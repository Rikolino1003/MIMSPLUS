"""
=================================================================
📊 MÓDULO DE REPORTES - ADMIN
=================================================================

Configuración del panel de administración de Django para el módulo de reportes.
Permite gestionar los reportes desde el panel de administración.

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from django.contrib import admin
from .models import Reporte


@admin.register(Reporte)
class ReporteAdmin(admin.ModelAdmin):
    """
    ================================
    📊 ADMIN REPORTE
    ================================
    
    Configuración del admin para el modelo Reporte.
    Permite gestionar reportes desde el panel de administración.
    """
    
    # Campos a mostrar en la lista
    list_display = (
        'id_reporte',
        'titulo',
        'tipo_reporte',
        'estado',
        'fecha_medicion',
        'creado_por',
        'drogueria',
        'fecha_creacion',
        'pdf_generado',
        'correo_enviado',
    )
    
    # Filtros en la barra lateral
    list_filter = (
        'estado',
        'tipo_reporte',
        'fecha_creacion',
        'fecha_medicion',
        'pdf_generado',
        'correo_enviado',
    )
    
    # Campos de búsqueda
    search_fields = (
        'id_reporte',
        'titulo',
        'descripcion',
        'creado_por__username',
        'creado_por__nombre_completo',
        'drogueria__nombre',
    )
    
    # Ordenamiento por defecto
    ordering = ('-fecha_creacion',)
    
    # Campos de solo lectura
    readonly_fields = (
        'id_reporte',
        'fecha_creacion',
        'fecha_actualizacion',
    )
    
    # Campos organizados en secciones
    fieldsets = (
        ('Información Principal', {
            'fields': (
                'id_reporte',
                'titulo',
                'tipo_reporte',
                'estado',
            )
        }),
        ('Fechas', {
            'fields': (
                'fecha_medicion',
                'fecha_creacion',
                'fecha_actualizacion',
                'fecha_revision',
                'fecha_aprobacion',
            )
        }),
        ('Usuarios', {
            'fields': (
                'creado_por',
                'revisado_por',
            )
        }),
        ('Droguería', {
            'fields': (
                'drogueria',
            )
        }),
        ('Contenido', {
            'fields': (
                'descripcion',
                'observaciones',
                'datos_json',
            )
        }),
        ('Archivos y Estado', {
            'fields': (
                'archivo_pdf',
                'pdf_generado',
                'correo_enviado',
            )
        }),
    )
    
    # Acciones personalizadas
    actions = [
        'marcar_como_completado',
        'marcar_como_aprobado',
        'marcar_pdf_generado',
    ]
    
    def marcar_como_completado(self, request, queryset):
        """Marca los reportes seleccionados como completados"""
        updated = queryset.update(estado='completado')
        self.message_user(
            request,
            f"{updated} reporte(s) marcado(s) como completado(s)."
        )
    marcar_como_completado.short_description = "Marcar reportes como completados"
    
    def marcar_como_aprobado(self, request, queryset):
        """Marca los reportes seleccionados como aprobados"""
        from django.utils import timezone
        updated = queryset.update(
            estado='aprobado',
            revisado_por=request.user,
            fecha_aprobacion=timezone.now()
        )
        self.message_user(
            request,
            f"{updated} reporte(s) marcado(s) como aprobado(s)."
        )
    marcar_como_aprobado.short_description = "Marcar reportes como aprobados"
    
    def marcar_pdf_generado(self, request, queryset):
        """Marca los reportes como PDF generado"""
        updated = queryset.update(pdf_generado=True)
        self.message_user(
            request,
            f"{updated} reporte(s) marcado(s) como PDF generado."
        )
    marcar_pdf_generado.short_description = "Marcar PDF como generado"
