from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Rol, Permiso  # ✅ importa los modelos Rol y Permiso

Usuario = get_user_model()


# =========================
# SERIALIZER DE PERMISO
# =========================
class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


# =========================
# SERIALIZER DE ROL
# =========================
class RolSerializer(serializers.ModelSerializer):
    permisos = PermisoSerializer(many=True, read_only=True)
    permisos_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permiso.objects.filter(activo=True),
        source='permisos',
        write_only=True,
        required=False
    )

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'permisos', 'permisos_ids', 'activo', 'fecha_creacion', 'actualizado']
        read_only_fields = ['id', 'fecha_creacion', 'actualizado']

    def create(self, validated_data):
        permisos_data = validated_data.pop('permisos', [])
        rol = Rol.objects.create(**validated_data)
        if permisos_data:
            rol.permisos.set(permisos_data)
        return rol

    def update(self, instance, validated_data):
        permisos_data = validated_data.pop('permisos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if permisos_data is not None:
            instance.permisos.set(permisos_data)
        return instance


# =========================
# SERIALIZER DE USUARIO (Tabla completa con id, nombre_usuario, nombre, rol, descripción, permisos)
# =========================
class UsuarioTablaSerializer(serializers.ModelSerializer):
    """Serializer para mostrar la tabla completa: id, nombre_usuario, nombre, rol, descripción, permisos"""
    nombre_usuario = serializers.CharField(source='username', read_only=True)
    nombre = serializers.CharField(source='nombre_completo', read_only=True)
    rol = serializers.SerializerMethodField()
    descripcion = serializers.SerializerMethodField()
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'nombre_usuario', 'nombre', 'rol', 'descripcion', 'permisos']

    def get_rol(self, obj):
        """Retorna el nombre del rol (nuevo o antiguo)"""
        if obj.rol_nuevo:
            return obj.rol_nuevo.nombre
        return obj.get_rol_display() if obj.rol else 'Sin rol'

    def get_descripcion(self, obj):
        """Retorna la descripción del rol"""
        if obj.rol_nuevo:
            return obj.rol_nuevo.descripcion
        return ''

    def get_permisos(self, obj):
        """Retorna la lista de permisos del usuario a través de su rol"""
        permisos = obj.obtener_permisos()
        return PermisoSerializer(permisos, many=True).data


# =========================
# SERIALIZER DE USUARIO (Completo para CRUD)
# =========================
class UsuarioSerializer(serializers.ModelSerializer):
    # ✔ Mostrar el label del rol (Administrador, Empleado, Cliente)
    rol_detalle = serializers.SerializerMethodField(read_only=True)
    rol_nuevo_info = RolSerializer(source='rol_nuevo', read_only=True)
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "password",
            "nombre_completo",
            "telefono",
            "direccion",
            "rol",           # valor interno: admin, empleado, cliente (compatibilidad)
            "rol_detalle",   # label: Administrador, Empleado, Cliente
            "rol_nuevo",     # ForeignKey al nuevo modelo Rol
            "rol_nuevo_info", # Información completa del rol
            "permisos",      # Lista de permisos del usuario
            "num_doc",
            "active_drogueria",
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    # ✔ Convierte el valor en su etiqueta definida en choices
    def get_rol_detalle(self, obj):
        return obj.get_rol_display()

    def get_permisos(self, obj):
        """Retorna los permisos del usuario"""
        permisos = obj.obtener_permisos()
        return PermisoSerializer(permisos, many=True).data

    def create(self, validated_data):
        """Crear usuario con contraseña encriptada"""
        password = validated_data.pop("password", None)
        usuario = self.Meta.model(**validated_data)
        if password:
            usuario.set_password(password)
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        """Actualizar usuario (con manejo de contraseña)"""
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
