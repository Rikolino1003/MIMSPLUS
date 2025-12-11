from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DrogueriaViewSet, ConversacionViewSet, MensajeViewSet

router = DefaultRouter()
router.register(r'droguerias', DrogueriaViewSet, basename='drogueria')
router.register(r'conversaciones', ConversacionViewSet, basename='conversacion')
router.register(r'mensajes', MensajeViewSet, basename='mensaje')

urlpatterns = [
    path('', include(router.urls)),
]
