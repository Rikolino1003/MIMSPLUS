import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/";

// Obtener el rol del usuario directamente del objeto de usuario en localStorage
const getUserRole = () => {
  try {
    // Obtener datos del usuario desde localStorage
    const userData = JSON.parse(localStorage.getItem('usuario') || '{}');
    console.log('👤 Datos del usuario desde localStorage:', userData);
    
    // Verificar si el usuario tiene un rol definido
    if (userData && userData.rol) {
      // Asegurar que el rol esté en el formato correcto
      const rol = userData.rol.toString().trim();
      console.log('🎯 Rol obtenido del usuario:', rol);
      return rol;
    }
    
    // Si no se encuentra el rol en el usuario, revisar en el token JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Buscar el rol en diferentes ubicaciones del payload
        const rol = payload.rol || payload.role || payload.user_rol || 'cliente';
        console.log('🔑 Rol obtenido del token JWT:', rol);
        return rol;
      } catch (tokenError) {
        console.error('❌ Error al decodificar el token JWT:', tokenError);
      }
    }
    
    // Si no se puede determinar el rol, usar 'cliente' por defecto
    console.warn('⚠️ No se pudo determinar el rol del usuario, usando "cliente" por defecto');
    return 'cliente';
    
  } catch (error) {
    console.error('❌ Error al obtener el rol del usuario:', error);
    return 'cliente';
  }
};

// Modificar la función isAuthorized para incluir logs adicionales
const isAuthorized = (requiredRoles = ['admin', 'empleado']) => {
  const userRole = getUserRole();
  const autorizado = requiredRoles.includes(userRole);

  if (!autorizado) {
    console.warn(`Usuario no autorizado. Rol actual: ${userRole}. Roles requeridos: ${requiredRoles.join(', ')}`);
  }

  return autorizado;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/* ========================================================
   🔵 PEDIDOS - CLIENTE
======================================================== */

// Crear un pedido desde el carrito
export const crearPedido = async (data) => {
  try {
    const response = await axios.post(
      `${API_URL}pedidos/crear-pedido/`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al crear pedido:", error.response?.data || error);
    throw error;
  }
};

// Mis pedidos (cliente)
export const getMisPedidos = async () => {
  try {
    console.log('Obteniendo mis pedidos...');
    const response = await axios.get(
      `${API_URL}pedidos/pedidos/`,
      { 
        headers: getAuthHeaders(),
        params: {
          cliente: 'me'  // Este parámetro puede ser necesario según tu backend
        }
      }
    );
    
    console.log('Respuesta de la API (mis pedidos):', response.data);
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results) {
      return response.data.results;
    } else if (response.data.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error("Error al obtener mis pedidos:", error);
    console.error("Detalles del error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Si el error es 404 o 403, devolver un array vacío
    if ([404, 403].includes(error.response?.status)) {
      return [];
    }
    
    throw error;
  }
};

// Alias usado en perfilCliente.jsx
export const obtenerPedidosUsuario = getMisPedidos;

/* ========================================================
   🔵 PEDIDOS - GENERAL (ADMIN / EMPLEADO)
======================================================== */

/**
 * Obtener todos los pedidos (solo para administradores y empleados)
 * @returns {Promise<Array>} Lista de pedidos
 */
export const getPedidos = async () => {
  try {
    if (!isAuthorized()) {
      throw new Error('No tiene permisos para ver todos los pedidos');
    }
    
    const response = await axios.get(
      `${API_URL}pedidos/`,
      { headers: getAuthHeaders() }
    );
    
    // Si el usuario es empleado, podríamos querer filtrar cierta información
    if (getUserRole() === 'empleado') {
      return response.data.map(pedido => ({
        ...pedido,
        // Aquí podrías ocultar o modificar ciertos campos para empleados
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    throw error;
  }
};

/**
 * Obtener un pedido por ID (accesible para admin, empleado o el cliente dueño del pedido)
 * @param {string|number} id - ID del pedido
 * @returns {Promise<Object>} Datos del pedido
 */
export const getPedidoById = async (id) => {
  try {
    const response = await axios.get(
      `${API_URL}pedidos/${id}/`,
      { 
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500 // Don't throw for 404
      }
    );
    
    // Si el pedido no existe
    if (response.status === 404) {
      throw new Error('El pedido no fue encontrado');
    }
    
    // Verificar si el usuario tiene permiso para ver este pedido
    const userRole = getUserRole();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const esCliente = userRole === 'cliente';
    
    if (esCliente && response.data.usuario_id !== userData.id) {
      throw new Error('No tiene permiso para ver este pedido');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    // Mejorar el mensaje de error para el usuario
    if (error.response && error.response.status === 404) {
      throw new Error('El pedido no fue encontrado');
    }
    throw error;
  }
};

/* ========================================================
   🔵 PANEL EMPLEADO Y ADMINISTRADOR
======================================================== */

/**
 * Obtener pedidos activos (pendientes o en proceso)
 * @returns {Promise<Array>} Lista de pedidos activos
 */
export const getPedidosActivos = async () => {
  try {
    const userRole = getUserRole();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    console.log('Rol del usuario:', userRole);

    // Si el usuario no está autorizado, devolver un array vacío
    if (!isAuthorized(['admin', 'empleado', 'cliente'])) {
      console.warn('Usuario no autorizado para ver pedidos activos');
      return [];
    }

    console.log('Obteniendo pedidos activos...');
    const response = await axios.get(
      `${API_URL}pedidos/pedidos/`,
      {
        headers: getAuthHeaders(),
        params: {
          estado: 'pendiente,procesado',  // Filtrar por estados activos
          expand: 'cliente',  // Incluir detalles del cliente
          page_size: 100,     // Obtener más resultados por página
          ordering: '-fecha_creacion' // Ordenar por fecha de creación descendente
        },
      }
    );

    console.log('Respuesta de la API (pedidos activos):', response.data);

    // Manejar diferentes formatos de respuesta
    let pedidos = [];
    if (Array.isArray(response.data)) {
      pedidos = response.data;
    } else if (response.data.results) {
      pedidos = response.data.results;
    } else if (response.data.data) {
      pedidos = response.data.data;
    }
    
    // Procesar los pedidos para asegurar que tengan la estructura correcta
    return pedidos.map(pedido => {
      // Si ya tiene cliente_nombre, mantenerlo
      if (pedido.cliente_nombre) return pedido;
      
      // Si el cliente es un objeto, extraer los datos necesarios
      if (pedido.cliente && typeof pedido.cliente === 'object') {
        const cliente = pedido.cliente;
        const nombreCompleto = [
          cliente.nombre || cliente.first_name || '',
          cliente.apellido || cliente.last_name || cliente.username || ''
        ].filter(Boolean).join(' ').trim() || 'Cliente sin nombre';
        
        // Asegurarse de que siempre haya un ID de cliente
        const clienteId = cliente.id || cliente.pk || cliente._id || 'unknown';
        
        return {
          ...pedido,
          cliente_id: clienteId,
          cliente_nombre: nombreCompleto,
          cliente_telefono: String(cliente.telefono || cliente.phone || '').trim(),
          cliente_email: String(cliente.email || '').trim().toLowerCase(),
          cliente_direccion: String(cliente.direccion || cliente.address || '').trim()
        };
      }
      
      // Si no hay información de cliente, usar un valor por defecto
      return {
        ...pedido,
        cliente_nombre: pedido.cliente_nombre || `Cliente ${pedido.id || ''}`
      };
    });
    
    console.log('Pedidos procesados con datos de cliente:', pedidos);

    // Filtrar pedidos según el rol del usuario
    if (userRole === 'cliente') {
      pedidos = pedidos.filter((pedido) => pedido.usuario_id === userData.id);
    }

    // Filtrar solo pedidos activos (pendientes o en proceso)
    const pedidosActivos = pedidos.filter(
      (pedido) => pedido.estado === 'pendiente' || pedido.estado === 'procesado'
    );
    
    console.log('Pedidos activos filtrados:', pedidosActivos);
    return pedidosActivos;
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    console.error('Detalles del error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Si el error es 404 o 403, devolver un array vacío
    if ([404, 403].includes(error.response?.status)) {
      return [];
    }

    throw error;
  }
};

/**
 * Cambiar el estado de un pedido
 * @param {string|number} id - ID del pedido
 * @param {Object} data - Datos para actualizar el estado
 * @param {string} data.estado - Nuevo estado del pedido
 * @param {string} [data.comentario] - Comentario opcional para el cambio de estado
 * @returns {Promise<Object>} Pedido actualizado
 */
/**
 * Cambia el estado de un pedido
 * @param {string|number} id - ID del pedido
 * @param {Object} data - Datos para actualizar el estado
 * @param {string} data.estado - Nuevo estado del pedido
 * @param {string} [data.comentario] - Comentario opcional para el cambio de estado
 * @returns {Promise<Object>} Pedido actualizado
 */
/**
 * Cambia el estado de un pedido
 * @param {string|number} id - ID del pedido
 * @param {Object} data - Datos para actualizar el estado
 * @param {string} data.estado - Nuevo estado del pedido
 * @param {string} [data.comentario] - Comentario opcional para el cambio de estado
 * @returns {Promise<Object>} Pedido actualizado
 */
export const cambiarEstadoPedido = async (id, data) => {
  try {
    console.log('🔵 [cambiarEstadoPedido] Iniciando cambio de estado para pedido:', id);
    console.log('📝 Datos recibidos:', data);
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No se encontró token de autenticación');
      throw new Error('No se encontró el token de autenticación');
    }
    
    // Validar que el estado sea uno de los permitidos
    const estadosPermitidos = ['pendiente', 'procesado', 'entregado', 'cancelado'];
    if (!data.estado || !estadosPermitidos.includes(data.estado)) {
      throw new Error(`Estado '${data.estado}' no válido. Los estados permitidos son: ${estadosPermitidos.join(', ')}`);
    }

    // Obtener información del usuario
    const userData = JSON.parse(localStorage.getItem('usuario') || '{}');
    console.log('👤 Datos del usuario desde localStorage:', userData);

    // Obtener rol del usuario
    const userRole = getUserRole();
    console.log('🎭 Rol detectado:', userRole);
    
    // Verificar si el usuario tiene un rol válido
    if (!userRole) {
      console.error('❌ No se pudo determinar el rol del usuario');
      throw new Error('No se pudo verificar su nivel de acceso');
    }
    
    // Convertir a minúsculas para la comparación
    const userRoleLower = userRole.toLowerCase();
    
    // Verificar si el usuario tiene un rol autorizado
    if (!['admin', 'empleado'].includes(userRoleLower)) {
      console.error(`🚫 Acceso denegado. Rol actual: ${userRole}`);
      throw new Error('No tienes permiso para realizar esta acción');
    }
    
    // Mapear estados si es necesario (por ejemplo, si la interfaz usa 'en_proceso' en lugar de 'procesado')
    const estadoMapeado = data.estado === 'en_proceso' ? 'procesado' : data.estado;
    
    // Verificar que el ID sea válido
    if (!id) {
      console.error('❌ ID de pedido no proporcionado');
      throw new Error('ID de pedido no proporcionado');
    }
    
    // Construir la URL correcta para la API
    const url = `${API_URL}pedidos/pedidos/${id}/`;  // Usar el endpoint correcto según la API
    console.log('🌐 URL de la solicitud:', url);
    
    // Configuración de la petición
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'  // Importante para Django
      },
      validateStatus: function (status) {
        // Aceptar códigos de éxito y de error de validación
        return status < 500; // No lanzar excepción para códigos de estado HTTP menores a 500
      }
    };
    
    // Datos a enviar - solo enviamos los campos necesarios
    const requestData = {
      estado: data.estado,
      comentario: data.comentario || `Estado cambiado a ${data.estado}`,
      fecha_actualizacion: new Date().toISOString()
    };
    
    console.log('📤 Enviando datos de actualización:', requestData);
    
    // Realizar la petición PATCH para actualizar solo los campos enviados
    const response = await axios.patch(url, requestData, config);
    
    // Manejar la respuesta
    console.log('📥 Respuesta del servidor:', {
      status: response.status,
      data: response.data
    });
    
    // Si la respuesta es exitosa (código 2xx)
    if (response.status >= 200 && response.status < 300) {
      // Verificar si la respuesta tiene datos
      if (!response.data) {
        throw new Error('La respuesta del servidor está vacía');
      }
      return response.data;
    }
    
    // Manejar errores específicos
    if (response.status === 401) {
      // Token inválido o expirado
      console.error('❌ Error de autenticación');
      // Limpiar el token expirado
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      throw new Error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
    } else if (response.status === 403) {
      // No autorizado
      console.error('❌ Acceso denegado');
      throw new Error('No tiene permisos para realizar esta acción');
    } else if (response.status === 404) {
      // Pedido no encontrado
      console.error('❌ Pedido no encontrado');
      throw new Error('El pedido solicitado no fue encontrado');
    } else if (response.status === 400) {
      // Error en los datos enviados
      const errorMsg = response.data?.error || 'Error en los datos enviados';
      console.error('❌ Error en la solicitud:', errorMsg);
      throw new Error(errorMsg);
    } else {
      // Otro error del servidor
      console.error('❌ Error del servidor:', response.status, response.data);
      throw new Error('Error del servidor al actualizar el estado del pedido');
    }
  } catch (error) {
    console.error('❌ Error al cambiar el estado del pedido:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      if (error.response.status === 404) {
        throw new Error('El pedido no fue encontrado. Por favor, verifica el ID del pedido.');
      } else if (error.response.status === 403) {
        throw new Error('No tienes permiso para realizar esta acción');
      } else if (error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      throw new Error('No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.');
    }
    
    // Si el error no es de red ni de respuesta del servidor
    throw error;
  }
};

/**
 * Obtener detalles completos de un pedido (accesible para admin, empleado o el cliente dueño)
 * @param {string|number} id - ID del pedido
 * @returns {Promise<Object>} Detalles completos del pedido
 */
/**
 * Obtener detalles completos de un pedido (accesible para admin, empleado o el cliente dueño)
 * @param {string|number} id - ID del pedido
 * @returns {Promise<Object>} Detalles completos del pedido
 */
export const getDetallesPedido = async (id) => {
  if (!id) {
    throw new Error('ID de pedido no proporcionado');
  }

  try {
    console.log(`🔍 Obteniendo detalles del pedido #${id}...`);
    
    // Usar el endpoint principal del pedido que ya incluye los detalles
    const response = await axios.get(
      `${API_URL}pedidos/${id}/`,  // Usar la ruta raíz del pedido
      { 
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500 // No lanzar excepción para códigos 4xx
      }
    );
    
    console.log(`✅ Detalles del pedido #${id} obtenidos:`, response.data);
    
    // Verificar permisos
    const userRole = getUserRole();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Si es cliente, solo puede ver sus propios pedidos
    if (userRole === 'cliente' && response.data.usuario_id !== userData.id) {
      throw new Error('No tiene permiso para ver los detalles de este pedido');
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error al obtener detalles del pedido #${id}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Mejorar los mensajes de error
    if (error.response?.status === 401) {
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    } else if (error.response?.status === 403) {
      throw new Error('No tiene permiso para ver este pedido');
    } else if (error.response?.status === 404) {
      throw new Error('El pedido solicitado no fue encontrado');
    } else if (error.request) {
      throw new Error('No se pudo conectar al servidor. Verifique su conexión a internet.');
    } else {
      throw error; // Lanzar el error original si no es de red ni de la API
    }
  }
};

/**
 * Obtener alertas de inventario bajo (solo para administradores y empleados)
 * @returns {Promise<Array>} Lista de medicamentos con stock bajo
 */
export const getAlertasMedicamentos = async () => {
  const defaultResponse = { stock_bajo: [], proximo_vencimiento: [] };
  
  try {
    // Verificar si el usuario tiene permisos
    const userRole = getUserRole();
    
    if (!['admin', 'empleado'].includes(userRole)) {
      console.log('Usuario sin permisos para ver alertas. Rol actual:', userRole);
      return defaultResponse;
    }
    
    // Intentar con el endpoint de alertas
    try {
      const response = await axios.get(
        `${API_URL}pedidos/alertas/stock-bajo/`,
        { 
          headers: getAuthHeaders(),
          validateStatus: status => status < 500 // No lanzar error para códigos 4xx
        }
      );
      
      // Si la respuesta es exitosa, devolver los datos
      if (response.status >= 200 && response.status < 300) {
        return response.data || defaultResponse;
      }
      
      console.warn('Respuesta inesperada del servidor:', response.status, response.data);
    } catch (apiError) {
      console.warn('Error al obtener alertas de stock:', apiError.message);
      
      // Si falla, intentar con el endpoint alternativo
      try {
        const altResponse = await axios.get(
          `${API_URL}inventario/alertas/`,
          { 
            headers: getAuthHeaders(),
            validateStatus: status => status < 500
          }
        );
        
        if (altResponse.status >= 200 && altResponse.status < 300) {
          return altResponse.data || defaultResponse;
        }
      } catch (altError) {
        console.warn('Error al intentar endpoint alternativo:', altError.message);
      }
    }
    
    return defaultResponse;
  } catch (error) {
    console.error("Error al obtener alertas de stock:", error);
    throw error;
  }
};

/* ========================================================
   👥 GESTIÓN DE CLIENTES
========================================================= */

/**
 * Obtener la lista de clientes (solo para administradores y empleados)
 * @returns {Promise<Array>} Lista de clientes
 */
export const getClientes = async () => {
  try {
    // Intentamos con diferentes endpoints comunes para obtener la lista de clientes
    const endpoints = [
      `${API_URL}usuarios/?rol=cliente`,
      `${API_URL}clientes/`,
      `${API_URL}usuarios/`
    ];
    
    let lastError = null;
    
    // Probamos cada endpoint hasta que uno funcione
    for (const endpoint of endpoints) {
      try {
        console.log(`Intentando con el endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers: getAuthHeaders()
        });
        
        console.log('📋 Respuesta del servidor:', response);
        
        // Si la respuesta es exitosa, retornamos los datos
        if (response.status === 200) {
          // Si la respuesta tiene la propiedad 'results', la usamos (común en APIs paginadas)
          const data = response.data.results || response.data;
          console.log('📋 Clientes obtenidos:', data);
          return Array.isArray(data) ? data : [data];
        }
      } catch (err) {
        console.warn(`Error con el endpoint ${endpoint}:`, err.message);
        lastError = err;
        // Continuamos con el siguiente endpoint
        continue;
      }
    }
    
    // Si ningún endpoint funcionó, lanzamos el último error
    throw lastError || new Error('No se pudo obtener la lista de clientes');
    
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    // En caso de error, devolvemos un array vacío para que la aplicación no falle
    return [];
  }
};

/* ========================================================
   🔵 FUNCIONES ADICIONALES PARA ADMIN/EMPLEADO
========================================================= */

/**
 * Obtener estadísticas de pedidos (solo para administradores y empleados)
 * @returns {Promise<Object>} Estadísticas de pedidos
 */
export const getEstadisticasPedidos = async () => {
  try {
    if (!isAuthorized(['admin', 'empleado'])) {
      throw new Error('Solo administradores y empleados pueden ver las estadísticas');
    }
    
    const response = await axios.get(
      `${API_URL}pedidos/estadisticas/`,
      { headers: getAuthHeaders() }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas de pedidos:", error);
    throw error;
  }
};

/**
 * Buscar pedidos por filtros (solo para administradores y empleados)
 * @param {Object} filtros - Filtros de búsqueda
 * @param {string} [filtros.estado] - Estado del pedido
 * @param {string} [filtros.fecha_desde] - Fecha desde (YYYY-MM-DD)
 * @param {string} [filtros.fecha_hasta] - Fecha hasta (YYYY-MM-DD)
 * @param {number} [filtros.usuario_id] - ID del usuario
 * @returns {Promise<Array>} Lista de pedidos que coinciden con los filtros
 */
export const buscarPedidos = async (filtros = {}) => {
  try {
    if (!isAuthorized(['admin', 'empleado'])) {
      throw new Error('Solo administradores y empleados pueden buscar pedidos');
    }
    
    // Limpiar filtros vacíos
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    
    const response = await axios.get(
      `${API_URL}pedidos/buscar/`,
      {
        params,
        headers: getAuthHeaders()
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error al buscar pedidos:", error);
    throw error;
  }
};

/* ========================================================
   🔵 EXPORTACIÓN GLOBAL
======================================================== */

export default {
  // Funciones para clientes
  crearPedido,
  getMisPedidos,
  obtenerPedidosUsuario,
  
  // Funciones para administradores y empleados
  getPedidos,
  getPedidoById,
  getPedidosActivos,
  cambiarEstadoPedido,
  getDetallesPedido,
  getAlertasMedicamentos,
  getEstadisticasPedidos,
  buscarPedidos,
  
  // Funciones de utilidad
  isAuthorized,
  getUserRole
};

// Compatibilidad: alias para nombres usados en versiones previas
export { cambiarEstadoPedido as actualizarEstadoPedido };