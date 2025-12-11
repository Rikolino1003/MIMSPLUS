// Configuración de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  // Facturación
  facturas: {
    descargar: (id) => `${API_BASE_URL}/api/facturacion/facturas/descargar/${id}/`,
    listar: () => `${API_BASE_URL}/api/facturacion/mis-facturas/`,
    buscarPorPedido: (pedidoId) => `${API_BASE_URL}/api/facturacion/facturas/?pedido=${pedidoId}`,
  },
  
  // Pedidos
  pedidos: {
    listar: () => `${API_BASE_URL}/api/pedidos/`,
    detalle: (id) => `${API_BASE_URL}/api/pedidos/${id}/`,
  },
  
  // Autenticación
  auth: {
    login: () => `${API_BASE_URL}/api/token/`,
    refresh: () => `${API_BASE_URL}/api/token/refresh/`,
    user: () => `${API_BASE_URL}/api/usuarios/me/`,
  },
};

export default api;
