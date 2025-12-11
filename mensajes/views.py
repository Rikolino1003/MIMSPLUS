from rest_framework import viewsets
from .models import Mensaje, Resena
from .serializers import MensajeSerializer, ResenaSerializer

class MensajeViewSet(viewsets.ModelViewSet):
    queryset = Mensaje.objects.all().order_by('-fecha_envio')
    serializer_class = MensajeSerializer

class ResenaViewSet(viewsets.ModelViewSet):
    queryset = Resena.objects.all().order_by('-fecha')
    serializer_class = ResenaSerializer
