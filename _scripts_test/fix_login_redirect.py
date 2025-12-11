#!/usr/bin/env python
"""
Script para arreglar la redirección de login en usuarios/views.py
"""
import re

with open('usuarios/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar la lógica de admin_redirect
old_pattern = r'''class LoginUsuarioView\(APIView\):
    permission_classes = \[permissions\.AllowAny\]

    def post\(self, request\):
        username = request\.data\.get\("username"\)
        password = request\.data\.get\("password"\)
        usuario = authenticate\(username=username, password=password\)

        if usuario:
            refresh = RefreshToken\.for_user\(usuario\)
            rol_actual = usuario\.get_rol_actual\(\)
            # Determinar si el usuario debe ser dirigido al panel de administración
            es_admin = usuario\.is_superuser or \(rol_actual and str\(rol_actual\)\.lower\(\) in \["admin", "administrador"\]\)
            admin_redirect = "/admin/" if es_admin else None'''

new_pattern = '''class LoginUsuarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        usuario = authenticate(username=username, password=password)

        if usuario:
            refresh = RefreshToken.for_user(usuario)
            rol_actual = usuario.get_rol_actual()
            # Determinar si el usuario debe ser dirigido al panel de administración
            es_admin = usuario.is_superuser or (rol_actual and str(rol_actual).lower() in ["admin", "administrador"])
            es_empleado = rol_actual and str(rol_actual).lower() in ["empleado", "vendedor"]
            
            # Determinar la redirección correcta según el rol
            if es_admin:
                redirect_path = "/paneladmin"
            elif es_empleado:
                redirect_path = "/panelempleado"
            else:
                redirect_path = "/perfilcliente"'''

content = re.sub(old_pattern, new_pattern, content)

# Reemplazar admin_redirect por redirect_path en el Response
content = content.replace('"admin_redirect": admin_redirect,', '"redirect_path": redirect_path,')

with open('usuarios/views.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Actualizado: usuarios/views.py")
print("✅ admin_redirect cambiado a redirect_path con lógica correcta")
