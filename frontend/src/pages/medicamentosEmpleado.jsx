import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { getMedicamentos, crearMedicamento, actualizarMedicamento, eliminarMedicamento } from "../services/inventarioServices";
import "../styles/empleadoDashboard.css";

const MedicamentosEmpleado = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    nombre: "",
    precio_venta: "",
    stock_actual: "",
  });
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erroresForm, setErroresForm] = useState({});

  useEffect(() => {
    cargarMedicamentos();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargarMedicamentos(), 300);
    return () => clearTimeout(t);
  }, [page, busqueda, filtroStock]);

  const cargarMedicamentos = async () => {
    setLoading(true);
    try {
      const data = await getMedicamentos();
      let filtered = data || [];

      // Filtrar por búsqueda
      if (busqueda) {
        filtered = filtered.filter((med) =>
          med.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      // Filtrar por stock
      if (filtroStock === "bajo") {
        filtered = filtered.filter((med) => med.stock_actual <= 10);
      } else if (filtroStock === "medio") {
        filtered = filtered.filter((med) => med.stock_actual > 10 && med.stock_actual <= 50);
      } else if (filtroStock === "alto") {
        filtered = filtered.filter((med) => med.stock_actual > 50);
      }

      setTotalCount(filtered.length);

      // Aplicar paginación
      const inicio = (page - 1) * pageSize;
      const fin = inicio + pageSize;
      setMedicamentos(filtered.slice(inicio, fin));
    } catch {
      console.error("Error al cargar medicamentos");
      mostrarMensaje("❌ Error al cargar medicamentos", "error");
    }
    setLoading(false);
  };

  const mostrarMensaje = (msg, tipo = "success") => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(""), 3000);
  };

  const validarFormulario = () => {
    const errores = {};
    
    if (!formData.nombre || formData.nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    
    if (!formData.precio_venta || parseFloat(formData.precio_venta) <= 0) {
      errores.precio_venta = "El precio debe ser mayor a 0";
    }
    
    if (!formData.stock_actual || parseInt(formData.stock_actual) < 0) {
      errores.stock_actual = "El stock no puede ser negativo";
    }

    setErroresForm(errores);
    return Object.keys(errores).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (erroresForm[name]) {
      setErroresForm({ ...erroresForm, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      mostrarMensaje("❌ Por favor completa todos los campos correctamente", "error");
      return;
    }

    try {
      if (editando) {
        await actualizarMedicamento(editando, formData);
        mostrarMensaje("✅ Medicamento actualizado correctamente.", "success");
      } else {
        await crearMedicamento(formData);
        mostrarMensaje("✅ Medicamento creado correctamente.", "success");
      }
      setFormData({ nombre: "", precio_venta: "", stock_actual: "" });
      setEditando(null);
      setMostrarFormulario(false);
      setErroresForm({});
      setPage(1);
      cargarMedicamentos();
    } catch {
      mostrarMensaje("❌ Error al guardar el medicamento.", "error");
    }
  };

  const handleEditar = (med) => {
    setFormData({
      nombre: med.nombre,
      precio_venta: med.precio_venta,
      stock_actual: med.stock_actual,
    });
    setEditando(med.id);
    setMensaje("");
    setMostrarFormulario(true);
    setErroresForm({});
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Deseas inactivar este medicamento?")) {
      try {
        await eliminarMedicamento(id);
        mostrarMensaje("✅ Medicamento inactivado correctamente.", "success");
        cargarMedicamentos();
      } catch (error) {
        console.error("Error al inactivar medicamento:", error);
        mostrarMensaje("❌ Ocurrió un error al inactivar el medicamento.", "error");
      }
    }
  };

  const getStockColor = (stock) => {
    if (stock <= 10) return "bg-red-100 text-red-700";
    if (stock <= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const getStockBadge = (stock) => {
    if (stock <= 10) return "🔴 Bajo";
    if (stock <= 50) return "🟡 Medio";
    return "🟢 Alto";
  };

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
          exit={{ opacity: 0 }}
          className={`p-4 rounded-lg mb-4 ${tipoMensaje === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {mensaje}
        </motion.div>
      )}

      <div className="mb-6 space-y-4">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          onClick={() => {
            setFormData({ nombre: "", precio_venta: "", stock_actual: "" });
            setEditando(null);
            setMostrarFormulario(true);
            setErroresForm({});
          }}
        >
          <Plus size={20} /> Nuevo Medicamento
        </button>

        <input
          type="text"
          placeholder="🔍 Buscar medicamento..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          className="w-full px-4 py-2 border rounded-lg"
        />

        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filtroStock}
            onChange={(e) => { setFiltroStock(e.target.value); setPage(1); }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="todos">Todos los stocks</option>
            <option value="bajo">🔴 Stock bajo (&lt;=10)</option>
            <option value="medio">🟡 Stock medio (11-50)</option>
            <option value="alto">🟢 Stock alto (&gt;50)</option>
          </select>

          <button
            onClick={() => { setBusqueda(""); setFiltroStock("todos"); setPage(1); }}
            className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Reset
          </button>
        </div>

        <div className="text-sm text-slate-600">
          Total: {totalCount} medicamento{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando medicamentos...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-right">Precio</th>
                  <th className="px-4 py-2 text-center">Stock</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.length > 0 ? (
                  medicamentos.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2 font-semibold">{m.nombre}</td>
                      <td className="px-4 py-2 text-right">${m.precio_venta}</td>
                      <td className="px-4 py-2 text-center font-semibold">{m.stock_actual}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStockColor(m.stock_actual)}`}>
                          {getStockBadge(m.stock_actual)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            onClick={() => handleEditar(m)}
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            onClick={() => handleEliminar(m.id)}
                            title="Inactivar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-600">
                      No hay medicamentos que coincidan con tu búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalCount > pageSize && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2">
                Página {page} de {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setMostrarFormulario(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {editando ? "Editar Medicamento" : "Nuevo Medicamento"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre</label>
                <input
                  name="nombre"
                  placeholder="Nombre del medicamento"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`input-default ${erroresForm.nombre ? "border-red-500 bg-red-50" : ""}`}
                />
                {erroresForm.nombre && <p className="text-red-600 text-xs mt-1">{erroresForm.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_venta"
                  placeholder="Precio de venta"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  className={`input-default ${erroresForm.precio_venta ? "border-red-500 bg-red-50" : ""}`}
                />
                {erroresForm.precio_venta && <p className="text-red-600 text-xs mt-1">{erroresForm.precio_venta}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Stock</label>
                <input
                  type="number"
                  name="stock_actual"
                  placeholder="Cantidad en stock"
                  value={formData.stock_actual}
                  onChange={handleChange}
                  className={`input-default ${erroresForm.stock_actual ? "border-red-500 bg-red-50" : ""}`}
                />
                {erroresForm.stock_actual && <p className="text-red-600 text-xs mt-1">{erroresForm.stock_actual}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary font-semibold">
                  {editando ? "Actualizar" : "Registrar"}
                </button>
                <button
                  type="button"
                  className="flex-1 btn-secondary"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setErroresForm({});
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default MedicamentosEmpleado;
