from django.urls import path
from . import views

app_name = "pedidos"

urlpatterns = [
    # Lista de pedidos (HTML, pero expuesta bajo api/pedidos/)
    path(
        "",
        views.ListaPedidosView.as_view(),
        name="lista_pedidos",
    ),
    # Crear pedido
    path(
        "crear/",
        views.crear_pedido,
        name="crear_pedido",
    ),
    # Rutas API para frontend (compatibilidad con endpoints usados por frontend)
    path(
        "crear-pedido/",
        views.api_pedidos_list_create if hasattr(views, 'api_pedidos_list_create') else __import__('pedidos.api_views', fromlist=['']).api_pedidos_list_create,
        name="api_crear_pedido",
    ),
    path(
        "pedidos/",
        views.api_pedidos_list_create if hasattr(views, 'api_pedidos_list_create') else __import__('pedidos.api_views', fromlist=['']).api_pedidos_list_create,
        name="api_lista_pedidos",
    ),
    path(
        "pedidos/<int:pk>/",
        views.api_pedido_detail if hasattr(views, 'api_pedido_detail') else __import__('pedidos.api_views', fromlist=['']).api_pedido_detail,
        name="api_detalle_pedido",
    ),
    # Detalle de pedido
    path(
        "<int:pk>/",
        views.DetallePedidoView.as_view(),
        name="detalle_pedido",
    ),
    # Cambiar estado de pedido
    path(
        "<int:pk>/cambiar-estado/<str:nuevo_estado>/",
        views.cambiar_estado_pedido,
        name="cambiar_estado_pedido",
    ),
]
