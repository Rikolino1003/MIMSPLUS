#!/usr/bin/env python
"""
Script de prueba para verificar los endpoints de droguerías
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import Token
from usuarios.models import Usuario
from droguerias.models import Drogueria, Conversacion, Mensaje
from rest_framework.test import APIClient

# Crear cliente API
client = APIClient()

# Obtener admin con token
admin = Usuario.objects.filter(is_staff=True).first()
if not admin:
    print("No hay admin")
    exit(1)

print("=== VERIFICACION DE ENDPOINTS ===\n")
print("Admin: " + admin.username)
print("ID: " + str(admin.id))

# Crear o obtener token
token, created = Token.objects.get_or_create(user=admin)
print("Token: " + token.key[:20] + "...")

# Autenticar cliente
client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

print("\n1. GET /api/droguerias/ (listar todas)")
response = client.get('/api/droguerias/')
print("Status: " + str(response.status_code))
print("Count: " + str(len(response.json())))

print("\n2. GET /api/droguerias/get_active/ (obtener activa)")
response = client.get('/api/droguerias/get_active/')
print("Status: " + str(response.status_code))
if response.status_code == 200:
    print("Active: " + response.json().get('nombre', 'N/A'))
else:
    print("Response: " + str(response.data if hasattr(response, 'data') else 'No data'))

print("\n3. POST /api/droguerias/set_active/ (cambiar activa)")
d = Drogueria.objects.first()
if d:
    response = client.post('/api/droguerias/set_active/', {'drogueria': d.id}, format='json')
    print("Status: " + str(response.status_code))
    if response.status_code == 200:
        print("Changed to: " + response.json().get('drogueria', {}).get('nombre', 'N/A'))

print("\n4. POST /api/conversaciones/ (crear conversacion)")
d = Drogueria.objects.first()
if d:
    response = client.post('/api/conversaciones/', {'drogueria': d.id}, format='json')
    print("Status: " + str(response.status_code))
    if response.status_code in [200, 201]:
        data = response.json()
        print("Conversacion ID: " + str(data.get('id', 'N/A')))
        conv_id = data.get('id')
        
        print("\n5. POST /api/mensajes/ (enviar mensaje)")
        response = client.post('/api/mensajes/', {
            'conversacion': conv_id,
            'texto': 'Mensaje de prueba'
        }, format='json')
        print("Status: " + str(response.status_code))
        if response.status_code in [200, 201]:
            print("Mensaje ID: " + str(response.json().get('id', 'N/A')))

print("\n=== FIN DE PRUEBAS ===")
