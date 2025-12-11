from django.contrib import admin
from .models import Categoria, Medicamento, MovimientoInventario
from .models import Prestamo

# =========================
# 📁 Categoría
# =========================
@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'descripcion', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)


# =========================
# 🔄 Inline para movimientos dentro del medicamento
# =========================
class MovimientoInventarioInline(admin.TabularInline):
    model = MovimientoInventario
    extra = 1
    readonly_fields = ('fecha_movimiento',)
    can_delete = True


# =========================
# 💊 Medicamento con CRUD completo
# =========================
@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'categoria', 'precio_venta', 'costo_compra', 'stock_actual', 
        'stock_reservado', 'stock_minimo', 'estado', 'esta_vencido', 'verificar_stock'
    )
    list_filter = ('categoria', 'estado')
    search_fields = ('nombre', 'descripcion')
    inlines = [MovimientoInventarioInline]
    readonly_fields = ('verificar_stock', 'esta_vencido')
    ordering = ('nombre',)


# =========================
# 🚚 Movimiento de Inventario (CRUD independiente)
# =========================
@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'medicamento', 'drogueria', 'tipo_movimiento', 'cantidad', 
        'fecha_movimiento', 'usuario', 'observacion'
    )
    list_filter = ('tipo_movimiento', 'fecha_movimiento', 'usuario')
    search_fields = ('medicamento__nombre', 'usuario__username', 'observacion')
    readonly_fields = ('fecha_movimiento',)


@admin.register(Prestamo)
class PrestamoAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicamento_origen', 'cantidad', 'origen', 'destino', 'estado', 'solicitante', 'fecha_solicitud')
    list_filter = ('estado', 'origen', 'destino')
    search_fields = ('medicamento_origen__nombre', 'medicamento_destino__nombre', 'origen__codigo', 'destino__codigo')
    readonly_fields = ('fecha_solicitud', 'fecha_respuesta')


from .models import Alerta, AuditLog


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'nivel', 'mensaje', 'medicamento', 'drogueria', 'creado_en', 'leido')
    list_filter = ('tipo', 'nivel', 'leido')
    search_fields = ('mensaje', 'medicamento__nombre')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'action', 'model_name', 'object_id', 'user', 'created_at')
    list_filter = ('action', 'model_name', 'user')
    search_fields = ('message',)
