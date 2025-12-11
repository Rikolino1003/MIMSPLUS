from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FacturaViewSet,
    DetalleFacturaViewSet,
    RegistrarFacturaView,
    FacturaListView,
    DetalleFacturaListView,
    HistorialFacturasView,
    MisFacturasView,
    EnviarFacturaEmailView,
    DescargarFacturaPDFView,
)

router = DefaultRouter()
router.register(r'facturas', FacturaViewSet, basename='facturas')
router.register(r'detalles', DetalleFacturaViewSet, basename='detalles')

urlpatterns = [
    path('', include(router.urls)),

    # Registrar factura manual (Usuario Empleado)
    path('registrar/', RegistrarFacturaView.as_view(), name='registrar-factura'),

    # Listados
    path('lista/', FacturaListView.as_view(), name='lista-facturas'),
    path('detalles/lista/', DetalleFacturaListView.as_view(), name='lista-detalles'),

    # Facturas según usuario autenticado
    path('cliente/historial/', HistorialFacturasView.as_view(), name='historial-cliente'),
    path('mis-facturas/', MisFacturasView.as_view(), name='mis-facturas'),

    path('enviar-email/<int:factura_id>/', EnviarFacturaEmailView.as_view(), name="enviar-factura-email"),
    path('descargar/<int:factura_id>/', DescargarFacturaPDFView.as_view(), name="descargar-factura"),
]
