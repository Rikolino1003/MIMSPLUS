from django.db import models
from django.utils import timezone
from usuarios.models import Usuario


class Drogueria(models.Model):
    """Representa una droguería / sucursal.

    Campos clave:
    - nombre: nombre público de la droguería
    - codigo: código corto único (ej: D001)
    - direccion, ciudad, telefono, email
    - propietario: FK a Usuario (opcional, puede ser admin sin propietario)
    - activo: si la sucursal está activa
    - creado/actualizado

    Este modelo permitirá mantener conversaciones tipo WhatsApp con usuarios.
    """

    nombre = models.CharField(max_length=150)
    codigo = models.CharField(max_length=30, unique=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    horarios = models.TextField(blank=True, null=True, help_text="Ej: Lunes-Viernes 9AM-6PM")
    propietario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='droguerias_propias')
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['codigo', 'nombre']
        verbose_name = 'Droguería'
        verbose_name_plural = 'Droguerías'

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Conversacion(models.Model):
    """Representa una conversación tipo WhatsApp entre un usuario y una droguería."""
    
    drogueria = models.ForeignKey(Drogueria, on_delete=models.CASCADE, related_name='conversaciones')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='conversaciones_droguerias')
    creada = models.DateTimeField(auto_now_add=True)
    actualizada = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('drogueria', 'usuario')
        ordering = ['-actualizada']

    def __str__(self):
        return f"Chat: {self.usuario.username} ↔ {self.drogueria.nombre}"


class Mensaje(models.Model):
    """Representa un mensaje dentro de una conversación."""
    
    REMITENTE_CHOICES = [
        ('usuario', 'Usuario'),
        ('drogueria', 'Droguería'),
    ]

    conversacion = models.ForeignKey(Conversacion, on_delete=models.CASCADE, related_name='mensajes')
    remitente_tipo = models.CharField(max_length=20, choices=REMITENTE_CHOICES)
    remitente_id = models.IntegerField(null=True, blank=True, help_text="ID del usuario o droguería que envía")
    texto = models.TextField()
    creado = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    class Meta:
        ordering = ['creado']

    def __str__(self):
        return f"{self.remitente_tipo.upper()}: {self.texto[:50]}"

class UsuarioDrogueria(models.Model):
    """Relaciona usuarios con droguerías (membresía/permiso por sucursal).

    Permite que un mismo usuario pertenezca a varias droguerías y tenga
    un rol por sucursal (propietario, manager, empleado).
    """

    ROL_CHOICES = [
        ('propietario', 'Propietario'),
        ('manager', 'Manager'),
        ('empleado', 'Empleado'),
    ]

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='droguerias_membresia')
    drogueria = models.ForeignKey(Drogueria, on_delete=models.CASCADE, related_name='usuarios_membresia')
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='empleado')
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'drogueria')
        verbose_name = 'Membresía Usuario-Droguería'
        verbose_name_plural = 'Membresías Usuario-Droguería'

    def __str__(self):
        return f"{self.usuario.username} @ {self.drogueria.codigo} ({self.rol})"

class InventarioDrogueria(models.Model):
    """Modelo de inventario por droguería.
    
    Consolida la información de stock, valores y movimientos de inventario
    para cada droguería de manera explícita y auditable.
    """
    
    drogueria = models.OneToOneField(Drogueria, on_delete=models.CASCADE, related_name='inventario')
    valor_total_inventario = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Valor total en costo de compra")
    valor_venta_total = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Valor total en precio de venta")
    cantidad_medicamentos = models.PositiveIntegerField(default=0, help_text="Total de medicamentos únicos")
    cantidad_stock_total = models.PositiveIntegerField(default=0, help_text="Total de unidades en stock")
    ultimo_movimiento = models.DateTimeField(auto_now=True, help_text="Última vez que se modificó")
    creado = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Inventario Droguería'
        verbose_name_plural = 'Inventarios Droguería'
    
    def __str__(self):
        return f"Inventario {self.drogueria.nombre} - ${self.valor_total_inventario}"
    
    @property
    def margen_promedio(self):
        """Calcula el margen promedio del inventario."""
        if self.valor_total_inventario == 0:
            return 0
        margen = ((self.valor_venta_total - self.valor_total_inventario) / self.valor_total_inventario) * 100
        return round(margen, 2)


class MovimientoDrogueria(models.Model):
    """Auditoría de movimientos de inventario por droguería.
    
    Registra todas las entradas, salidas, transferencias y ajustes
    de inventario en cada droguería.
    """
    
    TIPO_MOVIMIENTO = [
        ('entrada', 'Entrada de compra'),
        ('salida', 'Salida/Venta'),
        ('ajuste', 'Ajuste de inventario'),
        ('transferencia_out', 'Transferencia enviada'),
        ('transferencia_in', 'Transferencia recibida'),
        ('devolución', 'Devolución'),
    ]
    
    drogueria = models.ForeignKey(Drogueria, on_delete=models.CASCADE, related_name='movimientos_inventario')
    medicamento_nombre = models.CharField(max_length=200, help_text="Nombre del medicamento movido")
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, help_text="cantidad × precio_unitario")
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)
    drogueria_destino = models.ForeignKey(
        Drogueria, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='movimientos_recibidos',
        help_text="Droguería destino si es transferencia"
    )
    creado = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-creado']
        verbose_name = 'Movimiento de Droguería'
        verbose_name_plural = 'Movimientos de Droguería'
        indexes = [
            models.Index(fields=['drogueria', '-creado']),
            models.Index(fields=['tipo_movimiento']),
        ]
    
    def __str__(self):
        return f"{self.drogueria.codigo} - {self.tipo_movimiento} - {self.medicamento_nombre} ({self.cantidad})"
    
    def save(self, *args, **kwargs):
        """Auto-calcula el subtotal antes de guardar."""
        if not self.subtotal:
            self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)