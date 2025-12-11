from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # ✅ Rutas API
    path("api/usuarios/", include("usuarios.urls")),
    path("api/inventario/", include("inventario.urls")),
    path("api/facturas/", include("facturacion.urls")),
    path("api/pedidos/", include("pedidos.urls")),
    path('api/mensajes/', include('mensajes.urls')),
    path('api/droguerias/', include('droguerias.urls')),
    path('api/reportes/', include('reportes.urls')),
]