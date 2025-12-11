from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

Usuario = get_user_model()

class Pedido(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("procesado", "Procesado"),
        ("entregado", "Entregado"),
        ("cancelado", "Cancelado"),
    ]
    
    METODOS_PAGO = [
        ("efectivo", "Efectivo"),
        ("tarjeta", "Tarjeta de crédito/débito"),
        ("transferencia", "Transferencia bancaria"),
    ]
    
    cliente = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="pedidos")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO, default="efectivo")
    direccion_entrega = models.TextField(blank=True, null=True)
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f"Pedido {self.id} - {self.cliente.username}"

    def calcular_total(self):
        self.subtotal = sum(detalle.subtotal for detalle in self.detalles.all())
        self.total = self.subtotal - self.descuento
        self.save()

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="detalles")
    medicamento = models.ForeignKey('inventario.Medicamento', on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        # Set precio_unitario from medicamento.precio_venta if not set
        if not self.precio_unitario and self.medicamento_id:
            self.precio_unitario = self.medicamento.precio_venta
        # Calculate subtotal
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)
        # Update parent pedido total
        if hasattr(self, 'pedido'):
            self.pedido.calcular_total()

    def __str__(self):
        return f"{self.medicamento.nombre} x {self.cantidad}"


class HistorialPedido(models.Model):
    """
    Modelo para rastrear los cambios de estado de los pedidos
    """
    from django.conf import settings
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    estado_anterior = models.CharField(max_length=20, choices=Pedido.ESTADOS)
    estado_nuevo = models.CharField(max_length=20, choices=Pedido.ESTADOS)
    comentario = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Historial de pedido'
        verbose_name_plural = 'Historial de pedidos'
    
    def __str__(self):
        return f"{self.pedido.id}: {self.estado_anterior} → {self.estado_nuevo}"