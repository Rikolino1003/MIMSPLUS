from django.db import models
from usuarios.models import Usuario
from inventario.models import Medicamento

class Factura(models.Model):
    pedido = models.OneToOneField('pedidos.Pedido', on_delete=models.CASCADE, related_name="factura", null=True, blank=True)
    cliente = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="facturas")
    empleado = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="facturas_registradas", null=True, blank=True)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50, choices=[
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('transferencia', 'Transferencia'),
    ])
    correo_enviado = models.BooleanField(default=False)
    direccion_entrega = models.CharField(max_length=255, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Factura #{self.id} - {self.cliente.nombre_completo}" 


class DetalleFactura(models.Model):
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name="detalles")
    medicamento = models.ForeignKey(Medicamento, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.medicamento.nombre} ({self.cantidad})"
