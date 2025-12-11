from django.db import models

# 📩 Modelo de mensajes de contacto
class Mensaje(models.Model):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField()
    asunto = models.CharField(max_length=150)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nombre} - {self.asunto}"


# ⭐ Modelo de reseñas
class Resena(models.Model):
    nombre = models.CharField(max_length=100)
    comentario = models.TextField()
    calificacion = models.PositiveSmallIntegerField(default=5)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.calificacion}⭐)"