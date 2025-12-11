import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import facturaService from '../../services/facturaServices';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';
import { Download, FileText, X, Loader2 } from 'lucide-react';

// Estilos para el modal de PDF
const pdfModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90%',
    width: '900px',
    maxHeight: '90vh',
    padding: '0',
    border: 'none',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  }
};

// Estilos para el modal de detalles de factura
const modalStyles = {
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
    padding: '2rem',
    borderRadius: '0.5rem',
    border: 'none',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    backdropFilter: 'blur(3px)'
  }
};

const TabFacturas = ({ currencyFormatter = (v) => v }) => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFactura, setCurrentFactura] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const openModal = (factura) => {
    if (!factura) {
      console.error('No se proporcionó una factura para mostrar');
      return;
    }
    setSelectedFactura(factura);
    setCurrentFactura(factura);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFactura(null);
    setCurrentFactura(null);
    setShowPdfPreview(false);
    if (pdfUrl) {
      try {
        window.URL.revokeObjectURL(pdfUrl);
      } catch (e) {
        console.error('Error al liberar recursos del PDF:', e);
      }
      setPdfUrl('');
    }
  };

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const data = await facturaService.getFacturas();
        const facturasData = Array.isArray(data) ? data : (data?.results || []);
        setFacturas(facturasData);
      } catch (error) {
        console.error('Error al cargar facturas:', error);
        toast.error(error.message || 'Error al cargar las facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchFacturas();
  }, []);

  const handleDownloadFactura = async (factura, event) => {
    if (!factura) {
      console.error('No se proporcionó una factura para descargar');
      toast.error('No se pudo descargar la factura. Por favor, intente nuevamente.');
      return;
    }
    
    event?.stopPropagation();
    setIsPdfLoading(true);
    
    try {
      const pdfBlob = await facturaService.descargarFacturaPDF(factura.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${factura.numero || factura.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Factura descargada correctamente');
    } catch (error) {
      console.error('Error al descargar la factura:', error);
      toast.error('No se pudo descargar la factura. Por favor, intente nuevamente.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handlePreviewPdf = async (factura, event) => {
    if (!factura) {
      console.error('No se proporcionó una factura para previsualizar');
      toast.error('No se pudo cargar la factura. Por favor, intente nuevamente.');
      return;
    }
    
    event?.stopPropagation();
    setCurrentFactura(factura);
    setSelectedFactura(factura);
    setIsPdfLoading(true);
    setShowPdfPreview(true);
    setIsModalOpen(true);
    
    try {
      const pdfBlob = await facturaService.obtenerFacturaPDF(factura.id);
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.warn('No se pudo cargar la vista previa del PDF:', error);
      toast.warning('La vista previa del PDF no está disponible. Mostrando detalles de la factura.');
      setShowPdfPreview(false);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleViewFactura = async (factura, event) => {
    if (!factura) {
      console.error('No se proporcionó una factura para visualizar');
      toast.error('No se pudo cargar la factura. Por favor, intente nuevamente.');
      return;
    }
    
    event?.stopPropagation();
    setCurrentFactura(factura);
    setSelectedFactura(factura);
    setIsPdfLoading(true);
    
    try {
      const pdfBlob = await facturaService.obtenerFacturaPDF(factura.id);
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfPreview(true);
      setIsModalOpen(true);
    } catch (pdfError) {
      console.warn('No se pudo cargar el PDF, mostrando detalles en su lugar:', pdfError);
      if (pdfError.message && pdfError.message.includes('no está disponible')) {
        toast.warning(pdfError.message);
      } else {
        toast.warning('El PDF no está disponible. Mostrando detalles en su lugar.');
      }
      setShowPdfPreview(false);
      openModal(factura);
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Cargando facturas...</p>
      </div>
    );
  }

  const getStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pagada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'anulada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };

  const renderModalContent = () => {
    if (showPdfPreview) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Vista previa de la factura</h2>
            <button 
              onClick={() => setShowPdfPreview(false)} 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {isPdfLoading || !pdfUrl ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando factura...</p>
                </div>
              </div>
            ) : (
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-0" 
                title="Vista previa de factura" 
              />
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-8">
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Factura #{selectedFactura?.id || 'N/A'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedFactura?.cliente_nombre || 'Cliente no especificado'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFactura?.estado || 'PENDIENTE')}`}>
                {selectedFactura?.estado || 'PENDIENTE'}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Fecha: {formatDate(selectedFactura?.fecha_emision || selectedFactura?.fecha_creacion) || 'No especificada'}
              </div>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Resto del contenido del modal */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Medicamentos</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicamento</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedFactura?.detalles?.length > 0 ? (
                  selectedFactura.detalles.map((detalle, index) => {
                    const cantidad = detalle.cantidad || 0;
                    const precioUnitario = detalle.precio_unitario || 0;
                    const subtotal = cantidad * precioUnitario;
                    const nombreMedicamento = detalle.nombre_medicamento || detalle.medicamento?.nombre || 'Medicamento';
                    const descripcion = detalle.descripcion || detalle.medicamento?.descripcion || '';
                    const imagen = detalle.imagen || detalle.medicamento?.imagen;

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {imagen && (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img 
                                  className="h-10 w-10 rounded-md object-cover" 
                                  src={imagen} 
                                  alt={nombreMedicamento} 
                                />
                              </div>
                            )}
                            <div className={imagen ? "ml-4" : ""}>
                              <div className="text-sm font-medium text-gray-900">
                                {nombreMedicamento}
                              </div>
                              {descripcion && (
                                <div className="text-sm text-gray-500">{descripcion}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {currencyFormatter(precioUnitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {currencyFormatter(subtotal)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay medicamentos en esta factura
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Información de la Factura</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Número de factura:</span>
                <span className="font-medium">{selectedFactura?.id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de emisión:</span>
                <span>{formatDate(selectedFactura?.fecha_emision || selectedFactura?.fecha_creacion) || 'No especificada'}</span>
              </div>
              {selectedFactura?.fecha_vencimiento && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de vencimiento:</span>
                  <span>{formatDate(selectedFactura.fecha_vencimiento)}</span>
                </div>
              )}
              {selectedFactura?.pedido_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de pedido:</span>
                  <span className="font-medium">{selectedFactura.pedido_id}</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800">Información del Cliente</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{selectedFactura?.cliente_nombre || 'Cliente no especificado'}</p>
              {selectedFactura?.cliente_email && (
                <p className="text-sm text-gray-600 mt-1">{selectedFactura.cliente_email}</p>
              )}
              {selectedFactura?.cliente_direccion && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Dirección:</span> {selectedFactura.cliente_direccion}
                </p>
              )}
              {selectedFactura?.cliente_telefono && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Teléfono:</span> {selectedFactura.cliente_telefono}
                </p>
              )}
            </div>
          </div>

          {selectedFactura && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Resumen de Pago</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{currencyFormatter(selectedFactura?.subtotal || 0)}</span>
                  </div>
                  {selectedFactura?.impuestos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impuestos ({selectedFactura?.impuestos_porcentaje || 0}%):</span>
                      <span>{currencyFormatter(selectedFactura?.impuestos || 0)}</span>
                    </div>
                  )}
                  {selectedFactura?.descuento > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="text-red-600">-{currencyFormatter(selectedFactura?.descuento || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">{currencyFormatter(selectedFactura?.total || 0)}</span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewPdf(selectedFactura, e);
                    }}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Ver factura en PDF
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFactura(selectedFactura, e);
                    }}
                    className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center"
                    disabled={isPdfLoading}
                  >
                    {isPdfLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Descargar factura
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Productos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio unitario</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedFactura?.productos?.length > 0 ? (
                  selectedFactura.productos.map((producto, index) => (
                    <tr key={`producto-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{producto.nombre || 'Producto'}</div>
                        {producto.descripcion && <div className="text-sm text-gray-500">{producto.descripcion}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{producto.cantidad || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {currencyFormatter(producto.precio_unitario || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {currencyFormatter((producto.precio_unitario || 0) * (producto.cantidad || 1))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay productos registrados en esta factura
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      {!facturas || facturas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay facturas registradas</h3>
          <p className="mt-2 text-sm text-gray-500">Las facturas de tus compras aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {facturas.map((factura) => {
            const fechaEmision = factura.fecha_emision || factura.fecha;
            const estado = factura.estado || 'pendiente';
            
            return (
              <div 
                key={factura.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openModal(factura)}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(estado).split(' ')[0]}`}></div>
                        <span className="text-sm font-medium text-gray-900">#{factura.id}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        {factura.cliente_nombre || 'Cliente no especificado'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(fechaEmision)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(estado)}`}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {currencyFormatter(factura.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 text-sm text-gray-500 border-t border-gray-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {factura.cliente_email || 'No hay correo electrónico registrado'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={showPdfPreview ? "Vista previa de factura PDF" : "Detalles de la factura"}
        className="modal-content"
        overlayClassName="modal-overlay"
        style={showPdfPreview ? pdfModalStyles : modalStyles}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default TabFacturas;