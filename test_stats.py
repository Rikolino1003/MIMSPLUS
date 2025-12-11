#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pedidos.models import Pedido
from inventario.models import Medicamento
from django.utils import timezone

pedidos = Pedido.objects.all()
medicamentos = Medicamento.objects.all()

print(f'📊 DATOS EN LA BASE DE DATOS:')
print(f'✅ Total Pedidos: {pedidos.count()}')
print(f'   - Pendientes: {pedidos.filter(estado="pendiente").count()}')
print(f'   - Procesados: {pedidos.filter(estado="procesado").count()}')
print(f'   - Entregados: {pedidos.filter(estado="entregado").count()}')

print(f'✅ Total Medicamentos: {medicamentos.count()}')
vencidos = medicamentos.filter(fecha_vencimiento__lt=timezone.now())
print(f'   - Vencidos: {vencidos.count()}')
bajos = medicamentos.filter(stock_actual__lte=10)
print(f'   - Stock Bajo (≤10): {bajos.count()}')

print(f'\n📋 Primeros 3 Pedidos:')
for p in pedidos[:3]:
    print(f'   - ID: {p.id}, Estado: {p.estado}')

print(f'\n💊 Medicamentos con Stock Bajo:')
for m in bajos[:5]:
    print(f'   - {m.nombre}: {m.stock_actual} unidades')

print(f'\n⏰ Medicamentos Vencidos:')
for m in vencidos[:5]:
    print(f'   - {m.nombre}: vence el {m.fecha_vencimiento}')
