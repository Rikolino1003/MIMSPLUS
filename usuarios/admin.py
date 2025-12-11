from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol, Permiso


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('nombre', 'codigo', 'descripcion')
    ordering = ('nombre',)
    readonly_fields = ('fecha_creacion',)


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo', 'cantidad_permisos', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)
    readonly_fields = ('fecha_creacion', 'actualizado')
    filter_horizontal = ('permisos',)  # Para seleccionar múltiples permisos fácilmente
    
    fieldsets = (
        (None, {
            'fields': ('nombre', 'descripcion', 'activo')
        }),
        ('Permisos', {
            'fields': ('permisos',),
            'description': 'Seleccione los permisos para este rol (máximo 5 recomendado)'
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'actualizado')
        }),
    )
    
    def cantidad_permisos(self, obj):
        return obj.permisos.count()
    cantidad_permisos.short_description = 'Cantidad de Permisos'


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ('username', 'email', 'nombre_completo', 'rol', 'rol_nuevo', 'is_staff', 'is_active', 'fecha_creacion')
    list_filter = ('rol', 'rol_nuevo', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'nombre_completo')
    ordering = ('username',)

    # 🔹 ESTA LÍNEA ES LA CLAVE: evita el error con los campos no editables
    readonly_fields = ('fecha_creacion', 'actualizado')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {
            'fields': (
                'nombre_completo',
                'email',
                'telefono',
                'direccion',
            )
        }),
        ('Rol y permisos', {
            'fields': (
                'rol',          # Campo antiguo (compatibilidad)
                'rol_nuevo',    # Nuevo campo ForeignKey
                'is_staff',
                'is_active',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        ('Droguería', {
            'fields': ('active_drogueria',)
        }),
        ('Fechas importantes', {
            'fields': (
                'last_login',
                'fecha_creacion',
                'actualizado',
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'email',
                'password1',
                'password2',
                'nombre_completo',
                'telefono',
                'direccion',
                'rol',          # Campo antiguo
                'rol_nuevo',    # Nuevo campo
                'is_staff',
                'is_active',
            ),
        }),
    )
