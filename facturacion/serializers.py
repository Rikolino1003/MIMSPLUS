from rest_framework import serializers
from .models import Factura, DetalleFactura
from usuarios.models import Usuario
from inventario.models import Medicamento


# =========================
# 💊 SERIALIZER DETALLE FACTURA
# =========================
class DetalleFacturaSerializer(serializers.ModelSerializer):
    medicamento = serializers.StringRelatedField(read_only=True)
    medicamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicamento.objects.all(),
        source='medicamento',
        write_only=True
    )

    class Meta:
        model = DetalleFactura
        fields = [
            'id',
            'medicamento',
            'medicamento_id',
            'cantidad',
            'precio_unitario',
            'subtotal'
        ]


# =========================
# 🧾 SERIALIZER FACTURA
# =========================
class FacturaSerializer(serializers.ModelSerializer):
    cliente = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())   # 👈 ahora acepta ID de cliente
    cliente_nombre = serializers.SerializerMethodField()  # 👈 agregar nombre del cliente
    detalles = DetalleFacturaSerializer(many=True, required=False)                # 👈 detalles anidados opcionales

    class Meta:
        model = Factura
        fields = [
            'id',
            'cliente',
            'cliente_nombre',
            'empleado',
            'fecha_emision',
            'total',
            'metodo_pago',
            'correo_enviado',
            'direccion_entrega',
            'observaciones',
            'detalles',
        ]
        read_only_fields = ['fecha_emision', 'cliente_nombre']

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre_completo or obj.cliente.username

    # =========================
    # 🔹 Crear factura con detalles
    # =========================
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        factura = Factura.objects.create(**validated_data)

        for detalle_data in detalles_data:
            DetalleFactura.objects.create(
                factura=factura,
                **detalle_data
            )

        return factura

    # =========================
    # 🔹 Actualizar factura + detalles
    # =========================
    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)

        # Actualizar los campos principales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si vienen detalles, reemplazarlos
        if detalles_data is not None:
            instance.detalles.all().delete()
            for detalle_data in detalles_data:
                DetalleFactura.objects.create(
                    factura=instance,
                    **detalle_data
                )

        return instance
