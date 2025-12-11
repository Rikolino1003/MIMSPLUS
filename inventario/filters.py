"""Helpers to apply query-param-based filters to querysets for inventario app.

Centralizamos filtros para poder probar y mantenerlos fácilmente.
"""
from django.db.models import Q, F
from django.utils import timezone


def apply_medicamento_filters(qs, params):
    nombre = params.get('nombre')
    categoria = params.get('categoria')
    drogueria = params.get('drogueria')
    estado = params.get('estado')

    # búsqueda general (q) — si viene, usar sobre varios campos
    qparam = params.get('q')
    if qparam:
        qs = qs.filter(
            Q(nombre__icontains=qparam) |
            Q(descripcion__icontains=qparam) |
            Q(codigo_barra__icontains=qparam) |
            Q(proveedor__icontains=qparam) |
            Q(lote__icontains=qparam)
        )

    if nombre and not qparam:
        qs = qs.filter(nombre__icontains=nombre)
    if categoria:
        qs = qs.filter(categoria_id=categoria)
    if drogueria:
        qs = qs.filter(drogueria_id=drogueria)
    if estado is not None:
        if str(estado).lower() in ('false', '0'):
            qs = qs.filter(estado=False)
        else:
            qs = qs.filter(estado=True)

    # ------------------
    # Rango de precios
    # ------------------
    precio_min = params.get('precio_min')
    precio_max = params.get('precio_max')
    if precio_min:
        try:
            qs = qs.filter(precio_venta__gte=float(precio_min))
        except ValueError:
            pass
    if precio_max:
        try:
            qs = qs.filter(precio_venta__lte=float(precio_max))
        except ValueError:
            pass

    # ------------------
    # Stock filters
    # ------------------
    stock_min = params.get('stock_min')
    stock_max = params.get('stock_max')
    disponible = params.get('disponible')
    if stock_min:
        try:
            qs = qs.filter(stock_actual__gte=int(stock_min))
        except ValueError:
            pass
    if stock_max:
        try:
            qs = qs.filter(stock_actual__lte=int(stock_max))
        except ValueError:
            pass
    if disponible is not None:
        # disponible=true -> stock_actual > stock_reservado
        if str(disponible).lower() in ('true', '1'):
            qs = qs.filter(stock_actual__gt=F('stock_reservado'))
        else:
            qs = qs.filter(stock_actual__lte=F('stock_reservado'))

    # ------------------
    # Proveedor / lote
    # ------------------
    proveedor = params.get('proveedor')
    lote = params.get('lote')
    if proveedor:
        qs = qs.filter(proveedor__icontains=proveedor)
    if lote:
        qs = qs.filter(lote__icontains=lote)

    # ------------------
    # Fecha de vencimiento / expirados
    # ------------------
    vencido = params.get('vencido')
    fecha_venc_from = params.get('fecha_venc_from')
    fecha_venc_to = params.get('fecha_venc_to')
    if vencido is not None:
        if str(vencido).lower() in ('true', '1'):
            qs = qs.filter(fecha_vencimiento__lt=timezone.now().date())
        else:
            qs = qs.filter(Q(fecha_vencimiento__isnull=True) | Q(fecha_vencimiento__gte=timezone.now().date()))
    if fecha_venc_from:
        qs = qs.filter(fecha_vencimiento__gte=fecha_venc_from)
    if fecha_venc_to:
        qs = qs.filter(fecha_vencimiento__lte=fecha_venc_to)

    return qs


def apply_movimiento_filters(qs, params):
    medicamento = params.get('medicamento')
    drogueria = params.get('drogueria')
    tipo = params.get('tipo_movimiento')
    fecha_from = params.get('fecha_from')
    fecha_to = params.get('fecha_to')

    if medicamento:
        qs = qs.filter(medicamento_id=medicamento)
    if drogueria:
        qs = qs.filter(drogueria_id=drogueria)
    if tipo:
        qs = qs.filter(tipo_movimiento=tipo)
    if fecha_from:
        qs = qs.filter(fecha_movimiento__gte=fecha_from)
    if fecha_to:
        qs = qs.filter(fecha_movimiento__lte=fecha_to)

    return qs


def apply_prestamo_filters(qs, params):
    estado = params.get('estado')
    origen = params.get('origen')
    destino = params.get('destino')
    solicitante = params.get('solicitante')

    if estado:
        qs = qs.filter(estado=estado)
    if origen:
        qs = qs.filter(origen_id=origen)
    if destino:
        qs = qs.filter(destino_id=destino)
    if solicitante:
        qs = qs.filter(solicitante_id=solicitante)

    return qs


def apply_alerta_filters(qs, params):
    tipo = params.get('tipo')
    nivel = params.get('nivel')
    leido = params.get('leido')

    if tipo:
        qs = qs.filter(tipo=tipo)
    if nivel:
        qs = qs.filter(nivel=nivel)
    if leido is not None:
        if str(leido).lower() in ('true', '1'):
            qs = qs.filter(leido=True)
        else:
            qs = qs.filter(leido=False)

    return qs


def apply_audit_filters(qs, params):
    action = params.get('action')
    model_name = params.get('model_name')
    user_id = params.get('user')
    object_id = params.get('object_id')
    created_from = params.get('created_from')
    created_to = params.get('created_to')

    if action:
        qs = qs.filter(action=action)
    if model_name:
        qs = qs.filter(model_name=model_name)
    if user_id:
        qs = qs.filter(user_id=user_id)
    if object_id:
        qs = qs.filter(object_id=object_id)
    if created_from:
        qs = qs.filter(created_at__gte=created_from)
    if created_to:
        qs = qs.filter(created_at__lte=created_to)

    return qs
