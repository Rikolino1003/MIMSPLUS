#!/usr/bin/env python
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usuarios.models import Usuario

# Obtener token del admin (crear si no existe)
admin = Usuario.objects.get(username='admin')

# Generar o obtener token simple (usando el ID del usuario)
# Para este test, usaremos BasicAuth o no necesitamos token si está permitido
# Vamos a usar el endpoint sin autenticación primero para ver el estado

# Sin autenticación por ahora
headers = {}

# Hacer petición
response = requests.get('http://localhost:8000/api/droguerias/', headers=headers)

print(f"Status: {response.status_code}")
print(f"Response Type: {type(response.json())}")

data = response.json()
if isinstance(data, list):
    print(f"✅ Cantidad de droguerías: {len(data)}")
    for d in data[:3]:
        print(f"  - {d['nombre']} (ID: {d['id']})")
elif isinstance(data, dict) and 'results' in data:
    print(f"✅ Cantidad de droguerías: {len(data['results'])}")
    for d in data['results'][:3]:
        print(f"  - {d['nombre']} (ID: {d['id']})")
else:
    print(f"Response: {data}")
