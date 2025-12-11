from rest_framework import serializers
from .models import Medicamento, Categoria, MovimientoInventario
from droguerias.models import Drogueria


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'activo']


class DrogueriaNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drogueria
        fields = ['id', 'codigo', 'nombre']


class MedicamentoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all(), source='categoria', write_only=True, required=False, allow_null=True)

    drogueria = DrogueriaNestedSerializer(read_only=True)
    drogueria_id = serializers.PrimaryKeyRelatedField(queryset=Drogueria.objects.all(), source='drogueria', write_only=True, required=False, allow_null=True)

    # exposiciones de propiedades calculadas
    stock_disponible = serializers.IntegerField(read_only=True)
    valor_total = serializers.SerializerMethodField(read_only=True)
    costo_total = serializers.SerializerMethodField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    stock_status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Medicamento
        fields = [
            'id', 'nombre', 'descripcion', 'precio_venta', 'costo_compra',
            'stock_actual', 'stock_reservado', 'stock_minimo', 'categoria', 'categoria_id',
            'fecha_vencimiento', 'estado', 'imagen_url', 'drogueria', 'drogueria_id',
            'lote', 'fecha_ingreso', 'proveedor', 'codigo_barra', 'ubicacion',
            # calculados
            'stock_disponible', 'valor_total', 'costo_total', 'esta_vencido', 'stock_status'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # consistent formatting
        data['precio_venta'] = str(instance.precio_venta or "0.00")
        data['costo_compra'] = str(instance.costo_compra or "0.00")
        data['stock_actual'] = instance.stock_actual or 0
        data['stock_reservado'] = instance.stock_reservado or 0
        data['stock_minimo'] = instance.stock_minimo or 0
        data['fecha_vencimiento'] = instance.fecha_vencimiento.isoformat() if instance.fecha_vencimiento else None
        return data

    def get_valor_total(self, instance):
        # devolver como string consistente
        return str(instance.valor_total or "0.00")

    def get_costo_total(self, instance):
        return str(instance.costo_total or "0.00")

    def get_stock_status(self, instance):
        # breve etiqueta legible
        return instance.verificar_stock()


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    medicamento = MedicamentoSerializer(read_only=True)
    medicamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicamento.objects.all(), source='medicamento', write_only=True, required=True
    )

    # When reading a MovimientoInventario, return nested drogueria details.
    # When writing, accept drogueria_id to associate the movement with a drogueria.
    drogueria = DrogueriaNestedSerializer(read_only=True)
    drogueria_id = serializers.PrimaryKeyRelatedField(
        queryset=Drogueria.objects.all(), source='drogueria', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'tipo_movimiento', 'cantidad', 'fecha_movimiento',
            'medicamento', 'medicamento_id', 'drogueria', 'drogueria_id'
        ]


class CategoriaConMedicamentosSerializer(serializers.ModelSerializer):
    medicamentos = MedicamentoSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'activo', 'medicamentos']


class AlertaSerializer(serializers.ModelSerializer):
    medicamento = MedicamentoSerializer(read_only=True)
    drogueria = DrogueriaNestedSerializer(read_only=True)

    class Meta:
        model = getattr(__import__('inventario.models', fromlist=['Alerta']), 'Alerta')
        fields = ['id', 'tipo', 'nivel', 'mensaje', 'medicamento', 'drogueria', 'creado_en', 'leido']


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = getattr(__import__('inventario.models', fromlist=['AuditLog']), 'AuditLog')
        fields = ['id', 'action', 'model_name', 'object_id', 'user', 'message', 'data', 'created_at']
