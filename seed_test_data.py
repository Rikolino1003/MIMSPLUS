#!/usr/bin/env python
"""
Script para crear datos de prueba en el dashboard del empleado
Crea: Pedidos, Facturas, Medicamentos vencidos y con stock bajo
"""

import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pedidos.models import Pedido
from facturacion.models import Factura
from inventario.models import Medicamento
from droguerias.models import Drogueria
from usuarios.models import Usuario

print("=" * 60)
print("🌱 CREANDO DATOS DE PRUEBA")
print("=" * 60)

# Obtener usuario cliente para los pedidos
usuario = Usuario.objects.filter(username='cliente').first()
if not usuario:
    print("❌ Usuario 'cliente' no existe")
    exit(1)

print(f"✅ Usuario: {usuario.username}")

# ==========================================
# 1. CREAR MEDICAMENTOS CON STOCK BAJO
# ==========================================
print("\n📦 Creando medicamentos con stock bajo...")

meds_stock_bajo = [
    {'nombre': 'Amoxicilina 500mg', 'stock': 5, 'precio_venta': 8500, 'costo': 4000},
    {'nombre': 'Ibuprofeno 400mg', 'stock': 8, 'precio_venta': 5000, 'costo': 2500},
    {'nombre': 'Paracetamol 500mg', 'stock': 3, 'precio_venta': 4000, 'costo': 2000},
]

for med_data in meds_stock_bajo:
    med, created = Medicamento.objects.update_or_create(
        nombre=med_data['nombre'],
        defaults={
            'descripcion': f'{med_data["nombre"]} - Stock bajo',
            'stock_actual': med_data['stock'],
            'precio_venta': Decimal(str(med_data['precio_venta'])),
            'costo_compra': Decimal(str(med_data['costo'])),
        }
    )
    status = "✨ Creado" if created else "♻️ Actualizado"
    print(f"  {status}: {med.nombre} (Stock: {med.stock_actual})")

# ==========================================
# 2. CREAR MEDICAMENTOS VENCIDOS
# ==========================================
print("\n⚠️ Creando medicamentos vencidos...")

meds_vencidos = [
    {'nombre': 'Penicilina G 1M UI', 'vencimiento': datetime.now() - timedelta(days=30)},
    {'nombre': 'Sulfamethoxazol 400mg', 'vencimiento': datetime.now() - timedelta(days=15)},
]

for med_data in meds_vencidos:
    med, created = Medicamento.objects.update_or_create(
        nombre=med_data['nombre'],
        defaults={
            'descripcion': f'{med_data["nombre"]} - VENCIDO',
            'stock_actual': 10,
            'precio_venta': Decimal('6500'),
            'costo_compra': Decimal('3000'),
            'fecha_vencimiento': med_data['vencimiento'],
        }
    )
    status = "✨ Creado" if created else "♻️ Actualizado"
    print(f"  {status}: {med.nombre} (Vencimiento: {med.fecha_vencimiento.date()})")

# ==========================================
# 3. CREAR PEDIDOS
# ==========================================
print("\n📋 Creando pedidos...")

pedidos_data = [
    {'id_unique': 'PED-001', 'estado': 'pendiente', 'total': Decimal('250000')},
    {'id_unique': 'PED-002', 'estado': 'pendiente', 'total': Decimal('180000')},
    {'id_unique': 'PED-003', 'estado': 'procesado', 'total': Decimal('450000')},
    {'id_unique': 'PED-004', 'estado': 'procesado', 'total': Decimal('320000')},
    {'id_unique': 'PED-005', 'estado': 'entregado', 'total': Decimal('520000')},
]

for ped_data in pedidos_data:
    try:
        pedido, created = Pedido.objects.update_or_create(
            notas=ped_data['id_unique'],
            defaults={
                'cliente': usuario,
                'estado': ped_data['estado'],
                'total': ped_data['total'],
                'subtotal': ped_data['total'],
            }
        )
        status = "✨ Creado" if created else "♻️ Actualizado"
        print(f"  {status}: Pedido#{pedido.id} ({pedido.estado}) - ${pedido.total}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

# ==========================================
# 4. CREAR FACTURAS
# ==========================================
print("\n💰 Creando facturas...")

# Usar usuario empleado para crear facturas
empleado = Usuario.objects.filter(username='empleado').first()
if not empleado:
    print("  ⚠️ No hay usuario empleado, saltando facturas")
else:
    facturas_data = [
        {'numero': 'FAC-001', 'total': Decimal('150000'), 'fecha': datetime.now()},
        {'numero': 'FAC-002', 'total': Decimal('280000'), 'fecha': datetime.now()},
        {'numero': 'FAC-003', 'total': Decimal('95000'), 'fecha': datetime.now() - timedelta(days=1)},
        {'numero': 'FAC-004', 'total': Decimal('420000'), 'fecha': datetime.now() - timedelta(days=5)},
    ]

    for fac_data in facturas_data:
        try:
            factura, created = Factura.objects.update_or_create(
                numero_factura=fac_data['numero'],
                defaults={
                    'usuario_creador': empleado,
                    'total': fac_data['total'],
                    'fecha_emision': fac_data['fecha'].date(),
                    'estado': 'emitida',
                }
            )
            status = "✨ Creado" if created else "♻️ Actualizado"
            print(f"  {status}: {factura.numero_factura} - ${factura.total} ({factura.fecha_emision})")
        except Exception as e:
            print(f"  ❌ Error: {e}")

print("\n" + "=" * 60)
print("✅ ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE!")
print("=" * 60)
print("\nResumen:")
print(f"  📋 Pedidos: {Pedido.objects.count()}")
print(f"  💰 Facturas: {Factura.objects.count()}")
print(f"  💊 Medicamentos: {Medicamento.objects.count()}")
print("\nRecarga el dashboard para ver los cambios.")

