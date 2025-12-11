// src/components/PanelEmpleado/modals/MedicamentoModal.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function MedicamentoModal({ 
  open, 
  onClose, 
  medicamento = null, 
  onSubmit,
  isEditing = false 
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    precio_venta: "",
    stock_actual: "",
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medicamento && isEditing) {
      setFormData({
        nombre: medicamento.nombre || "",
        precio_venta: medicamento.precio_venta || "",
        stock_actual: medicamento.stock_actual || "",
      });
    } else {
      setFormData({ nombre: "", precio_venta: "", stock_actual: "" });
    }
    setErrores({});
  }, [medicamento, isEditing, open]);

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre || formData.nombre.trim().length < 3) {
      nuevosErrores.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (!formData.precio_venta || parseFloat(formData.precio_venta) <= 0) {
      nuevosErrores.precio_venta = "El precio debe ser mayor a 0";
    }

    if (!formData.stock_actual || parseInt(formData.stock_actual) < 0) {
      nuevosErrores.stock_actual = "El stock no puede ser negativo";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData, isEditing ? medicamento.id : null);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: "", precio_venta: "", stock_actual: "" });
    setErrores({});
    onClose();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-slate-800">
          {isEditing ? "Editar Medicamento" : "Nuevo Medicamento"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre del medicamento"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.nombre ? "border-red-500 bg-red-50" : "border-slate-300"
              }`}
            />
            {errores.nombre && (
              <p className="text-red-600 text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Precio
            </label>
            <input
              type="number"
              step="0.01"
              name="precio_venta"
              placeholder="Precio de venta"
              value={formData.precio_venta}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.precio_venta ? "border-red-500 bg-red-50" : "border-slate-300"
              }`}
            />
            {errores.precio_venta && (
              <p className="text-red-600 text-xs mt-1">{errores.precio_venta}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Stock
            </label>
            <input
              type="number"
              name="stock_actual"
              placeholder="Cantidad en stock"
              value={formData.stock_actual}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.stock_actual ? "border-red-500 bg-red-50" : "border-slate-300"
              }`}
            />
            {errores.stock_actual && (
              <p className="text-red-600 text-xs mt-1">{errores.stock_actual}</p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Registrar"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
