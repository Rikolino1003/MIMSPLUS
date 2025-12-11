# 📊 Sistema de Inventario por Droguería

## Descripción General

Se ha implementado un sistema robusto de gestión de inventario donde **cada droguería tiene su propio inventario completamente segregado** a nivel de base de datos.

## Modelos Creados

### 1. **InventarioDrogueria** (`droguerias.models.InventarioDrogueria`)
Resumen consolidado del inventario de cada droguería.

**Campos:**
- `drogueria` (FK) - Referencia única a una droguería
- `valor_total_inventario` - Valor total en costo de compra (Decimal)
- `valor_venta_total` - Valor total en precio de venta (Decimal)
- `cantidad_medicamentos` - Total de medicamentos únicos (Integer)
- `cantidad_stock_total` - Total de unidades en stock (Integer)
- `margen_promedio` - Propiedad calculada: (venta - costo) / costo * 100
- `ultimo_movimiento` - Timestamp del último cambio
- `creado` - Timestamp de creación

**Relación:**
```
Drogueria (1) ←→ (1) InventarioDrogueria
```

### 2. **MovimientoDrogueria** (`droguerias.models.MovimientoDrogueria`)
Auditoría detallada de todos los movimientos de inventario.

**Campos:**
- `drogueria` (FK) - Droguería origen
- `medicamento_nombre` - Nombre del medicamento movido (String)
- `tipo_movimiento` - Tipo (entrada, salida, ajuste, transferencia_out, transferencia_in, devolución)
- `cantidad` - Unidades movidas (Integer)
- `precio_unitario` - Precio por unidad (Decimal)
- `subtotal` - Calculado automático: cantidad × precio_unitario
- `usuario` (FK, nullable) - Usuario que hizo el movimiento
- `descripcion` - Comentarios adicionales
- `drogueria_destino` (FK, nullable) - Para transferencias entre droguerías
- `creado` - Timestamp del movimiento

**Relación:**
```
Drogueria (1) ←→ (∞) MovimientoDrogueria
```

### 3. **Medicamento** (Existente, mejorado)
Ya existía con FK a Drogueria. Ahora es la base del inventario.

```
Drogueria (1) ←→ (∞) Medicamento
```

## Endpoints de API

### InventarioDrogueria
- `GET /api/droguerias/inventarios/` - Listar todos los inventarios
- `GET /api/droguerias/inventarios/{id}/` - Detalle de un inventario
- `GET /api/droguerias/inventarios/?drogueria=<id>` - Filtrar por droguería
- `GET /api/droguerias/inventarios/resumen/` - Resumen agregado de usuario

### MovimientoDrogueria
- `GET /api/droguerias/movimientos/` - Listar movimientos
- `GET /api/droguerias/movimientos/?drogueria=<id>` - Filtrar por droguería
- `GET /api/droguerias/movimientos/?tipo=entrada` - Filtrar por tipo
- `POST /api/droguerias/movimientos/registrar_movimiento/` - Registrar nuevo movimiento

## Flujo de Datos

### Al crear/modificar Medicamento:
1. El medicamento se asocia a una droguería específica (FK `drogueria`)
2. Se puede consultar el inventario total de esa droguería desde `InventarioDrogueria`
3. Los cambios se registran automáticamente en `MovimientoDrogueria`

### Al transferir inventario entre droguerías:
1. Se crea un `MovimientoDrogueria` tipo `transferencia_out` en droguería origen
2. Se crea otro tipo `transferencia_in` en droguería destino
3. `drogueria_destino` vincula ambos movimientos

### Auditoría:
- Cada movimiento queda registrado con usuario, fecha y detalles
- Se puede generar reportes por droguería, por tipo de movimiento, por período

## Inicialización

Se ejecutó el script `setup_inventarios.py` que:
1. Crea un `InventarioDrogueria` para cada droguería existente
2. Calcula valores basados en `Medicamento` asociados
3. Registra el margen promedio de venta

**Comando:**
```bash
python setup_inventarios.py
```

**Resultado:**
- 6 nuevos inventarios creados
- Valores precalculados automáticamente

## Ejemplo de Uso (Frontend)

```javascript
// Obtener inventario de una droguería específica
const res = await API.get('/droguerias/inventarios/?drogueria=7');
const inv = res.data[0]; // InventarioDrogueria

console.log(`Droguería: ${inv.drogueria_nombre}`);
console.log(`Stock total: ${inv.cantidad_stock_total} unidades`);
console.log(`Valor costo: $${inv.valor_total_inventario}`);
console.log(`Valor venta: $${inv.valor_venta_total}`);
console.log(`Margen: ${inv.margen_promedio}%`);

// Obtener movimientos de esa droguería
const movRes = await API.get('/droguerias/movimientos/?drogueria=7');
const movimientos = movRes.data;
movimientos.forEach(m => {
  console.log(`${m.tipo_movimiento}: ${m.cantidad} × ${m.medicamento_nombre}`);
});
```

## Segregación de Datos

✅ **Cada droguería está completamente aislada:**
- Medicamentos propios (FK drogueria en Medicamento)
- Inventario único (OneToOne InventarioDrogueria)
- Movimientos auditados (FK drogueria en MovimientoDrogueria)
- Usuarios asignados (UsuarioDrogueria membership)

✅ **Permisos implementados:**
- Usuarios solo ven droguerías donde tienen membresía o son propietarios
- Admins ven todas las droguerías
- Operaciones limitadas por rol (propietario, manager, empleado)

## Próximos Pasos (Opcionales)

1. **Dashboard por Droguería** - Mostrar KPIs de inventario
2. **Reportes de Movimientos** - Exportar auditoría a PDF/Excel
3. **Alertas de Stock** - Notificaciones cuando stock es bajo
4. **Revalorización** - Actualizar precios por droguería
5. **Transferencias** - UI para transferencias entre droguerías
