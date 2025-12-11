"""
=================================================================
📊 MÓDULO DE REPORTES - URLs
=================================================================

Este módulo define todas las rutas URL para el sistema de reportes.

Endpoints principales:
- /api/reportes/ - CRUD completo de reportes
- /api/reportes/lista/ - Lista todos los reportes con filtros
- /api/reportes/mis-reportes/ - Reportes del usuario autenticado
- /api/reportes/crear/ - Crear reporte manualmente
- /api/reportes/{id}/estado/ - Consultar estado de un reporte
- /api/reportes/{id}/aprobar/ - Aprobar un reporte
- /api/reportes/{id}/descargar/ - Descargar PDF del reporte
- /api/reportes/{id}/enviar-email/ - Enviar reporte por correo

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ReporteViewSet,
    ReporteListView,
    MisReportesView,
    ConsultarEstadoReporteView,
    AprobarReporteView,
    DescargarReportePDFView,
    EnviarReporteEmailView,
    CrearReporteView,
)

# Router para el ViewSet
router = DefaultRouter()
router.register(r'reportes', ReporteViewSet, basename='reportes')

urlpatterns = [
    # Incluir las rutas del router (CRUD completo)
    path('', include(router.urls)),
    
    # Crear reporte manual (Usuario Empleado/Admin)
    path('crear/', CrearReporteView.as_view(), name='crear-reporte'),
    
    # Listados
    path('lista/', ReporteListView.as_view(), name='lista-reportes'),
    
    # Reportes del usuario autenticado
    path('mis-reportes/', MisReportesView.as_view(), name='mis-reportes'),
    
    # Consultar estado de un reporte específico
    path('reportes/<int:reporte_id>/estado/', ConsultarEstadoReporteView.as_view(), name='consultar-estado-reporte'),
    
    # Aprobar reporte (solo administradores)
    path('reportes/<int:reporte_id>/aprobar/', AprobarReporteView.as_view(), name='aprobar-reporte'),
    
    # Descargar PDF del reporte
    path('reportes/<int:reporte_id>/descargar/', DescargarReportePDFView.as_view(), name='descargar-reporte-pdf'),
    
    # Enviar reporte por correo electrónico
    path('reportes/<int:reporte_id>/enviar-email/', EnviarReporteEmailView.as_view(), name='enviar-reporte-email'),
]


