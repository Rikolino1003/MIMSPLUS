import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pill, FileText, Package, BarChart3, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    getPedidosActivos,
    getFacturasDia,
    getMedicamentosDisponibles,
    getAlertasMedicamentos,
} from "../../../../services/api";
import AutoAlertLauncher from "./AutoAlertLauncher";

export default function DashboardHome() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPedidos: 0,
        pendientes: 0,
        facturados: 0,
        medicamentosVencidos: 0,
        stockBajo: 0,
        ventasHoy: 0,
        ultimaActualizacion: null,
    });
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    useEffect(() => {
        cargarEstadisticas();
        const interval = setInterval(cargarEstadisticas, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const cargarEstadisticas = async () => {
        setActualizando(true);
        try {
            let pedidosData = [];
            try {
                const pRes = await getPedidosActivos();
                const data = pRes.data.results || pRes.data || [];
                pedidosData = Array.isArray(data) ? data : [];
            } catch (e) {
                console.error("Error al obtener pedidos activos:", e);
            }

            let facturasData = [];
            try {
                const fRes = await getFacturasDia();
                const data = fRes.data.results || fRes.data || [];
                facturasData = Array.isArray(data) ? data : [];
            } catch (e) {
                console.error("Error al obtener facturas del día:", e);
            }

            let alertas = {};
            try {
                const aRes = await getAlertasMedicamentos();
                alertas = aRes.data || aRes;
            } catch (e) {
                console.error("Error al obtener alertas:", e);
            }

            setStats({
                totalPedidos: Array.isArray(pedidosData) ? pedidosData.length : 0,
                pendientes: Array.isArray(pedidosData) ? pedidosData.filter(p => p.estado === "pendiente").length : 0,
                facturados: Array.isArray(facturasData) ? facturasData.length : 0,
                medicamentosVencidos: alertas.proximo_vencimiento ? alertas.proximo_vencimiento.cantidad || 0 : 0,
                stockBajo: alertas.stock_bajo ? alertas.stock_bajo.cantidad || 0 : 0,
                ventasHoy: Array.isArray(facturasData) ? facturasData.length : 0,
                ultimaActualizacion: new Date().toLocaleTimeString("es-CO"),
            });
        } catch (error) {
            console.error("Error cargando estadísticas:", error);
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    };

    const secciones = [
        { id: "medicamentos", nombre: "Medicamentos", icono: <Pill size={20} />, path: "/panelempleado/medicamentos" },
        { id: "facturas", nombre: "Facturas", icono: <FileText size={20} />, path: "/panelempleado/facturas" },
        { id: "pedidos", nombre: "Pedidos", icono: <Package size={20} />, path: "/panelempleado/pedidos" },
        { id: "reportes", nombre: "Reportes", icono: <BarChart3 size={20} />, path: "/panelempleado/reportes" },
    ];

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-block animate-spin text-2xl">⏳</div>
                <p className="mt-4 text-slate-600">Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold mb-2 text-slate-800"
            >
                Bienvenido, {usuario?.nombre || "Empleado"}
            </motion.h2>
            <p className="text-slate-600 mb-8">Panel de control de auxiliar de droguería</p>

            {/* Tarjetas de Estadísticas */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                            <p className="text-sm text-blue-700 font-medium">Pedidos Activos</p>
                            <p className="text-3xl font-bold text-blue-900">{stats.totalPedidos}</p>
                            <p className="text-xs text-blue-600 mt-1">Pendientes: {stats.pendientes}</p>
                        </div>
                        <div className="p-3 bg-blue-200 rounded-full">
                            <Package size={24} className="text-blue-900" />
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
                            <p className="text-sm text-green-700 font-medium">Facturas Hoy</p>
                            <p className="text-3xl font-bold text-green-900">{stats.facturados}</p>
                            <p className="text-xs text-green-600 mt-1">Emitidas hoy</p>
                        </div>
                        <div className="p-3 bg-green-200 rounded-full">
                            <FileText size={24} className="text-green-900" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-700 font-medium">Stock Bajo</p>
                            <p className="text-3xl font-bold text-orange-900">{stats.stockBajo}</p>
                            <p className="text-xs text-orange-600 mt-1">Medicamentos</p>
                        </div>
                        <div className="p-3 bg-orange-200 rounded-full">
                            <AlertCircle size={24} className="text-orange-900" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-700 font-medium">Próximo Vencimiento</p>
                            <p className="text-3xl font-bold text-purple-900">{stats.medicamentosVencidos}</p>
                            <p className="text-xs text-purple-600 mt-1">Medicamentos</p>
                        </div>
                        <div className="p-3 bg-purple-200 rounded-full">
                            <AlertCircle size={24} className="text-purple-900" />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Acciones Rápidas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h3 className="text-xl font-bold text-slate-800 mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {secciones.map((seccion) => (
                        <motion.button
                            key={seccion.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(seccion.path)}
                            className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition"
                        >
                            <div className="text-3xl mb-2 text-blue-600">{seccion.icono}</div>
                            <span className="font-semibold text-slate-800 text-center">{seccion.nombre}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Últimas Actualizaciones */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Última actualización</p>
                        <p className="text-slate-800 font-semibold">{stats.ultimaActualizacion}</p>
                    </div>
                    <button
                        onClick={cargarEstadisticas}
                        disabled={actualizando}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={actualizando ? "animate-spin" : ""} /> Refrescar
                    </button>
                </div>
            </motion.div>

            {/* AutoAlertLauncher */}
            <AutoAlertLauncher />
        </div>
    );
}
