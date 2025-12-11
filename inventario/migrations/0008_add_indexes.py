"""Add useful DB indexes for performance."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0007_auditlog'),
    ]

    operations = [
        # Medicamento indexes
        migrations.AddIndex(
            model_name='medicamento',
            index=models.Index(fields=['drogueria', 'categoria', 'nombre'], name='med_drog_cat_nom_idx'),
        ),
        migrations.AddIndex(
            model_name='medicamento',
            index=models.Index(fields=['stock_actual'], name='med_stock_idx'),
        ),

        # MovimientoInventario index
        migrations.AddIndex(
            model_name='movimientoinventario',
            index=models.Index(fields=['medicamento', 'drogueria', 'fecha_movimiento'], name='mov_med_drog_fecha_idx'),
        ),

        # Alerta index
        migrations.AddIndex(
            model_name='alerta',
            index=models.Index(fields=['medicamento', 'drogueria', 'tipo', 'creado_en'], name='alert_med_drog_tipo_idx'),
        ),

        # AuditLog index
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['model_name', 'object_id', 'created_at'], name='audit_model_obj_idx'),
        ),

        # Prestamo index
        migrations.AddIndex(
            model_name='prestamo',
            index=models.Index(fields=['origen', 'destino', 'estado', 'fecha_solicitud'], name='prest_origen_dest_estado_idx'),
        ),
    ]
