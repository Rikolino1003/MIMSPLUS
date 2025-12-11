#!/usr/bin/env python
"""Script para invitar/asignar un usuario a una droguería.
Uso:
  python invite_user_drogueria.py <username> <drogueria_codigo> [rol]
Ejemplo:
  python invite_user_drogueria.py juan D001 empleado

Crea el usuario si no existe (con contraseña por defecto "password123") y crea la membresía.
"""
import sys
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from usuarios.models import Usuario
from droguerias.models import Drogueria, UsuarioDrogueria


def main():
    if len(sys.argv) < 3:
        print('Uso: invite_user_drogueria.py <username> <drogueria_codigo> [rol]')
        return
    username = sys.argv[1]
    codigo = sys.argv[2]
    rol = sys.argv[3] if len(sys.argv) > 3 else 'empleado'

    try:
        drog = Drogueria.objects.get(codigo=codigo)
    except Drogueria.DoesNotExist:
        print('No existe droguería con código', codigo)
        return

    user, created = Usuario.objects.get_or_create(username=username, defaults={'email': f'{username}@example.com'})
    if created:
        user.set_password('password123')
        user.save()
        print('Usuario creado con contraseña por defecto: password123')
    else:
        print('Usuario existe:', username)

    ud, created = UsuarioDrogueria.objects.get_or_create(usuario=user, drogueria=drog, defaults={'rol': rol, 'activo': True})
    if created:
        print(f'Membresía creada: {username} -> {drog.nombre} ({rol})')
    else:
        print('Membresía ya existe')

if __name__ == '__main__':
    main()
