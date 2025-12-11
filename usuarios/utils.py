"""
Utilidades para trabajar con roles y permisos
"""
def obtener_rol_usuario(user):
    """
    Función helper para obtener el rol de un usuario de forma compatible.
    Primero intenta usar el nuevo sistema (rol_nuevo), luego el antiguo (rol).
    
    Args:
        user: Instancia de Usuario
        
    Returns:
        str: Nombre del rol en minúsculas (ej: 'admin', 'empleado', 'cliente')
    """
    if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
        return None
    
    # Intentar usar el método get_rol_actual si existe (nuevo sistema)
    if hasattr(user, 'get_rol_actual'):
        return user.get_rol_actual()
    
    # Fallback al sistema antiguo
    if hasattr(user, 'rol_nuevo') and user.rol_nuevo:
        return user.rol_nuevo.nombre.lower()
    
    if hasattr(user, 'rol') and user.rol:
        return user.rol.lower()
    
    return None


def es_admin(user):
    """
    Verifica si un usuario es administrador.
    
    Args:
        user: Instancia de Usuario
        
    Returns:
        bool: True si el usuario es admin o superuser
    """
    if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
        return False
    
    if user.is_superuser:
        return True
    
    rol = obtener_rol_usuario(user)
    return rol == 'admin'


def tiene_permiso(user, codigo_permiso):
    """
    Verifica si un usuario tiene un permiso específico.
    
    Args:
        user: Instancia de Usuario
        codigo_permiso: Código del permiso a verificar
        
    Returns:
        bool: True si el usuario tiene el permiso
    """
    if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
        return False
    
    # Si tiene el método tiene_permiso, usarlo
    if hasattr(user, 'tiene_permiso'):
        return user.tiene_permiso(codigo_permiso)
    
    return False
