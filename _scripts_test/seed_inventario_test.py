#!/usr/bin/env python
"""
Poblar medicamentos y movimientos de inventario de prueba para varias droguerías.
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from droguerias.models import Drogueria, UsuarioDrogueria, InventarioDrogueria
from inventario.models import Medicamento, MovimientoInventario
from usuarios.models import Usuario

print('🔬 Iniciando seed de inventario de prueba')

# Seleccionar algunas droguerías (las primeras 3)
drog_ids = list(Drogueria.objects.values_list('id', flat=True)[:3])
print('Droguerias seleccionadas:', drog_ids)

# Usuarios a asignar
empleado = Usuario.objects.filter(username='empleado').first()
cliente = Usuario.objects.filter(username='cliente').first()
admin = Usuario.objects.filter(username='admin').first()

# Crear membresías para empleado en la primera droguería
if empleado and drog_ids:
    d0 = Drogueria.objects.get(pk=drog_ids[0])
    ud, created = UsuarioDrogueria.objects.get_or_create(usuario=empleado, drogueria=d0, defaults={'rol':'empleado','activo':True})
    if created:
        print(f'✅ Membresía creada para empleado -> Drogueria {d0.id}')

# Crear algunos empleados adicionales y asignarles drogas
for i in range(2,5):
    uname = f'empleado{i}'
    u = Usuario.objects.filter(username=uname).first()
    if not u:
        u = Usuario.objects.create_user(username=uname, email=f'{uname}@example.com', password='Empleado123!')
        # asignar rol
        try:
            rol = u.rol_nuevo
        except:
            rol = None
    # asignar a drogueria i-2 si existe
    if i-2 < len(drog_ids):
        d = Drogueria.objects.get(pk=drog_ids[i-2])
        UsuarioDrogueria.objects.get_or_create(usuario=u, drogueria=d, defaults={'rol':'empleado','activo':True})
        print(f'✅ Usuario {u.username} asignado a drogueria {d.nombre}')

# Crear medicamentos y movimientos
for idx, drog_id in enumerate(drog_ids):
    drog = Drogueria.objects.get(pk=drog_id)
    print(f'🔸 Poblando medicamentos para {drog.nombre} (id={drog_id})')
    for j in range(1,4):
        nombre = f'TestMed-{drog_id}-{j}'
        med, created = Medicamento.objects.get_or_create(
            nombre=nombre,
            drogueria=drog,
            defaults={
                'descripcion': 'Medicina de prueba',
                'precio_venta': 10.0 + j + idx,
                'costo_compra': 5.0 + j,
                'stock_actual': 20 * j,
                'stock_minimo': 5
            }
        )
        if created:
            print(f'  ➕ Medicamento creado: {med.nombre} stock={med.stock_actual}')
        else:
            # actualizar valores si ya existía
            med.precio_venta = 10.0 + j + idx
            med.costo_compra = 5.0 + j
            med.stock_actual = max(med.stock_actual, 5 * j)
            med.save()
            print(f'  ✏️ Medicamento actualizado: {med.nombre} stock={med.stock_actual}')

        # Registrar un movimiento de entrada para cada medicamento
        mov = MovimientoInventario.objects.create(
            medicamento=med,
            drogueria=drog,
            tipo_movimiento='entrada',
            cantidad=5*j,
            usuario=admin if admin else None,
            observacion='Seed: entrada inicial'
        )
        print(f'    • Movimiento creado: {mov.tipo_movimiento} {mov.cantidad}')

# Actualizar InventarioDrogueria para las droguerías afectadas
from setup_inventarios import setup_inventarios
setup_inventarios()

print('\n✅ Seed completado. Ejecuta pruebas en /panelempleado y /api/droguerias/inventarios/resumen/')
