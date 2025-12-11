// src/components/PanelEmpleado/ReporteTurno.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { getReporteTurno } from "../../../../services/api";
import "../../styles/empleadoDashboard.css";

const ReporteTurno = () => {
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarReporte();
  }, []);

  const cargarReporte = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReporteTurno();
      setReporte(res.data || res);
    } catch (err) {
      console.error("Error al cargar reporte:", err);
      setError("Error al cargar el reporte del turno");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-600">
          <div className="inline-block animate-spin">⏳</div> Cargando reporte...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-700"
        >
          {error}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-4 text-slate-800 flex items-center gap-2"
      >
        📊 Reporte de Turno
      </motion.h2>

      <p className="text-sm text-slate-600 mb-6">Resumen de ventas, pedidos y medicamentos más solicitados</p>

      {/* Tarjetas de Resumen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Facturas Emitidas</p>
              <p className="text-3xl font-bold text-blue-900">{reporte?.total_facturas || 0}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <DollarSign size={24} className="text-blue-900" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Ventas</p>
              <p className="text-3xl font-bold text-green-900">
                ${reporte?.total_ventas?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <TrendingUp size={24} className="text-green-900" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Pedidos Procesados</p>
              <p className="text-3xl font-bold text-purple-900">{reporte?.total_pedidos || 0}</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <Package size={24} className="text-purple-900" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Ticket Promedio</p>
              <p className="text-3xl font-bold text-orange-900">
                ${reporte?.ticket_promedio?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-orange-200 rounded-full">
              <BarChart3 size={24} className="text-orange-900" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Top Medicamentos */}
      {reporte?.medicamentos_mas_vendidos && reporte.medicamentos_mas_vendidos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-2xl font-bold text-slate-800 mb-4">🏆 Top Medicamentos Vendidos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Medicamento</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Cantidad</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {reporte.medicamentos_mas_vendidos.map((med, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{med.nombre}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{med.cantidad_vendida}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      ${med.total_ingresos?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Botón de Refrescar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mt-8"
      >
        <button
          onClick={cargarReporte}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Refrescar Reporte
        </button>
      </motion.div>
    </div>
  );
};

export default ReporteTurno;
