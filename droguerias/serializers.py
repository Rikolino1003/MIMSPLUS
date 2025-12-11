from rest_framework import serializers
from .models import Drogueria, Conversacion, Mensaje


class DrogueriaSerializer(serializers.ModelSerializer):
    propietario_username = serializers.CharField(source='propietario.username', read_only=True)

    class Meta:
        model = Drogueria
        fields = [
            'id', 'codigo', 'nombre', 'direccion', 'ciudad', 'telefono', 'email', 'horarios',
            'propietario', 'propietario_username', 'activo', 'creado', 'actualizado'
        ]
        read_only_fields = ('creado', 'actualizado')


class MensajeSerializer(serializers.ModelSerializer):
    remitente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Mensaje
        fields = ['id', 'conversacion', 'remitente_tipo', 'remitente_id', 'remitente_nombre', 'texto', 'creado', 'leido']
        read_only_fields = ('creado',)

    def get_remitente_nombre(self, obj):
        """Retorna el nombre del remitente (usuario o nombre droguería)."""
        if obj.remitente_tipo == 'usuario':
            try:
                usuario = __import__('usuarios.models', fromlist=['Usuario']).Usuario.objects.get(id=obj.remitente_id)
                return usuario.username
            except:
                return 'Usuario desconocido'
        else:  # drogueria
            try:
                drogueria = Drogueria.objects.get(id=obj.remitente_id)
                return drogueria.nombre
            except:
                return 'Droguería desconocida'


class ConversacionSerializer(serializers.ModelSerializer):
    drogueria_nombre = serializers.CharField(source='drogueria.nombre', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    ultimo_mensaje = serializers.SerializerMethodField()
    mensajes = MensajeSerializer(many=True, read_only=True)

    class Meta:
        model = Conversacion
        fields = ['id', 'drogueria', 'drogueria_nombre', 'usuario', 'usuario_username', 'creada', 'actualizada', 'ultimo_mensaje', 'mensajes']
        read_only_fields = ('creada', 'actualizada')

    def get_ultimo_mensaje(self, obj):
        """Retorna el último mensaje de la conversación."""
        ultimo = obj.mensajes.last()
        if ultimo:
            return {
                'texto': ultimo.texto[:50],
                'remitente_tipo': ultimo.remitente_tipo,
                'creado': ultimo.creado
            }
        return None
