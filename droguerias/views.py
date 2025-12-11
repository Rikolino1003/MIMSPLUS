from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Drogueria, Conversacion, Mensaje
from .serializers import DrogueriaSerializer, ConversacionSerializer, MensajeSerializer
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
        """Set the active_drogueria on the current user. SOLO ADMIN.

        Body: { "drogueria": <id> }
        """
        # Solo admin puede cambiar droguería
        if not es_admin(request.user):
            return Response({'detail': 'Solo admin puede cambiar droguería'}, status=status.HTTP_403_FORBIDDEN)

        drogueria_id = request.data.get('drogueria')
        if not drogueria_id:
            return Response({'detail': 'drogueria id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            d = Drogueria.objects.get(pk=drogueria_id)
        except Drogueria.DoesNotExist:
            return Response({'detail': 'Drogueria not found'}, status=status.HTTP_404_NOT_FOUND)

        request.user.active_drogueria = d
        request.user.save()
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def marcar_leido(self, request, pk=None):
        """Marcar un mensaje como leído."""
        mensaje = self.get_object()
        mensaje.leido = True
        mensaje.save()
        serializer = self.get_serializer(mensaje)
        return Response(serializer.data)
