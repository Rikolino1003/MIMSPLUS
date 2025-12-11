"""
=================================================================
📊 MÓDULO DE REPORTES - VIEWS
=================================================================

Este módulo contiene todas las vistas (endpoints) para el sistema de reportes.

Vistas principales:
- ReporteViewSet: CRUD completo de reportes (listar, crear, ver, actualizar, eliminar)
- ReporteListView: Lista todos los reportes con filtros
- MisReportesView: Lista los reportes del usuario autenticado
- ConsultarEstadoReporteView: Consulta el estado de un reporte específico
- AprobarReporteView: Aproba un reporte (solo administradores)
- DescargarReportePDFView: Descarga el PDF de un reporte
- EnviarReporteEmailView: Envía un reporte por correo electrónico

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from typing import Any
from django.db.models import QuerySet
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from .models import Reporte
from .serializers import (
    ReporteSerializer,
    ReporteListSerializer,
    ReporteCreateSerializer
)
from .permissions import (
    EsEmpleadoOAdministrador,
    PuedeCrearReporte,
    PuedeEditarReporte,
    PuedeVerReporte,
    PuedeAprobarReporte
)
from .utils.pdf_generator import generar_pdf_reporte
from django.core.mail import EmailMessage
import os


# ======================================================
# 🔹 CRUD DE REPORTES (EMPLEADO + ADMIN)
# ======================================================
class ReporteViewSet(viewsets.ModelViewSet):
    """
    ================================
    📊 VIEWSET REPORTES
    ================================
    
    ViewSet completo para el CRUD de reportes.
    Permite listar, crear, ver, actualizar y eliminar reportes.
    
    Endpoints:
    - GET /api/reportes/ - Lista todos los reportes
    - POST /api/reportes/ - Crea un nuevo reporte
    - GET /api/reportes/{id}/ - Obtiene un reporte específico
    - PUT/PATCH /api/reportes/{id}/ - Actualiza un reporte
    - DELETE /api/reportes/{id}/ - Elimina un reporte
    """
    
    queryset = Reporte.objects.all().order_by('-fecha_creacion')
    serializer_class = ReporteSerializer
    permission_classes = [EsEmpleadoOAdministrador]
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return ReporteCreateSerializer
        elif self.action == 'list':
            return ReporteListSerializer
        return ReporteSerializer
    
    def perform_create(self, serializer) -> None:
        """
        Asigna automáticamente el usuario autenticado como creador
        al crear un reporte.
        """
        usuario = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=usuario)
        
        # Generar ID del reporte si no existe
        reporte = serializer.instance
        if reporte and not reporte.id_reporte:
            reporte.generar_id_reporte()
            reporte.save()
    
    def get_queryset(self) -> QuerySet:
        """Filtra los reportes según el rol del usuario"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user or not user.is_authenticated:
            return queryset.none()
        
        from usuarios.utils import obtener_rol_usuario
        rol = obtener_rol_usuario(user)
        
        # Admin y empleado ven todos los reportes
        if rol in ("admin", "empleado"):
            return queryset
        
        # Cliente solo ve sus propios reportes
        if rol == "cliente":
            return queryset.filter(creado_por=user)
        
        return queryset.none()


# ======================================================
# 📋 LISTAR TODOS LOS REPORTES (ADMIN / EMPLEADO)
# ======================================================
class ReporteListView(generics.ListAPIView):
    """
    ================================
    📋 LISTA DE REPORTES
    ================================
    
    Lista todos los reportes con filtros opcionales.
    
    Filtros disponibles:
    - ?estado=pendiente - Filtra por estado
    - ?tipo_reporte=inventario - Filtra por tipo
    - ?creado_por={id} - Filtra por creador
    """
    
    serializer_class = ReporteListSerializer
    permission_classes = [EsEmpleadoOAdministrador]
    
    def get_queryset(self) -> QuerySet:
        queryset = Reporte.objects.all().order_by('-fecha_creacion')
        
        # Filtros opcionales
        estado = self.request.query_params.get('estado', None)
        tipo_reporte = self.request.query_params.get('tipo_reporte', None)
        creado_por = self.request.query_params.get('creado_por', None)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if tipo_reporte:
            queryset = queryset.filter(tipo_reporte=tipo_reporte)
        
        if creado_por:
            queryset = queryset.filter(creado_por_id=creado_por)
        
        return queryset


# ======================================================
# 👨‍💼 REPORTES DEL USUARIO AUTENTICADO
# ======================================================
class MisReportesView(generics.ListAPIView):
    """
    ================================
    👨‍💼 MIS REPORTES
    ================================
    
    Lista los reportes creados por el usuario autenticado.
    """
    
    serializer_class = ReporteListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self) -> QuerySet:
        return Reporte.objects.filter(
            creado_por=self.request.user
        ).order_by('-fecha_creacion')


# ======================================================
# 🔍 CONSULTAR ESTADO DE UN REPORTE
# ======================================================
class ConsultarEstadoReporteView(APIView):
    """
    ================================
    🔍 CONSULTAR ESTADO
    ================================
    
    Consulta el estado de un reporte específico.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, reporte_id):
        reporte = get_object_or_404(Reporte, id=reporte_id)
        
        # Verificar permisos
        from usuarios.utils import obtener_rol_usuario
        rol = obtener_rol_usuario(request.user)
        
        if rol not in ("admin", "empleado"):
            if reporte.creado_por != request.user:
                return Response(
                    {"error": "No tienes permiso para ver este reporte"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return Response({
            "id_reporte": reporte.id_reporte,
            "titulo": reporte.titulo,
            "estado": reporte.estado,
            "fecha_creacion": reporte.fecha_creacion,
            "fecha_actualizacion": reporte.fecha_actualizacion,
            "fecha_revision": reporte.fecha_revision,
            "fecha_aprobacion": reporte.fecha_aprobacion,
            "pdf_generado": reporte.pdf_generado,
        })


# ======================================================
# ✅ APROBAR REPORTE (SOLO ADMIN)
# ======================================================
class AprobarReporteView(APIView):
    """
    ================================
    ✅ APROBAR REPORTE
    ================================
    
    Aprueba un reporte (solo administradores).
    """
    
    permission_classes = [PuedeAprobarReporte]
    
    def post(self, request, reporte_id):
        reporte = get_object_or_404(Reporte, id=reporte_id)
        
        try:
            reporte.marcar_como_aprobado(request.user)
            
            return Response({
                "mensaje": f"Reporte {reporte.id_reporte} aprobado correctamente",
                "reporte_id": reporte.id,
                "estado": reporte.estado,
                "fecha_aprobacion": reporte.fecha_aprobacion,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Error al aprobar el reporte: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


# ======================================================
# 📄 DESCARGAR PDF DEL REPORTE
# ======================================================
class DescargarReportePDFView(APIView):
    """
    ================================
    📄 DESCARGAR PDF
    ================================
    
    Descarga el PDF de un reporte específico.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, reporte_id):
        reporte = get_object_or_404(Reporte, id=reporte_id)
        
        # Verificar permisos
        from usuarios.utils import obtener_rol_usuario
        rol = obtener_rol_usuario(request.user)
        
        if rol not in ("admin", "empleado"):
            if reporte.creado_por != request.user:
                raise PermissionDenied("No tienes permiso para acceder a este reporte")
        
        try:
            # Generar el PDF
            pdf_buffer = generar_pdf_reporte(reporte)
            
            # Crear la respuesta con el PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            
            # Configurar el nombre del archivo
            fecha_creacion = timezone.localtime(reporte.fecha_creacion).strftime('%Y%m%d')
            filename = f'reporte_{reporte.id_reporte}_{fecha_creacion}.pdf'
            
            # Configurar las cabeceras para la descarga
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = pdf_buffer.getbuffer().nbytes
            
            # Marcar como PDF generado
            if not reporte.pdf_generado:
                reporte.pdf_generado = True
                reporte.save()
            
            return response
        
        except Exception as e:
            return Response(
                {"error": f"Error al generar el PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type='application/json'
            )


# ======================================================
# 📧 ENVIAR REPORTE POR CORREO
# ======================================================
class EnviarReporteEmailView(APIView):
    """
    ================================
    📧 ENVIAR POR CORREO
    ================================
    
    Envía un reporte por correo electrónico.
    """
    
    permission_classes = [EsEmpleadoOAdministrador]
    
    def post(self, request, reporte_id):
        reporte = get_object_or_404(Reporte, id=reporte_id)
        
        # Obtener el destinatario (por defecto el creador del reporte)
        destinatario_email = request.data.get('email', None)
        if not destinatario_email and reporte.creado_por:
            destinatario_email = reporte.creado_por.email
        
        if not destinatario_email:
            return Response(
                {"error": "No se especificó un destinatario para el correo"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generar el PDF
            pdf_buffer = generar_pdf_reporte(reporte)
            
            # Crear el correo electrónico
            email = EmailMessage(
                f'Reporte {reporte.id_reporte} - {reporte.titulo}',
                f'Adjunto encontrará el reporte {reporte.id_reporte}: {reporte.titulo}\n\n'
                f'Estado: {dict(Reporte.ESTADOS_REPORTE).get(reporte.estado, reporte.estado)}\n'
                f'Fecha de medición: {reporte.fecha_medicion.strftime("%Y-%m-%d %H:%M:%S")}\n\n'
                f'Descripción: {reporte.descripcion or "Sin descripción"}',
                'no-reply@mims.com',
                [destinatario_email]
            )
            
            # Adjuntar el PDF
            fecha_creacion = timezone.localtime(reporte.fecha_creacion).strftime('%Y%m%d')
            filename = f'reporte_{reporte.id_reporte}_{fecha_creacion}.pdf'
            email.attach(
                filename,
                pdf_buffer.getvalue(),
                'application/pdf'
            )
            
            # Enviar el correo
            email.send()
            
            # Marcar como enviado
            reporte.correo_enviado = True
            reporte.save()
            
            return Response({
                "mensaje": f"Reporte enviado a {destinatario_email}",
                "reporte_id": reporte.id,
                "correo_enviado": True,
            })
        
        except Exception as e:
            return Response(
                {"error": f"Error al enviar el reporte: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ======================================================
# ➕ CREAR REPORTE MANUAL
# ======================================================
class CrearReporteView(APIView):
    """
    ================================
    ➕ CREAR REPORTE MANUAL
    ================================
    
    Crea un reporte de forma manual (usado por el panel).
    """
    
    permission_classes = [PuedeCrearReporte]
    
    def post(self, request):
        data = request.data
        
        try:
            # Crear reporte
            reporte = Reporte.objects.create(
                titulo=data.get("titulo", "Reporte Sin Título"),
                tipo_reporte=data.get("tipo_reporte", "general"),
                fecha_medicion=data.get("fecha_medicion", timezone.now()),
                estado=data.get("estado", "pendiente"),
                creado_por=request.user if request.user.is_authenticated else None,
                drogueria_id=data.get("drogueria", None),
                descripcion=data.get("descripcion", ""),
                observaciones=data.get("observaciones", ""),
                datos_json=data.get("datos_json", {})
            )
            
            # Generar ID del reporte
            reporte.generar_id_reporte()
            reporte.save()
            
            return Response(
                {
                    "mensaje": "Reporte creado correctamente",
                    "reporte_id": reporte.id,
                    "id_reporte": reporte.id_reporte
                },
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
