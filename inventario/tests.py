from rest_framework.test import APITestCase
from usuarios.models import Usuario
from droguerias.models import Drogueria
from .models import Medicamento, MovimientoInventario, Alerta, AuditLog, Prestamo


class InventarioFilterTests(APITestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(username='u1', password='x', email='u1@example.com')
        self.d1 = Drogueria.objects.create(codigo='D1', nombre='Sucursal 1', propietario=self.user)
        self.d2 = Drogueria.objects.create(codigo='D2', nombre='Sucursal 2', propietario=self.user)
        Medicamento.objects.create(nombre='MedA', precio_venta=10.0, stock_actual=5, drogueria=self.d1)
        Medicamento.objects.create(nombre='MedB', precio_venta=20.0, stock_actual=3, drogueria=self.d2)

    def test_list_medicamentos_by_drogueria(self):
        self.client.force_authenticate(self.user)
        resp = self.client.get('/api/inventario/by-drogueria/?drogueria=%d' % self.d1.id)
        assert resp.status_code == 200, resp.content
        data = resp.json()
        assert isinstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['nombre'], 'MedA')

    def test_movimientos_filter_by_tipo_and_medicamento(self):
        # preparar datos — autenticar como empleado para poder ver movimientos
        emp = Usuario.objects.create_user(username='emp', password='x', email='emp@example.com')
        emp.rol = 'empleado'
        emp.save()
        self.client.force_authenticate(emp)
        med = Medicamento.objects.create(nombre='MovMed', precio_venta=2.5, stock_actual=10, drogueria=self.d1)
        MovimientoInventario.objects.create(medicamento=med, drogueria=self.d1, tipo_movimiento='entrada', cantidad=5)
        MovimientoInventario.objects.create(medicamento=med, drogueria=self.d1, tipo_movimiento='salida', cantidad=2)

        resp = self.client.get(f'/api/inventario/movimientos/?medicamento={med.id}&tipo_movimiento=salida')
        assert resp.status_code == 200
        data = resp.json()
        items = data['results'] if isinstance(data, dict) else data
        assert isinstance(items, list)
        # debe retornarse solo movimientos de tipo salida
        assert all(item['tipo_movimiento'] == 'salida' for item in items)

    def test_medicamentos_ordering_and_pagination(self):
        # create multiple medicamentos with different precio_venta to test ordering and pagination
        # use empleado role to access medicamentos CRUD viewset
        emp = Usuario.objects.create_user(username='emp2', password='x', email='emp2@example.com')
        emp.rol = 'empleado'
        emp.save()
        self.client.force_authenticate(emp)
        for i in range(15):
            Medicamento.objects.create(nombre=f'M{i}', precio_venta=1.0 + i, stock_actual=5, drogueria=self.d1)

        # order by precio_venta descending
        resp = self.client.get('/api/inventario/medicamentos-crud/?ordering=-precio_venta')
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict) or isinstance(data, list)
        # if pagination applied, check results ordering on first page
        items = data['results'] if isinstance(data, dict) else data
        # precio_venta comes as string via serializer; compare numerically
        assert float(items[0]['precio_venta']) >= float(items[-1]['precio_venta'])

        # test page_size parameter
        resp2 = self.client.get('/api/inventario/medicamentos-crud/?page_size=5')
        assert resp2.status_code == 200
        data2 = resp2.json()
        items2 = data2['results'] if isinstance(data2, dict) else data2
        assert len(items2) <= 5

    def test_catalogo_price_range_filter(self):
        # Public catalog should filter by price range
        Medicamento.objects.create(nombre='P1', precio_venta=100.0, stock_actual=1)
        Medicamento.objects.create(nombre='P2', precio_venta=200.0, stock_actual=1)
        Medicamento.objects.create(nombre='P3', precio_venta=300.0, stock_actual=1)

        resp = self.client.get('/api/inventario/catalogo/?precio_min=150&precio_max=250')
        assert resp.status_code == 200
        data = resp.json()
        items = data['results'] if isinstance(data, dict) else data
        names = [i['nombre'] for i in items]
        assert 'P2' in names and 'P1' not in names and 'P3' not in names

    def test_catalogo_disponible_and_pagination(self):
        # Create items with varying stock and reservas
        for i in range(12):
            Medicamento.objects.create(nombre=f'C{i}', precio_venta=10.0 + i, stock_actual= i, stock_reservado=0)

        # Set some reserved greater than stock to simulate unavailable
        m = Medicamento.objects.create(nombre='Cblocked', precio_venta=5.0, stock_actual=1, stock_reservado=1)

        # query catalog for disponibles
        resp = self.client.get('/api/inventario/catalogo/?disponible=true')
        assert resp.status_code == 200
        data = resp.json()
        items = data['results'] if isinstance(data, dict) else data
        # paginated: default page_size is 10
        assert len(items) <= 10
        # ensure the blocked item isn't present
        assert all(i['nombre'] != 'Cblocked' for i in items)

    def test_proveedores_autocomplete(self):
        Medicamento.objects.create(nombre='Prov1', precio_venta=10.0, proveedor='Acme Farma')
        Medicamento.objects.create(nombre='Prov2', precio_venta=12.0, proveedor='Delta Labs')
        Medicamento.objects.create(nombre='Prov3', precio_venta=15.0, proveedor='Acme Farma')

        resp = self.client.get('/api/inventario/catalogo/proveedores/?q=Acme')
        assert resp.status_code == 200
        data = resp.json()
        items = data['results'] if isinstance(data, dict) else data
        assert any('Acme' in s for s in items)


class PrestamoFlowTests(APITestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(username='owner', password='x', email='owner@example.com')
        # crear droguerias y medicamentos por drogueria
        self.d1 = Drogueria.objects.create(codigo='S1', nombre='Sucursal 1', propietario=self.user)
        self.d2 = Drogueria.objects.create(codigo='S2', nombre='Sucursal 2', propietario=self.user)
        self.m1 = Medicamento.objects.create(nombre='Paracetamol', precio_venta=5.0, stock_actual=20, drogueria=self.d1)
        self.m2 = Medicamento.objects.create(nombre='Paracetamol', precio_venta=5.0, stock_actual=2, drogueria=self.d2)

    def test_prestamo_reserva_and_accept(self):
        self.client.force_authenticate(self.user)
        # crear solicitud para transferir 5 unidades desde d1 a d2
        # create prestamo as the owner
        self.client.force_authenticate(self.user)
        # create prestamo as owner
        self.client.force_authenticate(self.user)
        resp = self.client.post('/api/inventario/prestamos/', data={
            'medicamento_origen': self.m1.id,
            'cantidad': 5,
            'origen': self.d1.id,
            'destino': self.d2.id
        }, format='json')
        assert resp.status_code == 201, resp.content
        data = resp.json()
        prestamo_id = data['id']

        # verificar reserva
        self.m1.refresh_from_db()
        self.assertEqual(self.m1.stock_reservado, 5)

        # aceptar la solicitud
        resp2 = self.client.post(f'/api/inventario/prestamos/{prestamo_id}/accept/')
        assert resp2.status_code == 200, resp2.content

        # verificar efecto en stock
        self.m1.refresh_from_db()
        self.m2.refresh_from_db()
        self.assertEqual(self.m1.stock_actual, 15)
        self.assertEqual(self.m1.stock_reservado, 0)
        self.assertEqual(self.m2.stock_actual, 7)

    def test_auditlog_created_on_prestamo_accept(self):
        # crear prestamo directo y aceptar para comprobar audit log
        prestamo = Prestamo.objects.create(medicamento_origen=self.m1, cantidad=2, origen=self.d1, destino=self.d2, solicitante=self.user)
        prestamo.reservar()
        prestamo.aceptar(user=self.user)
        assert AuditLog.objects.filter(action='prestamo_aceptado', model_name='Prestamo', object_id=prestamo.id).exists()

    def test_accept_requires_permission(self):
        # otro usuario sin permisos intenta aceptar -> 403
        other = Usuario.objects.create_user(username='other', password='x', email='other@example.com')
        # crear prestamo autenticado por el owner (self.user)
        self.client.force_authenticate(self.user)
        resp = self.client.post('/api/inventario/prestamos/', data={
            'medicamento_origen': self.m1.id,
            'cantidad': 1,
            'origen': self.d1.id,
            'destino': self.d2.id
        }, format='json')
        assert resp.status_code == 201, resp.content
        prestamo_id = resp.json()['id']

        # authenticate with another user and attempt to accept
        self.client.force_authenticate(user=other)
        resp2 = self.client.post(f'/api/inventario/prestamos/{prestamo_id}/accept/')
        # Depending on queryset/object-level behavior, API may return 403 or 404
        # (404 when the object isn't visible to the user). Accept either.
        self.assertIn(resp2.status_code, (403, 404))

    def test_prestamos_filter_by_estado(self):
        # owner creates two prestamos
        self.client.force_authenticate(self.user)
        p1 = self.client.post('/api/inventario/prestamos/', data={
            'medicamento_origen': self.m1.id,
            'cantidad': 1,
            'origen': self.d1.id,
            'destino': self.d2.id
        }, format='json')
        assert p1.status_code == 201
        p1_id = p1.json()['id']

        # create a second prestamo and accept it via model method (simulate processed)
        prestamo2 = Prestamo.objects.create(medicamento_origen=self.m1, cantidad=1, origen=self.d1, destino=self.d2, solicitante=self.user)
        prestamo2.reservar()
        prestamo2.aceptar(user=self.user)

        # list pending prestamos for owner
        resp = self.client.get('/api/inventario/prestamos/?estado=pending')
        assert resp.status_code == 200
        data = resp.json()
        items = data['results'] if isinstance(data, dict) else data
        # p1 should be pending
        assert any(p['id'] == p1_id for p in items)


class MedicamentoSerializerTests(APITestCase):
    def test_medicamento_serializer_includes_computed_fields(self):
        from .serializer import MedicamentoSerializer
        med = Medicamento.objects.create(
            nombre='Ibu', precio_venta=3.5, costo_compra=2.0, stock_actual=10, stock_reservado=2, fecha_vencimiento=None
        )

        ser = MedicamentoSerializer(med)
        data = ser.data

        assert 'stock_disponible' in data
        assert int(data['stock_disponible']) == 8
        assert 'valor_total' in data
        assert data['valor_total'] == str(med.valor_total)
        assert 'costo_total' in data
        assert data['costo_total'] == str(med.costo_total)
        assert 'esta_vencido' in data
        assert data['esta_vencido'] is False


class AlertaSignalsTests(APITestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(username='u2', password='x', email='u2@example.com')
        self.d1 = Drogueria.objects.create(codigo='D3', nombre='Aviso', propietario=self.user)

    def test_low_stock_alert_created_on_movimiento(self):
        med = Medicamento.objects.create(nombre='AlertaMed', precio_venta=5.0, stock_actual=5, stock_minimo=3, drogueria=self.d1)
        # salida que reduce stock a 3 (igual a minimo) -> should create alert
        MovimientoInventario.objects.create(medicamento=med, drogueria=self.d1, tipo_movimiento='salida', cantidad=2)

        # check alert exists
        from .models import Alerta
        exists = Alerta.objects.filter(tipo='low_stock', medicamento=med).exists()
        assert exists

    def test_auditlog_created_on_movimiento(self):
        med = Medicamento.objects.create(nombre='AuditMed', precio_venta=4.0, stock_actual=4, stock_minimo=3, drogueria=self.d1)
        MovimientoInventario.objects.create(medicamento=med, drogueria=self.d1, tipo_movimiento='salida', cantidad=1)
        assert AuditLog.objects.filter(action='movimiento_creado', model_name='MovimientoInventario').exists()

    def test_alerts_api_list_and_mark_read(self):
        # create med and movement to produce alert
        med = Medicamento.objects.create(nombre='ApiAlert', precio_venta=4.0, stock_actual=3, stock_minimo=3, drogueria=self.d1)
        MovimientoInventario.objects.create(medicamento=med, drogueria=self.d1, tipo_movimiento='salida', cantidad=1)

        # owner should see alert via API
        self.client.force_authenticate(self.user)
        resp = self.client.get('/api/inventario/alerts/')
        assert resp.status_code == 200
        data = resp.json()
        items = data['results'] if isinstance(data, dict) else data
        assert isinstance(items, list)
        assert len(items) >= 1

        # mark first alert as read
        aid = items[0]['id']
        resp2 = self.client.post(f'/api/inventario/alerts/{aid}/mark_read/')
        assert resp2.status_code == 200
        # verify DB
        from .models import Alerta
        a = Alerta.objects.get(pk=aid)
        assert a.leido is True

    def test_auditlogs_api_admin_only(self):
        # create an audit by creating a movement
        med = Medicamento.objects.create(nombre='Alog', precio_venta=1.0, stock_actual=3, stock_minimo=3, drogueria=self.d1)
        MovimientoInventario.objects.create(medicamento=med, drogueria=self.d1, tipo_movimiento='salida', cantidad=1)

        # non-admin should get empty list (queryset returns none)
        self.client.force_authenticate(self.user)
        r1 = self.client.get('/api/inventario/auditlogs/')
        assert r1.status_code == 200
        data1 = r1.json()
        # if paginated, results should be empty list for non-admin
        if isinstance(data1, dict):
            assert data1.get('count', 0) == 0
        else:
            assert data1 == []

        # create admin user
        admin = Usuario.objects.create_user(username='adm', password='x', email='adm@example.com')
        admin.rol = 'admin'
        admin.save()
        self.client.force_authenticate(admin)
        r2 = self.client.get('/api/inventario/auditlogs/')
        assert r2.status_code == 200
        r2data = r2.json()
        if isinstance(r2data, dict):
            assert isinstance(r2data.get('results', []), list)
        else:
            assert isinstance(r2data, list)

from django.test import TestCase

# Create your tests here.
