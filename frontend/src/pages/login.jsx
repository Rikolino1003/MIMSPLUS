import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUsuario, getSavedCredentials } from "../services/api.js";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import SliderVerification from "../components/SliderVerification";
import { validateField, validateLoginForm } from "../utils/validations";
import "../styles/Login.css";

export default function Login() {
  const location = useLocation();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success'|'error'
  const [isVerified, setIsVerified] = useState(false);
  const [inactivityMessage, setInactivityMessage] = useState("");
  const navigate = useNavigate();

  // Cargar credenciales guardadas y mensajes al montar
  useEffect(() => {
    // Verificar si hay mensaje de cierre de sesión exitoso
    const logoutReason = sessionStorage.getItem('logoutReason');
    
    if (logoutReason === 'inactivity') {
      setInactivityMessage("Tu sesión se cerró por inactividad. Por favor, inicia sesión nuevamente.");
      sessionStorage.removeItem('logoutReason');
    } else if (logoutReason === 'success') {
      setInactivityMessage("Cierre de sesión exitoso. ¿Deseas volver al sitio web?");
      setMessageType('success');
      sessionStorage.removeItem('logoutReason');
    } else if (location.state?.message) {
      setInactivityMessage(location.state.message);
    }

    // Cargar credenciales guardadas
    const saved = getSavedCredentials();
    if (saved) {
      setFormData({
        username: saved.username || "",
        password: saved.password || ""
      });
      setRememberMe(true);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Limpiar errores generales cuando el usuario escribe
    if (error) setError("");
    
    // Validación en tiempo real para el campo modificado
    if (name === 'username' || name === 'password') {
      // Validar el campo actual
      const fieldError = validateField(name, value, newFormData);
      
      // Si es el campo de contraseña, también validar la fortaleza
      if (name === 'password') {
        const strength = passwordStrength(value);
        // Puedes usar esta información para mostrar la fortaleza de la contraseña
      }
      
      // Actualizar errores solo si hay un cambio
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  const validarForm = () => {
    // Validar todos los campos del formulario
    const formErrors = validateLoginForm(formData);
    
    // Verificar si hay errores de validación
    const hasErrors = Object.keys(formErrors).length > 0;
    
    // Si hay errores, mostrarlos
    if (hasErrors) {
      setErrors(formErrors);
      
      // Enfocar el primer campo con error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.focus();
      }
      
      return false;
    }
    
    // Si no hay errores, limpiar los mensajes de error
    setErrors({});
    return true;
  };

  const passwordStrength = (pwd) => {
    if (!pwd) return "vacía";
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return "fuerte";
    if (pwd.length >= 8) return "media";
    return "débil";
  };

  const handleVerification = () => {
    setIsVerified(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar que el slider de verificación esté completado
    if (!isVerified) {
      setError("Por favor, completa la verificación deslizando el control");
      return;
    }
    
    // Validar que el formulario esté completo
    const formErrors = validateLoginForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setLoading(true);
    setError("");
    setMessageType(null);

    try {
      const loginResponse = await loginUsuario(formData, rememberMe);
      
      // Verificar la respuesta del login
      if (!loginResponse || !loginResponse.usuario) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      const { usuario } = loginResponse;
      console.log("Usuario autenticado:", usuario);
      console.log("Rol del usuario:", usuario.rol);
      
      // Mostrar datos del usuario para depuración
      console.log("Datos completos del usuario:", usuario);
      console.log("Rol del usuario (raw):", usuario.rol);
      
      // Determinar la ruta de redirección basada en el rol registrado
      const getRedirectPath = () => {
        // ✅ Priorizar redirect_path del backend (si está disponible)
        if (loginResponse?.redirect_path) {
          console.log('Usando redirect_path del backend:', loginResponse.redirect_path);
          return loginResponse.redirect_path;
        }

        // Normalizar posibles fuentes del rol (campo simple, objeto rol_nuevo.nombre, rol_actual, groups)
        let roleRaw = '';
        try {
          if (usuario) {
            if (typeof usuario.rol === 'string' && usuario.rol.trim()) roleRaw = usuario.rol;
            else if (usuario.rol_nuevo && typeof usuario.rol_nuevo === 'object' && usuario.rol_nuevo.nombre) roleRaw = usuario.rol_nuevo.nombre;
            else if (usuario.rol_nuevo && typeof usuario.rol_nuevo === 'string') roleRaw = usuario.rol_nuevo;
            else if (usuario.rol_actual && typeof usuario.rol_actual === 'string') roleRaw = usuario.rol_actual;
            else if (Array.isArray(usuario.groups) && usuario.groups.length > 0) roleRaw = usuario.groups.join(' ');
          }
        } catch (e) {
          console.warn('No se pudo normalizar rol del usuario:', e);
        }

        const role = String(roleRaw || '').toLowerCase().trim();

        console.log('Rol procesado (robusto):', role);

        // Superuser / staff / rol con 'admin' -> panel administrativo
        if (usuario?.is_superuser || usuario?.is_staff || role.includes('admin')) {
          return '/paneladmin';
        }

        // Empleado / vendedor -> panel empleado
        if (role.includes('empleado') || role.includes('vendedor')) {
          return '/panelempleado';
        }

        // Por defecto -> perfil de cliente
        return '/perfilcliente';
      };

      const redirectPath = getRedirectPath();
      console.log('Redireccionando a:', redirectPath);

      // Navegar sin recargar la página (más rápido y menos intrusivo)
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Error en el login:", err);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let errorMessage = "Error al iniciar sesión. Por favor, inténtalo de nuevo.";
      
      // Manejar diferentes tipos de errores
      if (err.response) {
        // Error de la API
        if (err.response.status === 400 || err.response.status === 401) {
          errorMessage = err.response.data?.error || "Usuario o contraseña incorrectos.";
        } else if (err.response.status === 403) {
          errorMessage = "Tu cuenta está deshabilitada. Contacta al administrador.";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Error de red
        errorMessage = "No se pudo conectar al servidor. Verifica tu conexión a Internet.";
      } else if (err.message) {
        // Error en el código
        errorMessage = err.message;
      }
      
      if (newAttempts >= 3) {
        const blockTime = 5 * 60 * 1000; // 5 minutos
        setBlockedUntil(Date.now() + blockTime);
        errorMessage = "Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.";
      } else if (newAttempts > 1) {
        errorMessage += ` (Intento ${newAttempts} de 3)`;
      }
      
      setError(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">MIMS</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-600">Ingresa tus credenciales para acceder a tu cuenta</p>
        </motion.div>

        <AnimatePresence>
          {/* Mensaje de inactividad */}
          {inactivityMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    {inactivityMessage}
                    {inactivityMessage.includes("Cierre de sesión exitoso") && (
                      <button 
                        onClick={() => window.location.href = "/"}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-semibold underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      >
                        Volver al inicio
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mensajes de error generales */}
          {error && !inactivityMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {messageType === 'success' ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${messageType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              name="username"
              placeholder="Usuario"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleChange}
              aria-label="Usuario"
              aria-invalid={errors.username ? "true" : "false"}
              className={`input-default ${errors.username ? 'ring-2 ring-red-500 border-red-300' : 'border-gray-300'}`}
              required
            />
            {errors.username && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.username}
              </p>
            )}
          </div>

          <div className="relative">
            <input
              type={passwordVisible ? 'text' : 'password'}
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleChange}
              aria-label="Contraseña"
              aria-invalid={errors.password ? "true" : "false"}
              className={`input-default pr-11 ${errors.password ? 'ring-2 ring-red-500 border-red-300' : 'border-gray-300'}`}
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((v) => !v)}
              aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-1.5"
              title={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {passwordVisible ? (
                <EyeOff size={20} className="text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-600" />
              )}
            </button>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.password}
              </p>
            )}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div>Fortaleza: <strong className="ml-1 text-gray-700">{passwordStrength(formData.password)}</strong></div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="text-xs">Recordarme</span>
              </label>
            </div>
          </div>

          <div className="mt-6 mb-4">
            <SliderVerification onVerify={handleVerification} disabled={loading} />
            {!isVerified && error && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {error}
              </p>
            )}
          </div>

          <div className="relative">
            <button
              type="submit"
              disabled={loading || !isVerified || (blockedUntil && blockedUntil > Date.now())}
              className={`group w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || (blockedUntil && blockedUntil > Date.now())
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } transition-colors duration-200 shadow-sm`}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2 text-white" />
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2 text-indigo-200 group-hover:text-indigo-100" aria-hidden="true" />
                  Iniciar sesión
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p
            className="text-sm text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate("/recuperar")}
          >
            ¿Olvidaste tu contraseña?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ¿No tienes cuenta?{" "}
            <span
              className="text-green-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/registro")}
            >
              Regístrate aquí
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
