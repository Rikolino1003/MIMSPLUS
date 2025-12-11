from usuarios.models import Usuario
from droguerias.models import Drogueria
from inventario.models import Medicamento, Prestamo, MovimientoInventario

u=Usuario.objects.create_user('tuser','t@test.com','x')
d1=Drogueria.objects.create(codigo='TX1', nombre='TX1', propietario=u)
d2=Drogueria.objects.create(codigo='TX2', nombre='TX2', propietario=u)
m1=Medicamento.objects.create(nombre='A', precio_venta=1.0, stock_actual=20, drogueria=d1)
m2=Medicamento.objects.create(nombre='A', precio_venta=1.0, stock_actual=2, drogueria=d2)

p=Prestamo.objects.create(medicamento_origen=m1, cantidad=5, origen=d1, destino=d2, solicitante=u)
print('after create: m1', m1.stock_actual, m1.stock_reservado)
# call reservar
p.reservar()
# refresh
m1.refresh_from_db()
print('after reservar: m1', m1.stock_actual, m1.stock_reservado)

p.aceptar(user=u)
# after accept
m1.refresh_from_db()
m2.refresh_from_db()
print('after accept: m1', m1.stock_actual, m1.stock_reservado)
print('after accept: m2', m2.stock_actual)
