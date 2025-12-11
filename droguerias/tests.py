from rest_framework.test import APITestCase
from django.urls import reverse
from usuarios.models import Usuario
from .models import Drogueria


class DrogueriaAPITest(APITestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(username='owner', password='pass1234', email='o@example.com')

    def test_create_drogueria_sets_owner(self):
        self.client.force_authenticate(self.user)
        url = reverse('drogueria-list')
        data = {'codigo': 'D100', 'nombre': 'Drogueria 100'}
        resp = self.client.post(url, data)
        self.assertEqual(resp.status_code, 201)
        obj = Drogueria.objects.get(codigo='D100')
        self.assertEqual(obj.propietario, self.user)

    def test_set_active_drogueria(self):
        self.client.force_authenticate(self.user)
        d = Drogueria.objects.create(codigo='D101', nombre='Drog101', propietario=self.user)
        url = reverse('drogueria-set-active')
        resp = self.client.post(url, {'drogueria': d.id})
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.active_drogueria.id, d.id)
