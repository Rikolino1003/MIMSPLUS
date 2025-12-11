from usuarios.models import Usuario
from pedidos.models import Pedido
from facturacion.models import Factura
from inventario.models import Medicamento

empleado = Usuario.objects.filter(username='empleado').first()
cliente = Usuario.objects.filter(username='cliente').first()

print("=" * 60)
print("DATOS POR USUARIO")
print("=" * 60)
print(f"\n👤 EMPLEADO ({empleado.username}):")
print(f"  Pedidos como cliente: {Pedido.objects.filter(cliente=empleado).count()}")
print(f"  Facturas creadas: {Factura.objects.filter(empleado=empleado).count()}")

print(f"\n👤 CLIENTE ({cliente.username}):")
print(f"  Pedidos creados: {Pedido.objects.filter(cliente=cliente).count()}")
print(f"  Facturas recibidas: {Factura.objects.filter(cliente=cliente).count()}")

print(f"\n💊 MEDICAMENTOS:")
print(f"  Total: {Medicamento.objects.count()}")
print(f"  Stock bajo (<=10): {Medicamento.objects.filter(stock_actual__lte=10).count()}")

from datetime import datetime
vencidos = Medicamento.objects.filter(fecha_vencimiento__lt=datetime.now())
print(f"  Vencidos: {vencidos.count()}")
