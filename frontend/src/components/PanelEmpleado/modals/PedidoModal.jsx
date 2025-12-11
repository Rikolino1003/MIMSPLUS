// src/components/PanelEmpleado/modals/PedidoModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function PedidoModal({ open, onClose, pedidos = [] }) {
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const estados = [
    { value: "todos", label: "Todos" },
    { value: "pendiente", label: "Pendiente" },
    { value: "procesado", label: "Procesado" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" },
  ];

  const pedidosFiltrados =
    estadoFiltro === "todos"
      ? pedidos
      : pedidos.filter((pedido) => pedido.estado === estadoFiltro);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Gestión de Pedidos</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Filtro de estados */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filtrar por estado:
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => (
              <div key={pedido.id} className="p-4 border rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Pedido #{pedido.id}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Estado:{" "}
                      {pedido.estado.charAt(0).toUpperCase() +
                        pedido.estado.slice(1)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      console.log("Ver detalles del pedido", pedido.id)
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
