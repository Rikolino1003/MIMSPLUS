#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from droguerias.models import Drogueria, UsuarioDrogueria
from usuarios.models import Usuario

# Obtener admin
admin = Usuario.objects.get(username='admin')
print(f"Usuario: {admin.username}")

# Obtener todas las droguerías
droguerias = Drogueria.objects.all()
print(f"Droguerías totales en BD: {droguerias.count()}")

# Asignar cada droguería al admin
created_count = 0
for drogueria in droguerias:
    ud, created = UsuarioDrogueria.objects.get_or_create(
        usuario=admin, 
        drogueria=drogueria
    )
    if created:
        created_count += 1
        print(f"  ✅ Asignada: {drogueria.nombre}")

print(f"\n✅ Asignadas {created_count} nuevas droguerías al admin")
print(f"Total memberships del admin: {UsuarioDrogueria.objects.filter(usuario=admin).count()}")
print("\nDroguerías accesibles:")
for ud in UsuarioDrogueria.objects.filter(usuario=admin):
    print(f"  - {ud.drogueria.nombre}")
