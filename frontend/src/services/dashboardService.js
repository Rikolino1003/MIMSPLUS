import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const obtenerEstadisticas = async () => {
  try {
    const response = await axios.get(`${API_URL}dashboard/estadisticas/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

export const obtenerPedidosRecientes = async () => {
  try {
    const response = await axios.get(`${API_URL}pedidos/?limit=5`, getAuthHeaders());
    return response.data.results || [];
  } catch (error) {
    console.error('Error al obtener pedidos recientes:', error);
    return [];
  }
};

export const obtenerAlertasStock = async () => {
  try {
    const response = await axios.get(`${API_URL}inventario/alertas/`, getAuthHeaders());
    return response.data || [];
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error);
    return [];
  }
};
