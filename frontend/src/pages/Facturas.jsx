// src/pages/Facturas.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import Modal from "../components/Modal";
import { exportarFacturaAPDF } from "../services/pdfServices.js";
import { Calendar, Search, Download } from "lucide-react";

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Lista de usuarios registrados
  const [medicamentos, setMedicamentos] = useState([]); // Lista de medicamentos registrados
  const [search, setSearch] = useState(""); // Estado para la búsqueda
  const [open, setOpen] = useState(false);
  const [editModal, setEditModal] = useState(false); // Modal para editar factura
  const [detalles, setDetalles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [medToAdd, setMedToAdd] = useState("");

  const [form, setForm] = useState({
    cliente: "",
    empleado: "",
    metodo_pago: "efectivo",
    correo_enviado: false,
    direccion_entrega: "",
    observaciones: "",
    fecha_emision: new Date().toISOString().slice(0, 10),
    detalles: [],
    total: 0,
  });

  const baseFacturas = "/facturas/facturas/";
  const baseUsuarios = "/usuarios/usuarios/";
  const baseMedicamentos = "/inventario/medicamentos-crud/";

  // filtros y paginación
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarFacturas();
    cargarUsuarios();
    cargarMedicamentos();
  }, []);

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const res = await api.get(baseFacturas);
      setFacturas(res.data || []);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      alert("Error cargando facturas");
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await api.get(baseUsuarios);
      setUsuarios(res.data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      alert("Error cargando usuarios");
    }
  };

  const cargarMedicamentos = async () => {
    try {
      const res = await api.get(baseMedicamentos);
      setMedicamentos(res.data);
    } catch (err) {
      console.error("Error cargando medicamentos:", err);
      alert("Error cargando medicamentos");
    }
  };

  const agregarMedicamento = (medicamento) => {
    const existe = form.detalles.find((d) => d.medicamento_id === medicamento.id);
    if (existe) {
      const nuevosDetalles = form.detalles.map((d) =>
        d.medicamento_id === medicamento.id
          ? {
              ...d,
              cantidad: d.cantidad + 1,
              subtotal: (d.cantidad + 1) * medicamento.precio_venta,
            }
          : d
      );
      setForm({
        ...form,
        detalles: nuevosDetalles,
        total: nuevosDetalles.reduce((acc, d) => acc + d.subtotal, 0),
      });
    } else {
      const nuevoDetalle = {
        medicamento_id: medicamento.id,
        medicamento_nombre: medicamento.nombre,
        cantidad: 1,
        precio_unitario: medicamento.precio_venta,
        subtotal: medicamento.precio_venta,
      };
      const nuevosDetalles = [...form.detalles, nuevoDetalle];
      setForm({
        ...form,
        detalles: nuevosDetalles,
        total: nuevosDetalles.reduce((acc, d) => acc + d.subtotal, 0),
      });
    }
  };

  const eliminarMedicamento = (index) => {
    const nuevosDetalles = form.detalles.filter((_, i) => i !== index);
    setForm({
      ...form,
      detalles: nuevosDetalles,
      total: nuevosDetalles.reduce((acc, d) => acc + d.subtotal, 0),
    });
  };

  const actualizarCantidad = (index, cantidad) => {
    const nuevos = [...form.detalles];
    nuevos[index].cantidad = Number(cantidad);
    nuevos[index].subtotal = Number(nuevos[index].cantidad) * Number(nuevos[index].precio_unitario || 0);
    setForm({ ...form, detalles: nuevos, total: nuevos.reduce((acc, d) => acc + Number(d.subtotal || 0), 0) });
  };

  const saveFactura = async () => {
    try {
      // Validar que el cliente esté seleccionado
      if (!form.cliente) {
        alert("Por favor, selecciona un cliente.");
        return;
      }

      // Validar que haya al menos un detalle
      if (form.detalles.length === 0) {
        alert("Por favor, agrega al menos un medicamento.");
        return;
      }

      // Crear el payload con la estructura correcta
      const payload = {
        cliente: form.cliente,
        empleado: form.empleado || null,
        metodo_pago: form.metodo_pago,
        correo_enviado: form.correo_enviado,
        direccion_entrega: form.direccion_entrega,
        observaciones: form.observaciones,
        fecha_emision: form.fecha_emision,
        detalles: form.detalles.map((d) => ({
          medicamento: d.medicamento_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
        })),
        total: form.total,
      };

      console.log("Payload enviado:", payload); // <-- Inspecciona los datos enviados

      // Enviar la solicitud al backend
      if (selected) {
        await api.put(`${baseFacturas}${selected.id}/`, payload);
      } else {
        await api.post(baseFacturas, payload);
      }

      // Cerrar el modal y recargar las facturas
      setEditModal(false);
      cargarFacturas();
    } catch (err) {
      console.error("Error guardando factura:", err);
      alert("Error guardando factura. Verifica los datos e intenta nuevamente.");
    }
  };

  const descargarPDF = (factura) => {
    // si la factura ya viene con detalles, generamos via jsPDF en cliente
    try {
      exportarFacturaAPDF(factura, factura.detalles || []);
    } catch (err) {
      console.error("Error exportando PDF:", err);
      alert("Error generando PDF");
    }
  };

  // Filtrado avanzado (cliente): búsqueda + rango fechas + total
  const facturasFiltradas = useMemo(() => {
    let out = [...facturas];
    if (search) {
      out = out.filter((f) => (f.cliente_nombre || String(f.cliente || "")).toLowerCase().includes(search.toLowerCase()));
    }
    if (fechaInicio) out = out.filter((f) => new Date(f.fecha_emision) >= new Date(fechaInicio));
    if (fechaFin) out = out.filter((f) => new Date(f.fecha_emision) <= new Date(fechaFin));
    if (minTotal) out = out.filter((f) => Number(f.total) >= Number(minTotal));
    if (maxTotal) out = out.filter((f) => Number(f.total) <= Number(maxTotal));
    return out.sort((a,b)=> new Date(b.fecha_emision) - new Date(a.fecha_emision));
  }, [facturas, search, fechaInicio, fechaFin, minTotal, maxTotal]);

  const totalPages = Math.max(1, Math.ceil(facturasFiltradas.length / pageSize));
  const pagedFacturas = facturasFiltradas.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestión de Facturas</h2>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => {
              setForm({
                cliente: "",
                empleado: "",
                metodo_pago: "efectivo",
                correo_enviado: false,
                direccion_entrega: "",
                observaciones: "",
                fecha_emision: new Date().toISOString().slice(0, 10),
                detalles: [],
                total: 0,
              });
              setEditModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Nueva Factura
          </button>

          <button
            onClick={cargarFacturas}
            className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200"
          >
            Refrescar
          </button>
        </div>
        <div className="ml-6 flex gap-3 items-center">
          <div className="text-sm text-slate-600">Facturas totales: <strong className="text-slate-800">{facturas.length}</strong></div>
          <div className="text-sm text-slate-600">Gastado total: <strong className="text-green-600">${facturas.reduce((s,f)=>s+Number(f.total||0),0).toLocaleString('es-CO')}</strong></div>
        </div>
      </header>

      {/* Filtros rápidos */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <input
          type="text"
          placeholder="Buscar por cliente"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <div>
          <label className="block text-xs text-gray-500">Desde</label>
          <input type="date" value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} className="input-default" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Hasta</label>
          <input type="date" value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} className="input-default" />
        </div>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min total" value={minTotal} onChange={(e)=>setMinTotal(e.target.value)} className="input-default" aria-label="Min total" />
          <input type="number" placeholder="Max total" value={maxTotal} onChange={(e)=>setMaxTotal(e.target.value)} className="input-default" aria-label="Max total" />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg p-4 shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-2">ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-6">Cargando facturas...</td></tr>
            ) : pagedFacturas.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6">No se encontraron facturas con esos filtros</td></tr>
            ) : (
              pagedFacturas.map((f) => (
              <tr key={f.id} className="border-t hover:bg-slate-50 cursor-pointer">
                <td className="py-2">{f.id}</td>
                <td>{f.cliente_nombre || f.cliente}</td>
                <td>{new Date(f.fecha_emision).toLocaleDateString()}</td>
                <td className="font-semibold">${Number(f.total).toLocaleString('es-CO')}</td>
                <td className="flex gap-2">
                  <button
                    onClick={() => { setSelected(f); setOpen(true); }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    👁️ Ver
                  </button>
                  <button
                    onClick={() => {
                      // prefill form for edición
                      setSelected(f);
                      setForm({
                        cliente: f.cliente || f.cliente_nombre || "",
                        empleado: f.empleado || "",
                        metodo_pago: f.metodo_pago || "efectivo",
                        correo_enviado: !!f.correo_enviado,
                        direccion_entrega: f.direccion_entrega || "",
                        observaciones: f.observaciones || "",
                        fecha_emision: f.fecha_emision ? f.fecha_emision.slice(0, 10) : new Date().toISOString().slice(0, 10),
                        detalles: (f.detalles || []).map((d) => ({
                          medicamento_id: d.medicamento,
                          medicamento_nombre: d.medicamento_nombre || d.nombre || "",
                          cantidad: d.cantidad,
                          precio_unitario: d.precio_unitario,
                          subtotal: d.subtotal,
                        })),
                        total: f.total || 0,
                      });
                      setEditModal(true);
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => descargarPDF(f)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                  >
                    <Download size={14} /> PDF
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">Mostrando {(page-1)*pageSize+1} - {Math.min(page*pageSize, facturasFiltradas.length)} de {facturasFiltradas.length}</div>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="px-3 py-1 border rounded">
            {[5,8,12,20].map(n => <option key={n} value={n}>{n} / página</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
            <span className="px-3 py-1 border rounded">{page} / {totalPages}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>
      {/* Modal ver factura */}
      <Modal open={open} title={selected ? `Factura #${selected.id}` : "Factura"} onClose={()=>{ setOpen(false); setSelected(null); }}>
        {selected ? (
          <div>
            <div className="text-sm text-gray-600 mb-3">Cliente: {selected.cliente_nombre || selected.cliente}</div>
            <div className="text-sm text-gray-600 mb-3">Fecha: {new Date(selected.fecha_emision).toLocaleString()}</div>
            <div className="border rounded p-3 mb-3">
              <ul className="space-y-2">
                {(selected.detalles || []).map(d=> (
                  <li key={d.id} className="flex justify-between"><span>{d.medicamento_nombre} × {d.cantidad}</span><strong>${Number(d.subtotal).toLocaleString('es-CO')}</strong></li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between items-center"><strong>Total: ${Number(selected.total).toLocaleString('es-CO')}</strong>
            <div className="flex gap-2"><button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>descargarPDF(selected)}>Descargar</button></div></div>
          </div>
        ) : <div>No hay factura seleccionada</div>}
      </Modal>

      {/* Modal crear/editar factura */}
      <Modal
        open={editModal}
        title={selected ? `Editar factura #${selected.id}` : "Nueva factura"}
        onClose={() => { setEditModal(false); setSelected(null); }}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="w-full">
              Cliente
              <select value={form.cliente} onChange={(e)=>setForm({...form, cliente: e.target.value})} className="input-default mt-1">
                <option value="">-- Seleccionar cliente --</option>
                {usuarios.map(u=> (<option key={u.id} value={u.id}>{u.nombre || u.email || u.username}</option>))}
              </select>
            </label>

            <label>
              Fecha emisión
              <input type="date" value={form.fecha_emision} onChange={(e)=>setForm({...form, fecha_emision: e.target.value})} className="input-default mt-1" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Dirección de entrega" value={form.direccion_entrega} onChange={(e)=>setForm({...form, direccion_entrega: e.target.value})} className="input-default" />
            <select value={form.metodo_pago} onChange={(e)=>setForm({...form, metodo_pago: e.target.value})} className="input-default">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <textarea placeholder="Observaciones" value={form.observaciones} onChange={(e)=>setForm({...form, observaciones: e.target.value})} className="input-default" />

          {/* agregar medicamentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-500">Agregar medicamento</label>
              <select value={medToAdd} onChange={(e)=>setMedToAdd(e.target.value)} className="input-default mt-1">
                <option value="">-- seleccionar --</option>
                {medicamentos.map(m=> (<option key={m.id} value={m.id}>{m.nombre} — ${m.precio_venta}</option>))}
              </select>
            </div>
            <div>
              <button onClick={()=>{ if(!medToAdd) return; const m = medicamentos.find(x=>String(x.id)===String(medToAdd)); if(m) agregarMedicamento(m); setMedToAdd(""); }} className="px-3 py-2 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="text-right font-semibold">Total: ${Number(form.total || 0).toLocaleString('es-CO')}</div>
          </div>

          {/* detalles */}
          <div className="border rounded p-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Medicamento</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(form.detalles || []).map((d, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{d.medicamento_nombre}</td>
                    <td><input type="number" min={1} value={d.cantidad} onChange={(e)=>actualizarCantidad(i, e.target.value)} className="w-20 px-2 py-1 border rounded" /></td>
                    <td>${Number(d.precio_unitario).toLocaleString('es-CO')}</td>
                    <td>${Number(d.subtotal).toLocaleString('es-CO')}</td>
                    <td><button onClick={()=>eliminarMedicamento(i)} className="px-2 py-1 bg-red-500 text-white rounded">Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>{ setEditModal(false); setSelected(null); }} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={saveFactura} className="px-4 py-2 bg-green-600 text-white rounded">Guardar</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
