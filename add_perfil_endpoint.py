#!/usr/bin/env python
"""
Script para agregar endpoint PUT/PATCH para actualizar perfil de usuario
"""

vista_nueva = '''

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def actualizar_perfil_usuario(request):
    """
    GET: Obtiene el perfil del usuario autenticado
    PUT/PATCH: Actualiza el perfil del usuario autenticado
    """
    usuario = request.user
    rol_actual = usuario.get_rol_actual()
    
    if request.method == 'GET':
        return Response({
            "id": usuario.id,
            "username": usuario.username,
            "email": usuario.email,
            "nombre_completo": usuario.nombre_completo,
            "telefono": usuario.telefono,
            "direccion": usuario.direccion,
            "rol": rol_actual,
            "rol_nuevo": RolSerializer(usuario.rol_nuevo).data if usuario.rol_nuevo else None,
            "is_superuser": usuario.is_superuser,
            "is_staff": usuario.is_staff,
        })
    
    elif request.method in ['PUT', 'PATCH']:
        # Permitir actualizar campos permitidos
        permitidos = ['nombre_completo', 'email', 'telefono', 'direccion']
        datos = request.data
        
        errores = {}
        
        # Validar nombre completo
        if 'nombre_completo' in datos:
            nombre = datos.get('nombre_completo', '').strip()
            if len(nombre) < 2:
                errores['nombre_completo'] = 'El nombre debe tener al menos 2 caracteres'
            elif len(nombre) > 150:
                errores['nombre_completo'] = 'El nombre no puede exceder 150 caracteres'
            else:
                usuario.nombre_completo = nombre
        
        # Validar email
        if 'email' in datos:
            email = datos.get('email', '').strip()
            if email and not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
                errores['email'] = 'Email inválido'
            elif email and Usuario.objects.exclude(pk=usuario.pk).filter(email=email).exists():
                errores['email'] = 'Este email ya está registrado'
            elif email:
                usuario.email = email
        
        # Validar teléfono
        if 'telefono' in datos:
            telefono = datos.get('telefono', '').strip()
            if telefono and len(telefono) < 7:
                errores['telefono'] = 'Teléfono inválido'
            else:
                usuario.telefono = telefono
        
        # Dirección
        if 'direccion' in datos:
            usuario.direccion = datos.get('direccion', '').strip()
        
        if errores:
            return Response({"errors": errores}, status=status.HTTP_400_BAD_REQUEST)
        
        usuario.save()
        
        return Response({
            "message": "Perfil actualizado correctamente",
            "usuario": {
                "id": usuario.id,
                "username": usuario.username,
                "email": usuario.email,
                "nombre_completo": usuario.nombre_completo,
                "telefono": usuario.telefono,
                "direccion": usuario.direccion,
                "rol": rol_actual,
            }
        }, status=status.HTTP_200_OK)
'''

# Leer el archivo
with open('usuarios/views.py', 'r', encoding='utf-8') as f:
    contenido = f.read()

# Agregar import de re si no está
if 'import re' not in contenido:
    contenido = contenido.replace('from django.contrib.auth import authenticate',
                                 'import re\nfrom django.contrib.auth import authenticate')

# Insertar la nueva vista después de perfil_usuario
posicion = contenido.find('@api_view([\'GET\'])\n@permission_classes([permissions.IsAuthenticated])\ndef perfil_usuario(request):')
if posicion != -1:
    # Encontrar el final de la función perfil_usuario
    fin_funcion = contenido.find('\n\n# =========================', posicion)
    if fin_funcion != -1:
        contenido = contenido[:fin_funcion] + vista_nueva + contenido[fin_funcion:]

# Escribir el archivo
with open('usuarios/views.py', 'w', encoding='utf-8') as f:
    f.write(contenido)

print("✅ Endpoint actualizar_perfil_usuario agregado a usuarios/views.py")
