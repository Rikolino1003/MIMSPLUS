// src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ===========================
// 🔐 AUTENTICACIÓN
// ===========================

// Constantes de expiración (en milisegundos)
const TOKEN_EXPIRATION_SHORT = 24 * 60 * 60 * 1000; // 24 horas (sesión normal)
const TOKEN_EXPIRATION_LONG = 30 * 24 * 60 * 60 * 1000; // 30 días (recordar sesión)

// Configurar token JWT en headers
export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

// Limpiar datos de autenticación (definir primero para evitar referencias circulares)
export const clearAuthData = () => {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  localStorage.removeItem("tokenData");
  localStorage.removeItem("remember");
  setAuthToken(null);
};

// Guardar credenciales de forma segura (solo si recordarme está activo)
export const saveCredentials = (username, password, rememberMe) => {
  if (rememberMe) {
    // Encriptación simple (en producción usar algo más seguro)
    const credentials = {
      username: username,
      password: btoa(password), // Base64 encoding (no es seguro, pero mejor que texto plano)
      savedAt: Date.now()
    };
    localStorage.setItem("savedCredentials", JSON.stringify(credentials));
  } else {
    localStorage.removeItem("savedCredentials");
  }
};

// Obtener credenciales guardadas
export const getSavedCredentials = () => {
  try {
    const saved = localStorage.getItem("savedCredentials");
    if (!saved) return null;
    
    const credentials = JSON.parse(saved);
    return {
      username: credentials.username,
      password: atob(credentials.password) // Decodificar
    };
  } catch (error) {
    console.error("Error al obtener credenciales guardadas:", error);
    return null;
  }
};

// Guardar token con expiración segura
export const saveTokenWithExpiration = (token, rememberMe = false) => {
  const expirationTime = rememberMe 
    ? Date.now() + TOKEN_EXPIRATION_LONG 
    : Date.now() + TOKEN_EXPIRATION_SHORT;
  
  const tokenData = {
    token,
    expiresAt: expirationTime,
    rememberMe
  };
  
  localStorage.setItem("token", token);
  localStorage.setItem("tokenData", JSON.stringify(tokenData));
  setAuthToken(token);
};

// Obtener token válido (verifica expiración)
export const getValidToken = () => {
  const tokenDataStr = localStorage.getItem("tokenData");
  const token = localStorage.getItem("token");
  
  // Si no hay tokenData pero hay token (migración de versión antigua)
  if (!tokenDataStr && token) {
    // Asumir que es una sesión corta por defecto
    saveTokenWithExpiration(token, false);
    return token;
  }
  
  if (!tokenDataStr || !token) {
    return null;
  }
  
  try {
    const tokenData = JSON.parse(tokenDataStr);
    const now = Date.now();
    
    // Si el token expiró, limpiar y retornar null
    if (tokenData.expiresAt < now) {
      clearAuthData();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error("Error al parsear tokenData:", error);
    clearAuthData();
    return null;
  }
};

// Verificar si la sesión está activa y no expirada
export const isSessionValid = () => {
  const token = getValidToken();
  return token !== null;
};

// Inicializar con token válido si existe
const validToken = getValidToken();
if (validToken) setAuthToken(validToken);

// ===========================
// 🔑 LOGIN, REGISTRO Y PERFIL
// ===========================

export const loginUsuario = async (data, rememberMe = false) => {
  try {
    // Asegurar que no se envíe token en el header del login (crear petición sin token)
    const loginApi = axios.create({
      baseURL: API_URL,
      headers: { 
        "Content-Type": "application/json",
      },
    });
    
    // Limpiar cualquier token que pueda estar en los headers por defecto
    delete loginApi.defaults.headers.common["Authorization"];
    
    // Log para debug (remover en producción)
    console.log("Enviando login con datos:", { username: data.username, password: "***" });
    
    const res = await loginApi.post("usuarios/login/", {
      username: data.username?.trim(),
      password: data.password
    });
    
    console.log("Respuesta del servidor:", res.data);
    
    const { usuario, token } = res.data;

    if (!usuario || !token) {
      throw new Error("Respuesta inválida del servidor: faltan usuario o token");
    }

    localStorage.setItem("usuario", JSON.stringify(usuario));
    saveTokenWithExpiration(token, rememberMe);
    
    // Guardar credenciales si recordarme está activo
    saveCredentials(data.username, data.password, rememberMe);

    return res.data;
  } catch (error) {
    console.error("Error completo en login:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    // Manejar diferentes formatos de error del servidor
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        // 401 Unauthorized - credenciales incorrectas
        const errorMsg = errorData?.error || errorData?.message || errorData?.detail || "Credenciales inválidas";
        throw new Error(errorMsg);
      } else if (status === 404) {
        throw new Error("Usuario no encontrado");
      } else if (status === 400) {
        const errorMsg = errorData?.error || errorData?.message || errorData?.detail || "Datos inválidos";
        throw new Error(errorMsg);
      } else {
        const errorMsg = errorData?.error || errorData?.message || errorData?.detail || `Error en el servidor (${status})`;
        throw new Error(errorMsg);
      }
    } else if (error.request) {
      // Error de red
      throw new Error("Error al conectar con el servidor. Verifica tu conexión.");
    } else {
      // Error en la configuración de la petición
      throw new Error(error.message || "Error en login");
    }
  }
};

export const registerUsuario = async (data) => {
  return await api.post("usuarios/registro/", data);
};

export const getPerfil = async () => {
  const token = getValidToken();
  if (token) setAuthToken(token);
  return await api.get("usuarios/perfil/");
};

export const logoutUsuario = () => {
  // No limpiar credenciales guardadas si recordarme estaba activo
  // Solo limpiar datos de sesión
  clearAuthData();
};

// ===========================
// 🔒 RECUPERACIÓN DE CONTRASEÑA
// ===========================

export const cambiarContrasena = async (email, codigo, nueva_contrasena, confirmar_contrasena) => {
  return await api.post("usuarios/cambiar-contrasena/", {
    email,
    codigo,
    nueva_contrasena,
    confirmar_contrasena,
  });
};
//FIN RECUPERACIÓN DE CONTRASEÑA


//=====================================
//FACTURAS EMPLEADO 
//=====================================
export const getFacturasDia = async () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  const today = new Date().toISOString().split('T')[0];
  // Endpoint para obtener las facturas
  return await api.get(`facturas/lista/`);
};

export const crearFactura = async (data) => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.post("facturas/registrar/", data);
};

export const getDetalleFactura = async (facturaId) => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get(`facturas/${facturaId}/`);
};

export const getFacturaPDF = async (facturaId) => {
  // Obtener el token usando la función getValidToken que ya maneja la expiración
  const token = getValidToken();
  if (!token) {
    console.error('No se encontró token de autenticación válido');
    throw new Error('No autenticado o sesión expirada');
  }
  
  // Usar la URL exacta como la necesita el backend
  const baseUrl = 'http://127.0.0.1:8000';
  const url = `${baseUrl}//api//facturas/descargar/${facturaId}/`;
  
  console.log('Solicitando PDF en:', url);
  console.log('Usando token:', token ? 'Token presente' : 'Sin token');
  
  try {
    // Usar fetch directamente para mejor control
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/pdf',
      },
      credentials: 'same-origin',
    });
    
    console.log('Respuesta recibida, estado:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.text();
        console.error('Error en la respuesta:', errorData);
        errorMessage = errorData || errorMessage;
      } catch (e) {
        console.error('No se pudo leer el mensaje de error:', e);
      }
      throw new Error(errorMessage);
    }
    
    // Obtener el blob de la respuesta
    const blob = await response.blob();
    
    // Verificar si el blob es un PDF
    if (!blob.type.includes('application/pdf')) {
      // Si no es un PDF, intentar leer como texto
      const errorText = await blob.text();
      console.error('Respuesta inesperada del servidor:', errorText);
      throw new Error('El servidor no devolvió un PDF válido');
    }
    
    console.log('Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      contentType: blob.type,
      size: blob.size
    });
    
    return {
      data: blob,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
    
  } catch (error) {
    console.error('Error detallado en getFacturaPDF:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No hay respuesta del servidor',
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : 'No hay configuración de solicitud'
    });
    throw error;
  }
};

// Obtener lista de clientes
export const getClientes = async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
    
    // 1. Obtener todos los usuarios
    const response = await api.get("usuarios/");
    console.log('Respuesta completa de la API:', response);
    
    // 2. Extraer los datos de la respuesta
    let users = [];
    if (Array.isArray(response.data)) {
      users = response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      users = response.data.results;
    } else if (response.data) {
      users = [response.data];
    }
    
    console.log('Usuarios extraídos:', users);
    
    // 3. Si no hay usuarios, devolver array vacío
    if (users.length === 0) {
      console.log('No se encontraron usuarios');
      return { data: [] };
    }
    
    // 4. Mostrar la estructura del primer usuario para depuración
    console.log('Estructura del primer usuario:', Object.keys(users[0]));
    
    // 5. Si solo hay un usuario, devolverlo directamente
    if (users.length === 1) {
      console.log('Solo hay un usuario, devolviendo como cliente');
      return { data: [users[0]] };
    }
    
    // 6. Si hay múltiples usuarios, intentar filtrar por rol
    const clientes = users.filter(user => {
      // Ver todas las propiedades del usuario para depuración
      console.log('Usuario:', user.username || user.email || user.id, '- Propiedades:', Object.keys(user));
      
      // Verificar si el usuario tiene rol de cliente
      const tieneRolCliente = 
        (user.rol_nuevo?.nombre && user.rol_nuevo.nombre.toLowerCase().includes('cliente')) ||
        (user.rol_nuevo && user.rol_nuevo.toLowerCase().includes('cliente')) ||
        (user.rol && user.rol.toLowerCase().includes('cliente')) ||
        (user.rol_actual && user.rol_actual.toLowerCase().includes('cliente')) ||
        (user.groups && user.groups.some(g => g.toLowerCase().includes('cliente'))) ||
        (user.is_staff === false && user.is_superuser === false); // Si no es admin ni staff, asumir que es cliente
      
      return tieneRolCliente;
    });
    
    console.log(`Total usuarios: ${users.length}, Clientes encontrados: ${clientes.length}`);
    
    // 7. Si no se encontraron clientes pero hay usuarios, devolver todos los usuarios
    if (clientes.length === 0 && users.length > 0) {
      console.log('No se encontraron clientes, devolviendo todos los usuarios');
      return { data: users };
    }
    
    return { data: clientes };
    
  } catch (error) {
    console.error('Error en getClientes:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    return { data: [] }; // Devolver array vacío en caso de error
  }
};

//=====================================================
//PEDIDOS EMPLEADO
//=====================================================
export const getPedidosActivos = async () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get("pedidos/activos/");
};

export const cambiarEstadoPedido = async (pedidoId, estado) => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.post(`pedidos/${pedidoId}/estado/`, { estado });
};

export const getDetallesPedido = async (pedidoId) => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get(`pedidos/${pedidoId}/detalles/`);
};

export const obtenerAlertasStock = async () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get("pedidos/alertas/stock-bajo/");
};

//======================================================
//MEDICAMENTOS EMPLEADO
//======================================================
export const getMedicamentosDisponibles = (params = {}) => {
  return api.get("inventario/medicamentos-crud/", { params });
};

export const buscarMedicamentos = (search) => {
  return api.get(`inventario/medicamentos-crud/?search=${search}`);
};

export const getAlertasMedicamentos = async () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get("inventario/alertas/");
};

export const getDetalleMedicamento = async (medicamentoId) => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get(`inventario/medicamentos-crud/${medicamentoId}/`);
};

//======================================================
//REPORTES EMPLEADO
//======================================================
export const getReporteTurno = async () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
  return await api.get("reportes/turno/");
};

export default api;