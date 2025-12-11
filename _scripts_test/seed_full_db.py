#!/usr/bin/env python
"""
Seed masivo para poblar la base de datos con muchos registros de prueba.

Uso:
  python seed_full_db.py

Configurable al inicio del archivo: número de droguerías, medicamentos por droguería,
usuarios clientes y pedidos.
"""
import os
import django
import random
import string
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usuarios.models import Usuario
from droguerias.models import Drogueria, UsuarioDrogueria
from inventario.models import Categoria, Medicamento, MovimientoInventario
from pedidos.models import Pedido, DetallePedido
from facturacion.models import Factura, DetalleFactura

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

# Configuración: ajusta según lo que desees generar
NUM_DROGUERIAS = 5
MEDS_PER_DROGUERIA = 200
NUM_CLIENTES = 100
NUM_EMPLEADOS = 10
NUM_PEDIDOS = 300

def rand_name(prefix='X', size=8):
    suf = ''.join(random.choices(string.ascii_uppercase + string.digits, k=size))
    return f"{prefix}-{suf}"

def create_droguerias(n=NUM_DROGUERIAS):
    objs = []
    for i in range(1, n+1):
        code = f"DRG{i:02d}"
        nombre = f"Drogueria {i}"
        d, created = Drogueria.objects.get_or_create(codigo=code, defaults={'nombre': nombre, 'direccion':'Seed Calle 1'})
        objs.append(d)
    print(f"✅ Droguerías: {len(objs)}")
    return objs

def create_users(num_clientes=NUM_CLIENTES, num_empleados=NUM_EMPLEADOS):
    clientes = []
    empleados = []

    # Crear clientes
    for i in range(1, num_clientes+1):
        username = f'cliente{i:03d}'
        u = Usuario.objects.filter(username=username).first()
        if not u:
            u = Usuario.objects.create_user(username=username, email=f'{username}@example.com', password='Cliente123!')
        clientes.append(u)

    # Crear empleados y asignar a droguerías
    for i in range(1, num_empleados+1):
        username = f'empleado{i:03d}'
        u = Usuario.objects.filter(username=username).first()
        if not u:
            u = Usuario.objects.create_user(username=username, email=f'{username}@example.com', password='Empleado123!')
        empleados.append(u)

    print(f"✅ Usuarios creados: clientes={len(clientes)} empleados={len(empleados)}")
    return clientes, empleados

def create_categorias():
    names = ['Analgesicos','Antibioticos','Antiinflamatorios','Vitaminas','Dermatologicos']
    cats = []
    for n in names:
        c, _ = Categoria.objects.get_or_create(nombre=n)
        cats.append(c)
    return cats

def create_medicamentos(droguerias, categorias, per_drog=MEDS_PER_DROGUERIA):
    meds = []
    for d in droguerias:
        for j in range(per_drog):
            nombre = f"{rand_name('Med')}-{d.codigo}-{j+1}"
            precio = Decimal(str(round(random.uniform(2.5, 120.0),2)))
            costo = Decimal(str(round(float(precio) * random.uniform(0.4, 0.8),2)))
            cat = random.choice(categorias)
            med, created = Medicamento.objects.get_or_create(
                nombre=nombre,
                drogueria=d,
                defaults={
                    'descripcion': 'Seed: medicamento de prueba',
                    'precio_venta': precio,
                    'costo_compra': costo,
                    'stock_actual': random.randint(0, 200),
                    'stock_minimo': random.randint(5, 20),
                    'categoria': cat
                }
            )
            meds.append(med)
        print(f"  ➕ {per_drog} medicamentos creados para {d.nombre}")
    print(f"✅ Medicamentos totales: {len(meds)}")
    return meds

def create_movimientos(medicamentos, admins=None):
    admins = admins or []
    count = 0
    for med in medicamentos:
        # crear entre 1 y 5 movimientos aleatorios
        for _ in range(random.randint(1,5)):
            tipo = random.choice(['entrada','salida'])
            cantidad = random.randint(1, 30)
            usuario = random.choice(admins) if admins else None
            MovimientoInventario.objects.create(
                medicamento=med,
                drogueria=med.drogueria,
                tipo_movimiento=tipo,
                cantidad=cantidad,
                usuario=usuario,
                observacion='Seed masivo'
            )
            count += 1
    print(f"✅ Movimientos creados: {count}")

def create_pedidos(clientes, medicamentos, num_pedidos=NUM_PEDIDOS):
    pedidos = []
    meds_by_drog = {}
    for med in medicamentos:
        meds_by_drog.setdefault(med.drogueria_id, []).append(med)

    for i in range(num_pedidos):
        cliente = random.choice(clientes)
        pedido = Pedido.objects.create(cliente=cliente, metodo_pago=random.choice(['efectivo','tarjeta','transferencia']), direccion_entrega='Seed Calle', telefono_contacto='300000000')
        # seleccionar entre 1 y 5 items; preferir medicamentos de la misma drogueria
        num_items = random.randint(1,5)
        for _ in range(num_items):
            med = random.choice(medicamentos)
            cantidad = random.randint(1,5)
            dp = DetallePedido.objects.create(
                pedido=pedido,
                medicamento=med,
                cantidad=cantidad,
                precio_unitario=med.precio_venta
            )
        pedido.calcular_total()
        pedidos.append(pedido)
    print(f"✅ Pedidos creados: {len(pedidos)}")
    return pedidos

def create_facturas_for_pedidos(pedidos, empleados=None):
    empleados = empleados or []
    count = 0
    for p in pedidos[:len(pedidos)//2]:
        empleado = random.choice(empleados) if empleados else None
        f = Factura.objects.create(
            pedido=p,
            cliente=p.cliente,
            empleado=empleado,
            total=p.total,
            metodo_pago=p.metodo_pago,
            direccion_entrega=p.direccion_entrega
        )
        # crear detalles de factura a partir de los detalles del pedido
        for det in p.detalles.all():
            DetalleFactura.objects.create(
                factura=f,
                medicamento=det.medicamento,
                cantidad=det.cantidad,
                precio_unitario=det.precio_unitario,
                subtotal=det.subtotal
            )
        count += 1
    print(f"✅ Facturas creadas: {count}")

def main():
    print('🔬 Inicio seed masivo')
    droguerias = create_droguerias()
    clientes, empleados = create_users()
    categorias = create_categorias()
    meds = create_medicamentos(droguerias, categorias)

    # intentar identificar administradores en la BD para asociar movimientos
    admins = list(Usuario.objects.filter(is_superuser=True)[:5])
    create_movimientos(meds, admins=admins)

    pedidos = create_pedidos(clientes, meds)
    create_facturas_for_pedidos(pedidos, empleados=empleados)

    print('\n🎉 Seed masivo completado.')
    print(f'  Droguerias: {len(droguerias)}')
    print(f'  Medicamentos: {len(meds)}')
    print(f'  Clientes: {len(clientes)}')
    print(f'  Empleados: {len(empleados)}')
    print(f'  Pedidos: {len(pedidos)}')

if __name__ == '__main__':
    main()
