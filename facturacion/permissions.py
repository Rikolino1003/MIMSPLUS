from typing import Any
from rest_framework.permissions import BasePermission, SAFE_METHODS
from usuarios.utils import obtener_rol_usuario


class EsEmpleadoOAdministrador(BasePermission):
    """
    Permite acceso total a admin y empleados.
    Los clientes solo pueden leer (GET).
    """

    def has_permission(self, request, view) -> bool: # type: ignore
        user = request.user

        # No autenticado → solo lectura
        if not user or not user.is_authenticated:
            return request.method in SAFE_METHODS

        # Admin o empleado → acceso total
        rol = obtener_rol_usuario(user)
        if rol in ("admin", "empleado"):
            return True

        # Cliente → solo lectura
        return request.method in SAFE_METHODS

    def has_object_permission(self, request, view, obj: Any) -> bool: # type: ignore
        user = request.user
        rol = obtener_rol_usuario(user)

        # Admin y empleado → acceso total
        if rol in ("admin", "empleado"):
            return True

        # Cliente → solo puede ver sus propias facturas
        if rol == "cliente":
            if request.method in SAFE_METHODS:
                return getattr(obj, "cliente", None) == user
            return False

        return False
