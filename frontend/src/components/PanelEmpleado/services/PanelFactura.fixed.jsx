// src/components/PanelEmpleado/PanelFactura.jsx
import React, { useState, useEffect } from "react";
import { Download, Plus, RefreshCw, X, Eye, Trash2 } from "lucide-react";
import {
  crearFactura,
  getFacturaPDF,
  getMedicamentosDisponibles,
  getFacturasDia,
  getClientes,
} from "../../../services/api";
import "../../../styles/empleadoDashboard.css";

const PanelFactura = () => {
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

  const descargarPDF = async (id) => {
    try {
      const response = await getFacturaPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('Error al descargar la factura');
    }
  };

  const getPrecioVenta = (m) => {
    if (!m) return 0;
    return Number(m.precio_venta) || Number(m.precio) || Number(m.precioUnitario) || 0;
  };

  const calcularTotal = () => {
    return formData.detalles.reduce((total, detalle) => {
      const medicamento = medicamentos.find(m => m.id === detalle.medicamento_id);
      const precio = medicamento ? getPrecioVenta(medicamento) : 0;
      return total + (precio * (detalle.cantidad || 0));
    }, 0);
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

  const verDetalleFactura = (factura) => {
    setFacturaSeleccionada(factura);
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
                  <td className="py-2 px-4 text-right">${factura.total?.toFixed(2) || '0.00'}</td>
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
                                {med.nombre} (${getPrecioVenta(med).toFixed(2)})
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
                    <span className="text-xl font-bold">${calcularTotal().toFixed(2)}</span>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{facturaSeleccionada.cliente?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Empleado</p>
                    <p className="font-medium">{facturaSeleccionada.empleado?.nombre || 'N/A'}</p>
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
                    <p className="text-lg font-bold">${facturaSeleccionada.total?.toFixed(2) || '0.00'}</p>
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
                            <td className="px-4 py-2">{detalle.medicamento?.nombre || 'Medicamento'}</td>
                            <td className="px-4 py-2 text-right">{detalle.cantidad}</td>
                            <td className="px-4 py-2 text-right">${detalle.precio_unitario?.toFixed(2) || '0.00'}</td>
                            <td className="px-4 py-2 text-right">${detalle.subtotal?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-4 py-2 text-right font-medium">Total:</td>
                          <td className="px-4 py-2 text-right font-bold">
                            ${facturaSeleccionada.total?.toFixed(2) || '0.00'}
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

export default PanelFactura;
