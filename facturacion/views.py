from typing import Any
from django.db.models import QuerySet
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from .models import Factura, DetalleFactura
from inventario.models import Medicamento
from usuarios.models import Usuario
from .serializers import FacturaSerializer, DetalleFacturaSerializer
from .permissions import EsEmpleadoOAdministrador
from .utils import generar_factura_pdf
from django.core.mail import EmailMessage
import os


# ======================================================
# 🔹 CRUD DE FACTURAS (EMPLEADO + ADMIN)
# ======================================================
class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all().order_by('-fecha_emision')
    serializer_class = FacturaSerializer
    permission_classes = [EsEmpleadoOAdministrador]

    def perform_create(self, serializer) -> None:
        """
        Asigna automáticamente el empleado autenticado
        al crear una factura.
        """
        empleado = self.request.user if self.request.user.is_authenticated else None
        serializer.save(empleado=empleado)


# ======================================================
# 🔹 CRUD DE DETALLES (PROTEGIDO)
# ======================================================
class DetalleFacturaViewSet(viewsets.ModelViewSet):
    queryset = DetalleFactura.objects.all()
    serializer_class = DetalleFacturaSerializer
    permission_classes = [EsEmpleadoOAdministrador]


# ======================================================
# 🧾 REGISTRO MANUAL DE FACTURA (USADO POR TU PANEL)
# ======================================================
class RegistrarFacturaView(APIView):
    permission_classes = [EsEmpleadoOAdministrador]

    def post(self, request) -> Response:
        data = request.data

        try:
            # Obtener cliente por ID
            cliente_id = data.get("cliente")
            cliente = get_object_or_404(Usuario, id=cliente_id)

            # Crear factura
            factura = Factura.objects.create(
                cliente=cliente,
                empleado=request.user if request.user.is_authenticated else None,
                metodo_pago=data.get("metodo_pago", "efectivo"),
                direccion_entrega=data.get("direccion_entrega", ""),
                observaciones=data.get("observaciones", ""),
                total=data.get("total", 0)
            )

            # Crear detalles
            detalles = data.get("detalles", [])
            for d in detalles:
                medicamento = get_object_or_404(Medicamento, id=d.get("medicamento"))

                DetalleFactura.objects.create(
                    factura=factura,
                    medicamento=medicamento,
                    cantidad=d.get("cantidad", 1),
                    precio_unitario=d.get("precio_unitario", 0),
                    subtotal=d.get("subtotal", 0)
                )
            return Response(
                {"mensaje": "Factura registrada correctamente", "factura_id": factura.cliente},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ======================================================
# 📋 LISTAR TODAS LAS FACTURAS (ADMIN / EMPLEADO)
# ======================================================
class FacturaListView(generics.ListAPIView):
    serializer_class = FacturaSerializer
    permission_classes = [EsEmpleadoOAdministrador]

    def get_queryset(self) -> QuerySet: # type: ignore
        return Factura.objects.all().order_by('-fecha_emision')


# ======================================================
# 💊 LISTAR DETALLES
# ======================================================
class DetalleFacturaListView(generics.ListAPIView):
    serializer_class = DetalleFacturaSerializer
    permission_classes = [EsEmpleadoOAdministrador]

    def get_queryset(self) -> QuerySet: # type: ignore
        return DetalleFactura.objects.all()


# ======================================================
# 🧍 FACTURAS DEL CLIENTE AUTENTICADO
# ======================================================
class HistorialFacturasView(generics.ListAPIView):
    serializer_class = FacturaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet: # type: ignore
        return Factura.objects.filter(cliente=self.request.user).order_by('-fecha_emision')


# ======================================================
# 👨‍💼 FACTURAS SEGÚN EL ROL DEL USUARIO
# ======================================================
class MisFacturasView(generics.ListAPIView):
    serializer_class = FacturaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet: # type: ignore 
        from usuarios.utils import obtener_rol_usuario
        user = self.request.user
        rol = obtener_rol_usuario(user)

        if rol == "empleado":
            return Factura.objects.filter(empleado=user).order_by('-fecha_emision')

        if rol == "admin":
            return Factura.objects.all().order_by('-fecha_emision')

        if rol == "cliente":
            return Factura.objects.filter(cliente=user).order_by('-fecha_emision')

        return Factura.objects.none()



class EnviarFacturaEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Solo empleados/admins

    def post(self, request, factura_id):
        factura = get_object_or_404(Factura, id=factura_id)
        
        # Verificar que el usuario tenga permiso para ver esta factura
        if not (request.user.is_staff or factura.cliente == request.user):
            return Response(
                {"error": "No tienes permiso para acceder a esta factura"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Generar el PDF
                pdf_buffer = generar_factura_pdf(factura)
            
            # Crear el correo electrónico
            email = EmailMessage(
                f'Factura #{factura.id} - {factura.fecha_emision.strftime("%Y-%m-%d")}',  # Fixed cursor position
                f'Adjunto encontrará la factura #{factura.id} del {factura.fecha_emision.strftime("%Y-%m-%d")}',
                'no-reply@tudominio.com',
                [factura.cliente.email]
            )
            
            # Adjuntar el PDF
            email.attach(
                f'factura_{factura.id}.pdf',
                pdf_buffer.getvalue(),
                'application/pdf'
            )
            
            # Enviar el correo
            email.send()
            
            return Response({"mensaje": f"Factura enviada a {factura.cliente.email}"})
            
        except Exception as e:
            return Response(
                {"error": f"Error al enviar la factura: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DescargarFacturaPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, factura_id):
        try:
            factura = get_object_or_404(Factura, id=factura_id)

            # Verificar permisos: cliente puede ver sus propias facturas, empleados/administradores pueden ver todas
            if not (request.user.is_staff or factura.cliente == request.user):
                raise PermissionDenied("No tienes permiso para acceder a esta factura")

            # Generar el PDF
                pdf_buffer = generar_factura_pdf(factura)

            if not pdf_buffer or pdf_buffer.getbuffer().nbytes == 0:
                raise Exception("El PDF generado está vacío")

            # Configurar el nombre del archivo
            fecha_emision = timezone.localtime(factura.fecha_emision).strftime('%Y%m%d')
            filename = f'factura_{factura.id}_{fecha_emision}.pdf'

            # Crear la respuesta con el PDF
            response = HttpResponse(
                pdf_buffer.getvalue(),
                content_type='application/pdf',
                status=status.HTTP_200_OK
            )

            # Configurar las cabeceras para la descarga
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = pdf_buffer.getbuffer().nbytes
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            response['Accept-Ranges'] = 'bytes'
            response['Content-Transfer-Encoding'] = 'binary'

            return response

        except Http404:
            return Response(
                {"error": "La factura solicitada no existe"},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error al generar el PDF: {error_trace}")
            return Response(
                {"error": f"Error al generar el PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type='application/json'
            )