// src/components/PanelEmpleado/PanelFactura.jsx
import React, { useState, useEffect, Component } from "react";
import { Download, Plus, RefreshCw, X, Eye, Trash2, AlertCircle } from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en el componente:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-medium">¡Algo salió mal!</h3>
          </div>
          <p className="mt-2 text-sm text-red-600">
            {this.state.error?.message || 'Ocurrió un error inesperado'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-3 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Recargar componente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
import {
  crearFactura,
  getFacturaPDF,
  getMedicamentosDisponibles,
  getFacturasDia,
  getClientes,
} from "../../../services/api";
import "../../../styles/empleadoDashboard.css";

const PanelFacturaContent = () => {
  const [facturas, setFacturas] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  const empleado = JSON.parse(localStorage.getItem("usuario"));
  const empleadoId = empleado?.id;

  const [formData, setFormData] = useState({
    cliente_id: "",
    empleado_id: empleadoId || "",
    detalles: [],
    metodo_pago: "efectivo",
    correo_enviado: false,
    direccion_entrega: "",
    observaciones: "",
    fecha_emision: new Date().toISOString().split('T')[0],
    total: 0
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarFacturas();
    cargarMedicamentos();
    cargarClientes();
  }, []);

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const res = await getFacturasDia();
      let facturasData = [];
      
      if (Array.isArray(res.data)) {
        facturasData = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        facturasData = res.data.results;
      } else if (res.data) {
        facturasData = [res.data];
      }
      
      const facturasFiltradas = facturasData.map(factura => ({
        ...factura,
        empleado: typeof factura.empleado === 'number' 
          ? { id: factura.empleado } 
          : factura.empleado
      }));
      
      setFacturas(facturasFiltradas);
    } catch (err) {
      console.error("Error al cargar facturas:", err);
    }
    setLoading(false);
  };

  const handleRefrescar = async () => {
    setRefrescando(true);
    await cargarFacturas();
    setRefrescando(false);
  };

  const cargarMedicamentos = async () => {
    try {
      const res = await getMedicamentosDisponibles();
      const data = res.data.results || res.data || [];
      setMedicamentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar medicamentos:", err);
    }
  };

  const cargarClientes = async () => {
    try {
      const { data } = await getClientes();
      let clientesData = [];
      
      if (Array.isArray(data)) {
        clientesData = data;
      } else if (data && Array.isArray(data.results)) {
        clientesData = data.results;
      } else if (data) {
        clientesData = [data];
      }
      
      const clientesFormateados = clientesData.map(cliente => {
        let nombreCompleto = '';
        
        if (cliente.nombre_completo) {
          nombreCompleto = cliente.nombre_completo;
        } else if (cliente.first_name || cliente.last_name) {
          nombreCompleto = [cliente.first_name, cliente.last_name].filter(Boolean).join(' ').trim();
        } else if (cliente.nombre || cliente.apellido) {
          nombreCompleto = [cliente.nombre, cliente.apellido].filter(Boolean).join(' ').trim();
        } else if (cliente.username) {
          nombreCompleto = cliente.username;
        } else {
          nombreCompleto = `Cliente ${cliente.id || ''}`.trim();
        }
        
        return {
          id: cliente.id || cliente.pk || cliente._id || Math.random().toString(36).substr(2, 9),
          nombre: nombreCompleto,
          email: cliente.email || 'Sin correo',
          telefono: cliente.telefono || cliente.phone || 'Sin teléfono',
          direccion: cliente.direccion || 'Sin dirección',
          documento: cliente.documento || cliente.dni || '',
          rawData: cliente
        };
      });
      
      setClientes(clientesFormateados);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
    }
  };

  const [isGenerandoPDF, setIsGenerandoPDF] = useState(false);
  const [mensajePDF, setMensajePDF] = useState('');

  const descargarPDF = async (id) => {
    try {
      console.log('Iniciando descarga de factura ID:', id);
      setIsGenerandoPDF(true);
      setMensajePDF('Generando factura, por favor espere...');
      
      if (!id) {
        throw new Error('ID de factura no proporcionado');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      console.log('Realizando petición a la API...');
      const response = await getFacturaPDF(id);
      
      if (!response || !response.data) {
        throw new Error('La respuesta de la API está vacía');
      }
      
      console.log('Tipo de respuesta recibida:', response.data.type || typeof response.data);
      
      // Crear el Blob con el tipo MIME correcto
      const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { type: 'application/pdf' });
      
      // Verificar si el blob es un PDF
      if (!blob.type.includes('pdf')) {
        const errorText = await blob.text();
        throw new Error(`Error en el servidor: ${errorText || 'Formato de archivo no soportado'}`);
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      console.log('Descarga de factura iniciada correctamente');
      
    } catch (err) {
      console.error('Error detallado al descargar PDF:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Mostrar mensaje de error más descriptivo
      let errorMessage = 'Error al descargar la factura. Por favor, inténtalo de nuevo.';
      
      if (err.response?.status === 404) {
        errorMessage = 'No se encontró la factura solicitada. Verifica que el ID sea correcto.';
      } else if (err.response?.status === 403) {
        errorMessage = 'No tienes permiso para acceder a esta factura.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Debes iniciar sesión para descargar facturas.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Mostrar el mensaje de error en el overlay
      setMensajePDF(errorMessage);
      
      // Ocultar el overlay después de 3 segundos
      setTimeout(() => {
        setIsGenerandoPDF(false);
        setMensajePDF('');
      }, 3000);
      
      return;
    } finally {
      // Siempre asegurarse de limpiar el estado de carga
      setTimeout(() => {
        setIsGenerandoPDF(false);
        setMensajePDF('');
      }, 1000);
    }
  };

  const getPrecioVenta = (m) => {
    if (!m) return 0;
    const precio = Number(m.precio_venta || m.precio || m.precioUnitario || 0);
    return isNaN(precio) ? 0 : precio;
  };

  const calcularTotal = () => {
    try {
      return formData.detalles.reduce((total, detalle) => {
        const cantidad = Math.max(1, Number(detalle.cantidad) || 0);
        const medicamento = medicamentos.find(m => m.id === detalle.medicamento_id);
        const precio = medicamento ? getPrecioVenta(medicamento) : 0;
        return total + (precio * cantidad);
      }, 0);
    } catch (error) {
      console.error('Error al calcular el total:', error);
      return 0;
    }
  };

  const agregarDetalle = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { medicamento_id: "", cantidad: 1 }]
    });
  };

  const actualizarDetalle = (index, campo, valor) => {
    const nuevosDetalles = [...formData.detalles];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
    setFormData({ ...formData, detalles: nuevosDetalles });
  };

  const eliminarDetalle = (index) => {
    const nuevosDetalles = formData.detalles.filter((_, i) => i !== index);
    setFormData({ ...formData, detalles: nuevosDetalles });
  };

  const handleCrearFactura = async () => {
    try {
      setCrearLoading(true);
      
      if (!formData.cliente_id) {
        throw new Error('Debe seleccionar un cliente');
      }
      
      if (formData.detalles.length === 0) {
        throw new Error('Debe agregar al menos un medicamento');
      }
      
      const total = calcularTotal();
      const detallesConPrecios = formData.detalles.map(detalle => {
        const medicamento = medicamentos.find(m => m.id === detalle.medicamento_id);
        const precioUnitario = getPrecioVenta(medicamento) || 0;
        const cantidad = parseInt(detalle.cantidad) || 1;
        const subtotal = precioUnitario * cantidad;
        
        return {
          medicamento: detalle.medicamento_id,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          subtotal: subtotal
        };
      });
      
      const datosEnvio = {
        cliente: formData.cliente_id,
        empleado: formData.empleado_id || empleadoId,
        metodo_pago: formData.metodo_pago,
        correo_enviado: formData.correo_enviado,
        direccion_entrega: formData.direccion_entrega,
        observaciones: formData.observaciones,
        fecha_emision: formData.fecha_emision,
        total: total,
        detalles: detallesConPrecios
      };
      
      await crearFactura(datosEnvio);
      alert('Factura creada correctamente');
      
      setModalCrearAbierto(false);
      setFormData({
        cliente_id: "",
        empleado_id: empleadoId || "",
        detalles: [],
        metodo_pago: "efectivo",
        correo_enviado: false,
        direccion_entrega: "",
        observaciones: "",
        fecha_emision: new Date().toISOString().split('T')[0],
        total: 0
      });
      
      await cargarFacturas();
      
    } catch (error) {
      console.error('Error al crear la factura:', error);
      alert(error.message || 'Error al crear la factura');
    } finally {
      setCrearLoading(false);
    }
  };

  const verDetalleFactura = async (factura) => {
    try {
      console.log('Datos de la factura recibidos:', factura);
      console.log('Lista de medicamentos disponibles:', medicamentos);
      
      // Asegurarse de que los detalles tengan la información del medicamento
      const facturaConDetalles = {
        ...factura,
        detalles: factura.detalles?.map(detalle => {
          console.log('Detalle actual:', detalle);
          
          // Buscar el medicamento en la lista de medicamentos
          const medicamentoEncontrado = medicamentos.find(m => m.id === detalle.medicamento_id);
          console.log('Medicamento encontrado para ID', detalle.medicamento_id, ':', medicamentoEncontrado);
          
          const detalleActualizado = {
            ...detalle,
            // Si el medicamento es un string, usarlo directamente
            // Si es un objeto, asegurarse de que tenga la estructura correcta
            medicamento: typeof detalle.medicamento === 'string' 
              ? { 
                  id: detalle.medicamento_id,
                  nombre: detalle.medicamento,
                  precio_venta: detalle.precio_unitario
                }
              : (detalle.medicamento || medicamentoEncontrado || { 
                  id: detalle.medicamento_id,
                  nombre: detalle.nombre_medicamento || detalle.medicamento_nombre || 'Medicamento no encontrado',
                  precio_venta: detalle.precio_unitario
                }),
            // Asegurarse de que el nombre del medicamento esté disponible en el nivel superior
            nombre_medicamento: typeof detalle.medicamento === 'string' 
              ? detalle.medicamento 
              : (detalle.nombre_medicamento || 
                 detalle.medicamento?.nombre || 
                 medicamentoEncontrado?.nombre ||
                 'Medicamento no encontrado')
          };
          
          console.log('Detalle procesado:', detalleActualizado);
          return detalleActualizado;
        }) || []
      };
      
      console.log('Factura con detalles procesada:', facturaConDetalles);
      setFacturaSeleccionada(facturaConDetalles);
    } catch (error) {
      console.error('Error al cargar los detalles de la factura:', error);
      alert('No se pudieron cargar los detalles de la factura');
    }
  };

  const eliminarFactura = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta factura?')) {
      return;
    }
    
    try {
      // Aquí iría la llamada a la API para eliminar la factura
      // await eliminarFacturaAPI(id);
      alert('Función de eliminación deshabilitada por seguridad');
      // await cargarFacturas();
    } catch (error) {
      console.error('Error al eliminar la factura:', error);
      alert('Error al eliminar la factura');
    }
  };

  const renderFacturasTable = () => {
    if (loading) {
      return <div className="text-center py-4">Cargando facturas...</div>;
    }

    if (!Array.isArray(facturas) || facturas.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay facturas registradas</p>
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Crear primera factura
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Cliente</th>
              <th className="py-2 px-4 text-right">Total</th>
              <th className="py-2 px-4 text-center">Fecha</th>
              <th className="py-2 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((factura) => {
              const fecha = new Date(factura.fecha_emision || factura.created_at);
              const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              
              return (
                <tr key={factura.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{factura.id || 'N/A'}</td>
                  <td className="py-2 px-4">{factura.cliente?.nombre || factura.cliente_nombre || 'Cliente no disponible'}</td>
                  <td className="py-2 px-4 text-right">${Number(factura.total || 0).toFixed(2)}</td>
                  <td className="py-2 px-4 text-center">{fechaFormateada}</td>
                  <td className="py-2 px-4 text-center space-x-2">
                    <button
                      onClick={() => verDetalleFactura(factura)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => descargarPDF(factura.id || factura.pk)}
                      className="text-green-600 hover:text-green-800"
                      title="Descargar PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => eliminarFactura(factura.id || factura.pk)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Loading Overlay */}
      {isGenerandoPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg font-medium text-gray-800">Generando factura</p>
              <p className="text-gray-600 mt-2 text-center">{mensajePDF}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Facturas</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefrescar}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Actualizar"
            disabled={refrescando}
          >
            <RefreshCw className={`w-5 h-5 ${refrescando ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={16} /> Nueva Factura
          </button>
        </div>
      </div>

      {renderFacturasTable()}

      {/* Modal para crear factura */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Nueva Factura</h2>
                <button
                  onClick={() => setModalCrearAbierto(false)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={crearLoading}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  {clientes.length === 0 ? (
                    <div className="text-red-500 text-sm">No hay clientes disponibles</div>
                  ) : (
                    <select
                      value={formData.cliente_id}
                      onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                      className="w-full border p-2 rounded"
                      disabled={crearLoading}
                      required
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre} {cliente.documento ? `(${cliente.documento})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Empleado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empleado
                  </label>
                  <select
                    value={formData.empleado_id}
                    onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
                    className="w-full border p-2 rounded"
                    disabled={crearLoading}
                  >
                    <option value="">Seleccione un empleado</option>
                    {clientes
                      .filter(c => 
                        c.rawData?.rol === 'empleado' || 
                        c.rawData?.rol === 'vendedor' || 
                        c.rawData?.rol === 'admin'
                      )
                      .map((empleado) => (
                        <option key={empleado.id} value={empleado.id}>
                          {empleado.nombre} ({empleado.rawData?.rol || 'empleado'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de pago <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['efectivo', 'tarjeta', 'transferencia'].map((metodo) => (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => setFormData({ ...formData, metodo_pago: metodo })}
                        className={`p-2 border rounded text-sm ${
                          formData.metodo_pago === metodo
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        disabled={crearLoading}
                      >
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Correo enviado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo enviado
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        checked={formData.correo_enviado === true}
                        onChange={() => setFormData({ ...formData, correo_enviado: true })}
                        disabled={crearLoading}
                      />
                      <span className="ml-2">Sí</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        checked={formData.correo_enviado === false}
                        onChange={() => setFormData({ ...formData, correo_enviado: false })}
                        disabled={crearLoading}
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>

                {/* Dirección de entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de entrega
                  </label>
                  <input
                    type="text"
                    value={formData.direccion_entrega}
                    onChange={(e) => setFormData({ ...formData, direccion_entrega: e.target.value })}
                    className="w-full border p-2 rounded"
                    placeholder="Dirección de entrega"
                    disabled={crearLoading}
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full border p-2 rounded"
                    rows="2"
                    placeholder="Observaciones adicionales"
                    disabled={crearLoading}
                  />
                </div>

                {/* Fecha de emisión */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de emisión
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_emision}
                    onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                    className="border p-2 rounded"
                    disabled={crearLoading}
                  />
                </div>

                {/* Detalles de la factura */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Detalles de la factura
                    </label>
                    <button
                      type="button"
                      onClick={agregarDetalle}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      disabled={crearLoading}
                    >
                      <Plus size={16} /> Agregar detalle
                    </button>
                  </div>

                  {formData.detalles.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay detalles agregados
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.detalles.map((detalle, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <select
                            value={detalle.medicamento_id}
                            onChange={(e) => actualizarDetalle(index, 'medicamento_id', e.target.value)}
                            className="flex-1 border p-2 rounded"
                            disabled={crearLoading}
                          >
                            <option value="">Seleccione un medicamento</option>
                            {medicamentos.map((med) => (
                              <option key={med.id} value={med.id}>
                                {med.nombre} (${Number(getPrecioVenta(med)).toFixed(2)})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={detalle.cantidad || ''}
                            onChange={(e) => actualizarDetalle(index, 'cantidad', parseInt(e.target.value) || 1)}
                            className="w-20 border p-2 rounded"
                            placeholder="Cant."
                            disabled={crearLoading}
                          />
                          <button
                            type="button"
                            onClick={() => eliminarDetalle(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                            disabled={crearLoading}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold">${Number(calcularTotal()).toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalCrearAbierto(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                    disabled={crearLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCrearFactura}
                    className={`px-4 py-2 rounded text-white ${
                      crearLoading || formData.detalles.length === 0 || !formData.cliente_id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={crearLoading || formData.detalles.length === 0 || !formData.cliente_id}
                  >
                    {crearLoading ? 'Creando...' : 'Crear Factura'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de factura */}
      {facturaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Detalles de Factura #{facturaSeleccionada.id}</h2>
                <button
                  onClick={() => setFacturaSeleccionada(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium text-lg">
                      {facturaSeleccionada.cliente_nombre || 
                       facturaSeleccionada.cliente?.nombre || 
                       facturaSeleccionada.cliente?.username || 
                       'Cliente no especificado'}
                    </p>
                    {facturaSeleccionada.cliente_identificacion && (
                      <p className="text-sm text-gray-600">
                        ID: {facturaSeleccionada.cliente_identificacion}
                      </p>
                    )}
                    {facturaSeleccionada.cliente?.email && (
                      <p className="text-sm text-gray-500">{facturaSeleccionada.cliente.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Atendido por</p>
                    <p className="font-medium">
                      {empleado?.nombre_completo || 
                       empleado?.username || 
                       facturaSeleccionada.empleado_nombre ||
                       facturaSeleccionada.empleado?.nombre ||
                       'Empleado no especificado'}
                    </p>
                    {empleado?.email && (
                      <p className="text-sm text-gray-500">{empleado.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de emisión</p>
                    <p>{new Date(facturaSeleccionada.fecha_emision).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">
                      {new Date(facturaSeleccionada.fecha_emision || facturaSeleccionada.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Método de pago</p>
                    <p className="font-medium capitalize">{facturaSeleccionada.metodo_pago || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Correo enviado</p>
                    <p className="font-medium">
                      {facturaSeleccionada.correo_enviado ? 'Sí' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold">${Number(facturaSeleccionada.total || 0).toFixed(2)}</p>
                  </div>
                </div>
                
                {facturaSeleccionada.observaciones && (
                  <div>
                    <p className="text-sm text-gray-500">Observaciones</p>
                    <p className="mt-1">{facturaSeleccionada.observaciones}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium mb-2">Detalles</h3>
                  <div className="border rounded">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicamento</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {facturaSeleccionada.detalles?.map((detalle, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              {detalle.medicamento?.nombre || 
                               detalle.nombre_medicamento || 
                               detalle.medicamento_nombre ||
                               (detalle.medicamento_id && medicamentos.find(m => m.id === detalle.medicamento_id)?.nombre) ||
                               'Medicamento'}
                            </td>
                            <td className="px-4 py-2 text-right">{detalle.cantidad}</td>
                            <td className="px-4 py-2 text-right">${Number(detalle.precio_unitario || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">${Number(detalle.subtotal || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-4 py-2 text-right font-medium">Total:</td>
                          <td className="px-4 py-2 text-right font-bold">
                            ${Number(facturaSeleccionada.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => descargarPDF(facturaSeleccionada.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download size={16} /> Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap the main component with ErrorBoundary
const PanelFactura = () => (
  <ErrorBoundary>
    <PanelFacturaContent />
  </ErrorBoundary>
);

export default PanelFactura;
