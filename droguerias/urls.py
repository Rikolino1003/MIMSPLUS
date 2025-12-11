from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DrogueriaViewSet, ConversacionViewSet, MensajeViewSet, UsuarioDrogueriaViewSet, InventarioDrogueriaViewSet, MovimientoDrogueriaViewSet

router = DefaultRouter()
# ✅ Registrar con prefijo vacío porque ya está incluido como 'api/droguerias/'
router.register(r'', DrogueriaViewSet, basename='drogueria')
router.register(r'conversaciones', ConversacionViewSet, basename='conversacion')
router.register(r'mensajes', MensajeViewSet, basename='mensaje')
router.register(r'membresias', UsuarioDrogueriaViewSet, basename='membresia')
router.register(r'inventarios', InventarioDrogueriaViewSet, basename='inventario-drogueria')
router.register(r'movimientos', MovimientoDrogueriaViewSet, basename='movimiento-drogueria')

urlpatterns = [
    path('', include(router.urls)),
]
