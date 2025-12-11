// src/pages/Medicamentos.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Eye, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import api from "../services/api";
import Modal from "../components/Modal";

export default function Medicamentos() {
  const base = "/inventario/medicamentos-crud/";
  const categoriasBase = "/inventario/categorias/";
  const [medicamentos, setMedicamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(null);
  const [open, setOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [erroresForm, setErroresForm] = useState({});

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio_venta: 0,
    stock_actual: 0,
    stock_minimo: 0,
    fecha_vencimiento: "",
    estado: true,
    imagen_url: "",
    categoria_id: null,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.get(base, { params: { page, page_size: pageSize, search } }),
        api.get(categoriasBase),
      ]);
      const medData = mRes.data;
      if (medData && medData.results) {
        setMedicamentos(medData.results);
        setTotalCount(medData.count);
      } else {
        setMedicamentos(medData || []);
        setTotalCount(null);
      }
      setCategorias(cRes.data);
    } catch (err) {
      console.error(err);
      mostrarMensaje("❌ Error cargando inventario", "error");
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (msg, tipo = "success") => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(""), 3000);
  };

  const validarForm = () => {
    const errores = {};
    if (!form.nombre || form.nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    if (!form.precio_venta || parseFloat(form.precio_venta) <= 0) {
      errores.precio_venta = "El precio debe ser mayor a 0";
    }
    if (!form.stock_actual || parseInt(form.stock_actual) < 0) {
      errores.stock_actual = "El stock no puede ser negativo";
    }
    setErroresForm(errores);
    return Object.keys(errores).length === 0;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      descripcion: "",
      precio_venta: 0,
      stock_actual: 0,
      stock_minimo: 0,
      fecha_vencimiento: "",
      estado: true,
      imagen_url: "",
      categoria_id: null,
    });
    setErroresForm({});
    setOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      nombre: m.nombre,
      descripcion: m.descripcion,
      precio_venta: m.precio_venta,
      stock_actual: m.stock_actual,
      stock_minimo: m.stock_minimo,
      fecha_vencimiento: m.fecha_vencimiento || "",
      estado: m.estado,
      imagen_url: m.imagen_url || "",
      categoria_id: m.categoria?.id || null,
    });
    setErroresForm({});
    setOpen(true);
  };

  const viewDetails = (m) => {
    setSelectedMedicamento(m);
    setViewModal(true);
  };

  const toggleActive = async (m) => {
    try {
      await api.patch(`${base}${m.id}/`, { estado: !m.estado });
      mostrarMensaje(`✅ Medicamento ${m.estado ? "desactivado" : "activado"}`, "success");
      fetchAll();
    } catch (err) {
      console.error(err);
      mostrarMensaje("❌ Error cambiando estado", "error");
    }
  };

  const eliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este medicamento?")) {
      try {
        await api.delete(`${base}${id}/`);
        mostrarMensaje("✅ Medicamento eliminado", "success");
        fetchAll();
      } catch (err) {
        console.error(err);
        mostrarMensaje("❌ Error eliminando medicamento", "error");
      }
    }
  };

  const save = async () => {
    if (!validarForm()) {
      mostrarMensaje("❌ Por favor completa los campos correctamente", "error");
      return;
    }

    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_venta: form.precio_venta,
        stock_actual: form.stock_actual,
        stock_minimo: form.stock_minimo,
        fecha_vencimiento: form.fecha_vencimiento || null,
        estado: form.estado,
        imagen_url: form.imagen_url,
        categoria_id: form.categoria_id,
      };
      if (editing) {
        await api.put(`${base}${editing.id}/`, payload);
        mostrarMensaje("✅ Medicamento actualizado", "success");
      } else {
        await api.post(base, payload);
        mostrarMensaje("✅ Medicamento creado", "success");
      }
      setOpen(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      mostrarMensaje("❌ Error guardando medicamento", "error");
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchAll(), 300);
    return () => clearTimeout(t);
  }, [search, page]);

  return (
    <div className="p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-slate-800"
      >
        Gestión de Medicamentos
      </motion.h2>

      {mensaje && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-4 ${tipoMensaje === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {mensaje}
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={openCreate}
            className="px-6 py-2 btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Nuevo Medicamento
          </button>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="px-6 py-2 btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            Refrescar
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar por nombre de medicamento..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando medicamentos...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-right font-semibold">Precio</th>
                    <th className="px-4 py-3 text-center font-semibold">Stock</th>
                    <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                    <th className="px-4 py-3 text-center font-semibold">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {medicamentos.length > 0 ? (
                    medicamentos.map((m) => {
                      const stockBajo = m.stock_actual <= m.stock_minimo;
                      const vencido = m.fecha_vencimiento && new Date(m.fecha_vencimiento) < new Date();
                      return (
                        <tr key={m.id} className="border-b hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-mono text-sm">{m.id}</td>
                          <td className="px-4 py-3 font-semibold">{m.nombre}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">${m.precio_venta}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              stockBajo ? "bg-red-100 text-red-700" :
                              m.stock_actual > 50 ? "bg-green-100 text-green-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {m.stock_actual}
                            </span>
                          </td>
                          <td className="px-4 py-3">{m.categoria?.nombre || "N/A"}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleActive(m)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                m.estado
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              {m.estado ? "🟢 Activo" : "🔴 Inactivo"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openEdit(m)}
                                className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => viewDetails(m)}
                                className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                                title="Ver detalles"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => eliminar(m.id)}
                                className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-600">
                        No hay medicamentos que coincidan con tu búsqueda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalCount !== null && Math.ceil(totalCount / pageSize) > 1 && (
              <div className="flex items-center justify-between p-4 border-t bg-slate-50">
                <div className="text-sm text-slate-600">
                  Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} de {totalCount}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    ← Anterior
                  </button>
                  <span className="px-4 py-2 font-semibold">Página {page}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * pageSize >= totalCount}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de detalles */}
      {viewModal && selectedMedicamento && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setViewModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Detalles del Medicamento</h3>
            <div className="space-y-3 text-sm">
              <p><strong>Nombre:</strong> {selectedMedicamento.nombre}</p>
              <p><strong>Descripción:</strong> {selectedMedicamento.descripcion || "N/A"}</p>
              <p><strong>Precio:</strong> ${selectedMedicamento.precio_venta}</p>
              <p><strong>Stock Actual:</strong> {selectedMedicamento.stock_actual}</p>
              <p><strong>Stock Mínimo:</strong> {selectedMedicamento.stock_minimo}</p>
              <p><strong>Fecha Vencimiento:</strong> {selectedMedicamento.fecha_vencimiento || "N/A"}</p>
              <p><strong>Categoría:</strong> {selectedMedicamento.categoria?.nombre || "N/A"}</p>
              <p><strong>Estado:</strong> {selectedMedicamento.estado ? "Activo" : "Inactivo"}</p>
            </div>
            <button
              onClick={() => setViewModal(false)}
              className="btn-secondary w-full mt-4"
              aria-label="Cerrar detalle medicamento"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de crear/editar */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {editing ? "Editar Medicamento" : "Nuevo Medicamento"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => {
                    setForm({ ...form, nombre: e.target.value });
                    if (erroresForm.nombre) setErroresForm({ ...erroresForm, nombre: "" });
                  }}
                  placeholder="Nombre del medicamento"
                  className={`input-default text-sm ${erroresForm.nombre ? "border-red-500 bg-red-50" : ""}`}
                />
                {erroresForm.nombre && <p className="text-red-600 text-xs mt-1">{erroresForm.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción"
                  className="input-default text-sm"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.precio_venta}
                    onChange={(e) => {
                      setForm({ ...form, precio_venta: e.target.value });
                      if (erroresForm.precio_venta) setErroresForm({ ...erroresForm, precio_venta: "" });
                    }}
                    placeholder="0.00"
                    className={`input-default text-sm ${erroresForm.precio_venta ? "border-red-500 bg-red-50" : ""}`}
                  />
                  {erroresForm.precio_venta && <p className="text-red-600 text-xs mt-1">{erroresForm.precio_venta}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Stock</label>
                  <input
                    type="number"
                    value={form.stock_actual}
                    onChange={(e) => {
                      setForm({ ...form, stock_actual: e.target.value });
                      if (erroresForm.stock_actual) setErroresForm({ ...erroresForm, stock_actual: "" });
                    }}
                    placeholder="0"
                    className={`input-default text-sm ${erroresForm.stock_actual ? "border-red-500 bg-red-50" : ""}`}
                  />
                  {erroresForm.stock_actual && <p className="text-red-600 text-xs mt-1">{erroresForm.stock_actual}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Stock Mín</label>
                  <input
                    type="number"
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                    placeholder="0"
                    className="input-default text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                    className="input-default text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Categoría</label>
                <select
                  value={form.categoria_id || ""}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })}
                  className="input-default text-sm"
                >
                  <option value="">-- Seleccionar --</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Activo</span>
              </label>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  className="flex-1 btn-primary"
                >
                  Guardar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
