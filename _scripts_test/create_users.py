#!/usr/bin/env python
"""
Script para crear roles y usuarios: admin, empleado, cliente
Borra usuarios existentes antes de crear los nuevos.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usuarios.models import Usuario, Rol

print("🔁 Iniciando: crear roles y usuarios solicitados...")

# 1) Crear roles si no existen
roles_needed = ['admin', 'empleado', 'cliente']
roles = {}
for r in roles_needed:
    rol_obj, created = Rol.objects.get_or_create(nombre=r)
    roles[r] = rol_obj
    print(f"- Rol '{r}': {'creado' if created else 'existente'}")

# 2) Eliminar usuarios existentes
count_before = Usuario.objects.count()
Usuario.objects.all().delete()
print(f"🗑️  Usuarios eliminados: {count_before}")

# 3) Crear superadmin
admin_pw = 'Admin123!'
admin_email = 'davidrico1003@gmail.com'
admin_username = 'Rikolino1003'
print("\n👤 Creando superuser...")
admin = Usuario.objects.create_superuser(username=admin_username, email=admin_email, password=admin_pw)
admin.is_staff = True
admin.is_superuser = True
admin.rol_nuevo = roles['admin']
admin.save()
print(f"✅ Superuser creado: {admin_username} / {admin_pw}")

# 4) Crear empleado
emp_username = 'empleado'
emp_pw = 'Empleado123!'
emp_email = 'empleado@example.com'
print("\n👥 Creando empleado...")
empleado = Usuario.objects.create_user(username=emp_username, email=emp_email, password=emp_pw)
empleado.is_staff = False
empleado.is_superuser = False
empleado.rol_nuevo = roles['empleado']
empleado.save()
print(f"✅ Empleado creado: {emp_username} / {emp_pw}")

# 5) Crear cliente
cli_username = 'cliente'
cli_pw = 'Cliente123!'
cli_email = 'cliente@example.com'
print("\n🧾 Creando cliente...")
cliente = Usuario.objects.create_user(username=cli_username, email=cli_email, password=cli_pw)
cliente.is_staff = False
cliente.is_superuser = False
cliente.rol_nuevo = roles['cliente']
cliente.save()
print(f"✅ Cliente creado: {cli_username} / {cli_pw}")

print("\n🎯 Todos los usuarios creados correctamente.")
print("Acceso frontend: http://localhost:5173/login")
print("Admin Django: http://localhost:8000/admin/")
