from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import PedidoSerializer
from .models import Pedido, HistorialPedido
from mensajes.models import Mensaje


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_pedidos_list_create(request):
    """Lista de pedidos (GET) y creación de pedido (POST JSON).
    Endpoint expuesto en: /api/pedidos/pedidos/  (lista)
    Endpoint expuesto en: /api/pedidos/crear-pedido/  (creación)
    """
    if request.method == 'GET':
        # Permitir filtros simples
        qs = Pedido.objects.select_related('cliente').prefetch_related('detalles')
        estado = request.GET.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        # Si no es staff, filtrar por cliente (usuario que realizó la petición)
        if not request.user.is_staff:
            qs = qs.filter(cliente=request.user)
        serializer = PedidoSerializer(qs.order_by('-fecha_creacion'), many=True)
        return Response(serializer.data)

    # POST -> crear pedido desde JSON
    if request.method == 'POST':
        data = request.data.copy()
        # Asignar cliente si no viene (usar usuario que realiza la petición)
        if not data.get('cliente'):
            data['cliente'] = request.user.id

        serializer = PedidoSerializer(data=data)
        if serializer.is_valid():
            pedido = serializer.save()
            # Registrar historial
            HistorialPedido.objects.create(
                pedido=pedido,
                usuario=request.user,
                estado_anterior='creado',
                estado_nuevo=pedido.estado or 'pendiente',
                comentario='Creado vía API',
            )
            # Crear una notificación en el sistema de mensajes para admins/empleados
            try:
                usuario_nombre = getattr(request.user, 'get_full_name', None)
                if callable(usuario_nombre):
                    usuario_nombre = request.user.get_full_name() or request.user.username
                else:
                    usuario_nombre = getattr(request.user, 'username', str(request.user.id))

                asunto = f"Nuevo pedido #{pedido.id}"
                # Construir un resumen básico del pedido
                detalles = []
                for d in pedido.detalles.all():
                    detalles.append(f"{d.medicamento.nombre if d.medicamento else 'ID:'+str(d.medicamento_id)} x{d.cantidad}")
                cuerpo = (
                    f"Pedido #{pedido.id} creado por {usuario_nombre}.\n"
                    f"Total: {pedido.total or pedido.subtotal}\n"
                    f"Detalles:\n" + "\n".join(detalles)
                )

                Mensaje.objects.create(
                    nombre=usuario_nombre,
                    correo=getattr(request.user, 'email', ''),
                    asunto=asunto,
                    mensaje=cuerpo
                )
            except Exception as e:
                # No bloquear la creación del pedido si falla la notificación, pero loguear
                import logging
                logging.exception('No se pudo crear Mensaje para el pedido: %s', e)
            return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_pedido_detail(request, pk):
    try:
        pedido = Pedido.objects.get(pk=pk)
    except Pedido.DoesNotExist:
        return Response({'detail': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    # GET -> retornar detalles
    if request.method == 'GET':
        serializer = PedidoSerializer(pedido)
        return Response(serializer.data)

    # PATCH -> actualizar parcialmente (por ejemplo estado)
    if request.method == 'PATCH':
        # Permisos: staff o cliente dueño del pedido
        if not request.user.is_staff and pedido.cliente != request.user:
            return Response({'detail': 'No tiene permiso'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        estado_anterior = pedido.estado
        nuevo_estado = data.get('estado')

        # Permitir solo cambios válidos de estado
        if nuevo_estado and nuevo_estado != pedido.estado:
            permitido = False
            estados_permitidos = {
                'pendiente': ['procesado', 'cancelado'],
                'procesado': ['entregado', 'cancelado'],
                'entregado': [],
                'cancelado': [],
            }
            if nuevo_estado in estados_permitidos.get(pedido.estado, []):
                permitido = True
            if not permitido:
                return Response({'detail': 'Transición de estado no permitida'}, status=status.HTTP_400_BAD_REQUEST)
            pedido.estado = nuevo_estado
            pedido.save()
            HistorialPedido.objects.create(
                pedido=pedido,
                usuario=request.user,
                estado_anterior=estado_anterior or '',
                estado_nuevo=nuevo_estado,
                comentario=data.get('comentario', 'Actualizado vía API'),
            )
            
            # Si se marca como entregado, crear factura automáticamente
            if nuevo_estado == 'entregado':
                try:
                    from facturacion.models import Factura, DetalleFactura
                    
                    # Verificar si la factura ya existe
                    factura_existente = Factura.objects.filter(pedido=pedido).first()
                    
                    if not factura_existente:
                        # Crear factura
                        factura = Factura.objects.create(
                            pedido=pedido,
                            cliente=pedido.cliente,
                            empleado=request.user if request.user.is_staff else None,
                            total=pedido.total,
                            metodo_pago=pedido.metodo_pago,
                            direccion_entrega=pedido.direccion_entrega,
                            observaciones=pedido.notas,
                        )
                        
                        # Crear detalles de factura desde los detalles del pedido
                        for detalle_pedido in pedido.detalles.all():
                            DetalleFactura.objects.create(
                                factura=factura,
                                medicamento=detalle_pedido.medicamento,
                                cantidad=detalle_pedido.cantidad,
                                precio_unitario=detalle_pedido.precio_unitario,
                                subtotal=detalle_pedido.subtotal,
                            )
                        
                        print(f"✅ Factura #{factura.id} creada automáticamente para el pedido #{pedido.id}")
                except Exception as e:
                    import logging
                    logging.exception('Error al crear factura automática: %s', e)
                    # No bloquear la entrega si falla la factura

        # Si hay otros campos editables, aplicarlos aquí (por ahora solo estado)
        return Response(PedidoSerializer(pedido).data)
