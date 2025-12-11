#!/usr/bin/env python
"""
Script para crear un nuevo superadmin y eliminar usuarios existentes
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usuarios.models import Usuario

# Eliminar todos los usuarios
print("🗑️  Eliminando usuarios existentes...")
Usuario.objects.all().delete()
print(f"✅ Usuarios eliminados")

# Crear nuevo superadmin
print("\n📝 Creando nuevo superadmin...")
admin = Usuario.objects.create_superuser(
    username='Rikolino1003',
    email='davidrico1003@gmail.com',
    password='Admin123'
)
print(f"✅ Superadmin creado:")
print(f"   Username: {admin.username}")
print(f"   Email: {admin.email}")
print(f"   Password: Admin123")
print(f"   Superuser: {admin.is_superuser}")
print(f"   Staff: {admin.is_staff}")

print("\n" + "="*50)
print("🎉 ¡Nuevo admin creado exitosamente!")
print("="*50)
print("\n📋 Credenciales:")
print(f"   User: Rikolino1003")
print(f"   Pass: Admin123")
print("\n🔗 Acceso:")
print(f"   Login: http://localhost:5173/login")
print(f"   Admin Django: http://localhost:8000/admin")
