from django.contrib import admin
from .models import Mensaje

@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'correo', 'asunto', 'fecha_envio', 'leido')
    list_filter = ('leido', 'fecha_envio')
    search_fields = ('nombre', 'correo', 'asunto', 'mensaje')
    ordering = ('-fecha_envio',)
    actions = ['marcar_como_leido']

    @admin.action(description="Marcar como leído")
    def marcar_como_leido(self, request, queryset):
        queryset.update(leido=True)
