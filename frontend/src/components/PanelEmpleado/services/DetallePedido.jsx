import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, AlertCircle, CheckCircle, Clock, XCircle, 
  Package, CreditCard, MapPin, User, Mail, Phone, Calendar, FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getPedidoById, actualizarEstadoPedido } from '../../../services/pedidosService';

const formatPrice = (price) => {
  try {
    const number = Number(price);
    if (isNaN(number)) return '$0,00';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(number);
  } catch (error) {
    console.error('Error al formatear el precio:', error);
    return '$0,00';
  }
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('es-AR', options);
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return 'Fecha inválida';
  }
};

const EstadoBadge = ({ estado }) => {
  const getBadgeStyles = () => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'procesado':
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'entregado':
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoText = (estado) => {
    const estados = {
      'pendiente': 'Pendiente',
      'procesado': 'En proceso',
      'en_proceso': 'En proceso',
      'entregado': 'Entregado',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getBadgeStyles()}`}>
      {getEstadoText(estado)}
    </span>
  );
};

const DetallePedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        setLoading(true);
        const data = await getPedidoById(id);
        setPedido(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar el pedido:', err);
        setError('No se pudo cargar el pedido. Por favor, inténtalo de nuevo.');
        toast.error('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [id]);

  const handleStatusChange = async (nuevoEstado) => {
    if (!pedido || !pedido.id || pedido.estado === nuevoEstado) return;
    
    try {
      setUpdatingStatus(true);
      await actualizarEstadoPedido(pedido.id, nuevoEstado);
      
      // Actualizar el estado local de manera segura
      setPedido(prev => {
        const historialActual = Array.isArray(prev.historial_estados) ? prev.historial_estados : [];
        
        return {
          ...prev,
          estado: nuevoEstado,
          historial_estados: [
            ...historialActual,
            {
              estado_anterior: prev.estado || 'desconocido',
              estado_nuevo: nuevoEstado,
              fecha: new Date().toISOString(),
              usuario: 'Tú',
              // Asegurar que todos los campos requeridos por el historial estén presentes
              fecha_formateada: new Date().toLocaleString('es-AR'),
              comentario: ''
            }
          ]
        };
      });
      
      toast.success(`Estado actualizado a: ${nuevoEstado}`);
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const calcularTotal = () => {
    if (!pedido || !pedido.detalles) return 0;
    return pedido.detalles.reduce((total, item) => {
      return total + (item.precio_unitario * item.cantidad);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar el pedido</h2>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar la información del pedido.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver a la lista de pedidos
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedido #{pedido.id}</h1>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-500 mr-2">Realizado el {formatDate(pedido.fecha_creacion)}</span>
                <EstadoBadge estado={pedido.estado} />
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total del pedido</p>
                <p className="text-2xl font-bold">{formatPrice(calcularTotal())}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalles del pedido */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  <Package className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Productos
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <div className="divide-y divide-gray-200">
                {pedido.detalles?.map((item, index) => {
                     // Add safe access to all properties with fallbacks
                     const productoNombre = item?.producto_nombre || 'Producto sin nombre';
                     const cantidad = item?.cantidad || 0;
                     const precioUnitario = parseFloat(item?.precio_unitario) || 0;
                     const subtotal = cantidad * precioUnitario;                   

                     return (
                       <div key={index} className="py-4 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                         <div className="col-span-3">
                           <p className="font-medium text-gray-900">
                             {productoNombre}
                           </p>
                           <p className="text-sm text-gray-500">Cantidad: {cantidad}</p>
                         </div>
                         <div className="col-span-2 text-right">
                           <p className="font-medium">{formatPrice(precioUnitario)} c/u</p>
                           <p className="text-sm text-gray-500">
                             Subtotal: {formatPrice(subtotal)}
                           </p>
                         </div>
                       </div>
                     );
                   })}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Total</span>
                    <span>{formatPrice(calcularTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de estados */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  <Clock className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Historial de estados
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {pedido.historial_estados?.map((historial, index, array) => {
                      // Usar el estado_nuevo para determinar el ícono y el estado actual
                      const estadoActual = historial.estado_nuevo || historial.estado;
                      const esUltimo = index === array.length - 1;
                      
                      return (
                        <li key={index}>
                          <div className="relative pb-8">
                            {!esUltimo && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  {estadoActual === 'cancelado' ? (
                                    <XCircle className="h-5 w-5 text-white" />
                                  ) : estadoActual === 'entregado' || estadoActual === 'completado' ? (
                                    <CheckCircle className="h-5 w-5 text-white" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-white" />
                                  )}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">{historial.usuario || 'Sistema'}</span>
                                    {historial.estado_anterior ? (
                                      <>
                                        {' '}cambió el estado de{' '}
                                        <span className="font-medium">
                                          <EstadoBadge estado={historial.estado_anterior} />
                                        </span>
                                        {' '}a{' '}
                                      </>
                                    ) : ' '}
                                    <span className="font-medium">
                                      <EstadoBadge estado={estadoActual} />
                                    </span>
                                    {historial.comentario && (
                                      <span className="block mt-1 text-xs text-gray-400">
                                        Comentario: {historial.comentario}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  <time dateTime={historial.fecha}>
                                    {historial.fecha_formateada || formatDate(historial.fecha)}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Información del cliente y envío */}
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  <User className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Información del cliente
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {pedido.cliente_nombre || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {pedido.cliente_email || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Teléfono</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {pedido.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  <MapPin className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Dirección de envío
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {pedido.direccion_entrega ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900">{pedido.direccion_entrega.calle} {pedido.direccion_entrega.numero}</p>
                    {pedido.direccion_entrega.piso && (
                      <p className="text-sm text-gray-900">Piso: {pedido.direccion_entrega.piso}</p>
                    )}
                    {pedido.direccion_entrega.departamento && (
                      <p className="text-sm text-gray-900">Depto: {pedido.direccion_entrega.departamento}</p>
                    )}
                    <p className="text-sm text-gray-900">
                      {pedido.direccion_entrega.localidad}, {pedido.direccion_entrega.provincia}
                    </p>
                    <p className="text-sm text-gray-900">{pedido.direccion_entrega.codigo_postal}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No se proporcionó dirección de envío</p>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  <FileText className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Acciones
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                      Cambiar estado
                    </label>
                    <select
                      id="estado"
                      value={pedido.estado}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingStatus}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Imprimir comprobante
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePedido;
