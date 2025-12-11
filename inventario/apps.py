from django.apps import AppConfig


class InventarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventario'

    def ready(self):
        # Importar señales aquí para evitar problemas de import-time antes de que
        # el registry de apps esté listo. Django llamará a ready() cuando la app
        # esté cargada.
        from . import signals  # noqa: F401
