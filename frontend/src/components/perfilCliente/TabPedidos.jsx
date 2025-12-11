import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { AlertCircle, CheckCircle, Truck, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import facturaService from '../../services/facturaServices';
import { obtenerPedidosUsuario, cambiarEstadoPedido as actualizarEstadoPedido } from '../../services/pedidosService';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';

// Estilos para el modal
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '12px',
    padding: '0',
    border: 'none',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  }
};

export default function TabPedidos({ pedidos = [], loadingPedidos = true, currencyFormatter = (v) => v }) {
  const [pedidosLocales, setPedidosLocales] = useState(pedidos);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  // Sincronizar con los pedidos recibidos por props
  useEffect(() => {
    setPedidosLocales(pedidos);
  }, [pedidos]);

  const openModal = (pedido) => {
    setSelectedPedido(pedido);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPedido(null);
  };

  const handleCancelPedido = async (pedido) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      return;
    }

    try {
      setIsCanceling(true);
      console.log('Iniciando cancelación del pedido:', pedido.id);
      
      // Verificar si el pedido ya está cancelado
      if (pedido.estado?.toLowerCase() === 'cancelado') {
        toast.warning('Este pedido ya ha sido cancelado anteriormente');
        return;
      }

      // Intentar cancelar el pedido
      await actualizarEstadoPedido(pedido.id, 'cancelado');
      
      // Actualizar el estado local
      setPedidosLocales(pedidosLocales.map(p => 
        p.id === pedido.id ? { ...p, estado: 'cancelado' } : p
      ));
      
      toast.success('✅ Pedido cancelado correctamente');
      closeModal();
      
    } catch (error) {
      console.error('Error al cancelar el pedido:', error);
      
      // Mensajes de error más descriptivos
      if (error.message.includes('404')) {
        toast.error('No se pudo encontrar el pedido. Por favor, intente recargar la página.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        toast.error('No tiene permiso para realizar esta acción. Por favor, inicie sesión nuevamente.');
      } else {
        toast.error(error.message || 'Ocurrió un error al intentar cancelar el pedido');
      }
    } finally {
      setIsCanceling(false);
    }
  };
  const handleViewFactura = async (pedido) => {
    try {
      // Si el pedido ya tiene un ID de factura, lo usamos directamente
      if (pedido.factura_id) {
        const pdfBlob = await facturaService.descargarFacturaPDF(pedido.factura_id);
        const url = window.URL.createObjectURL(pdfBlob);
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `factura_${pedido.factura_id}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        return;
      }
      
      // Si no tiene factura_id, buscamos por el ID del pedido
      const facturas = await facturaService.buscarFacturaPorPedido(pedido.id);
      
      if (facturas && facturas.length > 0) {
        const factura = facturas[0];
        
        // Actualizar el pedido con el ID de la factura para futuras referencias
        if (!pedido.factura_id) {
          pedido.factura_id = factura.id;
        }
        
        // Descargar la factura
        const pdfBlob = await facturaService.descargarFacturaPDF(factura.id);
        const url = window.URL.createObjectURL(pdfBlob);
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `factura_${factura.id}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast.warning('No se encontró la factura para este pedido');
      }
      
    } catch (error) {
      console.error('Error al obtener la factura:', error);
      toast.error(error.message || 'Error al obtener la factura');
    }
  };
  console.log('📦 TabPedidos recibió:', { pedidos: pedidosLocales, loading: loadingPedidos, cantidad: pedidosLocales?.length });

  if (loadingPedidos) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Función para obtener el color según el estado del pedido
  const getStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return 'bg-red-600 text-white border-red-700';
      case 'procesado':
      case 'en_proceso':
      case 'en proceso':
        return 'bg-blue-600 text-white border-blue-700';
      case 'entregado':
      case 'completado':
        return 'bg-green-600 text-white border-green-700';
      case 'cancelado':
        return 'bg-gray-600 text-white border-gray-700';
      default:
        return 'bg-gray-600 text-white border-gray-700';
    }
  };

  // Obtener icono según estado
  const getStatusIcon = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return <AlertCircle size={20} />;
      case 'procesado':
      case 'en_proceso':
      case 'en proceso':
        return <Truck size={20} />;
      case 'entregado':
      case 'completado':
        return <CheckCircle size={20} />;
      case 'cancelado':
        return <XCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  // Función para obtener el fondo según el estado del pedido
  const getPedidoBackground = (estado) => {
    if (estado?.toLowerCase() === 'pendiente') {
      return 'bg-red-50 border-red-300 ring-2 ring-red-200';
    }
    return 'bg-white border-gray-200';
  };

  return (
    <>
      {/* Modal de detalles del pedido */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Detalles del Pedido"
        ariaHideApp={false}
      >
        {selectedPedido && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalles del Pedido #{selectedPedido.id}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Cerrar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Información general del pedido */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Información del Pedido</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600">N° Pedido: </span>
                      <span className="font-medium">#{selectedPedido.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fecha: </span>
                      <span>{selectedPedido.fecha_creacion ? new Date(selectedPedido.fecha_creacion).toLocaleString('es-CO') : 'No disponible'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Estado: </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedPedido.estado)}`}>
                        {selectedPedido.estado?.charAt(0).toUpperCase() + selectedPedido.estado?.slice(1) || 'Procesando'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600">Subtotal: </span>
                      <span>{currencyFormatter(Number(selectedPedido.subtotal) || 0)}</span>
                    </div>
                    {selectedPedido.descuento > 0 && (
                      <div>
                        <span className="text-gray-600">Descuento: </span>
                        <span className="text-red-600">-{currencyFormatter(Number(selectedPedido.descuento) || 0)}</span>
                      </div>
                    )}
                    <div className="font-medium">
                      <span className="text-gray-700">Total: </span>
                      <span className="text-lg text-blue-700">{currencyFormatter(Number(selectedPedido.total) || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Método de pago: </span>
                      <span>
                        {selectedPedido.metodo_pago === 'efectivo' ? 'Efectivo' : 
                         selectedPedido.metodo_pago === 'tarjeta' ? 'Tarjeta de crédito/débito' : 
                         selectedPedido.metodo_pago === 'transferencia' ? 'Transferencia bancaria' : 
                         selectedPedido.metodo_pago || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <h3 className="font-medium text-gray-900 p-4 border-b">Productos</h3>
                {selectedPedido.detalles && selectedPedido.detalles.length > 0 ? (
                  <div className="divide-y">
                    {selectedPedido.detalles.map((detalle, index) => (
                      <div key={index} className="p-4 flex items-start">
                        <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md overflow-hidden">
                          {detalle.medicamento?.imagen ? (
                            <img
                              src={detalle.medicamento.imagen}
                              alt={detalle.medicamento.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {detalle.medicamento?.nombre || 'Medicamento sin nombre'}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">Cantidad: {detalle.cantidad || 1}</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {currencyFormatter(Number(detalle.precio_unitario) || 0)} c/u
                          </p>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {currencyFormatter(Number(detalle.subtotal) || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron detalles en este pedido
                  </div>
                )}
              </div>

              {/* Información de contacto y entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPedido.direccion_entrega && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Dirección de Entrega</h3>
                    <p className="text-gray-600 whitespace-pre-line">{selectedPedido.direccion_entrega}</p>
                  </div>
                )}
                {selectedPedido.telefono_contacto && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Contacto</h3>
                    <p className="text-gray-600">
                      <span className="block">Teléfono: {selectedPedido.telefono_contacto}</span>
                      {selectedPedido.cliente?.email && (
                        <span className="block mt-1">Email: {selectedPedido.cliente.email}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Notas del pedido */}
              {selectedPedido.notas && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Notas Adicionales</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedPedido.notas}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleViewFactura(selectedPedido)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ver Factura
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="mt-6 space-y-4">
      {loadingPedidos ? (
        <div className="p-6 text-center text-gray-500">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-2">Cargando tus pedidos...</p>
        </div>
      ) : !pedidosLocales || pedidosLocales.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm">
          <p className="text-lg font-medium">No hay pedidos registrados</p>
          <p className="text-sm mt-2">Los pedidos que hagas desde el carrito aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosLocales.map((pedido) => (
            <div key={pedido.id} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">Pedido #{pedido.id}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-blue-700">
                        {currencyFormatter(Number(pedido.total) || 0)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pedido.estado === 'completado' ? 'bg-green-100 text-green-800' :
                        pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        pedido.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pedido.estado || 'Procesando'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Fecha:</span> {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleString('es-CO') : 'Sin fecha'}
                    </p>
                    {pedido.cantidad_medicamentos && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Medicamentos:</span> {pedido.cantidad_medicamentos} {pedido.cantidad_medicamentos === 1 ? 'medicamento' : 'medicamentos'}
                      </p>
                    )}
                  </div>

                  {pedido.direccion_entrega && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Dirección de entrega:</p>
                      <p className="text-sm text-gray-600">{pedido.direccion_entrega}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => openModal(pedido)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver detalles
                  </button>

                    {pedido.estado?.toLowerCase() === 'entregado' && (
                      <button
                        onClick={() => handleViewFactura(pedido)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" />
                        </svg>
                        📄 Descargar Factura
                      </button>
                    )}

                    <button
                      onClick={() => pedido.estado?.toLowerCase() !== 'cancelado' ? handleCancelPedido(pedido) : null}
                    disabled={isCanceling}
                    className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto ${
                      pedido.estado?.toLowerCase() === 'cancelado'
                        ? 'bg-green-100 border border-green-500 text-green-700 cursor-default'
                        : 'bg-white border border-red-500 text-red-500 hover:bg-red-50'
                    }`}
                  >
                    {isCanceling ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelando...
                      </>
                    ) : (
                      <>
                        {pedido.estado?.toLowerCase() === 'cancelado' ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Cancelado
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar pedido
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
