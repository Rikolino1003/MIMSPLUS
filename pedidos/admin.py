from django.contrib import admin
from .models import Pedido, DetallePedido
from inventario.models import Medicamento  # ⚠ Importante para acceder al precio

# =========================
# 💊 Inline para Detalles de Pedido
# =========================
class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    fk_name = 'pedido'  # Especificar explícitamente el campo de relación
    extra = 1  # Muestra 1 línea vacía adicional para agregar fácilmente
    can_delete = True  # Permitir eliminar detalles desde el admin
    readonly_fields = ('precio_unitario', 'subtotal')  # mostrar solo lectura
    fields = ('medicamento', 'cantidad', 'precio_unitario', 'subtotal')

    def precio_unitario(self, obj):
        return obj.medicamento.precio_venta if obj.medicamento else 0
    precio_unitario.short_description = 'Precio Unitario'

    def subtotal(self, obj):
        return obj.cantidad * obj.medicamento.precio_venta if obj.medicamento else 0
    subtotal.short_description = 'Subtotal'


# =========================
# 📦 Admin del Pedido
# =========================
@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'fecha_creacion', 'estado', 'total', 'ver_detalles')
    list_filter = ('estado', 'fecha_creacion')
    search_fields = ('cliente__username',)
    inlines = [DetallePedidoInline]
    ordering = ('-fecha_creacion',)

    def ver_detalles(self, obj):
        """Muestra los medicamentos, cantidades y precio unitario de cada pedido."""
        detalles = []
        for d in obj.detalles.all():
            if d.medicamento:
                detalles.append(f"{d.medicamento.nombre} x{d.cantidad} (${d.medicamento.precio_venta})")
            else:
                detalles.append(f"Medicamento eliminado x{d.cantidad}")
        return ", ".join(detalles)
    ver_detalles.short_description = "Detalles del Pedido"


# =========================
# 🧾 Admin independiente de DetallePedido (opcional)
# =========================
@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'pedido', 'medicamento', 'cantidad', 'precio_unitario', 'subtotal')
    search_fields = ('pedido__cliente__username', 'medicamento__nombre')
    list_filter = ('pedido__estado',)

    def precio_unitario(self, obj):
        return obj.medicamento.precio_venta if obj.medicamento else 0
    precio_unitario.short_description = 'Precio Unitario'

    def subtotal(self, obj):
        return obj.cantidad * obj.medicamento.precio_venta if obj.medicamento else 0
    subtotal.short_description = 'Subtotal'
