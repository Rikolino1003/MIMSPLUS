#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from usuarios.models import Usuario

# Crear cliente API
client = APIClient()

# Obtener token del admin
try:
    admin = Usuario.objects.get(username='admin')
    refresh = RefreshToken.for_user(admin)
    access_token = str(refresh.access_token)
    
    print(f'✅ Token obtenido para admin')
    print(f'📡 Token (primeros 30 chars): {access_token[:30]}...')
    
    # Configurar headers
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Probar endpoint de pedidos
    print(f'\n🔍 Probando GET /api/pedidos/pedidos/')
    response = client.get('/api/pedidos/pedidos/')
    print(f'   Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Respuesta tipo: {type(data).__name__}')
        if isinstance(data, list):
            print(f'   Total pedidos recibidos: {len(data)}')
            if len(data) > 0:
                print(f'   Primer pedido: {data[0]}')
        elif isinstance(data, dict) and 'results' in data:
            print(f'   Total pedidos en results: {len(data["results"])}')
            print(f'   Estructura: {list(data.keys())}')
        else:
            print(f'   Estructura de respuesta: {list(data.keys()) if isinstance(data, dict) else "array"}')
            print(f'   Datos: {json.dumps(data, indent=2, default=str)[:500]}')
    else:
        print(f'   Error: {response.text}')
    
    # Probar endpoint de medicamentos
    print(f'\n🔍 Probando GET /api/inventario/medicamentos-crud/')
    response = client.get('/api/inventario/medicamentos-crud/')
    print(f'   Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Respuesta tipo: {type(data).__name__}')
        if isinstance(data, list):
            print(f'   Total medicamentos recibidos: {len(data)}')
        elif isinstance(data, dict) and 'results' in data:
            print(f'   Total medicamentos en results: {len(data["results"])}')
        else:
            print(f'   Estructura: {list(data.keys()) if isinstance(data, dict) else "array"}')
    else:
        print(f'   Error: {response.text}')
        
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
