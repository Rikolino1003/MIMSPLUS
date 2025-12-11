"""
=================================================================
📊 MÓDULO DE REPORTES - SERIALIZERS
=================================================================

Este módulo contiene los serializers para el sistema de reportes.
Los serializers permiten convertir los modelos Django en JSON y viceversa
para la comunicación con el frontend.

Serializers principales:
- ReporteSerializer: Serializer completo para el modelo Reporte
  - Incluye todos los campos del modelo
  - Campos de solo lectura para información relacionada
  - Métodos personalizados para campos calculados

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from rest_framework import serializers
from .models import Reporte
from usuarios.models import Usuario
from droguerias.models import Drogueria


class ReporteSerializer(serializers.ModelSerializer):
    """
    ================================
    📊 SERIALIZER REPORTE
    ================================
    
    Serializer completo para el modelo Reporte.
    Permite crear, leer, actualizar y eliminar reportes.
    
    Campos principales:
    - Todos los campos del modelo Reporte
    - Campos calculados (nombres de usuarios, droguería, etc.)
    - Validaciones personalizadas
    """
    
    # Campos de solo lectura para mostrar información relacionada
    creado_por_nombre = serializers.SerializerMethodField()
    revisado_por_nombre = serializers.SerializerMethodField()
    drogueria_nombre = serializers.SerializerMethodField()
    
    # Campos para escritura (aceptan IDs)
    creado_por = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=False,
        allow_null=True,
        write_only=False
    )
    revisado_por = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=False,
        allow_null=True,
        write_only=False
    )
    drogueria = serializers.PrimaryKeyRelatedField(
        queryset=Drogueria.objects.all(),
        required=False,
        allow_null=True,
        write_only=False
    )
    
    class Meta:
        model = Reporte
        fields = [
            # Campos principales
            'id',
            'id_reporte',
            'titulo',
            'tipo_reporte',
            'fecha_medicion',
            'estado',
            
            # Relaciones
            'creado_por',
            'creado_por_nombre',
            'revisado_por',
            'revisado_por_nombre',
            'drogueria',
            'drogueria_nombre',
            
            # Información adicional
            'descripcion',
            'observaciones',
            'datos_json',
            
            # Fechas
            'fecha_creacion',
            'fecha_actualizacion',
            'fecha_revision',
            'fecha_aprobacion',
            
            # Archivos y estado
            'archivo_pdf',
            'pdf_generado',
            'correo_enviado',
        ]
        
        # Campos de solo lectura (se generan automáticamente)
        read_only_fields = [
            'id',
            'id_reporte',
            'fecha_creacion',
            'fecha_actualizacion',
            'creado_por_nombre',
            'revisado_por_nombre',
            'drogueria_nombre',
            'archivo_pdf',
            'pdf_generado',
        ]
    
    def get_creado_por_nombre(self, obj):
        """Obtiene el nombre completo del usuario que creó el reporte"""
        if obj.creado_por:
            return obj.creado_por.nombre_completo or obj.creado_por.username
        return None
    
    def get_revisado_por_nombre(self, obj):
        """Obtiene el nombre completo del usuario que revisó el reporte"""
        if obj.revisado_por:
            return obj.revisado_por.nombre_completo or obj.revisado_por.username
        return None
    
    def get_drogueria_nombre(self, obj):
        """Obtiene el nombre de la droguería asociada"""
        if obj.drogueria:
            return obj.drogueria.nombre
        return None
    
    def validate_fecha_medicion(self, value):
        """Valida que la fecha de medición no sea en el futuro"""
        from django.utils import timezone
        if value > timezone.now():
            raise serializers.ValidationError(
                "La fecha de medición no puede ser en el futuro."
            )
        return value
    
    def validate_estado(self, value):
        """Valida que el estado sea uno de los permitidos"""
        estados_permitidos = [choice[0] for choice in Reporte.ESTADOS_REPORTE]
        if value not in estados_permitidos:
            raise serializers.ValidationError(
                f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
            )
        return value
    
    def create(self, validated_data):
        """
        Crea un nuevo reporte y asigna automáticamente el usuario creador
        si está autenticado.
        """
        # Obtener el usuario de la petición
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['creado_por'] = request.user
        
        # Crear el reporte
        reporte = Reporte.objects.create(**validated_data)
        
        # Generar el ID del reporte si no existe
        if not reporte.id_reporte:
            reporte.generar_id_reporte()
            reporte.save()
        
        return reporte
    
    def update(self, instance, validated_data):
        """
        Actualiza un reporte existente.
        Mantiene los campos de solo lectura y actualiza los permitidos.
        """
        # Actualizar campos permitidos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class ReporteListSerializer(serializers.ModelSerializer):
    """
    ================================
    📋 SERIALIZER LISTA DE REPORTES
    ================================
    
    Serializer simplificado para listar reportes (más eficiente).
    Solo incluye los campos más importantes para la lista.
    """
    
    creado_por_nombre = serializers.SerializerMethodField()
    drogueria_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Reporte
        fields = [
            'id',
            'id_reporte',
            'titulo',
            'tipo_reporte',
            'fecha_medicion',
            'estado',
            'creado_por_nombre',
            'drogueria_nombre',
            'fecha_creacion',
            'pdf_generado',
        ]
        read_only_fields = fields
    
    def get_creado_por_nombre(self, obj):
        """Obtiene el nombre del creador"""
        if obj.creado_por:
            return obj.creado_por.nombre_completo or obj.creado_por.username
        return None
    
    def get_drogueria_nombre(self, obj):
        """Obtiene el nombre de la droguería"""
        if obj.drogueria:
            return obj.drogueria.nombre
        return None


class ReporteCreateSerializer(serializers.ModelSerializer):
    """
    ================================
    ➕ SERIALIZER CREAR REPORTE
    ================================
    
    Serializer específico para crear reportes.
    Incluye validaciones adicionales para la creación.
    """
    
    class Meta:
        model = Reporte
        fields = [
            'titulo',
            'tipo_reporte',
            'fecha_medicion',
            'estado',
            'drogueria',
            'descripcion',
            'observaciones',
            'datos_json',
        ]
    
    def validate_titulo(self, value):
        """Valida que el título no esté vacío"""
        if not value or not value.strip():
            raise serializers.ValidationError(
                "El título del reporte es obligatorio."
            )
        return value.strip()


