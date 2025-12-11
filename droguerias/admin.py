from django.contrib import admin
from .models import Drogueria


@admin.register(Drogueria)
class DrogueriaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'propietario', 'ciudad', 'telefono', 'activo')
    list_filter = ('activo', 'ciudad')
    search_fields = ('codigo', 'nombre', 'direccion', 'propietario__username')
