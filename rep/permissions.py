"""
=================================================================
📊 MÓDULO DE REPORTES - PERMISSIONS
=================================================================

Este módulo define los permisos para el acceso a los reportes.

Permisos principales:
- EsEmpleadoOAdministrador: Permite acceso completo a empleados y administradores
- PuedeCrearReporte: Permite crear reportes
- PuedeEditarReporte: Permite editar reportes
- PuedeVerReporte: Permite ver reportes

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from typing import Any
from rest_framework.permissions import BasePermission, SAFE_METHODS
from usuarios.utils import obtener_rol_usuario


class EsEmpleadoOAdministrador(BasePermission):
    """
    ================================
    🔐 PERMISO: EMPLEADO O ADMINISTRADOR
    ================================
    
    Permite acceso completo a administradores y empleados.
    Los clientes solo pueden leer (GET).
    """
    
    def has_permission(self, request, view) -> bool:
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
    
    def has_object_permission(self, request, view, obj: Any) -> bool:
        user = request.user
        rol = obtener_rol_usuario(user)
        
        # Admin y empleado → acceso total
        if rol in ("admin", "empleado"):
            return True
        
        # Cliente → solo puede ver reportes que creó o que son públicos
        if rol == "cliente":
            if request.method in SAFE_METHODS:
                # Puede ver sus propios reportes
                if hasattr(obj, 'creado_por'):
                    return obj.creado_por == user
            return False
        
        return False


class PuedeCrearReporte(BasePermission):
    """
    ================================
    ➕ PERMISO: CREAR REPORTE
    ================================
    
    Permite crear reportes a empleados y administradores.
    """
    
    def has_permission(self, request, view) -> bool:
        if request.method == 'POST':
            user = request.user
            if not user or not user.is_authenticated:
                return False
            
            rol = obtener_rol_usuario(user)
            return rol in ("admin", "empleado")
        
        return True


class PuedeEditarReporte(BasePermission):
    """
    ================================
    ✏️ PERMISO: EDITAR REPORTE
    ================================
    
    Permite editar reportes a empleados y administradores.
    Solo el creador o un administrador puede editar un reporte.
    """
    
    def has_object_permission(self, request, view, obj: Any) -> bool:
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        rol = obtener_rol_usuario(user)
        
        # Administrador puede editar cualquier reporte
        if rol == "admin":
            return True
        
        # Empleado puede editar sus propios reportes o reportes en estado pendiente
        if rol == "empleado":
            if hasattr(obj, 'creado_por'):
                # Puede editar sus propios reportes
                if obj.creado_por == user:
                    return True
                # Puede editar reportes pendientes (para asignarlos)
                if obj.estado == 'pendiente':
                    return True
        
        return False


class PuedeVerReporte(BasePermission):
    """
    ================================
    👁️ PERMISO: VER REPORTE
    ================================
    
    Permite ver reportes según el rol del usuario.
    """
    
    def has_object_permission(self, request, view, obj: Any) -> bool:
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        rol = obtener_rol_usuario(user)
        
        # Admin y empleado pueden ver todos los reportes
        if rol in ("admin", "empleado"):
            return True
        
        # Cliente solo puede ver sus propios reportes
        if rol == "cliente":
            if hasattr(obj, 'creado_por'):
                return obj.creado_por == user
        
        return False


class PuedeAprobarReporte(BasePermission):
    """
    ================================
    ✅ PERMISO: APROBAR REPORTE
    ================================
    
    Solo administradores pueden aprobar reportes.
    """
    
    def has_object_permission(self, request, view, obj: Any) -> bool:
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        rol = obtener_rol_usuario(user)
        
        # Solo administradores pueden aprobar
        return rol == "admin"
