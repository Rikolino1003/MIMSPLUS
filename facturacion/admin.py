from django.contrib import admin

# Register your models here.
# facturacion/admin.py
from django.contrib import admin
from .models import Factura, DetalleFactura

# Inline para los detalles de la factura
class DetalleFacturaInline(admin.TabularInline):
    model = DetalleFactura
    extra = 1  # Formularios extra para agregar
    can_delete = True  # Permite eliminar detalles
    # Puedes hacer que algunos campos sean solo lectura si quieres
    # readonly_fields = ('subtotal',)

# Admin de Factura con CRUD completo
@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'empleado', 'fecha_emision', 'total', 'metodo_pago', 'correo_enviado')
    list_filter = ('metodo_pago', 'fecha_emision', 'correo_enviado')
    search_fields = ('cliente__username', 'empleado__username', 'direccion_entrega', 'observaciones')
    inlines = [DetalleFacturaInline]  # Permite crear y editar detalles desde la factura
    ordering = ('-fecha_emision',)
    readonly_fields = ('fecha_emision',)  # opcional, para no modificar la fecha de emisión

    # Acciones personalizadas (opcional)
    actions = ['marcar_correo_enviado']

    def marcar_correo_enviado(self, request, queryset):
        updated = queryset.update(correo_enviado=True)
        self.message_user(request, f"{updated} factura(s) marcadas como correo enviado.")
    marcar_correo_enviado.short_description = "Marcar facturas como correo enviado"

# Admin independiente de DetalleFactura (opcional)
@admin.register(DetalleFactura)
class DetalleFacturaAdmin(admin.ModelAdmin):
    list_display = ('id', 'factura', 'medicamento', 'cantidad', 'precio_unitario', 'subtotal')
    search_fields = ('factura__cliente__username', 'medicamento__nom_med')
    list_filter = ('factura__metodo_pago',)
