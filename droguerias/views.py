from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Drogueria, Conversacion, Mensaje, UsuarioDrogueria, InventarioDrogueria, MovimientoDrogueria
from .serializers import DrogueriaSerializer, ConversacionSerializer, MensajeSerializer, UsuarioDrogueriaSerializer, InventarioDrogueriaSerializer, MovimientoDrogueriaSerializer
from .permissions import IsOwnerOrAdmin
from usuarios.utils import obtener_rol_usuario, es_admin    


class DrogueriaViewSet(viewsets.ModelViewSet):
    queryset = Drogueria.objects.all()
    serializer_class = DrogueriaSerializer
    permission_classes = [IsOwnerOrAdmin]

    def perform_create(self, serializer):
        # si el usuario no es superuser, asignarlo como propietario
        if not self.request.user.is_superuser and not serializer.validated_data.get('propietario'):
            serializer.save(propietario=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """Lista droguerías cuyo propietario es el usuario (o todos si admin)."""
        user = request.user
        if es_admin(user):
            qs = Drogueria.objects.all()
        else:
            qs = Drogueria.objects.filter(propietario=user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def set_active(self, request):
        """Set the active_drogueria on the current user.

        Body: { "drogueria": <id> }
        Se permite si el usuario es propietario, admin o tiene una membresía activa.
        """
        drogueria_id = request.data.get('drogueria')
        if not drogueria_id:
            return Response({'detail': 'drogueria id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            d = Drogueria.objects.get(pk=drogueria_id)
        except Drogueria.DoesNotExist:
            return Response({'detail': 'Drogueria not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # permite si admin
        if es_admin(user) or d.propietario == user:
            allowed = True
        else:
            allowed = UsuarioDrogueria.objects.filter(usuario=user, drogueria=d, activo=True).exists()

        if not allowed:
            return Response({'detail': 'No tiene permiso para usar esa droguería'}, status=status.HTTP_403_FORBIDDEN)

        user.active_drogueria = d
        user.save()
        return Response({
            'detail': f'active drogueria set to {d.nombre}',
            'drogueria': DrogueriaSerializer(d).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_active(self, request):
        """Obtiene la droguería activa del usuario admin."""
        if not es_admin(request.user):
            return Response({'detail': 'Solo admin tiene droguería activa'}, status=status.HTTP_403_FORBIDDEN)

        drogueria = request.user.active_drogueria
        if not drogueria:
            return Response({'detail': 'No hay droguería activa'}, status=status.HTTP_204_NO_CONTENT)

        return Response(DrogueriaSerializer(drogueria).data, status=status.HTTP_200_OK)


class ConversacionViewSet(viewsets.ModelViewSet):
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """El usuario solo puede ver sus conversaciones."""
        return Conversacion.objects.filter(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        """Crear o obtener una conversación con una droguería."""
        drogueria_id = request.data.get('drogueria')
        if not drogueria_id:
            return Response({'detail': 'drogueria id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            drogueria = Drogueria.objects.get(pk=drogueria_id)
        except Drogueria.DoesNotExist:
            return Response({'detail': 'Drogueria not found'}, status=status.HTTP_404_NOT_FOUND)

        conversacion, created = Conversacion.objects.get_or_create(
            drogueria=drogueria,
            usuario=request.user
        )
        serializer = self.get_serializer(conversacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mensajes(self, request, pk=None):
        """Obtiene los mensajes de una conversación."""
        conversacion = self.get_object()
        mensajes = conversacion.mensajes.all()
        serializer = MensajeSerializer(mensajes, many=True)
        return Response(serializer.data)


class MensajeViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """El usuario solo puede ver mensajes de sus conversaciones."""
        return Mensaje.objects.filter(conversacion__usuario=self.request.user)

    def perform_create(self, serializer):
        """Crear un mensaje. El remitente es el usuario actual."""
        conversacion_id = self.request.data.get('conversacion')
        try:
            conversacion = Conversacion.objects.get(pk=conversacion_id, usuario=self.request.user)
        except Conversacion.DoesNotExist:
            return Response({'detail': 'Conversacion not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer.save(
            conversacion=conversacion,
            remitente_tipo='usuario',
            remitente_id=self.request.user.id
        )



class UsuarioDrogueriaViewSet(viewsets.ModelViewSet):
    """Gestiona las membresías usuario <-> droguería."""
    queryset = UsuarioDrogueria.objects.all()
    serializer_class = UsuarioDrogueriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Si es admin, verá todas; si no, solo sus membresías
        user = self.request.user
        if es_admin(user):
            return UsuarioDrogueria.objects.all()
        return UsuarioDrogueria.objects.filter(usuario=user)

    def perform_create(self, serializer):
        # Solo propietarios de la droguería o admin pueden crear membresías
        user = self.request.user
        drogueria = serializer.validated_data.get('drogueria')
        if not (es_admin(user) or drogueria.propietario == user):
            # evitar crear membresías por usuarios comunes
            raise permissions.PermissionDenied('Solo propietario o admin puede invitar usuarios a la droguería')
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def marcar_leido(self, request, pk=None):
        """Marcar un mensaje como leído."""
        mensaje = self.get_object()
        mensaje.leido = True
        mensaje.save()
        serializer = self.get_serializer(mensaje)
        return Response(serializer.data)


class InventarioDrogueriaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para consultar inventarios por droguería."""
    queryset = InventarioDrogueria.objects.all()
    serializer_class = InventarioDrogueriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtra por droguería si se proporciona en query params."""
        qs = super().get_queryset()
        drogueria_id = self.request.query_params.get('drogueria')
        if drogueria_id:
            qs = qs.filter(drogueria__id=drogueria_id)
        return qs

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Retorna resumen agregado de todas las droguerías del usuario."""
        user = request.user
        if user.is_staff or user.is_superuser:
            qs = InventarioDrogueria.objects.all()
        else:
            # Solo droguerías donde el usuario es propietario o tiene membresía
            from django.db.models import Q
            qs = InventarioDrogueria.objects.filter(
                Q(drogueria__propietario=user) |
                Q(drogueria__usuarios_membresia__usuario=user, drogueria__usuarios_membresia__activo=True)
            ).distinct()
        
        total_valor = sum(inv.valor_total_inventario for inv in qs)
        total_venta = sum(inv.valor_venta_total for inv in qs)
        total_medicamentos = sum(inv.cantidad_medicamentos for inv in qs)
        total_stock = sum(inv.cantidad_stock_total for inv in qs)
        
        return Response({
            'total_droguerias': qs.count(),
            'valor_total_inventario': total_valor,
            'valor_venta_total': total_venta,
            'cantidad_total_medicamentos': total_medicamentos,
            'cantidad_total_stock': total_stock,
            'margen_promedio': ((total_venta - total_valor) / total_valor * 100) if total_valor > 0 else 0,
        })


class MovimientoDrogueriaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para auditar movimientos de inventario por droguería."""
    queryset = MovimientoDrogueria.objects.all().order_by('-creado')
    serializer_class = MovimientoDrogueriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtra movimientos por droguería."""
        qs = super().get_queryset()
        drogueria_id = self.request.query_params.get('drogueria')
        tipo_movimiento = self.request.query_params.get('tipo')
        
        if drogueria_id:
            qs = qs.filter(drogueria__id=drogueria_id)
        if tipo_movimiento:
            qs = qs.filter(tipo_movimiento=tipo_movimiento)
        return qs

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def registrar_movimiento(self, request):
        """Registra un nuevo movimiento de inventario."""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Asignar usuario actual si no se proporciona
            if not serializer.validated_data.get('usuario'):
                serializer.validated_data['usuario'] = request.user
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
