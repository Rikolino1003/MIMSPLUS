// src/pages/EmpleadoDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Pill, FileText, Package, TrendingUp, 
  AlertCircle, RefreshCw, Clock, BarChart3, ArrowLeft
} from "lucide-react";
import { ModalProvider } from "../components/PanelEmpleado/services/ModalContext";
import GlobalModals from "../components/PanelEmpleado/modals/GlobalModals";
import MedicamentosEmpleado from "../components/PanelEmpleado/services/MedicamentosEmpleado";
import PanelFactura from "../components/PanelEmpleado/services/PanelFactura";
import PanelPedidos from "../components/PanelEmpleado/services/PanelPedidos";
import PanelPedidosAdmin from "../components/PanelEmpleado/services/PanelPedidosAdmin";
import DetallePedido from "../components/PanelEmpleado/services/DetallePedido";
import "../styles/empleadoDashboard.css";
import axios from "axios";

// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api';

export default function EmpleadoDashboard() {
  const [seccionActual, setSeccionActual] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pendientes: 0,
    facturados: 0,
    medicamentosVencidos: 0,
    stockBajo: 0,
    ventasHoy: 0,
    ultimaActualizacion: null,
  });

  /**
   * Obtiene los datos de la API con manejo de errores
   */
  const fetchData = async (endpoint, config) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        ...config,
        timeout: 10000, // 10 segundos de timeout
        withCredentials: true // Para manejar cookies de autenticación
      });
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response.data)) return response.data;
      if (response.data?.results) return response.data.results;
      if (response.data?.data) return response.data.data;
      return [];
    } catch (error) {
      console.error(`Error al cargar ${endpoint}:`, error);
      
      // Manejo específico de errores
      if (error.response) {
        // La petición fue hecha y el servidor respondió con un código de estado
        // que está fuera del rango 2xx
        if (error.response.status === 401) {
          // No autorizado - redirigir a login
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
          // Aquí podrías redirigir al login
          // navigate('/login');
        } else if (error.response.status === 404) {
          toast.error('Recurso no encontrado');
        } else if (error.response.status >= 500) {
          toast.error('Error en el servidor. Por favor, intente más tarde.');
        }
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        toast.error('No se pudo conectar con el servidor. Verifique su conexión a internet.');
      } else {
        // Algo pasó en la configuración de la petición que lanzó un Error
        toast.error(`Error: ${error.message}`);
      }
      
      return [];
    }
  };

  /**
   * Carga las estadísticas del dashboard
   */
  const cargarEstadisticas = useCallback(async () => {
    try {
      setActualizando(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        return;
      }

      const config = { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      // Cargar datos en paralelo
      const [pedidosData, facturasData, medicamentosData] = await Promise.all([
        fetchData('/pedidos/', config),
        fetchData('/facturas/', config),
        fetchData('/inventario/medicamentos-crud/', config)
      ]);

      const hoy = new Date().toDateString();
      const ventasHoy = facturasData.filter(f => 
        f.fecha_emision && new Date(f.fecha_emision).toDateString() === hoy
      ).length;

      const medicamentosVencidos = medicamentosData.filter(m => 
        m.fecha_vencimiento && new Date(m.fecha_vencimiento) < new Date()
      ).length;

      const stockBajo = medicamentosData.filter(m => m.stock_actual <= 10).length;
      const pendientes = pedidosData.filter(p => p.estado === "pendiente").length;

      setStats({
        totalPedidos: pedidosData.length,
        pendientes,
        facturados: facturasData.length,
        medicamentosVencidos,
        stockBajo,
        ventasHoy,
        ultimaActualizacion: new Date().toLocaleTimeString("es-CO")
      });
    } catch (error) {
      console.error('Error en cargarEstadisticas:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  }, []);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await cargarEstadisticas();
      } catch (error) {
        console.error('Error en carga inicial:', error);
      }
    };
    
    if (isMounted) {
      loadData();
    }
    
    const interval = setInterval(() => {
      if (isMounted) {
        cargarEstadisticas();
      }
    }, 5 * 60 * 1000); // Actualizar cada 5 minutos
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cargarEstadisticas]);

  const secciones = [
    { id: "dashboard", nombre: "Dashboard", icono: <BarChart3 size={20} /> },
    { id: "medicamentos", nombre: "Medicamentos", icono: <Pill size={20} /> },
    { id: "facturas", nombre: "Facturas", icono: <FileText size={20} /> },
    { id: "pedidos", nombre: "Pedidos", icono: <Package size={20} /> },
  ];

  const CardEstadistica = ({ icon, titulo, valor, subtitulo, color, isAlert }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-6 text-white shadow-lg ${
        isAlert
          ? "bg-gradient-to-br from-red-500 to-red-600"
          : `bg-gradient-to-br ${color}`
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{titulo}</p>
          <p className="text-3xl font-bold mt-2">{valor}</p>
          {subtitulo && <p className="text-xs opacity-75 mt-1">{subtitulo}</p>}
        </div>
        <div className="opacity-30">{icon}</div>
      </div>
    </motion.div>
  );

  const location = useLocation();
  const navigate = useNavigate();
  const isOrderDetailPage = location.pathname.includes('/pedidos/');
  
  // Handle back navigation from order detail
  const handleBack = () => {
    navigate('/panelempleado');
  };

  const renderSeccionActual = () => {
    switch (seccionActual) {
      case "dashboard":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Bienvenido al Dashboard</h1>
              <p className="text-gray-600">Aquí puedes ver el resumen de tu actividad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardEstadistica
                icon={<Package size={40} />}
                titulo="Total de Pedidos"
                valor={stats.totalPedidos}
                subtitulo="En el sistema"
                color="from-blue-500 to-blue-600"
              />
              <CardEstadistica
                icon={<FileText size={40} />}
                titulo="Ventas Hoy"
                valor={stats.ventasHoy}
                subtitulo="Facturas creadas"
                color="from-green-500 to-green-600"
              />
              <CardEstadistica
                icon={<TrendingUp size={40} />}
                titulo="Facturadas"
                valor={stats.facturados}
                subtitulo="Total procesadas"
                color="from-purple-500 to-purple-600"
              />
              <CardEstadistica
                icon={<Pill size={40} />}
                titulo="Medicamentos"
                valor={stats.medicamentosVencidos}
                subtitulo="Vencidos"
                isAlert={stats.medicamentosVencidos > 0}
              />
            </div>

            {(stats.medicamentosVencidos > 0 || stats.stockBajo > 0 || stats.pendientes > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500"
              >
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertCircle size={24} className="text-red-500" /> Alertas Importantes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.medicamentosVencidos > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-red-800 mb-1">🔴 Medicamentos Vencidos</p>
                      <p className="text-2xl font-bold text-red-600">{stats.medicamentosVencidos}</p>
                      <p className="text-xs text-red-600 mt-2">Requieren atención inmediata</p>
                    </div>
                  )}
                  {stats.stockBajo > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-800 mb-1">🟡 Stock Bajo</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.stockBajo}</p>
                      <p className="text-xs text-yellow-600 mt-2">Medicamentos con stock &lt;= 10</p>
                    </div>
                  )}
                  {stats.pendientes > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-800 mb-1">🔵 Pedidos Pendientes</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.pendientes}</p>
                      <p className="text-xs text-blue-600 mt-2">Pendientes de procesamiento</p>
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
        return <PanelPedidosAdmin esAdmin={false} />;
      default:
        return null;
    }
  };

  // Función para renderizar el menú lateral
  const renderSidebar = () => (
    <div className="fixed left-0 top-0 h-full w-64 bg-indigo-900 text-white p-4 transform transition-transform duration-300 ease-in-out md:translate-x-0 -translate-x-full">
      <div className="flex items-center justify-between mb-8 p-4 border-b border-indigo-800">
        <h2 className="text-xl font-bold">Menú</h2>
      </div>
      <nav className="space-y-2">
        <button
          onClick={() => setSeccionActual("dashboard")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            seccionActual === "dashboard" ? "bg-indigo-700" : "hover:bg-indigo-800"
          }`}
        >
          <BarChart3 size={20} />
          <span>Dashboard</span>
        </button>
        
        <button
          onClick={() => setSeccionActual("pedidos")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            seccionActual === "pedidos" ? "bg-indigo-700" : "hover:bg-indigo-800"
          }`}
        >
          <FileText size={20} />
          <span>Pedidos</span>
        </button>
        
        <button
          onClick={() => setSeccionActual("facturas")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            seccionActual === "facturas" ? "bg-indigo-700" : "hover:bg-indigo-800"
          }`}
        >
          <FileText size={20} />
          <span>Facturas</span>
        </button>
        
        <button
          onClick={() => setSeccionActual("medicamentos")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            seccionActual === "medicamentos" ? "bg-indigo-700" : "hover:bg-indigo-800"
          }`}
        >
          <Package size={20} />
          <span>Medicamentos</span>
        </button>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-800">
        <button 
          onClick={() => cargarEstadisticas()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={actualizando ? "animate-spin" : ""} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  );

  return (
    <ModalProvider>
      <GlobalModals />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            {isOrderDetailPage ? (
              <div className="flex items-center">
                <button 
                  onClick={handleBack}
                  className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold">Detalle del Pedido</h1>
              </div>
            ) : (
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">Droguería MIMS</h1>
                <p className="text-sm text-purple-200 mt-1">Panel Empleado</p>
                {stats.ultimaActualizacion && (
                  <p className="text-xs text-purple-300 mt-2 flex items-center gap-1">
                    <Clock size={12} /> Actualizado: {stats.ultimaActualizacion}
                  </p>
                )}
              </div>
            )}
          </header>

          <div className="flex">
            {/* Sidebar */}
            {renderSidebar()}
            
            {/* Contenido principal */}
            <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
              <Routes>
                <Route path="pedidos/:id" element={<DetallePedido />} />
                <Route path="*" element={renderSeccionActual()} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </ModalProvider>
  );
}