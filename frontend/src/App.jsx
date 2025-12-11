// src/App.jsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/home.jsx";
import CatalogoMedicamentos from "./pages/catalogo.jsx";
import Registro from "./pages/registro.jsx";
import Login from "./pages/login.jsx";
import PerfilCliente from "./pages/perfilcliente.jsx";
import PanelAdmin from "./pages/panelAdmin.jsx";
import EmpleadoDashboard from "./pages/empleadoDashboard.jsx";
import EnviarCorreoRecuperacion from "./pages/EnviarCorreoRecuperacion.jsx";
import CambiarPassword from "./pages/CambiarPassword.jsx";
import Acerca from "./pages/Acerca.jsx";
import Reseñas from "./pages/reseñas.jsx";
import Mensajes from "./pages/Mensajes.jsx";
import Contacto from "./pages/Contacto.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import Droguerias from "./pages/droguerias.jsx";
import Workspace from "./pages/Workspace.jsx";
import { isSessionValid, getValidToken, setAuthToken, clearAuthData } from "./services/api.js";
import { useInactivity } from "./hooks/useInactivity.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { DrogueriaProvider } from "./context/DrogueriaContext.jsx";

// 🔐 Ruta protegida por rol con detección de inactividad
const PrivateRoute = ({ children, allowedRoles }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [user, setUser] = useState(null);

  // Activar detección de inactividad solo cuando el usuario esté autenticado
  useInactivity(15000, isValid && !isValidating); // 15 segundos de inactividad

  useEffect(() => {
    // Validar sesión al montar el componente
    const validateSession = () => {
      if (isSessionValid()) {
        const token = getValidToken();
        if (token) {
          setAuthToken(token);
          try {
            const userData = JSON.parse(localStorage.getItem("usuario") || "{}");
            setUser(userData);
            setIsValid(true);
          } catch (error) {
            console.error("Error al parsear usuario:", error);
            setIsValid(false);
          }
        } else {
          setIsValid(false);
        }
      } else {
        setIsValid(false);
      }
      setIsValidating(false);
    };

    validateSession();
  }, []);

  if (isValidating) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles permitidos, permitir también si el usuario es superuser o staff.
  if (allowedRoles) {
    const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

    const candidates = [];
    if (user?.rol) candidates.push(String(user.rol).toLowerCase());
    if (user?.rol_nuevo?.nombre) candidates.push(String(user.rol_nuevo.nombre).toLowerCase());
    if (user?.rol_nuevo) candidates.push(String(user.rol_nuevo).toLowerCase());
    if (user?.rol_actual) candidates.push(String(user.rol_actual).toLowerCase());
    if (user?.groups && Array.isArray(user.groups)) candidates.push(user.groups.join(' ').toLowerCase());

    const hasRole = normalizedAllowed.some((ar) => candidates.some((c) => c === ar || c.includes(ar)));

    // Depuración: mostrar por qué se acepta o rechaza el acceso
    try {
      console.group("PrivateRoute debug");
      console.log("allowedRoles:", allowedRoles);
      console.log("normalizedAllowed:", normalizedAllowed);
      console.log("user:", user);
      console.log("candidates:", candidates);
      console.log("is_superuser:", user?.is_superuser, "is_staff:", user?.is_staff);
      console.log("hasRole:", hasRole);
      console.groupEnd();
    } catch (e) {
      // no-op en entornos sin consola
    }

    if (!(user?.is_superuser || user?.is_staff || hasRole)) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
};

export default function App() {
  const [carrito, setCarrito] = useState([]);
  const [carritoOpen, setCarritoOpen] = useState(false);

  // Validar sesión al cargar la aplicación
  useEffect(() => {
    const validateSessionOnLoad = () => {
      if (!isSessionValid()) {
        // Si la sesión expiró, limpiar datos
        clearAuthData();
      } else {
        // Si la sesión es válida, asegurar que el token esté en los headers
        const token = getValidToken();
        if (token) {
          setAuthToken(token);
        }
      }
    };

    validateSessionOnLoad();
  }, []);

  // Estadísticas del carrito (derivadas)
  const estadisticasCarrito = useMemo(() => ({
    cantidad: carrito.length,
    total: carrito.reduce((acc, p) => acc + ((p.precio || 0) * (p.cantidad || 0)), 0),
    items: carrito.reduce((acc, p) => acc + (p.cantidad || 0), 0),
  }), [carrito]);

  // Carrito helpers
  const agregarAlCarrito = useCallback((producto) => {
    const token = getValidToken();
    if (!token || !isSessionValid()) {
      alert("Debes iniciar sesión para agregar productos al pedido.");
      return;
    }
    
    if (!producto.stock_disponible || producto.stock_disponible <= 0) {
      alert(`${producto.nombre} no está disponible en este momento.`);
      return;
    }
    
    // Asegurarse de que el producto incluya el precio
    const productoConPrecio = {
      ...producto,
      precio: producto.precio_venta || producto.precio || 0
    };
    
    setCarrito(prevCarrito => {
      const existe = prevCarrito.find(p => p.id === productoConPrecio.id);
      
      if (existe) {
        if (existe.cantidad >= productoConPrecio.stock_disponible) {
          alert(`No hay más stock de ${productoConPrecio.nombre} disponible.`);
          return prevCarrito;
        }
        return prevCarrito.map(p => 
          p.id === productoConPrecio.id 
            ? { ...p, cantidad: p.cantidad + 1 } 
            : p
        );
      }
      
      return [...prevCarrito, { ...productoConPrecio, cantidad: 1 }];
    });
  }, []);

  const reducirCantidad = useCallback((id) => {
    setCarrito(prevCarrito => 
      prevCarrito
        .map(p => p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p)
        .filter(p => p.cantidad > 0)
    );
  }, []);

  const eliminar = useCallback((id) => {
    setCarrito(prevCarrito => prevCarrito.filter(p => p.id !== id));
  }, []);

  const enviarPedido = useCallback(async () => {
    try {
      const token = getValidToken();
      if (!token || !isSessionValid()) {
        alert("Debes iniciar sesión para enviar tu pedido.");
        return;
      }
      
      if (!carrito?.length) {
        alert("El carrito está vacío");
        return;
      }

      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      
      // Obtener datos del formulario si existen (del flujo de compra)
      const datosFormulario = JSON.parse(localStorage.getItem("pedidoDatosTemporales") || "{}");
      
      // Preparar los datos del pedido
      const pedidoData = {
        metodo_pago: datosFormulario.metodo_pago || "efectivo",
        direccion_entrega: datosFormulario.direccion_entrega || usuario.direccion || "Dirección no especificada",
        telefono_contacto: datosFormulario.telefono_contacto || usuario.telefono || "Sin teléfono",
        notas: datosFormulario.notas || "Pedido desde el carrito",
        // El backend espera el campo 'detalles' con { medicamento_id, cantidad }
        detalles: carrito.map(item => ({
          medicamento_id: Number(item.id),
          cantidad: Number(item.cantidad) || 1
        }))
      };

      console.log("Enviando pedido:", JSON.stringify(pedidoData, null, 2));

      const response = await axios.post(
        "http://127.0.0.1:8000/api/pedidos/crear-pedido/",
        pedidoData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.status === 201) {
        alert("✅ Pedido creado correctamente");
        setCarrito([]);
        setCarritoOpen(false);
        // Devolver el pedido creado al llamador (Cart.jsx espera un objeto con 'id')
        return response.data;
      }
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      
      let errorMessage = "Error al crear el pedido. Por favor, inténtalo de nuevo.";
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data) {
          errorMessage = data.error || 'Error de validación';
          if (data.details) {
            errorMessage += '\n' + JSON.stringify(data.details, null, 2);
          }
        } else if (status === 500) {
          errorMessage = 'Error interno del servidor';
          if (data?.error) {
            errorMessage += `: ${data.error}`;
            console.error('Detalles del error:', data.traceback);
          }
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      
      alert(errorMessage);
    }
  }, [carrito]);

  return (
    <DrogueriaProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Routes>
          <Route
            path="/"
            element={
              <Layout
                carrito={carrito}
                carritoOpen={carritoOpen}
                setCarritoOpen={setCarritoOpen}
                agregarAlCarrito={agregarAlCarrito}
                reducirCantidad={reducirCantidad}
                eliminar={eliminar}
                enviarPedido={enviarPedido}
                estadisticasCarrito={estadisticasCarrito}
                setCarrito={setCarrito}
              />
            }
          >
            <Route index element={<Navigate to="/home" replace />} />

            {/* 🌐 Rutas públicas */}
            <Route
              path="home"
              element={
                <Home 
                  carrito={carrito} 
                  setCarrito={setCarrito} 
                  carritoOpen={carritoOpen} 
                  setCarritoOpen={setCarritoOpen} 
                  agregarAlCarrito={agregarAlCarrito} 
                  reducirCantidad={reducirCantidad} 
                  eliminar={eliminar} 
                  enviarPedido={enviarPedido} 
                  estadisticasCarrito={estadisticasCarrito} 
                />
              }
            />
            <Route
              path="catalogo"
              element={
                <CatalogoMedicamentos 
                  carrito={carrito} 
                  setCarrito={setCarrito} 
                  agregarAlCarrito={agregarAlCarrito} 
                />
              }
            />
            <Route path="registro" element={<Registro />} />
            <Route path="login" element={<Login />} />
            <Route path="acerca" element={<Acerca />} />
            <Route path="reseñas" element={<Reseñas />} />
            <Route path="recuperar" element={<EnviarCorreoRecuperacion />} />
            <Route path="cambiar-contrasena" element={<CambiarPassword />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path="ofertas" element={<Ofertas />} />
            <Route path="*" element={<Navigate to="/" replace />} />

            {/* 🔒 Rutas privadas */}
            <Route
              path="perfilcliente"
              element={
                <PrivateRoute allowedRoles={["cliente"]}>
                  <PerfilCliente />
                </PrivateRoute>
              }
            />
            <Route
              path="paneladmin"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <PanelAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="panelempleado"
              element={
                <PrivateRoute allowedRoles={["empleado"]}>
                  <EmpleadoDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="mensajes"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Mensajes />
                </PrivateRoute>
              }
            />
            <Route
              path="droguerias"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Droguerias />
                </PrivateRoute>
              }
            />
            <Route path="workspace/:id" element={<Workspace />} />
          </Route>
        </Routes>
      </div>
    </ErrorBoundary>
    </DrogueriaProvider>
  );
}