from rest_framework import serializers
from .models import Prestamo, MovimientoInventario, Medicamento
from droguerias.models import Drogueria


class PrestamoSerializer(serializers.ModelSerializer):
    medicamento_origen = serializers.PrimaryKeyRelatedField(queryset=Medicamento.objects.all())
    medicamento_destino = serializers.PrimaryKeyRelatedField(queryset=Medicamento.objects.all(), required=False, allow_null=True)
    origen = serializers.PrimaryKeyRelatedField(queryset=Drogueria.objects.all())
    destino = serializers.PrimaryKeyRelatedField(queryset=Drogueria.objects.all())

    class Meta:
        model = Prestamo
        fields = ['id', 'medicamento_origen', 'medicamento_destino', 'cantidad', 'origen', 'destino', 'estado', 'solicitante', 'respondedor', 'fecha_solicitud', 'fecha_respuesta', 'nota']
        read_only_fields = ('estado', 'solicitante', 'respondedor', 'fecha_solicitud', 'fecha_respuesta')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def validate(self, data):
        medic_origen = data.get('medicamento_origen')
        origen = data.get('origen')
        cantidad = data.get('cantidad')
        if medic_origen.drogueria_id != origen.id:
            raise serializers.ValidationError('El medicamento_origen no pertenece a la drogueria origen')

        disponible = medic_origen.stock_actual - medic_origen.stock_reservado
        if cantidad > disponible:
            raise serializers.ValidationError('Stock insuficiente en la droguería origen para la cantidad solicitada')

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        prestamo = Prestamo.objects.create(
            medicamento_origen=validated_data['medicamento_origen'],
            medicamento_destino=validated_data.get('medicamento_destino'),
            cantidad=validated_data['cantidad'],
            origen=validated_data['origen'],
            destino=validated_data['destino'],
            solicitante=user
        )
        # reservar stock en origen
        prestamo.reservar()
        return prestamo
