import React, { useState, useEffect } from "react";
import { registerUsuario, loginUsuario } from "../services/api";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff, Check } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { validateField, validateRegisterForm } from "../utils/validations";


// Importar estilos
import '../styles/registro.css';

// Componente para mostrar el indicador de campo requerido
const RequiredField = () => (
  <span className="text-red-500 ml-1">*</span>
);

// Componente para mostrar mensajes de error
const ErrorMessage = ({ message }) => (
  message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null
);

export default function Registro() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    nombre_completo: "",
    telefono: "",
    direccion: ""
  });
  
  const [mensaje, setMensaje] = useState("");
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const navigate = useNavigate();
  
  // Efecto para limpiar mensajes cuando se desmonta el componente
  useEffect(() => {
    return () => {
      setMensaje("");
      setMessageType(null);
    };
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    // Actualizar el estado del formulario
    const updatedFormData = {
      ...formData,
      [name]: fieldValue
    };
    
    setFormData(updatedFormData);
    
    // Validación en tiempo real para el campo modificado
    if (name !== 'confirmPassword') {
      const errorMessage = validateField(name, fieldValue, updatedFormData);
      
      // Actualizar errores solo si hay un cambio en la validación
      if ((errors[name] && !errorMessage) || (!errors[name] && errorMessage) || 
          (errors[name] && errors[name] !== errorMessage)) {
        setErrors({
          ...errors,
          [name]: errorMessage || null
        });
      }
    } else {
      // Manejar la validación de confirmación de contraseña
      const errorMessage = validateField('confirmPassword', fieldValue, updatedFormData);
      setErrors({
        ...errors,
        confirmPassword: errorMessage || null
      });
    }
    
    // Limpiar mensajes de éxito/error generales
    if (mensaje) {
      setMensaje("");
      setMessageType(null);
    }
  };

  const handleConfirm = (e) => {
    const { value } = e.target;
    
    // Actualizar el estado del formulario
    const updatedFormData = {
      ...formData,
      confirmPassword: value
    };
    
    setFormData(updatedFormData);
    
    // Validar la confirmación de contraseña
    const errorMessage = validateField('confirmPassword', value, updatedFormData);
    setErrors({
      ...errors,
      confirmPassword: errorMessage || null
    });
  };

  const validar = () => {
    // Validar todo el formulario
    const validationErrors = validateRegisterForm(formData, formData.confirmPassword);
    
    // Agregar emojis y formato a los mensajes de error
    const formattedErrors = {};
    
    Object.entries(validationErrors).forEach(([field, message]) => {
      switch(field) {
        case 'username':
          formattedErrors[field] = formData.username ? `👤 ${message}` : `👤 ${message}`;
          break;
        case 'email':
          formattedErrors[field] = formData.email ? `✉️ ${message}` : `✉️ ${message}`;
          break;
        case 'password':
          formattedErrors[field] = formData.password ? `🔒 ${message}` : `🔒 ${message}`;
          break;
        case 'confirmPassword':
          formattedErrors[field] = formData.confirmPassword ? `🔐 ${message}` : `🔐 ${message}`;
          break;
        case 'nombre_completo':
          formattedErrors[field] = formData.nombre_completo ? `👥 ${message}` : `👥 ${message}`;
          break;
        case 'telefono':
          formattedErrors[field] = formData.telefono ? `📱 ${message}` : `📱 ${message}`;
          break;
        case 'direccion':
          formattedErrors[field] = `🏠 ${message}`;
          break;
        default:
          formattedErrors[field] = message;
      }
    });
    
    setErrors(formattedErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'vacía' };
    
    let score = 0;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    const isLongEnough = password.length >= 8;
    const isVeryLong = password.length >= 12;
    
    // Puntaje por longitud
    if (isVeryLong) score += 2;
    else if (isLongEnough) score += 1;
    
    // Puntaje por complejidad
    if (hasUppercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecialChar) score += 1;
    
    // Determinar nivel de fortaleza
    if (score >= 5) return { score: 4, label: 'Muy fuerte' };
    if (score >= 4) return { score: 3, label: 'Fuerte' };
    if (score >= 3) return { score: 2, label: 'Media' };
    if (score >= 1) return { score: 1, label: 'Débil' };
    return { score: 0, label: 'Muy débil' };
  };
  
  const PasswordStrengthMeter = ({ password }) => {
    const { score, label } = calculatePasswordStrength(password);
    const strengthColors = [
      'bg-red-500',    // Muy débil
      'bg-yellow-400', // Débil
      'bg-blue-400',   // Media
      'bg-green-400',  // Fuerte
      'bg-green-600'   // Muy fuerte
    ];
    
    const strengthText = [
      'Muy débil',
      'Débil',
      'Media',
      'Fuerte',
      'Muy fuerte'
    ];
    
    const strengthDescriptions = [
      'Añade al menos 8 caracteres, incluyendo mayúsculas, números y caracteres especiales',
      'Añade más caracteres y complejidad para mejorar la seguridad',
      'Buena contraseña, pero podrías mejorarla',
      'Contraseña segura',
      '¡Excelente contraseña!'
    ];
    
    return (
      <div className="mt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Seguridad: {strengthText[score]}</span>
          <span className={`text-xs font-medium ${
            score < 2 ? 'text-red-600' : 
            score < 3 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {strengthText[score]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strengthColors[score]}`}
            style={{ width: `${(score / 4) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {strengthDescriptions[score]}
        </p>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validar()) {
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar datos para el registro
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        direccion: formData.direccion,
        rol: 'cliente' // Rol por defecto
      };
      
      // 1️⃣ Registrar usuario
      await registerUsuario(userData);
      
      // Mostrar mensaje de éxito
      setMensaje("✅ Usuario registrado correctamente");
      setMessageType('success');
      
      // 2️⃣ Login automático
      try {
        const loginData = {
          username: formData.username,
          password: formData.password,
        };
        
        const data = await loginUsuario(loginData);
        
        // Redirigir según el rol
        if (data.usuario.rol === "administrador") {
          navigate("/paneladmin");
        } else if (data.usuario.rol === "empleado") {
          navigate("/panelempleado");
        } else {
          navigate("/perfilCliente");
        }
        
      } catch (loginError) {
        // Si hay error en el login automático, redirigir a login
        console.error("Error en login automático:", loginError);
        navigate("/login", { 
          state: { 
            message: "Registro exitoso. Por favor inicia sesión.",
            messageType: "success",
            email: formData.email
          } 
        });
      }
      
      // Limpiar formulario
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        nombre_completo: "",
        telefono: "",
        direccion: ""
      });
      
      setErrors({});
      
    } catch (err) {
      console.error("Error en el registro:", err);
      
      // Manejar errores del servidor
      if (err.response && err.response.data) {
        const dataErr = err.response.data;
        
        // Si hay errores de validación del servidor
        if (dataErr.errors) {
          const serverErrors = {};
          Object.keys(dataErr.errors).forEach(key => {
            serverErrors[key] = dataErr.errors[key].msg || dataErr.errors[key];
          });
          setErrors(serverErrors);
          setMensaje("Por favor corrige los errores en el formulario");
          setMessageType('error');
        } 
        // Si hay un mensaje de error general
        else if (dataErr.message) {
          setMensaje(dataErr.message);
          setMessageType('error');
        } else {
          // Manejo de otros formatos de error del servidor
          const eMap = {};
          let errorMessage = "Error al procesar la solicitud";
          
          if (typeof dataErr === 'object') {
            Object.keys(dataErr).forEach((k) => {
              try {
                eMap[k] = Array.isArray(dataErr[k]) ? dataErr[k].join(', ') : String(dataErr[k]);
              } catch (error) {
                eMap[k] = 'Error en el campo';
              }
            });
            setErrors(eMap);
            
            // Crear un mensaje de error legible
            errorMessage = Object.entries(eMap)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
          } else {
            errorMessage = String(dataErr);
          }
          
          setMensaje(errorMessage);
          setMessageType('error');
        }
      } else {
        // Error de red o del servidor sin respuesta
        setMensaje("Error al conectar con el servidor. Por favor inténtalo de nuevo más tarde.");
        setMessageType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getBorderClass = (fieldName) => {
    return `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[fieldName] ? 'border-red-500' : 'border-gray-300'
    } ${formData[fieldName] && !errors[fieldName] ? 'border-green-500' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="md:flex">
            {/* Sidebar */}
            <div className="md:w-1/3 bg-gradient-to-b from-blue-600 to-blue-700 p-8 text-white">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">¡Bienvenido a MIMS!</h2>
                <p className="text-blue-100 mb-8">
                  Crea tu cuenta para acceder a todos nuestros servicios y ofertas exclusivas.
                </p>
                
                <div className="hidden md:block mt-12">
                  <h3 className="font-semibold mb-4">Beneficios de registrarte:</h3>
                  <ul className="space-y-3">
                    {[
                      'Acceso a ofertas exclusivas',
                      'Seguimiento de pedidos',
                      'Historial de compras',
                      'Atención personalizada'
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-300 mr-2" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Registration Form */}
            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Crear cuenta</h2>
                <div className="text-sm">
                  ¿Ya tienes una cuenta?{' '}
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Inicia sesión
                  </Link>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mensaje de éxito/error */}
                {mensaje && (
                  <div className={`p-4 rounded-lg ${
                    messageType === 'error' 
                      ? 'bg-red-50 border border-red-200 text-red-700' 
                      : 'bg-green-50 border border-green-200 text-green-700'
                  }`}>
                    {mensaje}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre de usuario */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de usuario <RequiredField />
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        className={getBorderClass('username')}
                        placeholder="Ej: juan123"
                        maxLength="20"
                      />
                      {formData.username && !errors.username && (
                        <Check className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <ErrorMessage message={errors.username} />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres, solo letras, números y _</p>
                  </div>
                  
                  {/* Correo electrónico */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico <RequiredField />
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={getBorderClass('email')}
                        placeholder="tucorreo@ejemplo.com"
                      />
                      {formData.email && !errors.email && (
                        <Check className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <ErrorMessage message={errors.email} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contraseña */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña <RequiredField />
                    </label>
                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type={passwordVisible ? "text" : "password"}
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          } ${formData.password && !errors.password ? 'border-green-500' : ''}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                        >
                          {passwordVisible ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {formData.password && <PasswordStrengthMeter password={formData.password} />}
                    </div>
                    <ErrorMessage message={errors.password} />
                    
                    {/* Requisitos de contraseña */}
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p>La contraseña debe contener:</p>
                      <ul className="list-disc pl-5">
                        <li className={formData.password?.length >= 8 ? 'text-green-600' : ''}>
                          Mínimo 8 caracteres
                        </li>
                        <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                          Al menos una mayúscula
                        </li>
                        <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                          Al menos un número
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                          Al menos un carácter especial
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Confirmar Contraseña */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar contraseña <RequiredField />
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={confirmPasswordVisible ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleConfirm}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        } ${formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        tabIndex="-1"
                      >
                        {confirmPasswordVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                        <Check className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <ErrorMessage message={errors.confirmPassword} />
                    
                    {/* Indicador de coincidencia de contraseñas */}
                    {formData.password && formData.confirmPassword && (
                      <div className="mt-2">
                        <div className={`text-xs ${
                          formData.password === formData.confirmPassword 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formData.password === formData.confirmPassword 
                            ? '✓ Las contraseñas coinciden'
                            : '✗ Las contraseñas no coinciden'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre completo */}
                  <div>
                    <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo <RequiredField />
                    </label>
                    <div className="relative">
                      <input
                        id="nombre_completo"
                        name="nombre_completo"
                        type="text"
                        value={formData.nombre_completo}
                        onChange={handleChange}
                        className={getBorderClass('nombre_completo')}
                        placeholder="Ej: Juan Pérez"
                      />
                      {formData.nombre_completo && !errors.nombre_completo && (
                        <Check className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <ErrorMessage message={errors.nombre_completo} />
                  </div>
                  
                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        className={getBorderClass('telefono')}
                        placeholder="Ej: 3001234567"
                      />
                      {formData.telefono && !errors.telefono && (
                        <Check className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <ErrorMessage message={errors.telefono} />
                    <p className="text-xs text-gray-500 mt-1">Ej: 3001234567 (opcional)</p>
                  </div>
                </div>
                
                {/* Dirección */}
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <div className="relative">
                    <input
                      id="direccion"
                      name="direccion"
                      type="text"
                      value={formData.direccion}
                      onChange={handleChange}
                      className={getBorderClass('direccion')}
                      placeholder="Ej: Calle 123 # 45-67"
                    />
                    {formData.direccion && !errors.direccion && (
                      <Check className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <ErrorMessage message={errors.direccion} />
                  <p className="text-xs text-gray-500 mt-1">(opcional)</p>
                </div>
                
                {/* Botón de registro */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading
                        ? 'bg-blue-400'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    } transition-colors duration-200`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                        Crear cuenta
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} MIMS - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}