from django.db import models
from django.utils import timezone
from usuarios.models import Usuario  # relación con usuarios
from droguerias.models import Drogueria

# =========================
# 🧩 CATEGORÍA DE MEDICAMENTOS
# =========================
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


# =========================
# 💊 MEDICAMENTO
# =========================
class Medicamento(models.Model):
    # nombre ya no es único globalmente — permitimos el mismo nombre en distintas droguerías
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        related_name="medicamentos"
    )
    # asociación con una droguería / sucursal
    drogueria = models.ForeignKey(
        Drogueria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medicamentos'
    )
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    # información de compra y lote
    costo_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lote = models.CharField(max_length=60, blank=True, null=True)
    fecha_ingreso = models.DateField(blank=True, null=True)
    proveedor = models.CharField(max_length=150, blank=True, null=True)
    codigo_barra = models.CharField(max_length=120, blank=True, null=True)
    ubicacion = models.CharField(max_length=120, blank=True, null=True)
    # stock reservado (por pedidos/transferencias pendientes)
    stock_reservado = models.PositiveIntegerField(default=0)
    stock_actual = models.PositiveIntegerField(default=0)
    stock_minimo = models.PositiveIntegerField(default=10)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    estado = models.BooleanField(default=True)
    imagen_url = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.nombre

    class Meta:
        # asegurar unicidad por (nombre, drogueria) para permitir el mismo medicamento en varias sucursales
        constraints = [
            models.UniqueConstraint(fields=['nombre', 'drogueria'], name='unique_nombre_drogueria')
        ]
        indexes = [
            models.Index(fields=['drogueria', 'categoria', 'nombre'], name='med_drog_cat_nom_idx'),
            models.Index(fields=['stock_actual'], name='med_stock_idx'),
        ]

    @property
    def stock_disponible(self):
        """Stock disponible teniendo en cuenta el reservado."""
        return max(self.stock_actual - self.stock_reservado, 0)

    @property
    def valor_total(self):
        """Valor total del inventario en venta (precio_venta * stock_actual)."""
        return self.precio_venta * self.stock_actual

    @property
    def costo_total(self):
        """Costo total del inventario (costo_compra * stock_actual)."""
        return self.costo_compra * self.stock_actual

    # =========================
    # Métodos de utilidad
    # =========================
    def verificar_stock(self):
        """Verifica si el stock está por debajo del mínimo."""
        return "Bajo stock ⚠️" if self.stock_actual <= self.stock_minimo else "Stock suficiente ✅"

    def esta_vencido(self):
        """Comprueba si el medicamento está vencido."""
        return bool(self.fecha_vencimiento and self.fecha_vencimiento < timezone.now().date())


# =========================
# 📦 MOVIMIENTOS DE INVENTARIO
# =========================
class MovimientoInventario(models.Model):
    TIPO_MOVIMIENTO = [
        ("entrada", "Entrada"),
        ("salida", "Salida"),
        ("ajuste", "Ajuste"),
    ]

    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name="movimientos"
    )
    # Indica en qué droguería se registró el movimiento
    drogueria = models.ForeignKey(
        Drogueria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos'
    )
    tipo_movimiento = models.CharField(max_length=10, choices=TIPO_MOVIMIENTO)
    cantidad = models.PositiveIntegerField()
    fecha_movimiento = models.DateTimeField(default=timezone.now)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    observacion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo_movimiento.title()} - {self.medicamento.nombre} ({self.cantidad})"

    # =========================
    # Actualiza stock al guardar
    # =========================
    def save(self, *args, **kwargs):
        """Ajusta automáticamente el stock del medicamento."""
        if not self.pk:  # solo al crear el movimiento
            if self.tipo_movimiento == "entrada":
                # entrada incrementa stock_actual
                self.medicamento.stock_actual += self.cantidad
                # si es entrada desde una transferencia, podemos liberar reservados
                if kwargs.get('transferencia_release'):
                    self.medicamento.stock_reservado = max(self.medicamento.stock_reservado - self.cantidad, 0)
            elif self.tipo_movimiento == "salida":
                # salida reduce stock_actual (y si se desea reservar, usar otro flujo)
                self.medicamento.stock_actual -= self.cantidad
                # prevenir stock negativo
                if self.medicamento.stock_actual < 0:
                    self.medicamento.stock_actual = 0
            self.medicamento.save()
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['medicamento', 'drogueria', 'fecha_movimiento'], name='mov_med_drog_fecha_idx'),
        ]


class Alerta(models.Model):
    TIPOS = [
        ('low_stock', 'Stock bajo'),
        ('vencido', 'Vencido'),
        ('prestamo', 'Prestamo'),
        ('info', 'Información'),
    ]

    nivel_choices = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('danger', 'Danger')
    ]

    tipo = models.CharField(max_length=30, choices=TIPOS)
    nivel = models.CharField(max_length=10, choices=nivel_choices, default='warning')
    mensaje = models.TextField()
    medicamento = models.ForeignKey(Medicamento, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas')
    drogueria = models.ForeignKey(Drogueria, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas')
    creado_en = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    class Meta:
        ordering = ['-creado_en']
        indexes = [
            models.Index(fields=['medicamento', 'drogueria', 'tipo', 'creado_en'], name='alert_med_drog_tipo_idx'),
        ]

    def __str__(self):
        return f"Alerta({self.tipo}) - {self.mensaje[:40]}"


class AuditLog(models.Model):
    """Registro de auditoría de acciones críticas en inventario y préstamos."""
    action = models.CharField(max_length=80)
    model_name = models.CharField(max_length=80, blank=True, null=True)
    object_id = models.IntegerField(blank=True, null=True)
    user = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField(blank=True, null=True)
    data = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id', 'created_at'], name='audit_model_obj_idx'),
        ]

    def __str__(self):
        return f"Audit: {self.action} on {self.model_name}#{self.object_id} by {self.user} at {self.created_at}"


# =========================
# 🔁 PRÉSTAMOS / TRANSFERENCIAS ENTRE DROGUERÍAS
# =========================
class Prestamo(models.Model):
    ESTADO = [
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptado'),
        ('rejected', 'Rechazado'),
        ('cancelled', 'Cancelado'),
    ]

    medicamento_origen = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name='prestamos_origen'
    )
    medicamento_destino = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name='prestamos_destino',
        null=True,
        blank=True,
        help_text='Puede apuntar a la entrada equivalente en la droguería destino (si existe)'
    )
    cantidad = models.PositiveIntegerField()
    origen = models.ForeignKey(
        Drogueria,
        on_delete=models.CASCADE,
        related_name='prestamos_origen'
    )
    destino = models.ForeignKey(
        Drogueria,
        on_delete=models.CASCADE,
        related_name='prestamos_destino'
    )
    estado = models.CharField(max_length=20, choices=ESTADO, default='pending')
    solicitante = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    respondedor = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='respuestas_prestamo')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    nota = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha_solicitud']
        indexes = [
            models.Index(fields=['origen', 'destino', 'estado', 'fecha_solicitud'], name='prest_origen_dest_estado_idx'),
        ]

    def __str__(self):
        return f"Prestamo {self.id}: {self.medicamento_origen.nombre} x{self.cantidad} {self.origen.codigo}->{self.destino.codigo} [{self.estado}]"

    def clean(self):
        # Validaciones simples: medicamento_origen debe pertenecer a la drogueria origen
        if self.medicamento_origen.drogueria_id != self.origen_id:
            raise ValueError('El medicamento_origen no pertenece a la droguería origen')

        # si medicamento_destino existe, su drogueria debe coincidir con destino
        if self.medicamento_destino and self.medicamento_destino.drogueria_id != self.destino_id:
            raise ValueError('El medicamento_destino no pertenece a la droguería destino')

        if self.cantidad <= 0:
            raise ValueError('La cantidad debe ser mayor que 0')

    def reservar(self):
        """Reserva la cantidad en el medicamento de origen (aumenta stock_reservado).

        Lanza ValueError si no hay stock disponible suficiente.
        """
        disponible = self.medicamento_origen.stock_actual - self.medicamento_origen.stock_reservado
        if self.cantidad > disponible:
            raise ValueError('Stock insuficiente para reservar')
        self.medicamento_origen.stock_reservado += self.cantidad
        self.medicamento_origen.save()

    def liberar_reserva(self):
        self.medicamento_origen.stock_reservado = max(self.medicamento_origen.stock_reservado - self.cantidad, 0)
        self.medicamento_origen.save()

    def aceptar(self, user=None):
        """Acepta la solicitud: crea movimientos de salida/entrada y actualiza estado."""
        if self.estado != 'pending':
            raise ValueError('Solo solicitudes pendientes pueden aceptarse')

        from django.db import transaction

        # Ejecutar todo en una transacción para evitar inconsistencias
        with transaction.atomic():
            # Verificar existencia de medicamento_destino; si no existe, crear uno equivalente
            if not self.medicamento_destino:
                # buscar por nombre/categoria en la drogueria destino
                dest, created = Medicamento.objects.get_or_create(
                nombre=self.medicamento_origen.nombre,
                drogueria=self.destino,
                defaults={
                    'descripcion': self.medicamento_origen.descripcion,
                    'categoria': self.medicamento_origen.categoria,
                    'precio_venta': self.medicamento_origen.precio_venta,
                    'costo_compra': self.medicamento_origen.costo_compra,
                    'stock_actual': 0,
                }
                )
                self.medicamento_destino = dest
                self.save()

            # lock the medications to prevent concurrent modifications
            origen_med = Medicamento.objects.select_for_update().get(pk=self.medicamento_origen.pk)
            dest_med = Medicamento.objects.select_for_update().get(pk=self.medicamento_destino.pk)

            # Crear movimiento salida en origen (ajusta stock_actual en 'origen_med')
            MovimientoInventario.objects.create(
                medicamento=origen_med,
                drogueria=self.origen,
                tipo_movimiento='salida',
                cantidad=self.cantidad,
                usuario=user
            )

            # Crear movimiento entrada en destino (ajusta stock_actual en 'dest_med')
            MovimientoInventario.objects.create(
                medicamento=dest_med,
                drogueria=self.destino,
                tipo_movimiento='entrada',
                cantidad=self.cantidad,
                usuario=user
            )

            # Reducir la reserva en la instancia bloqueada para no sobrescribir cambios
            origen_med.stock_reservado = max(origen_med.stock_reservado - self.cantidad, 0)
            origen_med.save()
            self.estado = 'accepted'
            self.respondedor = user
            from django.utils.timezone import now
            self.fecha_respuesta = now()
            self.save()

    def rechazar(self, user=None, nota=None):
        if self.estado != 'pending':
            raise ValueError('Solo solicitudes pendientes pueden rechazarse')
        # liberar reserva
        self.liberar_reserva()
        self.estado = 'rejected'
        self.respondedor = user
        self.nota = nota or self.nota
        from django.utils.timezone import now
        self.fecha_respuesta = now()
        self.save()

