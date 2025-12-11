from rest_framework import serializers
from .models import Pedido, DetallePedido
from inventario.serializer import MedicamentoSerializer  # Note: 'serializer' not 'serializers'

class DetallePedidoSerializer(serializers.ModelSerializer):
    medicamento = MedicamentoSerializer(read_only=True)
    medicamento_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DetallePedido
        fields = ['id', 'medicamento', 'medicamento_id', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['precio_unitario', 'subtotal']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True)
    cliente_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    def get_cliente_nombre(self, obj):
        # Intentar obtener el nombre del cliente de diferentes maneras
        cliente = obj.cliente
        if not cliente:
            return 'Cliente no disponible'
            
        # Intentar con diferentes campos de nombre
        if hasattr(cliente, 'get_full_name'):
            full_name = cliente.get_full_name()
            if full_name.strip():
                return full_name
                
        # Si no hay get_full_name o está vacío, probar con otros campos
        if hasattr(cliente, 'nombre_completo') and cliente.nombre_completo:
            return cliente.nombre_completo
            
        # Intentar con nombre y apellido por separado
        nombre = getattr(cliente, 'first_name', '') or getattr(cliente, 'nombre', '')
        apellido = getattr(cliente, 'last_name', '') or getattr(cliente, 'apellido', '')
        
        if nombre or apellido:
            return f"{nombre} {apellido}".strip()
            
        # Si no hay nombre, usar el username o email
        if hasattr(cliente, 'username') and cliente.username:
            return cliente.username
            
        if hasattr(cliente, 'email') and cliente.email:
            return cliente.email.split('@')[0]
            
        return f'Cliente {cliente.id}'

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'fecha_creacion', 'fecha_actualizacion',
            'estado', 'estado_display', 'metodo_pago', 'direccion_entrega',
            'telefono_contacto', 'notas', 'subtotal', 'descuento', 'total', 'detalles'
        ]
        # Permitimos enviar el campo 'cliente' desde la API para crear pedidos vía JSON
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion', 'subtotal', 'total']

    def create(self, validated_data):
        from inventario.models import Medicamento  # Import here to avoid circular import
        
        detalles_data = validated_data.pop('detalles', [])
        pedido = Pedido.objects.create(**validated_data)
        
        for detalle_data in detalles_data:
            # Get the medicamento to access its precio_venta
            try:
                medicamento = Medicamento.objects.get(id=detalle_data['medicamento_id'])
                DetallePedido.objects.create(
                    pedido=pedido,
                    medicamento=medicamento,
                    cantidad=detalle_data['cantidad'],
                    precio_unitario=medicamento.precio_venta
                )
            except Medicamento.DoesNotExist:
                # Skip if medicamento doesn't exist
                continue
        
        return pedido