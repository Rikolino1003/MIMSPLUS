#!/usr/bin/env python
"""
Script para inicializar registros de InventarioDrogueria para cada droguería.
Ejecutar: python setup_inventarios.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from droguerias.models import Drogueria, InventarioDrogueria
from inventario.models import Medicamento
from django.db.models import Sum, DecimalField, F
from django.db.models.functions import Coalesce

def setup_inventarios():
    """Crea InventarioDrogueria para cada droguería si no existe."""
    
    droguerias = Drogueria.objects.all()
    creados = 0
    
    for drogueria in droguerias:
        inv, created = InventarioDrogueria.objects.get_or_create(drogueria=drogueria)
        
        # Calcular valores del inventario basado en medicamentos
        medicamentos = Medicamento.objects.filter(drogueria=drogueria)
        
        # Calcular valor total iterando (evita problemas con tipos mixtos)
        valor_total = 0
        valor_venta = 0
        for med in medicamentos:
            valor_total += med.costo_compra * med.stock_actual
            valor_venta += med.precio_venta * med.stock_actual
        
        
        cantidad_medicamentos = medicamentos.count()
        cantidad_stock_total = medicamentos.aggregate(
            total=Coalesce(Sum('stock_actual'), 0)
        )['total'] or 0
        
        # Actualizar valores
        inv.valor_total_inventario = valor_total
        inv.valor_venta_total = valor_venta
        inv.cantidad_medicamentos = cantidad_medicamentos
        inv.cantidad_stock_total = cantidad_stock_total
        inv.save()
        
        if created:
            creados += 1
            print(f"✅ Creado: {drogueria.nombre} - ${valor_total} (costo) / ${valor_venta} (venta)")
        else:
            print(f"✏️ Actualizado: {drogueria.nombre} - ${valor_total} (costo) / ${valor_venta} (venta)")
    
    print(f"\n📊 Total: {creados} nuevos inventarios creados, {droguerias.count() - creados} actualizados")

if __name__ == '__main__':
    setup_inventarios()
