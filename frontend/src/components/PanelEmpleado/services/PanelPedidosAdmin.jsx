import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Package, Eye, Filter, Search, ChevronDown, ChevronUp, AlertCircle, Check, Truck, Eye as EyeIcon } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000/api";

export default function PanelPedidosAdmin({ esAdmin = false }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const intervalRef = useRef(null);

  // Cargar pedidos
  useEffect(() => {
    cargarPedidos();
    
    // Auto-actualizar cada 5 segundos
    intervalRef.current = setInterval(() => {
      cargarPedidos();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const cargarPedidos = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { "Authorization": `Bearer ${token}` }
      };

      const res = await axios.get(`${API_BASE}/pedidos/pedidos/`, config);
      let data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      
      // Ordenar por estado (pendiente primero) y luego por fecha más reciente
      data.sort((a, b) => {
        if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
        if (a.estado !== "pendiente" && b.estado === "pendiente") return 1;
        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      });
      setPedidos(data);
      setCargando(false);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      setCargando(false);
    }
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    const coincideBusqueda = 
      String(p.id).includes(busqueda) ||
      p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.correo_cliente?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = !filtroEstado || p.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  // Cambiar estado del pedido
  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setCambiandoEstado(prev => ({ ...prev, [pedidoId]: true }));
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { "Authorization": `Bearer ${token}` }
      };

      await axios.patch(
        `${API_BASE}/pedidos/pedidos/${pedidoId}/`,
        { estado: nuevoEstado },
        config
      );

      // Actualizar localmente
      setPedidos(prev =>
        prev.map(p =>
          p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
        ).sort((a, b) => {
          if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
          if (a.estado !== "pendiente" && b.estado === "pendiente") return 1;
          return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
        })
      );
      
      // Recargar para asegurar sincronización
      setTimeout(cargarPedidos, 500);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("❌ Error al actualizar el estado");
    } finally {
      setCambiandoEstado(prev => ({ ...prev, [pedidoId]: false }));
    }
  };

  const estadosPermitidos = {
    pendiente: ["procesado", "cancelado"],
    procesado: ["entregado", "cancelado"],
    entregado: [],
    cancelado: []
  };

  const colorEstado = {
    pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    procesado: "bg-blue-100 text-blue-800 border-blue-300",
    entregado: "bg-green-100 text-green-800 border-green-300",
    cancelado: "bg-red-100 text-red-800 border-red-300",
  };

  if (cargando) {
    return <div className="text-center py-8">Cargando pedidos...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <Package size={28} /> Pedidos
        </h2>

        {/* Filtros */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID, cliente o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="procesado">Procesado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <button
            onClick={cargarPedidos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay pedidos que coincidan con los filtros
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const esPendiente = pedido.estado === "pendiente";
            
            return (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg shadow-sm hover:shadow-md transition-all ${
                  esPendiente
                    ? "bg-red-50 border-red-300 ring-2 ring-red-200"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Header del pedido */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {esPendiente && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <AlertCircle size={24} className="text-red-600" />
                        </motion.div>
                      )}
                      <span className="font-bold text-lg text-blue-600">#{pedido.id}</span>
                      <span className={`font-medium ${esPendiente ? "text-red-800" : "text-gray-700"}`}>
                        {pedido.cliente_nombre}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm border font-medium ${
                          esPendiente
                            ? "bg-red-600 text-white border-red-700"
                            : colorEstado[pedido.estado] || colorEstado.pendiente
                        }`}
                      >
                        {pedido.estado_display || pedido.estado}
                      </span>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-2">
                      {esPendiente && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => cambiarEstado(pedido.id, "procesado")}
                            disabled={cambiandoEstado[pedido.id]}
                            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-400 transition flex items-center gap-1"
                            title="Marcar como procesado"
                          >
                            <Truck size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => cambiarEstado(pedido.id, "entregado")}
                            disabled={cambiandoEstado[pedido.id]}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition flex items-center gap-1"
                            title="Marcar como entregado"
                          >
                            <Check size={18} />
                          </motion.button>
                        </>
                      )}
                      
                      {pedido.estado === "procesado" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => cambiarEstado(pedido.id, "entregado")}
                          disabled={cambiandoEstado[pedido.id]}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition"
                          title="Marcar como entregado"
                        >
                          <Check size={18} />
                        </motion.button>
                      )}

                      <button
                        onClick={() =>
                          setPedidoExpandido(
                            pedidoExpandido === pedido.id ? null : pedido.id
                          )
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        {pedidoExpandido === pedido.id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Información resumida */}
                  <div className={`text-sm ${esPendiente ? "text-red-700" : "text-gray-600"}`}>
                    📅 {new Date(pedido.fecha_creacion).toLocaleDateString("es-CO")} |
                    💰 Total: ${pedido.total?.toLocaleString("es-CO") || "0"}
                  </div>
                </div>

              {/* Detalles expandidos */}
              {pedidoExpandido === pedido.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t bg-gray-50 p-4"
                >
                  {/* Información del pedido */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium">{pedido.cliente_nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Correo</p>
                      <p className="font-medium text-blue-600">{pedido.correo_cliente || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-medium">{pedido.direccion_entrega}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{pedido.telefono_contacto}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Método de pago</p>
                      <p className="font-medium">{pedido.metodo_pago}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-bold text-lg">${pedido.total?.toLocaleString("es-CO") || "0"}</p>
                    </div>
                  </div>

                  {/* Detalles de los productos */}
                  {pedido.detalles && pedido.detalles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-800">Productos:</h4>
                      <div className="bg-white rounded p-3 space-y-2">
                        {pedido.detalles.map((detalle, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {detalle.medicamento?.nombre || `Medicamento #${detalle.medicamento_id}`}
                            </span>
                            <span>
                              {detalle.cantidad}x ${detalle.precio_unitario?.toLocaleString("es-CO") || "0"} = ${(detalle.subtotal)?.toLocaleString("es-CO") || "0"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {pedido.notas && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-gray-600">Notas:</p>
                      <p className="text-gray-800">{pedido.notas}</p>
                    </div>
                  )}

                  {/* Cambiar estado */}
                  {estadosPermitidos[pedido.estado]?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {estadosPermitidos[pedido.estado].map((nuevoEstado) => (
                        <motion.button
                          key={nuevoEstado}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => cambiarEstado(pedido.id, nuevoEstado)}
                          disabled={cambiandoEstado[pedido.id]}
                          className={`px-4 py-2 rounded text-white font-medium transition ${
                            nuevoEstado === "cancelado"
                              ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                              : "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                          }`}
                        >
                          {cambiandoEstado[pedido.id] ? "..." : `${nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1)}`}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
          })}
        </div>
      )}
    </motion.div>
  );
}
