# usuarios/views.py
import uuid
from django.core.mail import send_mail
from django.conf import settings
import re
from django.contrib.auth import authenticate
from rest_framework import status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Rol, Permiso
from .serializer import UsuarioSerializer, RolSerializer, PermisoSerializer, UsuarioTablaSerializer
from droguerias.models import Drogueria, UsuarioDrogueria
from rest_framework_simplejwt.tokens import RefreshToken


# =========================
# Registro de usuario
# =========================
class RegistroUsuarioView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()

            # Si se envía drogueria en el body, crear membresía
            drogueria_id = request.data.get('drogueria') or request.data.get('drogueria_id')
            rol_membresia = request.data.get('rol_membresia') or request.data.get('rol')
            set_active = request.data.get('set_active', False)

            if drogueria_id:
                try:
                    drog = Drogueria.objects.get(pk=drogueria_id)
                    UsuarioDrogueria.objects.get_or_create(usuario=usuario, drogueria=drog, defaults={
                        'rol': rol_membresia or 'empleado',
                        'activo': True
                    })
                    if set_active in [True, 'true', 'True', '1', 1]:
                        # Guardar drogueria activa si el modelo Usuario la soporta
                        if hasattr(usuario, 'active_drogueria'):
                            usuario.active_drogueria = drog
                            usuario.save(update_fields=['active_drogueria'])
                except Drogueria.DoesNotExist:
                    pass

            # Generar token para login inmediato
            refresh = RefreshToken.for_user(usuario)

            return Response({
                "usuario": {
                    "id": usuario.id,
                    "username": usuario.username,
                    "nombre_completo": getattr(usuario, 'nombre_completo', ''),
                    "email": usuario.email,
                },
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "workspace_url": f"/workspace/{usuario.active_drogueria.id}" if hasattr(usuario, 'active_drogueria') and usuario.active_drogueria else None,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# Login de usuario
# =========================
class LoginUsuarioView(APIView):
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
                redirect_path = "/perfilcliente"

            return Response({
                "usuario": {
                    "id": usuario.id,
                    "username": usuario.username,
                    "nombre_completo": usuario.nombre_completo,
                    "email": usuario.email,
                    "rol": rol_actual,  # Usa el método get_rol_actual para compatibilidad
                    "rol_nuevo": RolSerializer(usuario.rol_nuevo).data if usuario.rol_nuevo else None,
                    "permisos": PermisoSerializer(usuario.obtener_permisos(), many=True).data,
                    "is_superuser": usuario.is_superuser,
                    "is_staff": usuario.is_staff,
                },
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "redirect_path": redirect_path,
            })
        return Response(
            {"error": "Usuario o contraseña incorrectos"},
            status=status.HTTP_401_UNAUTHORIZED
        )


# =========================
# Perfil del usuario logueado
# =========================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def perfil_usuario(request):
    usuario = request.user
    rol_actual = usuario.get_rol_actual()
    return Response({
        "id": usuario.id,
        "username": usuario.username,
        "email": usuario.email,
        "rol": rol_actual,
        "rol_nuevo": RolSerializer(usuario.rol_nuevo).data if usuario.rol_nuevo else None,
        "permisos": PermisoSerializer(usuario.obtener_permisos(), many=True).data,
        "nombre_completo": usuario.nombre_completo,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "is_superuser": usuario.is_superuser,
        "is_staff": usuario.is_staff,
        "admin_redirect": ("/admin/" if (usuario.is_superuser or (rol_actual and str(rol_actual).lower() in ["admin","administrador"])) else None),
    })


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


# =========================
# CRUD de Usuarios
# =========================
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        """Inactivar en lugar de eliminar."""
        instance.is_active = False
        instance.save()

    def perform_update(self, serializer):
        """Permitir actualizar datos de usuario."""
        serializer.save()

    def update(self, request, pk=None):
        try:
            usuario = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Solo el propio usuario puede editar su perfil o admin
        # Evitar AttributeError si request.user es AnonymousUser: comprobar autenticación
        from .utils import obtener_rol_usuario, es_admin
        user_is_admin = es_admin(request.user)
        if request.user != usuario and not user_is_admin:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        serializer = UsuarioSerializer(usuario, data=request.data, partial=True)  # partial=True permite actualizar solo algunos campos
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def tabla(self, request):
        """
        Endpoint para obtener la tabla de usuarios con: id, nombre_usuario, nombre, rol, descripción, permisos
        Permite filtrar por rol si se proporciona el parámetro 'rol' en la query string
        """
        usuarios = Usuario.objects.filter(is_active=True)
        
        # Filtro por rol si se proporciona
        rol_filtro = request.query_params.get('rol')
        if rol_filtro:
            usuarios = usuarios.filter(rol_nuevo__nombre__icontains=rol_filtro) | \
                      usuarios.filter(rol__icontains=rol_filtro)
        
        serializer = UsuarioTablaSerializer(usuarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# CRUD de Roles
# =========================
class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        """Inactivar en lugar de eliminar."""
        instance.activo = False
        instance.save()

    def perform_update(self, serializer):
        """Actualizar roles."""
        serializer.save()


# =========================
# CRUD de Permisos
# =========================
class PermisoViewSet(viewsets.ModelViewSet):
    queryset = Permiso.objects.filter(activo=True)
    serializer_class = PermisoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        """Inactivar en lugar de eliminar."""
        instance.activo = False
        instance.save()


# =========================
# Recuperación de contraseña
# =========================
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def solicitar_recuperacion(request):
    email = request.data.get("email")

    if not email:
        return Response({"error": "Debes ingresar un correo electrónico válido."}, status=400)

    try:
        usuario = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response({"error": "No existe una cuenta registrada con ese correo."}, status=404)

    codigo = str(uuid.uuid4())[:8]
    usuario.cod_recuperacion = codigo
    usuario.save(update_fields=['cod_recuperacion'])

    asunto = "🔐 Recuperación de contraseña - Droguería MIMS"
    mensaje = f"""
    Hola {usuario.username},

    Has solicitado recuperar tu contraseña.
    Tu código de verificación es: {codigo}

    Si no realizaste esta solicitud, ignora este mensaje.

    Droguería MIMS 💊
    """

    send_mail(
        subject=asunto,
        message=mensaje,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({"mensaje": "Correo de recuperación enviado correctamente."}, status=200)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def cambiar_contrasena(request):
    email = request.data.get("email")
    codigo = request.data.get("codigo")
    nueva_contrasena = request.data.get("nueva_contrasena")
    confirmar_contrasena = request.data.get("confirmar_contrasena")

    if not all([email, codigo, nueva_contrasena, confirmar_contrasena]):
        return Response({"error": "Faltan datos."}, status=400)

    if nueva_contrasena != confirmar_contrasena:
        return Response({"error": "Las contraseñas no coinciden."}, status=400)

    try:
        usuario = Usuario.objects.get(email=email, cod_recuperacion=codigo)
    except Usuario.DoesNotExist:
        return Response({"error": "Código o correo incorrecto."}, status=400)

    usuario.set_password(nueva_contrasena)
    usuario.cod_recuperacion = None
    usuario.save()

    return Response({"mensaje": "Contraseña cambiada correctamente."}, status=200)
