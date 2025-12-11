"""
=================================================================
📊 MÓDULO DE REPORTES - MODELOS
=================================================================

Este módulo define los modelos para el sistema de reportes del MIMS.

Modelos principales:
- Reporte: Almacena información completa de cada reporte generado
  - Fecha de medición
  - Estado del reporte
  - ID único del reporte
  - Relaciones con usuarios, droguerías, etc.
  - Campos adicionales para documentación completa

Autor: Sistema MIMS
Fecha: 2025
=================================================================
"""

from django.db import models
from django.utils import timezone
from usuarios.models import Usuario
from droguerias.models import Drogueria


class Reporte(models.Model):
    """
    ================================
    📊 MODELO REPORTE
    ================================
    
    Este modelo almacena toda la información de un reporte generado
    en el sistema. Incluye fechas de medición, estados, relaciones
    con usuarios y droguerías, y campos adicionales para documentación.
    
    Campos principales:
    - id_reporte: Código único del reporte (generado automáticamente)
    - fecha_medicion: Fecha en que se realizó la medición/datos
    - estado: Estado actual del reporte (pendiente, en_proceso, completado, etc.)
    - creado_por: Usuario que creó el reporte
    - drogueria: Droguería asociada al reporte (opcional)
    - otros campos esenciales para documentación completa
    """
    
    # ================================
    # ESTADOS DEL REPORTE
    # ================================
    ESTADOS_REPORTE = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completado', 'Completado'),
        ('revisado', 'Revisado'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('cancelado', 'Cancelado'),
    ]
    
    # ================================
    # TIPOS DE REPORTE
    # ================================
    TIPOS_REPORTE = [
        ('inventario', 'Inventario'),
        ('ventas', 'Ventas'),
        ('financiero', 'Financiero'),
        ('medicamentos', 'Medicamentos'),
        ('pedidos', 'Pedidos'),
        ('clientes', 'Clientes'),
        ('general', 'General'),
        ('personalizado', 'Personalizado'),
    ]
    
    # ================================
    # CAMPOS PRINCIPALES
    # ================================
    
    # ID único del reporte (generado automáticamente)
    id_reporte = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="ID del Reporte",
        help_text="Código único identificador del reporte"
    )
    
    # Título del reporte
    titulo = models.CharField(
        max_length=200,
        verbose_name="Título del Reporte",
        help_text="Título descriptivo del reporte"
    )
    
    # Tipo de reporte
    tipo_reporte = models.CharField(
        max_length=50,
        choices=TIPOS_REPORTE,
        default='general',
        verbose_name="Tipo de Reporte",
        help_text="Clasificación del tipo de reporte"
    )
    
    # Fecha de medición (fecha en que se tomaron los datos)
    fecha_medicion = models.DateTimeField(
        verbose_name="Fecha de Medición",
        help_text="Fecha y hora en que se realizó la medición o se tomaron los datos"
    )
    
    # Estado actual del reporte
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_REPORTE,
        default='pendiente',
        verbose_name="Estado del Reporte",
        help_text="Estado actual del reporte"
    )
    
    # ================================
    # RELACIONES
    # ================================
    
    # Usuario que creó el reporte
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportes_creados',
        verbose_name="Creado Por",
        help_text="Usuario que creó este reporte"
    )
    
    # Usuario que revisó el reporte (opcional)
    revisado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportes_revisados',
        verbose_name="Revisado Por",
        help_text="Usuario que revisó este reporte"
    )
    
    # Droguería asociada (opcional)
    drogueria = models.ForeignKey(
        Drogueria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportes',
        verbose_name="Droguería",
        help_text="Droguería asociada al reporte (opcional)"
    )
    
    # ================================
    # INFORMACIÓN ADICIONAL
    # ================================
    
    # Descripción detallada del reporte
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Descripción detallada del contenido del reporte"
    )
    
    # Observaciones o notas
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observaciones",
        help_text="Observaciones, notas o comentarios adicionales"
    )
    
    # Datos del reporte en formato JSON (para almacenar datos estructurados)
    datos_json = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Datos JSON",
        help_text="Datos estructurados del reporte en formato JSON"
    )
    
    # ================================
    # FECHAS DE AUDITORÍA
    # ================================
    
    # Fecha de creación del reporte
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación",
        help_text="Fecha y hora en que se creó el reporte"
    )
    
    # Fecha de última actualización
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Actualización",
        help_text="Fecha y hora de la última modificación"
    )
    
    # Fecha de revisión (cuando fue revisado)
    fecha_revision = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Revisión",
        help_text="Fecha y hora en que fue revisado el reporte"
    )
    
    # Fecha de aprobación (cuando fue aprobado)
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Aprobación",
        help_text="Fecha y hora en que fue aprobado el reporte"
    )
    
    # ================================
    # ARCHIVOS ADICIONALES
    # ================================
    
    # Ruta al archivo PDF generado (opcional)
    archivo_pdf = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Archivo PDF",
        help_text="Ruta al archivo PDF generado del reporte"
    )
    
    # Indicador de si el PDF fue generado
    pdf_generado = models.BooleanField(
        default=False,
        verbose_name="PDF Generado",
        help_text="Indica si el PDF del reporte ya fue generado"
    )
    
    # Indicador de si el reporte fue enviado por correo
    correo_enviado = models.BooleanField(
        default=False,
        verbose_name="Correo Enviado",
        help_text="Indica si el reporte fue enviado por correo electrónico"
    )
    
    # ================================
    # MÉTODOS
    # ================================
    
    def __str__(self):
        """Representación en cadena del reporte"""
        return f"Reporte {self.id_reporte} - {self.titulo}"
    
    def generar_id_reporte(self):
        """
        Genera un ID único para el reporte si no existe.
        Formato: REP-YYYYMMDD-HHMMSS-XXXX
        """
        if not self.id_reporte:
            timestamp = timezone.now().strftime("%Y%m%d-%H%M%S")
            # Usar los últimos 4 dígitos del ID de la base de datos
            self.id_reporte = f"REP-{timestamp}-{str(self.pk).zfill(4) if self.pk else '0000'}"
        return self.id_reporte
    
    def save(self, *args, **kwargs):
        """Sobrescribe el método save para generar el ID automáticamente"""
        # Si es un nuevo reporte y no tiene ID, lo generamos después de guardar
        if not self.pk and not self.id_reporte:
            super().save(*args, **kwargs)
            self.generar_id_reporte()
        super().save(*args, **kwargs)
    
    def marcar_como_revisado(self, usuario_revisor):
        """Marca el reporte como revisado por un usuario"""
        self.estado = 'revisado'
        self.revisado_por = usuario_revisor
        self.fecha_revision = timezone.now()
        self.save()
    
    def marcar_como_aprobado(self, usuario_aprobador):
        """Marca el reporte como aprobado por un usuario"""
        self.estado = 'aprobado'
        self.revisado_por = usuario_aprobador
        self.fecha_aprobacion = timezone.now()
        self.save()
    
    def marcar_como_completado(self):
        """Marca el reporte como completado"""
        self.estado = 'completado'
        self.save()
    
    # ================================
    # META
    # ================================
    
    class Meta:
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['id_reporte'], name='rep_id_reporte_idx'),
            models.Index(fields=['estado'], name='rep_estado_idx'),
            models.Index(fields=['fecha_medicion'], name='rep_fecha_medicion_idx'),
            models.Index(fields=['tipo_reporte'], name='rep_tipo_reporte_idx'),
            models.Index(fields=['creado_por', 'fecha_creacion'], name='rep_creado_por_idx'),
        ]
