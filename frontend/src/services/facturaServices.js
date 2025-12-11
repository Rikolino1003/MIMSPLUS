import api from "./api";
import httpUtils from "./httpUtils";

// Configuración común para las peticiones de facturas
const getPdfConfig = (facturaId) => ({
  responseType: 'blob',
  headers: { 'Accept': 'application/pdf' },
  withCredentials: true,
  params: { _: new Date().getTime() } // Evitar caché
});
// BASE_URL apunta al endpoint del ViewSet registrado en backend: /api/facturas/facturas/
const BASE_URL = "facturas/facturas/";
const DETALLES_BASE = "facturas/detalles/";

/**
 * Obtener todas las facturas del usuario autenticado
 * @returns {Promise<Array>} Lista de facturas
 */
export const getFacturas = () => {
  const endpoint = 'facturas/mis-facturas/';
  console.log('Making request to:', endpoint);
  return httpUtils.fetchWithRetry(() => 
    api.get(endpoint, {
      params: {
        expand: 'detalles.medicamento',
        include: 'detalles'
      }
    })
  )
    .then(r => {
      console.log('Response from API:', r);
      // Process the response to ensure details are properly formatted
      const data = Array.isArray(r.data) ? r.data : (r.data?.results || []);
      return data.map(factura => ({
        ...factura,
        // Ensure detalles is always an array
        detalles: Array.isArray(factura.detalles) ? factura.detalles : []
      }));
    })
    .catch(error => {
      console.error('Error in getFacturas:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    });
};

/**
 * Obtener una factura por su ID
 * @param {number} id - ID de la factura
 * @returns {Promise<Object>} Datos de la factura
 */
export const getFactura = (id) => 
  httpUtils.fetchWithRetry(() => 
    api.get(`${id}/`, {
      baseURL: `${api.defaults.baseURL}facturas/`,
      params: {
        expand: 'detalles.medicamento',
        include: 'detalles'
      }
    })
  )
    .then(r => ({
      ...r.data,
      // Ensure detalles is always an array
      detalles: Array.isArray(r.data.detalles) ? r.data.detalles : []
    }));

/**
 * Buscar facturas por ID de pedido
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<Array>} Facturas relacionadas al pedido
 */
export const buscarFacturaPorPedido = (pedidoId) =>
  httpUtils.fetchWithRetry(() => api.get(`${BASE_URL}?pedido=${pedidoId}`))
    .then(r => {
      // El endpoint devuelve un listado; normalizar a array
      const data = Array.isArray(r.data) ? r.data : (r.data?.results || []);
      return data;
    });

/**
 * Obtener factura en formato PDF para visualización
 * @param {number} facturaId - ID de la factura a visualizar
 * @returns {Promise<Blob>} Archivo PDF como Blob
 */
export const obtenerFacturaPDF = async (facturaId) => {
  // El backend expone el PDF en: /api/facturas/descargar/<id>/
  const endpoint = `facturas/descargar/${facturaId}/`;
  console.log('Solicitando factura PDF para visualización desde:', endpoint);
  
  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' },
      withCredentials: true,
      params: { _: new Date().getTime() }, // Evitar caché
      validateStatus: status => status === 200 || status === 404 // Aceptar 404 para manejarlo nosotros
    });

    // Si el estado es 404, lanzar un error específico
    if (response.status === 404) {
      throw new Error('PDF_NO_ENCONTRADO');
    }

    // Si el tipo de contenido no es PDF, algo salió mal
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/pdf')) {
      throw new Error('El archivo recibido no es un PDF válido');
    }

    return response.data;
  } catch (error) {
    console.error('Error al obtener la factura para visualización:', error);
    
    // Si es un error de PDF no encontrado, relanzar con mensaje específico
    if (error.message === 'PDF_NO_ENCONTRADO') {
      throw new Error('El PDF de esta factura no está disponible en este momento.');
    }
    
    // Para otros errores, usar un mensaje genérico
    throw new Error('No se pudo cargar la factura. Mostrando detalles en su lugar.');
  }
};

/**
 * Descargar factura en formato PDF
 * @param {number} facturaId - ID de la factura a descargar
 * @returns {Promise<Blob>} Archivo PDF como Blob
 */
export const descargarFacturaPDF = (facturaId) => {
  const endpoint = `facturas/descargar/${facturaId}/`;
  console.log('Descargando factura PDF desde:', endpoint);

  return httpUtils.fetchWithRetry(() =>
    api.get(endpoint, getPdfConfig(facturaId))
  )
    .then(response => response.data)
    .catch(error => {
      console.error('Error al descargar la factura:', error);
      throw new Error('No se pudo descargar la factura. Por favor, intente nuevamente.');
    });
};

/**
 * Crear una factura
 * @param {Object} data - Datos de la factura
 * @returns {Promise<Object>} Factura creada
 */
export const crearFactura = (data) => 
  httpUtils.fetchWithRetry(() => api.post(BASE_URL, data))
    .then(r => r.data);

/**
 * Actualizar una factura
 * @param {number} id - ID de la factura
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Factura actualizada
 */
export const actualizarFactura = (id, data) => 
  httpUtils.fetchWithRetry(() => api.put(`${BASE_URL}${id}/`, data))
    .then(r => r.data);

/**
 * Eliminar una factura
 * @param {number} id - ID de la factura a eliminar
 * @returns {Promise<void>}
 */
export const eliminarFactura = (id) => 
  httpUtils.fetchWithRetry(() => api.delete(`${BASE_URL}${id}/`));

/**
 * Obtener detalles de factura
 * @returns {Promise<Array>} Lista de detalles de factura
 */
export const getDetallesFactura = () => 
  httpUtils.fetchWithRetry(() => api.get(DETALLES_BASE))
    .then(r => r.data);

/**
 * Obtener detalles de una factura específica
 * @param {number} facturaId - ID de la factura
 * @returns {Promise<Array>} Detalles de la factura
 */
export const getDetallesPorFactura = (facturaId) =>
  httpUtils.fetchWithRetry(() => api.get(`${DETALLES_BASE}?factura=${facturaId}`))
    .then(r => r.data);

export default {
  getFacturas,
  getFactura,
  obtenerFacturaPDF,
  buscarFacturaPorPedido,
  descargarFacturaPDF,
  crearFactura,
  actualizarFactura,
  eliminarFactura,
  getDetallesFactura,
  getDetallesPorFactura
};
