from rest_framework import permissions
from usuarios.utils import es_admin
from .models import UsuarioDrogueria


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access only to the owner (propietario) or admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Safe methods allowed
        if request.method in permissions.SAFE_METHODS:
            return True
        # Owner or site superuser or role 'admin'
        if es_admin(request.user):
            return True
        # Allow if the user is propietario
        if obj.propietario == request.user:
            return True
        # Allow if the user has an active membership for this drogueria
        try:
            return UsuarioDrogueria.objects.filter(usuario=request.user, drogueria=obj, activo=True).exists()
        except:
            return False
