"""
Script para crear datos de prueba del sistema de roles y permisos
Ejecutar desde el shell de Django: python manage.py shell
Luego: exec(open('usuarios/crear_datos_prueba.py').read())
"""

from usuarios.models import Usuario, Rol, Permiso
from django.utils import timezone

print("=" * 60)
print("CREANDO PERMISOS DE EJEMPLO")
print("=" * 60)

# Crear permisos de ejemplo
permisos_data = [
    {"nombre": "Ver Inventario", "codigo": "ver_inventario", "descripcion": "Permite ver el inventario"},
    {"nombre": "Crear Factura", "codigo": "crear_factura", "descripcion": "Permite crear facturas"},
    {"nombre": "Gestionar Usuarios", "codigo": "gestionar_usuarios", "descripcion": "Permite gestionar usuarios"},
    {"nombre": "Ver Reportes", "codigo": "ver_reportes", "descripcion": "Permite ver reportes"},
    {"nombre": "Gestionar Droguerías", "codigo": "gestionar_droguerias", "descripcion": "Permite gestionar droguerías"},
]

permisos_creados = []
for perm_data in permisos_data:
    permiso, created = Permiso.objects.get_or_create(
        codigo=perm_data["codigo"],
        defaults={
            "nombre": perm_data["nombre"],
            "descripcion": perm_data["descripcion"],
            "activo": True
        }
    )
    permisos_creados.append(permiso)
    if created:
        print(f"✅ Permiso creado: {permiso.nombre} ({permiso.codigo})")
    else:
        print(f"⚠️  Permiso ya existe: {permiso.nombre} ({permiso.codigo})")

print("\n" + "=" * 60)
print("CREANDO ROLES DE EJEMPLO")
print("=" * 60)

# Crear rol Administrador con todos los permisos
rol_admin, created = Rol.objects.get_or_create(
    nombre="Administrador",
    defaults={
        "descripcion": "Rol con todos los permisos del sistema",
        "activo": True
    }
)
if created:
    rol_admin.permisos.set(permisos_creados)  # Asignar todos los permisos
    print(f"✅ Rol creado: {rol_admin.nombre} con {rol_admin.permisos.count()} permisos")
else:
    print(f"⚠️  Rol ya existe: {rol_admin.nombre}")

# Crear rol Empleado con algunos permisos
permisos_empleado = [p for p in permisos_creados if p.codigo in ["ver_inventario", "crear_factura", "ver_reportes"]]
rol_empleado, created = Rol.objects.get_or_create(
    nombre="Empleado",
    defaults={
        "descripcion": "Rol para empleados con permisos limitados",
        "activo": True
    }
)
if created:
    rol_empleado.permisos.set(permisos_empleado)
    print(f"✅ Rol creado: {rol_empleado.nombre} con {rol_empleado.permisos.count()} permisos")
else:
    print(f"⚠️  Rol ya existe: {rol_empleado.nombre}")

# Crear rol Cliente sin permisos especiales
rol_cliente, created = Rol.objects.get_or_create(
    nombre="Cliente",
    defaults={
        "descripcion": "Rol para clientes del sistema",
        "activo": True
    }
)
if created:
    print(f"✅ Rol creado: {rol_cliente.nombre} sin permisos especiales")
else:
    print(f"⚠️  Rol ya existe: {rol_cliente.nombre}")

print("\n" + "=" * 60)
print("ASIGNANDO ROLES A USUARIOS EXISTENTES")
print("=" * 60)

# Asignar roles a usuarios existentes según su rol antiguo
usuarios = Usuario.objects.all()
for usuario in usuarios:
    if usuario.rol == 'admin' and not usuario.rol_nuevo:
        usuario.rol_nuevo = rol_admin
        usuario.save()
        print(f"✅ Usuario {usuario.username} asignado al rol: {rol_admin.nombre}")
    elif usuario.rol == 'empleado' and not usuario.rol_nuevo:
        usuario.rol_nuevo = rol_empleado
        usuario.save()
        print(f"✅ Usuario {usuario.username} asignado al rol: {rol_empleado.nombre}")
    elif usuario.rol == 'cliente' and not usuario.rol_nuevo:
        usuario.rol_nuevo = rol_cliente
        usuario.save()
        print(f"✅ Usuario {usuario.username} asignado al rol: {rol_cliente.nombre}")

print("\n" + "=" * 60)
print("VERIFICANDO DATOS")
print("=" * 60)

print(f"\n📊 Total de Permisos: {Permiso.objects.count()}")
print(f"📊 Total de Roles: {Rol.objects.count()}")
print(f"📊 Total de Usuarios: {Usuario.objects.count()}")
print(f"📊 Usuarios con rol_nuevo asignado: {Usuario.objects.filter(rol_nuevo__isnull=False).count()}")

print("\n" + "=" * 60)
print("✅ PROCESO COMPLETADO")
print("=" * 60)



