from django import forms
from django.forms import inlineformset_factory

from .models import Pedido, DetallePedido


class CrearPedidoForm(forms.ModelForm):
    class Meta:
        model = Pedido
        # Campos que el empleado va a llenar al crear el pedido
        fields = [
            "cliente",
            "metodo_pago",
            "direccion_entrega",
            "telefono_contacto",
            "notas",
        ]


DetallePedidoFormSet = inlineformset_factory(
    Pedido,
    DetallePedido,
    fields=["medicamento", "cantidad", "precio_unitario"],
    extra=1,
    can_delete=True,
)
