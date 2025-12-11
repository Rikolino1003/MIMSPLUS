// src/components/PanelEmpleado/modals/FacturaModal.jsx
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function FacturaModal({ open, onClose, factura = null }) {
  if (!open || !factura) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-96 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-slate-800">
            Detalles de la Factura #{factura.id}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <strong className="text-slate-700">Cliente:</strong>
            <span className="text-slate-900">{factura.cliente_nombre}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <strong className="text-slate-700">Método de Pago:</strong>
            <span className="text-slate-900 capitalize">{factura.metodo_pago}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <strong className="text-slate-700">Estado:</strong>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                factura.estado === "pagada"
                  ? "bg-green-100 text-green-700"
                  : factura.estado === "pendiente"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {factura.estado?.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <strong className="text-slate-700">Dirección:</strong>
            <span className="text-slate-900 text-right">
              {factura.direccion_entrega || "N/A"}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <strong className="text-slate-700">Fecha:</strong>
            <span className="text-slate-900">
              {new Date(factura.fecha_emision).toLocaleDateString("es-CO")}
            </span>
          </div>

          {factura.detalles && factura.detalles.length > 0 && (
            <div className="mt-4">
              <strong className="text-slate-700 block mb-2">Detalles:</strong>
              <ul className="mt-2 text-xs space-y-1">
                {factura.detalles.map((d, i) => (
                  <li key={i} className="bg-slate-100 p-2 rounded flex justify-between">
                    <span>
                      {d.medicamento}: {d.cantidad}x ${d.precio_unitario}
                    </span>
                    <strong>${d.subtotal}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t-2 pt-3 mt-4">
            <div className="flex justify-between font-bold text-base">
              <span className="text-slate-800">Total:</span>
              <span className="text-blue-600">${factura.total}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  );
}
