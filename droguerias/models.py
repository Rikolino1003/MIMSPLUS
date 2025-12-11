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
