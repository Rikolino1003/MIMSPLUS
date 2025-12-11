import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  Pill, Package, BarChart3, AlertCircle, RefreshCw, LogOut, 
  TrendingUp, Clock, CheckCircle, XCircle
} from "lucide-react";
import { ModalProvider } from "../components/PanelEmpleado/services/ModalContext";
import GlobalModals from "../components/PanelEmpleado/modals/GlobalModals";
import MedicamentosEmpleado from "../components/PanelEmpleado/services/MedicamentosEmpleado";
import PanelFactura from "../components/PanelEmpleado/services/PanelFactura";
import PanelPedidos from "../components/PanelEmpleado/services/PanelPedidos";
import "../styles/empleadoDashboard.css";
import axios from "axios";

const API_BASE_URL = 'http://localhost:8000/api';

export default function EmpleadoDashboard() {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState("dashboard");
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pendientes: 0,
    procesados: 0,
    entregados: 0,
    cancelados: 0,
    medicamentosVencidos: 0,
    stockBajo: 0,
    ventasHoy: 0,
    ingresoTotal: 0
  });
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  // Obtener token
  const getToken = () => localStorage.getItem('token');

  const getConfig = () => ({
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  // Cargar todas las estadísticas
  const cargarEstadisticas = async () => {
    try {
      setActualizando(true);
      const token = getToken();
      
      if (!token) {
        navigate('/login');
        return;
      }

      const config = getConfig();

      // Cargar datos en paralelo
      const [pedidosRes, facturesRes, medicamentosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/pedidos/pedidos/`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/facturas/lista/`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/inventario/medicamentos-crud/`, config).catch(() => ({ data: [] }))
      ]);

      // Normalizar respuestas
      const pedidos = Array.isArray(pedidosRes.data) ? pedidosRes.data : (pedidosRes.data?.results || []);
      const facturas = Array.isArray(facturesRes.data) ? facturesRes.data : (facturesRes.data?.results || []);
      const medicamentos = Array.isArray(medicamentosRes.data) ? medicamentosRes.data : (medicamentosRes.data?.results || []);

      console.log('✅ Datos cargados:', { 
        pedidos: pedidos.length, 
        facturas: facturas.length, 
        medicamentos: medicamentos.length 
      });

      // Calcular estadísticas de pedidos
      const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
      const procesados = pedidos.filter(p => p.estado === "procesado").length;
      const entregados = pedidos.filter(p => p.estado === "entregado").length;
      const cancelados = pedidos.filter(p => p.estado === "cancelado").length;

      // Calcular ventas hoy
      const hoy = new Date().toDateString();
      const ventasHoy = facturas.filter(f => {
        try {
          return f.fecha_emision && new Date(f.fecha_emision).toDateString() === hoy;
        } catch {
          return false;
        }
      }).length;

      // Calcular ingreso total
      const ingresoTotal = facturas.reduce((sum, f) => {
        const total = parseFloat(f.total) || 0;
        return sum + total;
      }, 0);

      // Medicamentos
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
        cancelados,
        medicamentosVencidos,
        stockBajo,
        ventasHoy,
        ingresoTotal: Math.round(ingresoTotal)
      };

      console.log('📊 Stats:', nuevoStats);
      setStats(nuevoStats);

    } catch (error) {
      console.error('❌ Error:', error);
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
  const Card = ({ icon: Icon, titulo, valor, subtitulo, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-6 text-white shadow-lg ${color}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90">{titulo}</p>
          <p className="text-3xl font-bold mt-2">{valor}</p>
          {subtitulo && <p className="text-xs opacity-75 mt-1">{subtitulo}</p>}
        </div>
        <Icon size={28} className="opacity-40" />
      </div>
    </motion.div>
  );

  // Renderizar sección
  const renderSeccion = () => {
    switch (seccion) {
      case "dashboard":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Panel de Control</h1>
              <p className="text-gray-600">Gestión de pedidos y farmacéutica</p>
            </div>

            {/* Estadísticas principales */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">📊 Resumen de Pedidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                  icon={Package} 
                  titulo="Total Pedidos" 
                  valor={stats.totalPedidos}
                  color="bg-gradient-to-br from-blue-500 to-blue-600" 
                />
                <Card 
                  icon={Clock} 
                  titulo="Pendientes" 
                  valor={stats.pendientes}
                  color={stats.pendientes > 0 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" : "bg-gradient-to-br from-gray-400 to-gray-500"} 
                />
                <Card 
                  icon={BarChart3} 
                  titulo="Procesados" 
                  valor={stats.procesados}
                  color="bg-gradient-to-br from-purple-500 to-purple-600" 
                />
                <Card 
                  icon={CheckCircle} 
                  titulo="Entregados" 
                  valor={stats.entregados}
                  color="bg-gradient-to-br from-green-500 to-green-600" 
                />
              </div>
            </div>

            {/* Estadísticas de facturas y medicamentos */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">💰 Facturación & Medicamentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                  icon={TrendingUp} 
                  titulo="Facturas Hoy" 
                  valor={stats.ventasHoy}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600" 
                />
                <Card 
                  icon={TrendingUp} 
                  titulo="Ingreso Total" 
                  valor={`$${stats.ingresoTotal.toLocaleString()}`}
                  subtitulo="Todas las facturas"
                  color="bg-gradient-to-br from-cyan-500 to-cyan-600" 
                />
                <Card 
                  icon={AlertCircle} 
                  titulo="Vencidos" 
                  valor={stats.medicamentosVencidos}
                  color={stats.medicamentosVencidos > 0 ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-gray-400 to-gray-500"} 
                />
                <Card 
                  icon={Pill} 
                  titulo="Stock Bajo" 
                  valor={stats.stockBajo}
                  color={stats.stockBajo > 0 ? "bg-gradient-to-br from-orange-500 to-orange-600" : "bg-gradient-to-br from-gray-400 to-gray-500"} 
                />
              </div>
            </div>

            {/* Alertas */}
            {(stats.medicamentosVencidos > 0 || stats.stockBajo > 0 || stats.pendientes > 0 || stats.cancelados > 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Alertas y Acciones Requeridas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.medicamentosVencidos > 0 && (
                    <div className="bg-white p-4 rounded border-l-4 border-red-500">
                      <p className="text-red-700 font-semibold">🔴 {stats.medicamentosVencidos} medicamentos vencidos</p>
                      <p className="text-sm text-gray-600 mt-1">Revisar e inutilizar inmediatamente</p>
                    </div>
                  )}
                  {stats.stockBajo > 0 && (
                    <div className="bg-white p-4 rounded border-l-4 border-orange-500">
                      <p className="text-orange-700 font-semibold">🟠 {stats.stockBajo} medicamentos con stock bajo</p>
                      <p className="text-sm text-gray-600 mt-1">Considerar reorden urgente</p>
                    </div>
                  )}
                  {stats.pendientes > 0 && (
                    <div className="bg-white p-4 rounded border-l-4 border-yellow-500">
                      <p className="text-yellow-700 font-semibold">🟡 {stats.pendientes} pedidos pendientes</p>
                      <p className="text-sm text-gray-600 mt-1">Requieren procesamiento o confirmación</p>
                    </div>
                  )}
                  {stats.cancelados > 0 && (
                    <div className="bg-white p-4 rounded border-l-4 border-gray-500">
                      <p className="text-gray-700 font-semibold">⚫ {stats.cancelados} pedidos cancelados</p>
                      <p className="text-sm text-gray-600 mt-1">Verificar motivos de cancelación</p>
                    </div>
                  )}
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
            <h1 className="text-2xl font-bold text-teal-600">MIMS - Panel Empleado</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              <LogOut size={18} /> Salir
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4">Navegación</h3>
                <nav className="space-y-2">
                  {[
                    { id: "dashboard", label: "📊 Dashboard", icon: "📊" },
                    { id: "pedidos", label: "📦 Pedidos", icon: "📦" },
                    { id: "facturas", label: "💰 Facturas", icon: "💰" },
                    { id: "medicamentos", label: "💊 Medicamentos", icon: "💊" }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSeccion(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${
                        seccion === item.id
                          ? "bg-teal-500 text-white shadow-md"
                          : "text-slate-700 hover:bg-gray-100"
                      }`}
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
                  <p className="mt-4 text-gray-600 font-medium">Cargando panel...</p>
                </div>
              ) : (
                <>
                  {seccion === "dashboard" && (
                    <button
                      onClick={cargarEstadisticas}
                      disabled={actualizando}
                      className="mb-6 flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50 font-medium"
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
