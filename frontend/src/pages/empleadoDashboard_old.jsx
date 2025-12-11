// src/pages/EmpleadoDashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  Pill, FileText, Package, BarChart3, AlertCircle, RefreshCw, LogOut
} from "lucide-react";
import { ModalProvider } from "../components/PanelEmpleado/services/ModalContext";
import GlobalModals from "../components/PanelEmpleado/modals/GlobalModals";
import MedicamentosEmpleado from "../components/PanelEmpleado/services/MedicamentosEmpleado";
import PanelFactura from "../components/PanelEmpleado/services/PanelFactura";
import PanelPedidos from "../components/PanelEmpleado/services/PanelPedidos";
import "../styles/empleadoDashboard.css";
import axios from "axios";

// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api';

export default function EmpleadoDashboard() {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState("dashboard");
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pendientes: 0,
    procesados: 0,
    entregados: 0,
    medicamentosVencidos: 0,
    stockBajo: 0
  });
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      setActualizando(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada');
        navigate('/login');
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      console.log('📡 Iniciando carga de estadísticas...');

      // Hacer todas las peticiones en paralelo
      const [pedidosRes, medicamentosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/pedidos/pedidos/`, config).catch(e => {
          console.error('Error en pedidos:', e.message);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/inventario/medicamentos-crud/`, config).catch(e => {
          console.error('Error en medicamentos:', e.message);
          return { data: [] };
        })
      ]);

      // Extraer datos - manejar diferentes formatos de respuesta
      const pedidos = Array.isArray(pedidosRes.data) ? pedidosRes.data : (pedidosRes.data?.results || []);
      const medicamentos = Array.isArray(medicamentosRes.data) ? medicamentosRes.data : (medicamentosRes.data?.results || []);

      console.log('✅ Datos cargados:', { pedidos: pedidos.length, medicamentos: medicamentos.length });

      // Calcular estadísticas
      const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
      const procesados = pedidos.filter(p => p.estado === "procesado").length;
      const entregados = pedidos.filter(p => p.estado === "entregado").length;

      const medicamentosVencidos = medicamentos.filter(m => {
        try {
          return m.fecha_vencimiento && new Date(m.fecha_vencimiento) < new Date();
        } catch {
          return false;
        }
      }).length;

      const stockBajo = medicamentos.filter(m => {
        try {
          return m.stock_actual && m.stock_actual <= 10;
        } catch {
          return false;
        }
      }).length;

      const nuevoStats = {
        totalPedidos: pedidos.length,
        pendientes,
        procesados,
        entregados,
        medicamentosVencidos,
        stockBajo,
        ventasHoy: 0 // Se calcula desde facturas si es necesario
      };

      console.log('📊 Stats calculadas:', nuevoStats);
      setStats(nuevoStats);

    } catch (error) {
      console.error('❌ Error en cargarEstadisticas:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    cargarEstadisticas();
    const intervalo = setInterval(cargarEstadisticas, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  // Card componente
  const Card = ({ icon: Icon, titulo, valor, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-6 text-white shadow-lg ${color}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90">{titulo}</p>
          <p className="text-3xl font-bold mt-2">{valor}</p>
        </div>
        <Icon size={28} className="opacity-40" />
      </div>
    </motion.div>
  );

  // Renderizar sección actual
  const renderSeccion = () => {
    switch (seccion) {
      case "dashboard":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Dashboard</h1>
              <p className="text-gray-600">Resumen de tu actividad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card icon={Package} titulo="Total Pedidos" valor={stats.totalPedidos} color="bg-gradient-to-br from-blue-500 to-blue-600" />
              <Card icon={AlertCircle} titulo="Pendientes" valor={stats.pendientes} color={stats.pendientes > 0 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" : "bg-gradient-to-br from-gray-500 to-gray-600"} />
              <Card icon={BarChart3} titulo="Procesados" valor={stats.procesados} color="bg-gradient-to-br from-purple-500 to-purple-600" />
              <Card icon={Package} titulo="Entregados" valor={stats.entregados} color="bg-gradient-to-br from-green-500 to-green-600" />
              <Card icon={AlertCircle} titulo="Vencidos" valor={stats.medicamentosVencidos} color={stats.medicamentosVencidos > 0 ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-gray-500 to-gray-600"} />
              <Card icon={Pill} titulo="Stock Bajo" valor={stats.stockBajo} color={stats.stockBajo > 0 ? "bg-gradient-to-br from-orange-500 to-orange-600" : "bg-gradient-to-br from-gray-500 to-gray-600"} />
            </div>

            {(stats.medicamentosVencidos > 0 || stats.stockBajo > 0 || stats.pendientes > 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Alertas Importantes</h3>
                <div className="space-y-2">
                  {stats.medicamentosVencidos > 0 && <p className="text-red-700 font-semibold">🔴 {stats.medicamentosVencidos} medicamentos vencidos - Revisar inmediatamente</p>}
                  {stats.stockBajo > 0 && <p className="text-orange-700 font-semibold">🟠 {stats.stockBajo} medicamentos con stock bajo - Considerar reorden</p>}
                  {stats.pendientes > 0 && <p className="text-yellow-700 font-semibold">🟡 {stats.pendientes} pedidos pendientes - Requieren procesamiento</p>}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      case "medicamentos":
        return <MedicamentosEmpleado />;
      case "facturas":
        return <PanelFactura />;
      case "pedidos":
        return <PanelPedidos />;
      default:
        return null;
    }
  };

  return (
    <ModalProvider>
      <GlobalModals />
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-teal-600">MIMS Farmacia</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4">Menú</h3>
                <nav className="space-y-2">
                  {[
                    { id: "dashboard", label: "📊 Dashboard" },
                    { id: "medicamentos", label: "💊 Medicamentos" },
                    { id: "facturas", label: "📄 Facturas" },
                    { id: "pedidos", label: "📦 Pedidos" }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSeccion(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${seccion === item.id ? "bg-teal-500 text-white font-semibold" : "text-slate-700 hover:bg-gray-100"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-4">
              {cargando ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                  <p className="mt-4 text-gray-600">Cargando datos...</p>
                </div>
              ) : (
                <>
                  {seccion === "dashboard" && (
                    <button
                      onClick={cargarEstadisticas}
                      disabled={actualizando}
                      className="mb-6 flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50"
                    >
                      <RefreshCw size={18} className={actualizando ? "animate-spin" : ""} />
                      {actualizando ? "Actualizando..." : "Actualizar"}
                    </button>
                  )}
                  {renderSeccion()}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </ModalProvider>
  );
}