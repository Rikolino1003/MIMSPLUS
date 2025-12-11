from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db import transaction
from django.views.generic import ListView, DetailView
from django.utils.decorators import method_decorator
from django.urls import reverse_lazy

from .models import Pedido, DetallePedido, HistorialPedido
from inventario.models import Medicamento
from .forms import CrearPedidoForm, DetallePedidoFormSet



@method_decorator(login_required, name="dispatch")
class ListaPedidosView(ListView):
    model = Pedido
    template_name = "empleados/pedidos/lista.html"
    context_object_name = "pedidos"
    paginate_by = 20

    def get_queryset(self):
        queryset = Pedido.objects.select_related("cliente").prefetch_related("detalles")
        # Si no es administrador, solo verá los pedidos que ha creado
        if not self.request.user.is_staff:
            queryset = queryset.filter(usuario_creacion=self.request.user)
        # Filtro por estado
        estado = self.request.GET.get("estado")
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset.order_by("-fecha_creacion")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["estados"] = dict(Pedido.ESTADOS)
        return context


@login_required
def crear_pedido(request):
    if request.method == "POST":
        form = CrearPedidoForm(request.POST)
        formset = DetallePedidoFormSet(request.POST)

        if form.is_valid() and formset.is_valid():
            try:
                with transaction.atomic():
                    # Crear el pedido
                    pedido = form.save(commit=False)
                    pedido.usuario_creacion = request.user
                    pedido.estado = "pendiente"
                    pedido.save()

                    # Guardar los detalles
                    detalles = formset.save(commit=False)
                    for detalle in detalles:
                        detalle.pedido = pedido
                        detalle.save()

                    # Actualizar totales del pedido
                    pedido.actualizar_totales()

                    # Registrar el cambio de estado
                    HistorialPedido.objects.create(
                        pedido=pedido,
                        usuario=request.user,
                        estado_anterior="creado",
                        estado_nuevo="pendiente",
                        comentario="Pedido creado desde el panel de empleados",
                    )

                    messages.success(request, "Pedido creado exitosamente.")
                    return redirect("empleados:detalle_pedido", pk=pedido.id)

            except Exception as e:
                messages.error(request, f"Error al crear el pedido: {str(e)}")
    else:
        form = CrearPedidoForm()
        formset = DetallePedidoFormSet()

    return render(
        request,
        "empleados/pedidos/crear.html",
        {"form": form, "formset": formset},
    )


@login_required
def cambiar_estado_pedido(request, pk, nuevo_estado):
    pedido = get_object_or_404(Pedido, pk=pk)

    # Verificar permisos
    if not request.user.is_staff and pedido.usuario_creacion != request.user:
        messages.error(request, "No tiene permiso para modificar este pedido.")
        return redirect("empleados:lista_pedidos")

    # Validar transición de estado
    estados_permitidos = {
        "pendiente": ["procesado", "cancelado"],
        "procesado": ["entregado", "cancelado"],
        "entregado": [],
        "cancelado": [],
    }

    if nuevo_estado not in estados_permitidos.get(pedido.estado, []):
        messages.error(
            request,
            f"No se puede cambiar el estado de "
            f"{pedido.get_estado_display()} "
            f"a {dict(Pedido.ESTADOS).get(nuevo_estado, nuevo_estado)}",
        )
        return redirect("empleados:detalle_pedido", pk=pedido.id)

    try:
        with transaction.atomic():
            estado_anterior = pedido.estado
            pedido.estado = nuevo_estado
            pedido.save()

            # Registrar el cambio de estado
            HistorialPedido.objects.create(
                pedido=pedido,
                usuario=request.user,
                estado_anterior=estado_anterior,
                estado_nuevo=nuevo_estado,
                comentario=request.POST.get("comentario", ""),
            )

            # Si se cancela, devolver el stock
            if nuevo_estado == "cancelado":
                for detalle in pedido.detalles.all():
                    if detalle.medicamento:
                        detalle.medicamento.stock_actual += detalle.cantidad
                        detalle.medicamento.save()

            messages.success(
                request,
                f"El pedido ha sido actualizado a {pedido.get_estado_display()}",
            )

    except Exception as e:
        messages.error(request, f"Error al actualizar el pedido: {str(e)}")

    return redirect("empleados:detalle_pedido", pk=pedido.id)


@method_decorator(login_required, name="dispatch")
class DetallePedidoView(DetailView):
    model = Pedido
    template_name = "empleados/pedidos/detalle.html"
    context_object_name = "pedido"

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(usuario_creacion=self.request.user)
        return queryset.prefetch_related("detalles__medicamento", "historial__usuario")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["estados"] = dict(Pedido.ESTADOS)
        context["historial"] = self.object.historial.all().order_by("-fecha")
        return context
