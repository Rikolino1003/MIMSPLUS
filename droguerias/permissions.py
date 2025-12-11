from rest_framework import permissions
from usuarios.utils import es_admin


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
        return obj.propietario == request.user
