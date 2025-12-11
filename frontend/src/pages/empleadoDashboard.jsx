import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import axios from "axios";
import { motion } from "framer-motion";
import { BarChart3, Package, FileText, Pill, AlertCircle, RefreshCw, LogOut, Eye } from "lucide-react";
import { ModalProvider } from "../components/PanelEmpleado/services/ModalContext";
import GlobalModals from "../components/PanelEmpleado/modals/GlobalModals";
import MedicamentosEmpleado from "../components/PanelEmpleado/services/MedicamentosEmpleado";
import PanelFactura from "../components/PanelEmpleado/services/PanelFactura";
import PanelPedidos from "../components/PanelEmpleado/services/PanelPedidos";
import "../styles/empleadoDashboard.css";

const API_BASE_URL = 'http://localhost:8000/api';

export default function EmpleadoDashboard() {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pendientes: 0,
    procesados: 0,
    entregados: 0,
    medicamentosVencidos: 0,
    stockBajo: 0,
    totalMedicamentos: 0
  });

  const getToken = () => localStorage.getItem('token');

  const getConfig = () => ({
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  const loadStats = async () => {
    try {
      setUpdating(true);
      if (!getToken()) { navigate('/login'); return; }
      const config = getConfig();
      const [pedidosRes, medicamentosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/pedidos/pedidos/`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/inventario/medicamentos-crud/`, config).catch(() => ({ data: [] }))
      ]);
      const pedidos = Array.isArray(pedidosRes.data) ? pedidosRes.data : (pedidosRes.data?.results || []);
      const medicamentos = Array.isArray(medicamentosRes.data) ? medicamentosRes.data : (medicamentosRes.data?.results || []);
      const newStats = {
        totalPedidos: pedidos.length,
        pendientes: pedidos.filter(p => p.estado === "pendiente").length,
        procesados: pedidos.filter(p => p.estado === "procesado").length,
        entregados: pedidos.filter(p => p.estado === "entregado").length,
        medicamentosVencidos: medicamentos.filter(m => { try { return m.fecha_vencimiento && new Date(m.fecha_vencimiento) < new Date(); } catch { return false; } }).length,
        stockBajo: medicamentos.filter(m => { try { return m.stock_actual && m.stock_actual <= 10; } catch { return false; } }).length,
        totalMedicamentos: medicamentos.length
      };
      setStats(newStats);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => { loadStats(); const interval = setInterval(loadStats, 5 * 60 * 1000); return () => clearInterval(interval); }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const StatCard = ({ icon: Icon, title, value, color, alert }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-lg text-white shadow-lg ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {alert && <p className="text-xs mt-2 font-semibold">Accion requerida</p>}
        </div>
        <Icon size={28} className="opacity-40" />
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (seccion) {
      case "dashboard":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-800">Dashboard</h2>
                <p className="text-gray-600">Resumen general de operaciones</p>
              </div>
              <button onClick={loadStats} disabled={updating} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50">
                <RefreshCw size={18} className={updating ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Package} title="Total Pedidos" value={stats.totalPedidos} color="bg-gradient-to-br from-blue-500 to-blue-600" />
              <StatCard icon={AlertCircle} title="Pendientes" value={stats.pendientes} color={stats.pendientes > 0 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" : "bg-gradient-to-br from-gray-400 to-gray-500"} alert={stats.pendientes > 0} />
              <StatCard icon={BarChart3} title="Procesados" value={stats.procesados} color="bg-gradient-to-br from-purple-500 to-purple-600" />
              <StatCard icon={FileText} title="Entregados" value={stats.entregados} color="bg-gradient-to-br from-green-500 to-green-600" />
              <StatCard icon={Pill} title="Medicamentos Total" value={stats.totalMedicamentos} color="bg-gradient-to-br from-indigo-500 to-indigo-600" />
              <StatCard icon={AlertCircle} title="Vencidos" value={stats.medicamentosVencidos} color={stats.medicamentosVencidos > 0 ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-gray-400 to-gray-500"} alert={stats.medicamentosVencidos > 0} />
              <StatCard icon={Pill} title="Stock Bajo" value={stats.stockBajo} color={stats.stockBajo > 0 ? "bg-gradient-to-br from-orange-500 to-orange-600" : "bg-gradient-to-br from-gray-400 to-gray-500"} alert={stats.stockBajo > 0} />
              <StatCard icon={Eye} title="Requerimientos" value={stats.pendientes + stats.medicamentosVencidos + stats.stockBajo} color="bg-gradient-to-br from-pink-500 to-pink-600" />
            </div>
          </motion.div>
        );
      case "pedidos": return <PanelPedidos />;
      case "facturas": return <PanelFactura />;
      case "medicamentos": return <MedicamentosEmpleado />;
      default: return null;
    }
  };

  return (
    <ModalProvider>
      <GlobalModals />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-teal-600">MIMS Farmacia</h1>
              <p className="text-xs text-gray-500">Panel de Empleado</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"><LogOut size={18} /> Salir</button>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Menu</h3>
                <nav className="space-y-2">
                  {[{ id: "dashboard", label: "Dashboard" },{ id: "pedidos", label: "Pedidos" },{ id: "facturas", label: "Facturas" },{ id: "medicamentos", label: "Medicamentos" }].map(item => (
                    <button key={item.id} onClick={() => setSeccion(item.id)} className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${seccion === item.id ? "bg-teal-500 text-white shadow-md" : "text-slate-700 hover:bg-gray-100"}`}>{item.label}</button>
                  ))}
                </nav>
              </div>
            </aside>
            <main className="lg:col-span-4">
              {loading ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div><p className="mt-4 text-gray-600 font-semibold">Cargando datos...</p></div>
              ) : (
                renderContent()
              )}
            </main>
          </div>
        </div>
      </div>
    </ModalProvider>
  );
}
