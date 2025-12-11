from rest_framework import permissions
from usuarios.utils import obtener_rol_usuario

class EsEmpleadoOPermisoAdmin(permissions.BasePermission):
    """
    Permite acceso a empleados o administradores
    """

    def has_permission(self, request, view):
        # Protegemos el acceso contra usuarios anónimos: primero comprobamos
        # que el usuario está autenticado y luego leemos el atributo `rol`
        # de forma segura con getattr para evitar AttributeError.
        if not getattr(request, "user", None):
            return False

        if not getattr(request.user, "is_authenticated", False):
            return False

        user_is_staff = getattr(request.user, "is_staff", False)
        user_rol = obtener_rol_usuario(request.user)

        return bool(user_is_staff or user_rol in ["empleado", "admin"])
