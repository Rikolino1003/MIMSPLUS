import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Check, ArrowRight, ArrowLeft, User, CreditCard, FileCheck } from "lucide-react";

const PASOS = [
  { id: 1, nombre: "Carrito", icono: ShoppingCart },
  { id: 2, nombre: "Datos", icono: User },
  { id: 3, nombre: "Confirmación", icono: FileCheck },
];

// Función para obtener el carrito desde localStorage
const getInitialCart = () => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  }
  return [];
};

export default function Cart({ carrito: propCarrito = [], carritoOpen = false, setCarritoOpen = () => {}, agregarAlCarrito = () => {}, reducirCantidad = () => {}, eliminar = () => {}, enviarPedido = () => {}, estadisticasCarrito = { cantidad: 0, items: 0, total: 0 } }) {
  const [localCarrito, setLocalCarrito] = React.useState([]);
  
  // Cargar carrito desde localStorage al montar el componente
  React.useEffect(() => {
    const savedCart = getInitialCart();
    setLocalCarrito(savedCart);
  }, []);
  
  // Usar el carrito de las props si existe, de lo contrario usar el local
  const carrito = (propCarrito && propCarrito.length > 0) ? propCarrito : localCarrito;
  
  // Sincronizar el carrito con localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined' && carrito.length > 0) {
      localStorage.setItem('cart', JSON.stringify(carrito));
    } else if (typeof window !== 'undefined' && carrito.length === 0) {
      localStorage.removeItem('cart');
    }
  }, [carrito]);
  const [pasoActual, setPasoActual] = useState(1);
  const [datosEnvio, setDatosEnvio] = useState({
    direccion_entrega: "",
    telefono_contacto: "",
    metodo_pago: "efectivo",
    
    notas: "",
  });
  const [errores, setErrores] = useState({});
  const [mensajeExito, setMensajeExito] = useState('');

  // Cargar datos del usuario si está logueado
  useEffect(() => {
    if (carritoOpen && pasoActual === 2) {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      setDatosEnvio(prev => ({
        ...prev,
        direccion_entrega: usuario.direccion || "",
        telefono_contacto: usuario.telefono || "",
      }));
    }
  }, [carritoOpen, pasoActual]);

  // Cargar carrito desde localStorage al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setLocalCarrito(JSON.parse(savedCart));
      }
    }
  }, []);

  // Resetear al cerrar
  useEffect(() => {
    if (!carritoOpen) {
      setPasoActual(1);
      setErrores({});
    }
  }, [carritoOpen]);

  const validarDatos = () => {
    const nuevosErrores = {};
    if (!datosEnvio.direccion_entrega.trim()) {
      nuevosErrores.direccion_entrega = "La dirección es requerida";
    }
    if (!datosEnvio.telefono_contacto.trim()) {
      nuevosErrores.telefono_contacto = "El teléfono es requerido";
    } else if (!/^[0-9+\-\s()]+$/.test(datosEnvio.telefono_contacto)) {
      nuevosErrores.telefono_contacto = "Teléfono inválido";
    }
    setErrores(nuevosErrores);
    
    // Mostrar mensaje de éxito si no hay errores
    if (Object.keys(nuevosErrores).length === 0) {
      setMensajeExito("Datos actualizados correctamente");
      setTimeout(() => setMensajeExito(''), 3000);
    }
    
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguientePaso = () => {
    if (pasoActual === 2 && !validarDatos()) {
      return;
    }
    if (pasoActual < 3) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const handleEnviarPedido = async () => {
    if (validarDatos()) {
      try {
        // Guardar datos en localStorage temporalmente para que enviarPedido los use
        localStorage.setItem('pedidoDatosTemporales', JSON.stringify(datosEnvio));
        const resultado = await enviarPedido();
        
        if (resultado && resultado.id) {
          // Mostrar mensaje de éxito
          setMensajeExito(`¡Pedido #${resultado.id} realizado con éxito!`);
          
          // Limpiar estados después de enviar el pedido
          setPasoActual(1);
          setDatosEnvio({
            direccion_entrega: "",
            telefono_contacto: "",
            metodo_pago: "efectivo",
            notas: "",
          });
          
          // Limpiar el carrito
          setLocalCarrito([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cart');
          }
          
          // Ocultar el mensaje después de 5 segundos
          setTimeout(() => {
            setMensajeExito('');
          }, 5000);
        }
        
      } catch (error) {
        console.error("Error al enviar el pedido:", error);
        alert("Ocurrió un error al procesar tu pedido. Por favor, inténtalo de nuevo.");
      } finally {
        // Asegurarse de limpiar el temporal incluso si hay un error
        localStorage.removeItem('pedidoDatosTemporales');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosEnvio(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{ x: carritoOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 right-0 h-screen w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col transition-all duration-300 ${
          carritoOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-5 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={24} /> Mi Pedido
          </h3>
          <motion.button whileHover={{ scale: 1.2 }} onClick={() => setCarritoOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={24} />
          </motion.button>
        </div>

        {/* Indicador de Pasos */}
        {carrito.length > 0 && (
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between mb-2">
              {PASOS.map((paso, index) => {
                const Icono = paso.icono;
                const estaCompleto = pasoActual > paso.id;
                const estaActivo = pasoActual === paso.id;
                
                return (
                  <React.Fragment key={paso.id}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        estaCompleto ? "bg-green-500 text-white" : estaActivo ? "bg-blue-600 text-white scale-110" : "bg-gray-200 text-gray-500"
                      }`}>
                        {estaCompleto ? <Check size={20} /> : <Icono size={18} />}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${estaActivo ? "text-blue-600" : "text-gray-500"}`}>
                        {paso.nombre}
                      </span>
                    </div>
                    {index < PASOS.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 transition-all ${
                        estaCompleto ? "bg-green-500" : "bg-gray-200"
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
{carrito.length > 0 ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {/* Paso 1: Carrito */}
              {pasoActual === 1 && (
                <motion.div
                  key="paso1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
            {/* Mensaje de éxito */}
            {mensajeExito && (
              <motion.div 
                key="mensaje-exito"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mx-4 mt-2 rounded-r"
              >
                <div className="flex items-center">
                  <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">{mensajeExito}</p>
                </div>
              </motion.div>
            )}
            
            <div className="bg-white border-b p-4 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{carrito.length}</p>
                <p className="text-xs text-gray-600">Productos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {carrito.reduce((total, item) => total + (item.cantidad || 0), 0)}
                </p>
                <p className="text-xs text-gray-600">Unidades</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-teal-600">
                  ${carrito.reduce((total, item) => {
                    const precio = item.precio_venta || item.precio || 0;
                    return total + (precio * (item.cantidad || 0));
                  }, 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {carrito.map((p) => {
                const precioUnitario = p.precio_venta || p.precio || 0;
                const subtotal = precioUnitario * p.cantidad;
                
                return (
                  <motion.div 
                    key={p.id} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    layout
                    className="bg-white rounded-lg p-3 border-2 border-gray-100 hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-gray-800 text-sm flex-1">{p.nombre}</p>
                      <motion.button 
                        whileHover={{ scale: 1.2, rotate: 90 }} 
                        whileTap={{ scale: 0.9 }} 
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors ml-2" 
                        onClick={() => eliminar(p.id)}
                        title="Eliminar producto"
                      >
                        <X size={14} />
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      ${precioUnitario.toLocaleString("es-CO")} c/u
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2 items-center flex-1">
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          className="bg-gray-200 text-gray-800 w-8 h-8 rounded font-bold hover:bg-gray-300 transition-colors flex items-center justify-center" 
                          onClick={() => reducirCantidad(p.id)}
                          disabled={p.cantidad <= 1}
                          title="Reducir cantidad"
                        >
                          −
                        </motion.button>
                        <motion.span 
                          key={p.cantidad}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="px-3 py-1 font-bold text-gray-800 min-w-[2rem] text-center"
                        >
                          {p.cantidad}
                        </motion.span>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          className="bg-blue-200 text-blue-800 w-8 h-8 rounded font-bold hover:bg-blue-300 transition-colors flex items-center justify-center" 
                          onClick={() => agregarAlCarrito(p)}
                          title="Aumentar cantidad"
                        >
                          +
                        </motion.button>
                      </div>
                      <motion.p 
                        key={subtotal}
                        initial={{ scale: 1.1, color: "#10b981" }}
                        animate={{ scale: 1, color: "#059669" }}
                        className="text-sm font-bold text-green-600 ml-auto"
                      >
                        ${subtotal.toLocaleString("es-CO")}
                      </motion.p>
                  </div>
                </motion.div>
                );
              })}
            </div>

                  <div className="bg-white border-t-2 border-gray-200 p-4">
                    <div className="flex justify-between items-center text-lg font-bold mb-3">
                <span>Total:</span>
                      <motion.span 
                        key={estadisticasCarrito.total}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="text-2xl text-green-600 font-extrabold"
                      >
                        ${estadisticasCarrito.total.toLocaleString("es-CO")}
                      </motion.span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                      onClick={siguientePaso}
                    >
                      Continuar <ArrowRight size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Paso 2: Datos de Envío */}
              {pasoActual === 2 && (
                <motion.div
                  key="paso2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Mensaje de éxito específico para el paso 2 */}
                  {mensajeExito && mensajeExito.includes('actualizados') && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mx-4 mt-2 rounded-r"
                    >
                      <div className="flex items-center">
                        <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                        <p className="text-sm">{mensajeExito}</p>
                      </div>
                    </motion.div>
                  )}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tu Carrito de Compras</h2>
                    <button
                      onClick={() => setCarritoOpen(false)}
                      className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 -mr-1 sm:-mr-2"
                      aria-label="Cerrar carrito"
                    >
                      <X size={20} className="sm:size-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dirección de Entrega *
                      </label>
                      <textarea
                        name="direccion_entrega"
                        value={datosEnvio.direccion_entrega}
                        onChange={handleChange}
                        placeholder="Ingresa tu dirección completa"
                        rows={3}
                        className={`w-full border-2 rounded-lg p-3 focus:outline-none transition ${
                          errores.direccion_entrega ? "border-red-500" : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      {errores.direccion_entrega && (
                        <p className="text-red-500 text-xs mt-1">{errores.direccion_entrega}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono de Contacto *
                      </label>
                      <input
                        type="tel"
                        name="telefono_contacto"
                        value={datosEnvio.telefono_contacto}
                        onChange={handleChange}
                        placeholder="Ej: +57 300 123 4567"
                        className={`w-full border-2 rounded-lg p-3 focus:outline-none transition ${
                          errores.telefono_contacto ? "border-red-500" : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      {errores.telefono_contacto && (
                        <p className="text-red-500 text-xs mt-1">{errores.telefono_contacto}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Método de Pago *
                      </label>
                      <div className="space-y-2">
                        {["efectivo", "tarjeta", "transferencia"].map((metodo) => (
                          <label key={metodo} className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition hover:bg-blue-50" style={{ borderColor: datosEnvio.metodo_pago === metodo ? "#2563eb" : "#e5e7eb" }}>
                            <input
                              type="radio"
                              name="metodo_pago"
                              value={metodo}
                              checked={datosEnvio.metodo_pago === metodo}
                              onChange={handleChange}
                              className="mr-3"
                            />
                            <CreditCard size={18} className="mr-2 text-gray-600" />
                            <span className="capitalize">{metodo === "tarjeta" ? "Tarjeta de crédito/débito" : metodo === "transferencia" ? "Transferencia bancaria" : "Efectivo"}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notas Adicionales (Opcional)
                      </label>
                      <textarea
                        name="notas"
                        value={datosEnvio.notas}
                        onChange={handleChange}
                        placeholder="Instrucciones especiales para la entrega..."
                        rows={3}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div className="bg-white border-t-2 border-gray-200 p-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition"
                      onClick={pasoAnterior}
                    >
                      <ArrowLeft size={20} /> Volver
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                      onClick={siguientePaso}
                    >
                      Continuar <ArrowRight size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Paso 3: Confirmación */}
              {pasoActual === 3 && (
                <motion.div
                  key="paso3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <Check size={20} />
                        <h4 className="font-bold">Resumen del Pedido</h4>
                      </div>
                      <p className="text-sm text-green-600">Revisa los detalles antes de confirmar</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <h5 className="font-bold text-gray-800 mb-3">Datos de Entrega</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-semibold">Dirección:</span> {datosEnvio.direccion_entrega}</p>
                        <p><span className="font-semibold">Teléfono:</span> {datosEnvio.telefono_contacto}</p>
                        <p><span className="font-semibold">Método de Pago:</span> <span className="capitalize">{datosEnvio.metodo_pago === "tarjeta" ? "Tarjeta de crédito/débito" : datosEnvio.metodo_pago === "transferencia" ? "Transferencia bancaria" : "Efectivo"}</span></p>
                        {datosEnvio.notas && (
                          <p><span className="font-semibold">Notas:</span> {datosEnvio.notas}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold text-gray-800">Productos ({estadisticasCarrito.cantidad})</h5>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPasoActual(1)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
                        >
                          Modificar
                        </motion.button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {carrito.map((p) => {
                          const precioUnitario = p.precio_venta || p.precio || 0;
                          const subtotal = precioUnitario * p.cantidad;
                          
                          return (
                            <motion.div 
                              key={p.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-between text-sm border-b pb-2"
                            >
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{p.nombre}</span>
                                <span className="text-gray-500 text-xs ml-2">x {p.cantidad}</span>
                              </div>
                              <span className="font-semibold text-gray-900">${subtotal.toLocaleString("es-CO")}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total a Pagar:</span>
                        <motion.span 
                          key={estadisticasCarrito.total}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-extrabold text-green-600"
                        >
                          ${estadisticasCarrito.total.toLocaleString("es-CO")}
                        </motion.span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-t-2 border-gray-200 p-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition"
                      onClick={pasoAnterior}
                    >
                      <ArrowLeft size={20} /> Volver
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                      onClick={handleEnviarPedido}
                    >
                      <FileCheck size={20} /> Confirmar Pedido
                    </motion.button>
              </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-xs mx-auto"
            >
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-blue-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShoppingCart size={40} className="text-blue-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Tu carrito está vacío</h3>
              <p className="text-gray-600 mb-6">Explora nuestro catálogo y descubre increíbles productos</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCarritoOpen(false);
                  window.location.href = '/catalogo';
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                <span>Explorar catálogo</span>
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Overlay para cerrar carrito */}
      {carritoOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCarritoOpen(false)} className="fixed inset-0 bg-black/40 z-40" />
      )}

      {/* Botón Carrito Flotante */}
      <motion.button 
        initial={{ scale: 0 }} 
        animate={{ 
          scale: 1,
          rotate: carritoOpen ? 180 : 0,
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        }} 
        whileHover={{ scale: 1.1 }} 
        whileTap={{ scale: 0.9 }} 
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-full shadow-2xl z-40 flex items-center justify-center border-4 border-blue-400 hover:shadow-lg transition-all duration-300" 
        onClick={() => setCarritoOpen(!carritoOpen)}
        aria-label={carritoOpen ? "Cerrar carrito" : carrito.length > 0 ? "Abrir carrito" : "Ir al catálogo"}
      >
        {carritoOpen ? (
          <X size={24} />
        ) : (
          <>
            <ShoppingCart size={24} />
            {carrito.length > 0 && (
              <motion.span 
                key={estadisticasCarrito.items}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  transition: { type: 'spring', stiffness: 500, damping: 15 }
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
              >
                {estadisticasCarrito.items}
              </motion.span>
            )}
          </>
        )}
      </motion.button>
    </>
  );
}
