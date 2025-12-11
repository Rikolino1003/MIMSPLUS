# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroUsuarioView,
    LoginUsuarioView,
    perfil_usuario,
    actualizar_perfil_usuario,
    solicitar_recuperacion,
    cambiar_contrasena,
    UsuarioViewSet,
    RolViewSet,
    PermisoViewSet,
)

# 🔹 Router para los CRUD automáticos
router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r'roles', RolViewSet, basename='roles')
router.register(r'permisos', PermisoViewSet, basename='permisos')

urlpatterns = [
    # 🔹 Endpoints personalizados
    path("registro/", RegistroUsuarioView.as_view(), name="registro_usuario"),
    path("login/", LoginUsuarioView.as_view(), name="login_usuario"),
    path("perfil/", actualizar_perfil_usuario, name="perfil_usuario"),
    path("recuperar/", solicitar_recuperacion, name="solicitar_recuperacion"),
    path("cambiar-contrasena/", cambiar_contrasena, name="cambiar_contrasena"),
    path("editar-usuario/<int:pk>/", UsuarioViewSet.as_view({'put': 'update'}), name="editar_usuario"),
    path("usuarios/tabla/", UsuarioViewSet.as_view({'get': 'tabla'}), name="usuarios_tabla"),

    # 🔹 Endpoints del router (CRUDs)
    path("", include(router.urls)),
]
