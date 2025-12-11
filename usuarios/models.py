from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid

# =========================
# MODELO PERMISO
# =========================
class Permiso(models.Model):
    """Modelo para definir permisos específicos del sistema"""
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=50, unique=True, help_text="Código único del permiso (ej: 'ver_inventario', 'crear_factura')")
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# =========================
# MODELO ROL
# =========================
class Rol(models.Model):
    """Modelo para definir roles con permisos asociados"""
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    permisos = models.ManyToManyField(Permiso, related_name='roles', blank=True, help_text="Permisos asociados a este rol (máximo 5 recomendado)")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# =========================
# MODELO USUARIO
# =========================
class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('admin', 'Administrador'),
        ('empleado', 'Empleado'),
        ('cliente', 'Cliente'),
    ]

    num_doc = models.CharField(max_length=20, unique=True, null=True, blank=True)
    cod_recuperacion = models.CharField(max_length=100, blank=True, null=True)  # 🔑 para recuperar contraseña
    nombre_completo = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    direccion = models.CharField(max_length=200, blank=True, null=True)
    
    # Campo antiguo para compatibilidad (se mantiene)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='cliente', null=True, blank=True)
    
    # Nuevo campo ForeignKey a Rol
    rol_nuevo = models.ForeignKey(
        Rol,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        help_text="Rol asignado al usuario con permisos específicos"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    
    # drogueria activa para el usuario (puede cambiarla en la UI)
    active_drogueria = models.ForeignKey(
        'droguerias.Drogueria',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_activos'
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        rol_display = self.rol_nuevo.nombre if self.rol_nuevo else (self.rol or 'Sin rol')
        return f"{self.username} ({rol_display})"

    # ✅ Método para generar código de recuperación
    def generar_codigo_recuperacion(self):
        self.cod_recuperacion = str(uuid.uuid4())[:8]
        self.save()
    
    # ✅ Método para obtener el rol (compatibilidad con código antiguo)
    def get_rol_actual(self):
        """Retorna el rol actual: primero intenta rol_nuevo, luego el campo rol antiguo"""
        if self.rol_nuevo:
            return self.rol_nuevo.nombre.lower()
        return self.rol or 'cliente'
    
    # ✅ Método para verificar si tiene un permiso específico
    def tiene_permiso(self, codigo_permiso):
        """Verifica si el usuario tiene un permiso específico a través de su rol"""
        if self.rol_nuevo and self.rol_nuevo.activo:
            return self.rol_nuevo.permisos.filter(codigo=codigo_permiso, activo=True).exists()
        return False
    
    # ✅ Método para obtener todos los permisos del usuario
    def obtener_permisos(self):
        """Retorna todos los permisos activos del usuario a través de su rol"""
        if self.rol_nuevo and self.rol_nuevo.activo:
            return self.rol_nuevo.permisos.filter(activo=True)
        return Permiso.objects.none()
