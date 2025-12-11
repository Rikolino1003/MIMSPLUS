
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usuarios.models import Usuario
from inventario.models import Medicamento
from facturacion.models import Factura, DetalleFactura

def verify_invoice_total():
    print("Verifying invoice total calculation...")
    
    # Create or get test user
    cliente, _ = Usuario.objects.get_or_create(
        username='test_client_total',
        defaults={'email': 'test_total@example.com', 'rol': 'cliente'}
    )
    
    # Create or get test medicine
    medicamento, _ = Medicamento.objects.get_or_create(
        nombre='Test Med Total',
        defaults={
            'precio_venta': Decimal('10.50'),
            'stock_actual': 100,
            'stock_minimo': 10,
            'codigo_barra': 'TEST002',
            'descripcion': 'Test Medicine'
        }
    )
    
    # Create invoice
    print("Creating invoice...")
    factura = Factura.objects.create(
        cliente=cliente,
        metodo_pago='efectivo',
        total=0
    )
    
    # Create detail
    print("Creating detail...")
    DetalleFactura.objects.create(
        factura=factura,
        medicamento=medicamento,
        cantidad=2,
        precio_unitario=medicamento.precio_venta
    )
    
    # Refresh invoice from DB
    factura.refresh_from_db()
    
    expected_total = Decimal('21.00') # 2 * 10.50
    
    print(f"Invoice ID: {factura.id}")
    print(f"Total in DB: {factura.total}")
    print(f"Expected Total: {expected_total}")
    
    if factura.total == expected_total:
        print("SUCCESS: Total is correct.")
    else:
        print("FAILURE: Total is incorrect.")

if __name__ == "__main__":
    verify_invoice_total()