from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import MovimientoInventario, Medicamento, Alerta, Prestamo, AuditLog


@receiver(post_save, sender=MovimientoInventario)
def movimiento_post_save(sender, instance: MovimientoInventario, created, **kwargs):
    # solo en creación de movimientos consideramos alertas
    if not created:
        return

    med = instance.medicamento

    # registrar auditoría básica del movimiento
    try:
        AuditLog.objects.create(
            action='movimiento_creado',
            model_name='MovimientoInventario',
            object_id=instance.pk,
            user=instance.usuario,
            message=f"Movimiento {instance.tipo_movimiento} {instance.cantidad} para {med.nombre}",
            data={'medicamento': med.id, 'drogueria': instance.drogueria.id if instance.drogueria else None}
        )
    except Exception:
        pass
    # verificar stock bajo
    try:
        if med.stock_actual <= med.stock_minimo:
            # evitar duplicados: si ya existe una alerta no leída del mismo tipo para este medicamento
            exists = Alerta.objects.filter(tipo='low_stock', medicamento=med, leido=False).exists()
            if not exists:
                Alerta.objects.create(
                    tipo='low_stock',
                    nivel='warning',
                    mensaje=f"Stock bajo para {med.nombre}: {med.stock_actual} <= {med.stock_minimo}",
                    medicamento=med,
                    drogueria=instance.drogueria
                )
                # (la auditoría del movimiento ya se registró arriba)
    except Exception:
        # no queremos que una excepción en alerts rompa el flujo
        pass


@receiver(post_save, sender=Medicamento)
def medicamento_post_save(sender, instance: Medicamento, created, **kwargs):
    # verificación expiración
    try:
        if instance.esta_vencido():
            exists = Alerta.objects.filter(tipo='vencido', medicamento=instance, leido=False).exists()
            if not exists:
                Alerta.objects.create(
                    tipo='vencido',
                    nivel='danger',
                    mensaje=f"{instance.nombre} está vencido o su fecha de vencimiento ha pasado.",
                    medicamento=instance,
                    drogueria=instance.drogueria
                )
    except Exception:
        pass


@receiver(post_save, sender=Prestamo)
def prestamo_post_save(sender, instance: Prestamo, created, **kwargs):
    # si un prestamo fue aceptado, crear alerta informativa en la drogueria destino
    if not created and instance.estado == 'accepted':
        try:
            Alerta.objects.create(
                tipo='prestamo',
                nivel='info',
                mensaje=f"Préstamo aceptado: {instance.medicamento_origen.nombre} x{instance.cantidad} {instance.origen.codigo} → {instance.destino.codigo}",
                medicamento=instance.medicamento_destino,
                drogueria=instance.destino
            )
            # auditoria del prestamo aceptado
            try:
                AuditLog.objects.create(
                    action='prestamo_aceptado',
                    model_name='Prestamo',
                    object_id=instance.pk,
                    user=instance.respondedor,
                    message=f"Prestamo {instance.id} aceptado: {instance.medicamento_origen.nombre} x{instance.cantidad}",
                    data={'origen': instance.origen.id, 'destino': instance.destino.id}
                )
            except Exception:
                pass
        except Exception:
            # no queremos que una excepción aquí impida que otros handlers se ejecuten
            pass
    # si el prestamo fue rechazado
    if not created and instance.estado == 'rejected':
        try:
            AuditLog.objects.create(
                action='prestamo_rechazado',
                model_name='Prestamo',
                object_id=instance.pk,
                user=instance.respondedor,
                message=f"Prestamo {instance.id} rechazado: {instance.medicamento_origen.nombre} x{instance.cantidad}",
                data={'origen': instance.origen.id, 'destino': instance.destino.id}
            )
        except Exception:
            pass
