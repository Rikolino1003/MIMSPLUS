// src/services/inventarioService.js
import API from "./api.js";
import httpUtils from "./httpUtils.js";


/* ===============================
// 🧩 CATEGORÍAS CON MEDICAMENTOS ANIDADOS (público)
================================= */
export const getCategoriasConMedicamentos = async () => {
  return await httpUtils.fetchWithRetry(() => API.get("/inventario/catalogo/categorias-con-medicamentos/")).then(r => r.data);
};

export const getCatalogo = async (params = {}) => {
  // Try to use the paginated helper (handles both list and paginated responses)
  return await httpUtils.fetchWithRetry(() => API.get("/inventario/catalogo/", { params })).then(r => r.data);
};

export const getProveedores = async (q = "", page = 1, page_size = 10) => {
  return await httpUtils.fetchWithRetry(() => API.get("/inventario/catalogo/proveedores/", { params: { q, page, page_size } })).then(r => r.data);
};

export const getDrogueriasPublic = async () => {
  const res = await API.get("/inventario/catalogo/droguerias/");
  return res.data;
};


/* ===============================
   💊 MEDICAMENTOS (CRUD protegido)
================================= */
export const getMedicamentos = async () => {
  const res = await API.get("/inventario/medicamentos/");
  return res.data;
};

export const crearMedicamento = async (data) => {
  const res = await API.post("/inventario/medicamentos/", data);
  return res.data;
};

export const actualizarMedicamento = async (id, data) => {
  const res = await API.put(`/inventario/medicamentos/${id}/`, data);
  return res.data;
};

export const eliminarMedicamento = async (id) => {
  const res = await API.delete(`/inventario/medicamentos/${id}/`);
  return res.data;
};

/* ===============================
   📊 ALERTAS DE INVENTARIO
================================= */

/**
 * Obtiene las alertas de inventario (stock bajo y próximos a vencer)
 * @returns {Promise<{stock_bajo: Array, proximo_vencimiento: Array}>} Objeto con las alertas
 */
/**
 * Obtiene los medicamentos con stock bajo (menor al stock mínimo)
 * @returns {Promise<Array>} Lista de medicamentos con stock bajo
 */
export const getStockBajo = async () => {
  try {
    const response = await httpUtils.fetchWithRetry(() => 
      API.get("/inventario/medicamentos/", { 
        params: { stock_bajo: true } 
      })
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error al obtener medicamentos con stock bajo:', error);
    return [];
  }
};

/**
 * Obtiene los medicamentos próximos a vencer
 * @returns {Promise<Array>} Lista de medicamentos próximos a vencer
 */
export const getProximosAVencer = async () => {
  try {
    const response = await httpUtils.fetchWithRetry(() => 
      API.get("/inventario/medicamentos/", {
        params: { proximo_vencimiento: true }
      })
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error al obtener medicamentos próximos a vencer:', error);
    return [];
  }
};

/**
 * Obtiene las alertas de inventario (stock bajo y próximos a vencer)
 * @returns {Promise<{stock_bajo: Array, proximo_vencimiento: Array}>} Objeto con las alertas
 */
export const getAlertasInventario = async () => {
  try {
    // Obtener ambos conjuntos de datos en paralelo
    const [stockBajo, proximosAVencer] = await Promise.all([
      getStockBajo(),
      getProximosAVencer()
    ]);

    return {
      stock_bajo: stockBajo,
      proximo_vencimiento: proximosAVencer
    };
  } catch (error) {
    console.error('Error al obtener alertas de inventario:', error);
    return { stock_bajo: [], proximo_vencimiento: [] };
  }
};

