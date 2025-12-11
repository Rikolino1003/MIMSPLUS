// src/components/PanelEmpleado/PanelPedidos.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, AlertCircle, RefreshCw, Search, Filter, BarChart3, XCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Plus } from "lucide-react";
import { getPedidosActivos, cambiarEstadoPedido, getAlertasMedicamentos, getClientes } from "../../../services/pedidosService";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../../../styles/empleadoDashboard.css";

const EstadoBadge = ({ estado }) => {
  const estados = {
    pendiente: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock size={14} className="inline mr-1" />,
      label: "Pendiente",
    },
    procesado: {
      color: "bg-blue-100 text-blue-800",
      icon: <RefreshCw size={14} className="inline mr-1 animate-spin" />,
      label: "Procesando",
    },
    entregado: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle size={14} className="inline mr-1" />,
      label: "Entregado",
    },
    cancelado: {
      color: "bg-red-100 text-red-800",
      icon: <AlertCircle size={14} className="inline mr-1" />,
      label: "Cancelado",
    },
  };

  const info = estados[estado] || { color: "bg-gray-100 text-gray-800", icon: "❓", label: estado };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${info.color}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

// Definir los estados posibles y sus transiciones permitidas
const proximosEstados = {
  pendiente: ['procesado', 'cancelado'],
  procesado: ['entregado', 'cancelado'],
  entregado: [], // No se puede cambiar desde entregado
  cancelado: []  // No se puede cambiar desde cancelado
};

// Componente para el selector de estado con iconos
const StatusSelector = ({ currentStatus, onStatusChange, pedidoId, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const estados = {
    pendiente: {
      icon: <Clock size={16} />,
      label: 'Pendiente',
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      textColor: 'text-yellow-800'
    },
    procesado: {
      icon: <RefreshCw size={16} className="animate-spin" />,
      label: 'Procesando',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      textColor: 'text-blue-800'
    },
    entregado: {
      icon: <CheckCircle2 size={16} />,
      label: 'Entregado',
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
      textColor: 'text-green-800'
    },
    cancelado: {
      icon: <XCircle size={16} />,
      label: 'Cancelado',
      color: 'bg-red-100 text-red-800 hover:bg-red-200',
      textColor: 'text-red-800'
    }
  };

  const currentState = estados[currentStatus] || {};
  const availableStates = proximosEstados[currentStatus] || [];

  if (availableStates.length === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${currentState.color} ${currentState.textColor}`}>
        {currentState.icon}
        <span>{currentState.label}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1 rounded-full text-sm font-medium ${currentState.color} ${currentState.textColor} ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'} min-w-[120px]`}
      >
        <div className="flex items-center gap-1">
          {currentState.icon}
          <span>{currentState.label}</span>
        </div>
        {!loading && (
          <span className="ml-1">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            tabIndex="-1"
          >
            <div className="py-1">
              {availableStates.map((estado) => {
                const state = estados[estado];
                return (
                  <button
                    key={estado}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(estado, pedidoId);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 ${state.textColor}`}
                    role="menuitem"
                    tabIndex="-1"
                  >
                    {state.icon}
                    {state.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PanelPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [error, setError] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState({ id: null, estado: '' });
  const [alertas, setAlertas] = useState({ stock_bajo: [], proximo_vencimiento: [] });
  const [clientes, setClientes] = useState([]);
  
  // Form state for creating/editing orders
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: "",
    detalles: [],
    metodo_pago: "efectivo",
    estado: "pendiente",
    direccion_entrega: "",
    telefono_contacto: "",
    notas: "",
    subtotal: 0,
    descuento: 0,
    total: 0,
    fecha_creacion: new Date().toISOString()
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle product selection and quantity changes
  const handleProductChange = (index, field, value) => {
    const newDetalles = [...formData.detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    
    // Calculate subtotal if quantity or price changes
    if (field === 'cantidad' || field === 'precio_unitario') {
      const subtotal = newDetalles.reduce((sum, item) => {
        return sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0));
      }, 0);
      
      setFormData(prev => ({
        ...prev,
        detalles: newDetalles,
        subtotal,
        total: subtotal - (prev.descuento || 0)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        detalles: newDetalles
      }));
    }
  };

  // Add new product row
  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        { 
          producto_id: '',
          nombre_producto: '',
          cantidad: 1,
          precio_unitario: 0,
          descuento: 0
        }
      ]
    }));
  };

  // Remove product row
  const removeProductRow = (index) => {
    const newDetalles = formData.detalles.filter((_, i) => i !== index);
    const subtotal = newDetalles.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0));
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      detalles: newDetalles,
      subtotal,
      total: subtotal - (prev.descuento || 0)
    }));
  };

  // Handle client selection
  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id.toString() === clienteId);
    
    setFormData(prev => ({
      ...prev,
      cliente_id: clienteId,
      cliente_nombre: cliente ? cliente.nombre : '',
      telefono_contacto: cliente?.telefono || '',
      direccion_entrega: cliente?.direccion || ''
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.cliente_id) {
      alert('Por favor seleccione un cliente');
      return;
    }
    
    if (formData.detalles.length === 0) {
      alert('Por favor agregue al menos un producto al pedido');
      return;
    }
    
    // Validate product details
    const hasInvalidProduct = formData.detalles.some(item => 
      !item.producto_id || !item.cantidad || item.cantidad <= 0 || !item.precio_unitario || item.precio_unitario <= 0
    );
    
    if (hasInvalidProduct) {
      alert('Por favor complete todos los campos de los productos correctamente');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Enviando pedido:', formData);
      
      // Prepare the data for the API
      const pedidoData = {
        ...formData,
        // Add any additional fields required by your API
        fecha_creacion: new Date().toISOString(),
        estado: 'pendiente',
        // Convert detalles to the format expected by your API if needed
        detalles: formData.detalles.map(item => ({
          producto_id: item.producto_id,
          cantidad: parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          descuento: parseFloat(item.descuento || 0)
        }))
      };
      
      // Uncomment and use your actual API call
      // await crearPedido(pedidoData);
      
      // Show success message
      toast.success('Pedido creado exitosamente', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Reset form
      setFormData({
        cliente_id: "",
        detalles: [],
        metodo_pago: "efectivo",
        estado: "pendiente",
        direccion_entrega: "",
        telefono_contacto: "",
        notas: "",
        subtotal: 0,
        descuento: 0,
        total: 0,
        fecha_creacion: new Date().toISOString()
      });
      
      // Refresh orders list
      await cargarPedidos();
      
      // Hide the form
      setShowNuevoPedido(false);
      
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      toast.error('Error al crear el pedido. Por favor, intente nuevamente.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await getClientes();
      let clientesData = [];
      
      // Verificamos si la respuesta es un array o tiene la propiedad 'results'
      if (Array.isArray(response)) {
        clientesData = response;
      } else if (response && Array.isArray(response.results)) {
        clientesData = response.results;
      } else if (response) {
        clientesData = [response];
      }
      
      console.log('Datos de clientes recibidos:', clientesData);
      
      const clientesFormateados = clientesData.map(cliente => {
        // Extraemos los datos del cliente según la estructura de tu API
        const clienteId = cliente.id || cliente.pk || cliente._id;
        
        // Obtenemos el nombre del cliente
        let nombre = '';
        if (cliente.nombre_completo) {
          nombre = cliente.nombre_completo;
        } else if (cliente.nombre) {
          nombre = cliente.nombre;
          if (cliente.apellido) nombre += ` ${cliente.apellido}`;
        } else if (cliente.first_name || cliente.last_name) {
          nombre = [cliente.first_name, cliente.last_name].filter(Boolean).join(' ');
        } else if (cliente.username) {
          nombre = cliente.username;
        } else {
          nombre = `Cliente ${clienteId || ''}`;
        }
        
        // Obtenemos los datos de contacto
        const telefono = cliente.telefono || cliente.phone || cliente.telefono_contacto || '';
        const direccion = cliente.direccion || cliente.direccion_entrega || '';
        const documento = cliente.documento || cliente.dni || cliente.numero_documento || '';
        
        return {
          id: clienteId,
          nombre: nombre.trim(),
          email: cliente.email || '',
          telefono: telefono.toString().trim(),
          direccion: direccion.toString().trim(),
          documento: documento.toString().trim(),
          rawData: cliente
        };
      });
      
      console.log('Clientes formateados:', clientesFormateados);
      setClientes(clientesFormateados);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
    }
  };

  useEffect(() => {
    cargarPedidos();
    cargarAlertas();
    cargarClientes();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargarPedidos(), 300);
    return () => clearTimeout(t);
  }, [page, busqueda, filtroEstado]);

  const handleCambiarEstado = async (nuevoEstado, pedidoId) => {
    if (!pedidoId) {
      console.error('❌ Error: ID de pedido no proporcionado');
      setError('Error: No se proporcionó un ID de pedido válido');
      return;
    }
    
    setCambiandoEstado(pedidoId);
    setError(null);
    
    try {
      console.log(`🔄 Intentando cambiar estado del pedido ${pedidoId} a ${nuevoEstado}`);
      
      // Verificar si el estado es válido
      const pedidoActual = pedidos.find(p => p.id === pedidoId || p.id.toString() === pedidoId.toString());
      if (!pedidoActual) {
        throw new Error('No se encontró el pedido en la lista actual');
      }
      
      // Verificar si la transición de estado es válida
      const estadosPermitidos = proximosEstados[pedidoActual.estado] || [];
      if (!estadosPermitidos.includes(nuevoEstado)) {
        throw new Error(`No se puede cambiar el estado de '${pedidoActual.estado}' a '${nuevoEstado}'. Transición no permitida.`);
      }
      
      // Llamar a la función de actualización
      console.log('📝 Datos enviados al servidor:', {
        pedidoId,
        estado: nuevoEstado,
        comentario: `Estado cambiado a ${nuevoEstado} por el empleado`
      });
      
      const response = await cambiarEstadoPedido(pedidoId, { 
        estado: nuevoEstado,
        comentario: `Estado cambiado a ${nuevoEstado} por el empleado`
      });
      
      console.log('✅ Respuesta del servidor:', response);
      
      // Texto del estado en español
      const estadoTexto = {
        'pendiente': 'pendiente',
        'procesado': 'en proceso',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
      }[nuevoEstado] || nuevoEstado;
      
      // Mostrar notificación en español
      toast(
        <div className="bg-green-100 text-green-800 p-3 rounded shadow-md">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <span>Estado del pedido {pedidoId} actualizado exitosamente a {estadoTexto}</span>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          closeButton: false,
          draggable: true,
          pauseOnHover: true,
          className: '!p-0 !bg-transparent !shadow-none',
          bodyClassName: '!p-0',
          progressClassName: '!bg-green-500',
        }
      );
      
      // Cerrar el detalle si está abierto
      setDetalleAbierto(false);
      
      // Recargar los pedidos para ver los cambios
      await cargarPedidos();
      
      console.log(`✅ Estado del pedido ${pedidoId} actualizado exitosamente a ${nuevoEstado}`);
      
    } catch (err) {
      console.error('❌ Error al cambiar estado del pedido:', {
        pedidoId,
        nuevoEstado,
        error: err.message,
        stack: err.stack
      });
      
      // Mostrar mensaje de error específico
      const errorMessage = err.response?.data?.error || 
                         err.response?.data?.message || 
                         err.message || 
                         'Error desconocido al cambiar el estado del pedido';
      
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right"
      });
      
      // Si el error es de autenticación, forzar recarga para limpiar el estado
      if (err.response?.status === 401 || err.message.includes('No autorizado')) {
        console.warn('🔒 Sesión expirada, recargando aplicación...');
        setTimeout(() => window.location.reload(), 2000);
      }
    } finally {
      setCambiandoEstado(null);
    }
  };

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener pedidos con detalles de cliente incluidos
      const res = await getPedidosActivos();
      let data = res.results || res || [];
      
      // Asegurarse de que los datos sean un array
      let filtered = Array.isArray(data) ? [...data] : [];
      
      // Procesar cada pedido para asegurar que el nombre del cliente esté disponible
      filtered = filtered.map(pedido => {
        // Si ya tenemos cliente_nombre, lo mantenemos
        if (pedido.cliente_nombre) return pedido;
        
        // Si tenemos un objeto cliente, intentamos extraer el nombre
        if (pedido.cliente && typeof pedido.cliente === 'object') {
          const cliente = pedido.cliente;
          const nombreCompleto = [
            cliente.first_name,
            cliente.last_name
          ].filter(Boolean).join(' ').trim();
          
          return {
            ...pedido,
            cliente_nombre: nombreCompleto || cliente.username || `Cliente ${cliente.id || ''}`
          };
        }
        
        // Si no hay información de cliente, usamos un valor por defecto
        return {
          ...pedido,
          cliente_nombre: `Cliente ${pedido.id || ''}`
        };
      });
      
      console.log('Pedidos procesados:', filtered);

      // Filtro por estado
      if (filtroEstado === "activos") {
        filtered = filtered.filter((p) => !["entregado", "cancelado"].includes(p.estado));
      } else if (filtroEstado !== "todos") {
        filtered = filtered.filter((p) => p.estado === filtroEstado);
      }

      // Búsqueda
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            (p.cliente_nombre && p.cliente_nombre.toLowerCase().includes(busquedaLower)) ||
            (p.cliente?.username && p.cliente.username.toLowerCase().includes(busquedaLower)) ||
            (p.id && p.id.toString().includes(busqueda))
        );
      }

      setTotalCount(filtered.length);
      const inicio = (page - 1) * pageSize;
      const fin = inicio + pageSize;
      setPedidos(filtered.slice(inicio, fin));
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const cargarAlertas = async () => {
    try {
      const res = await getAlertasMedicamentos();
      setAlertas(res.data || { stock_bajo: [], proximo_vencimiento: [] });
    } catch (e) {
      console.error("Error al cargar alertas:", e);
    }
  };

  const handleRefrescar = async () => {
    setRefrescando(true);
    await cargarPedidos();
    setRefrescando(false);
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-CO");
  };

  const formatoHora = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"
            >
              <span className="bg-blue-100 p-2 rounded-lg">📦</span>
              <span>Gestión de Pedidos</span>
            </motion.h2>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              Listado, seguimiento y cambio de estado de pedidos activos
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNuevoPedido(!showNuevoPedido)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              showNuevoPedido 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
            }`}
          >
            {showNuevoPedido ? (
              <>
                <XCircle size={18} />
                <span>Cancelar</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Nuevo Pedido</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Formulario de Nuevo Pedido */}
      {showNuevoPedido && (
        <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Nuevo Pedido</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleClienteChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="" disabled>Seleccione un cliente</option>
                  {Array.isArray(clientes) && clientes.map(cliente => (
                    <option 
                      key={`cliente-${cliente.id}`} 
                      value={cliente.id}
                      className="text-gray-900"
                    >
                      {cliente.nombre} - {cliente.documento || 'Sin documento'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Productos del Pedido */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Productos</h3>
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Producto
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.detalles.map((item, index) => (
                        <tr key={`producto-${index}`}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select
                              value={item.producto_id}
                              onChange={(e) => handleProductChange(index, 'producto_id', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              required
                            >
                              <option value="">Seleccionar producto</option>
                              {/* Replace with your products list */}
                              <option value="1">Producto 1</option>
                              <option value="2">Producto 2</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad || ''}
                              onChange={(e) => handleProductChange(index, 'cantidad', e.target.value)}
                              className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              required
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex rounded-md shadow-sm">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precio_unitario || ''}
                                onChange={(e) => handleProductChange(index, 'precio_unitario', e.target.value)}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            ${(item.cantidad * item.precio_unitario).toFixed(2) || '0.00'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeProductRow(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago *</label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              {/* Dirección de Entrega */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección de Entrega *</label>
                <input
                  type="text"
                  name="direccion_entrega"
                  value={formData.direccion_entrega}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Teléfono de Contacto */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono de Contacto *</label>
                <input
                  type="tel"
                  name="telefono_contacto"
                  value={formData.telefono_contacto}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="procesado">Procesando</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Notas */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas (Opcional)</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre el pedido..."
                />
              </div>
            </div>

            {/* Sección para agregar productos al pedido */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-slate-800 mb-3">Productos</h3>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-center text-slate-500 py-4">
                  Próximamente: Agregar productos al pedido
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNuevoPedido(false)}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar Pedido
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg mb-6 bg-red-100 border border-red-300 text-red-700"
        >
          {error}
        </motion.div>
      )}

      {/* Alertas de Stock */}
      {(alertas.stock_bajo?.length > 0 || alertas.proximo_vencimiento?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">⚠️ Alertas de Medicamentos</p>
              {alertas.stock_bajo?.length > 0 && (
                <p className="text-sm text-amber-800">
                  {alertas.stock_bajo.length} medicamento(s) con stock bajo
                </p>
              )}
              {alertas.proximo_vencimiento?.length > 0 && (
                <p className="text-sm text-amber-800">
                  {alertas.proximo_vencimiento.length} medicamento(s) próximo a vencer
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Controles */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleRefrescar}
            disabled={refrescando}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refrescando ? "animate-spin" : ""} /> Refrescar
          </button>
          <div className="text-sm text-slate-600 font-medium ml-auto">
            <BarChart3 size={18} className="text-blue-600" /> Total: <span className="text-blue-600">{totalCount}</span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente o ID..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => {
              setBusqueda("");
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition font-medium"
          >
            Reset
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Filtrar por Estado:</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
            >
              <option value="activos">⏳ Pedidos Activos</option>
              <option value="pendiente">⏳ Pendientes</option>
              <option value="procesado">⚙️ Procesando</option>
              <option value="entregado">✅ Entregados</option>
              <option value="cancelado">❌ Cancelados</option>
              <option value="todos">📋 Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">
          <div className="inline-block animate-spin">⏳</div> Cargando pedidos...
        </div>
      ) : pedidos.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm"
        >
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cliente</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Items</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <motion.tr
                  key={pedido.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-b border-slate-100 hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-3 font-bold text-slate-800">#{pedido.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {pedido.cliente_nombre || 
                     (pedido.cliente?.first_name && pedido.cliente?.last_name
                      ? `${pedido.cliente.first_name} ${pedido.cliente.last_name}`.trim()
                      : pedido.cliente?.username || 
                       (pedido.cliente?.nombre_completo || 
                        `Cliente ${pedido.cliente?.id || pedido.id || ''}`))}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-700">{formatoFecha(pedido.fecha_creacion)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusSelector 
                      currentStatus={pedido.estado} 
                      onStatusChange={handleCambiarEstado}
                      pedidoId={pedido.id}
                      loading={cambiandoEstado === pedido.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-800">
                    {pedido.detalles?.length || 0} items
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setPedidoSeleccionado(pedido);
                          setDetalleAbierto(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                        title="Ver detalles del pedido"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setEstadoSeleccionado(prev => ({
                            id: prev.id === pedido.id ? null : pedido.id,
                            estado: pedido.estado
                          }))}
                          className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
                          title="Cambiar estado del pedido"
                          disabled={cambiandoEstado === pedido.id}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        
                        {estadoSeleccionado.id === pedido.id && (
                          <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                            <div className="py-1">
                              {proximosEstados[pedido.estado]?.map((estado) => (
                                <button
                                  key={estado}
                                  onClick={() => {
                                    handleCambiarEstado(estado, pedido.id);
                                    setEstadoSeleccionado({ id: null, estado: '' });
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  {estado === 'procesado' && <RefreshCw size={14} className="text-blue-500" />}
                                  {estado === 'entregado' && <CheckCircle2 size={14} className="text-green-500" />}
                                  {estado === 'cancelado' && <XCircle size={14} className="text-red-500" />}
                                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200"
        >
          <p className="text-slate-600 font-medium">No hay pedidos que coincidan con tu búsqueda</p>
        </motion.div>
      )}

      {/* Paginación */}
      {totalCount > pageSize && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition font-medium"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-slate-700">
            Página {page} de {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(totalCount / pageSize)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition font-medium"
          >
            Siguiente →
          </button>
        </motion.div>
      )}

      {/* Modal de Detalles */}
      {detalleAbierto && pedidoSeleccionado && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Detalles Pedido #{pedidoSeleccionado.id}</h3>
              <button
                onClick={() => setDetalleAbierto(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 mb-2">Información del Cliente</h4>
                  <div>
                    <label className="text-xs text-slate-500 block">Nombre:</label>
                    <p className="font-medium text-slate-800">
                      {pedidoSeleccionado.cliente?.nombre_completo || 
                       (pedidoSeleccionado.cliente?.first_name && pedidoSeleccionado.cliente?.last_name 
                        ? `${pedidoSeleccionado.cliente.first_name} ${pedidoSeleccionado.cliente.last_name}` 
                        : pedidoSeleccionado.cliente?.username || 
                          'Cliente')}
                    </p>
                  </div>
                  {pedidoSeleccionado.cliente?.email && (
                    <div>
                      <label className="text-xs text-slate-500 block">Email:</label>
                      <a 
                        href={`mailto:${pedidoSeleccionado.cliente.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {pedidoSeleccionado.cliente.email}
                      </a>
                    </div>
                  )}
                  {(pedidoSeleccionado.telefono_contacto || pedidoSeleccionado.cliente?.telefono) && (
                    <div>
                      <label className="text-xs text-slate-500 block">Teléfono:</label>
                      <p className="text-sm text-slate-800">
                        {pedidoSeleccionado.telefono_contacto || pedidoSeleccionado.cliente?.telefono}
                      </p>
                    </div>
                  )}
                  {pedidoSeleccionado.cliente?.num_doc && (
                    <div>
                      <label className="text-xs text-slate-500 block">Documento:</label>
                      <p className="text-sm text-slate-800">
                        {pedidoSeleccionado.cliente.num_doc}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 mb-2">Detalles del Pedido</h4>
                  <div>
                    <label className="text-xs text-slate-500 block">Estado Actual:</label>
                    <EstadoBadge estado={pedidoSeleccionado.estado} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Fecha:</label>
                    <p className="text-sm font-medium text-slate-800">{formatoFecha(pedidoSeleccionado.fecha_creacion)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Total Items:</label>
                    <p className="text-sm font-medium text-slate-800">{pedidoSeleccionado.detalles?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-800 mb-3">Items del Pedido:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pedidoSeleccionado.detalles?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{item.medicamento?.nombre || "Medicamento"}</p>
                        <p className="text-xs text-slate-600">Cantidad: {item.cantidad}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-800 mb-3">Cambiar Estado:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {proximosEstados[pedidoSeleccionado.estado]?.map((estado) => {
                    const esCancelado = estado === 'cancelado';
                    const esEntregado = estado === 'entregado';
                    const esProcesado = estado === 'procesado';
                    
                    // Estilos y texto según el estado
                    const getButtonStyles = () => {
                      if (esCancelado) return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300';
                      if (esEntregado) return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300';
                      if (esProcesado) return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300';
                      return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300';
                    };
                    
                    const getButtonIcon = () => {
                      if (esCancelado) return <XCircle className="w-5 h-5 mr-2" />;
                      if (esEntregado) return <CheckCircle2 className="w-5 h-5 mr-2" />;
                      if (esProcesado) return <RefreshCw className="w-5 h-5 mr-2" />;
                      return <Loader2 className="w-5 h-5 mr-2 animate-spin" />;
                    };
                    
                    const getButtonText = () => {
                      if (esCancelado) return 'Cancelar Pedido';
                      if (esEntregado) return 'Marcar como Entregado';
                      return `Marcar como ${estado.charAt(0).toUpperCase() + estado.slice(1)}`;
                    };
                    
                    return (
                      <button
                        key={estado}
                        onClick={() => handleCambiarEstado(pedidoSeleccionado.id, estado)}
                        disabled={cambiandoEstado === pedidoSeleccionado.id}
                        className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 font-medium transition-colors ${getButtonStyles()} ${
                          cambiandoEstado === pedidoSeleccionado.id ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
                        }`}
                      >
                        {getButtonText()}
                      </button>
                    );
                  })}
                  
                  {proximosEstados[pedidoSeleccionado.estado]?.length === 0 && (
                    <p className="text-sm text-slate-500">No hay más acciones disponibles para este estado</p>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t flex gap-2 justify-end">
              <button
                onClick={() => setDetalleAbierto(false)}
                className="px-4 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 transition font-semibold"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PanelPedidos;
