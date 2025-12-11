// src/pages/home.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { getValidToken, setAuthToken } from "../services/api.js";
import { ChevronLeft, ChevronRight, ShoppingCart, Filter, X, Star, TrendingUp } from "lucide-react";
import "../styles/pages/home.css";

// Constantes optimizadas
const API_BASE = "http://localhost:8000/api";
const API_CATALOGO = `${API_BASE}/inventario/catalogo/`;
const API_CATEGORIAS = `${API_BASE}/inventario/categorias/`;
const API_MEDICAMENTOS = `${API_BASE}/inventario/medicamentos-crud/`;
const PAGE_SIZE = 12;
const DEBOUNCE_DELAY = 300;

// Componente de imagen optimizado con lazy loading
const LazyImage = React.memo(({ src, alt, className, placeholder = "/placeholder.png" }) => {
  const [imgSrc, setImgSrc] = useState(src || placeholder);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Resetear cuando cambia src
    if (src) {
      setImgSrc(src);
      setError(false);
    } else {
      setImgSrc(placeholder);
    }
  }, [src, placeholder]);

  const handleError = () => {
    if (!error && imgSrc !== placeholder) {
      setError(true);
      setImgSrc(placeholder);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || "Imagen del producto"}
      className={className}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
});

LazyImage.displayName = 'LazyImage';

export default function Home({ carrito, setCarrito, carritoOpen, setCarritoOpen, agregarAlCarrito, reducirCantidad, eliminar, enviarPedido, estadisticasCarrito }) {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // filtros avanzados (servidor)
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [disponibleOnly, setDisponibleOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [valoracionMin, setValoracionMin] = useState(0);

  // Filtros
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [orden, setOrden] = useState("nombre_asc");
  
  // Refs para optimización
  const debounceTimer = useRef(null);
  const fetchAbortController = useRef(null);

  // Leer token y usuario (se actualiza cuando cambia el localStorage)
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario") || "{}"));

  // Permisos para mostrar el panel administrativo (normalizar formatos)
  const canAccessAdmin = Boolean(
    token && usuario && (
      usuario.is_superuser ||
      String(usuario.rol || "").toLowerCase().includes("admin") ||
      String(usuario.rol || "").toLowerCase().includes("empleado")
    )
  );

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUsuario(JSON.parse(localStorage.getItem("usuario") || "{}"));
    };
    
    window.addEventListener('storage', handleStorageChange);
    // También verificar periódicamente (por si el cambio fue en la misma pestaña)
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);


  // Contar filtros activos (memoizado)
  const filtrosActivos = useMemo(() => {
    let activos = 0;
    if (precioMin) activos++;
    if (precioMax) activos++;
    if (disponibleOnly) activos++;
    if (valoracionMin > 0) activos++;
    if (categoriaSeleccionada) activos++;
    if (categoriasSeleccionadas.length > 0) activos++;
    if (orden !== "nombre_asc") activos++;
    return activos;
  }, [precioMin, precioMax, disponibleOnly, valoracionMin, categoriaSeleccionada, categoriasSeleccionadas, orden]);

  // Debounce para búsqueda
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [busqueda]);

  // ==========================
  // Cargar categorías (solo una vez) - con autenticación si es necesario
  // ==========================
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        // Intentar con el endpoint público primero
        const res = await api.get("inventario/catalogo/categorias/");
        setCategorias(res.data || []);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
        // Si falla, intentar con el endpoint protegido
        try {
          const token = getValidToken();
          if (token) {
            setAuthToken(token);
            const res = await api.get("inventario/categorias/");
            setCategorias(res.data || []);
          } else {
            setCategorias([]);
          }
        } catch (err2) {
          console.error("Error al cargar categorías protegidas:", err2);
          setCategorias([]);
        }
      }
    };
    
    cargarCategorias();
  }, []);


  // ==========================
  // Fetch productos desde API con filtros (optimizado)
  // ==========================
  const fetchProductos = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    
    fetchAbortController.current = new AbortController();
    setLoading(true);
    
    try {
      // Asegurar que el token esté en los headers si existe
      const token = getValidToken();
      if (token) {
        setAuthToken(token);
      }
      
      const params = { page, page_size: PAGE_SIZE };
      if (categoriaSeleccionada) params.categoria = categoriaSeleccionada;
      if (categoriasSeleccionadas.length > 0) params.categorias = categoriasSeleccionadas.join(',');
      if (busquedaDebounced) params.q = busquedaDebounced;
      if (precioMin) params.precio_min = precioMin;
      if (precioMax) params.precio_max = precioMax;
      if (disponibleOnly) params.disponible = true;
      if (valoracionMin > 0) params.valoracion_min = valoracionMin;
      if (orden) params.orden = orden;
      if (disponibleOnly) params.disponible = true;

      // Intentar primero con la ruta de catálogo, si falla probar con medicamentos-crud
      let res;
      try {
        res = await api.get("inventario/catalogo/", { 
          params,
          signal: fetchAbortController.current.signal
        });
      } catch (catalogoError) {
        // Si falla el catálogo, intentar con medicamentos-crud
        if (catalogoError.response?.status === 404 || catalogoError.response?.status === 401) {
          res = await api.get("inventario/medicamentos-crud/", { 
            params,
            signal: fetchAbortController.current.signal
          });
        } else {
          throw catalogoError;
        }
      }
      
      // es paginado — respetar estructura
      if (res.data && res.data.results) {
        setProductos(res.data.results);
        setTotalCount(res.data.count);
      } else if (Array.isArray(res.data)) {
        setProductos(res.data);
        setTotalCount(res.data.length);
      } else {
        setProductos([]);
        setTotalCount(null);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error("Error al cargar medicamentos:", err);
        setProductos([]);
        setTotalCount(null);
      }
    } finally {
      setLoading(false);
      fetchAbortController.current = null;
    }
  }, [categoriaSeleccionada, categoriasSeleccionadas, busquedaDebounced, precioMin, precioMax, disponibleOnly, valoracionMin, orden, page]);

  // Llamar fetchProductos cuando cambian los filtros
  useEffect(() => {
    fetchProductos();
    return () => {
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
    };
  }, [fetchProductos]);

  // Resetear página cuando cambian los filtros (excepto page)
  useEffect(() => {
    setPage(1);
  }, [categoriaSeleccionada, categoriasSeleccionadas, busquedaDebounced, precioMin, precioMax, disponibleOnly, valoracionMin, orden]);

  const limpiarFiltros = useCallback(() => {
    setPrecioMin("");
    setPrecioMax("");
    setDisponibleOnly(false);
    setValoracionMin(0);
    setCategoriaSeleccionada(null);
    setCategoriasSeleccionadas([]);
    setBusqueda("");
    setOrden("nombre_asc");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 flex flex-col">
      {/* Bienvenida / Banner Mejorado */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-r from-blue-600 via-teal-500 to-green-500 text-white py-12 mt-6 px-6 rounded-b-3xl shadow-xl"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-extrabold mb-2">💊 Bienvenido a MIMS Plus</h2>
              <p className="text-blue-50 text-lg max-w-2xl">
                Encuentra los mejores medicamentos con garantía de calidad, asesoría farmacéutica profesional y envío rápido a todo el territorio colombiano
              </p>
            </div>
            {token && (
              <div className="text-right">
                <p className="text-sm text-blue-100">Bienvenido,</p>
                <p className="font-bold text-xl">{usuario.nombre_completo || usuario.username}</p>
              </div>
            )}
            {canAccessAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // Si es superuser o rol contiene 'admin' redirigir al Django admin
                    // Redirigir al panel administrativo del frontend (nuestra UI)
                    // para admins y empleados. Evitamos abrir el Django admin.
                    navigate('/paneladmin');
                  }}
                  className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-full shadow-md hover:shadow-lg focus:outline-none"
                  title="Ir al panel administrativo"
                >
                  🛠 Panel administrativo
                </button>
              </div>
            )}
          </div>
          {!token && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-yellow-300/20 border border-yellow-300 rounded-lg p-3 text-sm"
            >
              🔐 Inicia sesión para comenzar a agregar productos a tu carrito de compras
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto w-full px-6 py-8">
        {/* Barra de Filtros Consolidada y Mejorada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6"
        >
          {/* Búsqueda y Toggle */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Busca medicamentos, marca, dolencia..."
                className="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-blue-500 outline-none transition"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition ${
                mostrarFiltros
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500"
              }`}
            >
              <Filter size={18} />
              {filtrosActivos > 0 ? `Filtros (${filtrosActivos})` : 'Filtros'} {filtrosActivos > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 ml-1">{filtrosActivos}</span>}
            </motion.button>
          </div>

          {/* Panel de Filtros Colapsable */}
          {mostrarFiltros && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              {/* Fila 1: Ordenamiento, Valoración y Precio */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ordenar</label>
                  <select 
                    value={orden} 
                    onChange={(e) => { setOrden(e.target.value); setPage(1); }} 
                    className="w-full border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="nombre_asc">A - Z (Alfabético)</option>
                    <option value="nombre_desc">Z - A (Alfabético inverso)</option>
                    <option value="precio_asc">Precio: Menor a Mayor</option>
                    <option value="precio_desc">Precio: Mayor a Menor</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Valoración mínima</label>
                  <select
                    value={valoracionMin}
                    onChange={(e) => setValoracionMin(Number(e.target.value))}
                    className="w-full border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="0">Todas</option>
                    <option value="1">⭐ 1+</option>
                    <option value="2">⭐⭐ 2+</option>
                    <option value="3">⭐⭐⭐ 3+</option>
                    <option value="4">⭐⭐⭐⭐ 4+</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">💵 Precio</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" className="flex-1 border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-amber-200" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} />
                    <input type="number" placeholder="Max" className="flex-1 border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-amber-200" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Fila 2: Tipos de Fármaco (Categorías Múltiples) */}
              <div className="mb-6 border-t pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipos de Fármaco</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (categoriasSeleccionadas.includes(cat.id)) {
                          setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== cat.id));
                        } else {
                          setCategoriasSeleccionadas([...categoriasSeleccionadas, cat.id]);
                        }
                        setPage(1);
                      }}
                      className={`p-2 rounded-lg text-sm font-medium transition border ${categoriasSeleccionadas.includes(cat.id) ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-100'}`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 3: Checkboxes y Acciones */}
              <div className="border-t pt-4 flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-green-50 rounded-lg border border-green-200">
                  <input
                    type="checkbox"
                    checked={disponibleOnly}
                    onChange={(e) => { setDisponibleOnly(e.target.checked); setPage(1); }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">✅ Solo disponibles</span>
                </label>
                
                <div className="flex gap-2 ml-auto">
                  <button onClick={limpiarFiltros} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">🔄 Limpiar</button>
                  <button onClick={() => { setPrecioMin(''); setPrecioMax(''); setDisponibleOnly(false); setCategoriasSeleccionadas([]); setOrden('nombre_asc'); setPage(1); }} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">📋 Mostrar todos</button>
                  <button onClick={() => fetchProductos()} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:opacity-95">🔎 Aplicar</button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Catálogo - Grid de Productos Mejorado */}
        <motion.div
          className="w-full pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <motion.div
                className="col-span-full flex justify-center items-center py-12"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <p className="text-gray-600 text-lg">⏳ Cargando nuestro catálogo de medicamentos, por favor espera un momento...</p>
              </motion.div>
            ) : productos.length > 0 ? (
              productos.map((p, idx) => {
                const estaVencido = new Date(p.fecha_vencimiento) < new Date();
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    whileHover={{ y: -8 }}
                    className={`group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all overflow-hidden border-2 border-transparent hover:border-blue-300 ${
                      estaVencido ? "opacity-60" : ""
                    }`}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                      {p.imagen_url ? (
                        <LazyImage
                          src={p.imagen_url}
                          alt={p.nombre}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          placeholder="/placeholder.png"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <ShoppingCart size={48} className="text-gray-400" />
                        </div>
                      )}
                      {estaVencido && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold">PRODUCTO VENCIDO</span>
                        </div>
                      )}
                      {!token && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs bg-black/70 px-3 py-1.5 rounded-full font-medium">Inicia sesión para comprar</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-1">{p.nombre}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{p.descripcion || 'Descripción no disponible'}</p>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < (p.valoracion || 4) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({p.resenas_count || 0} opiniones)</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-xl font-bold text-green-600">${(p.precio_venta || p.precio || 0).toLocaleString("es-CO")}</p>
                        {p.precio_compra && (
                          <p className="text-xs line-through text-gray-400">${p.precio_compra?.toLocaleString("es-CO")}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-end text-xs mb-3">
                        <span className="text-gray-500 text-sm">{p.laboratorio || ""}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!token || estaVencido}
                        onClick={() => agregarAlCarrito(p)}
                        className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                          !token || estaVencido
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <ShoppingCart size={16} />
                        Agregar
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                className="col-span-full text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-gray-600 text-lg mb-3">❌ No hay medicamentos que coincidan con tus filtros</p>
                {filtrosActivos > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={limpiarFiltros}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Limpiar filtros
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>

          {/* Paginación Mejorada */}
          {totalCount !== null && totalCount > PAGE_SIZE && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-8 flex-wrap"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft size={20} />
              </motion.button>
              {[...Array(Math.ceil(totalCount / PAGE_SIZE))].map((_, i) => {
                const pageNum = i + 1;
                const showPage = pageNum === 1 || pageNum === Math.ceil(totalCount / PAGE_SIZE) || (pageNum >= page - 1 && pageNum <= page + 1);
                return (
                  showPage && (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        pageNum === page
                          ? "bg-blue-600 text-white shadow-lg"
                          : "border-2 border-gray-300 text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  )
                );
              })}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
                className="p-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Cart is now rendered globally by Layout */}

      {/* Footer Mejorado */}
      <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-800 text-white py-8 mt-12 border-t-4 border-blue-600">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div>
            <h4 className="font-bold text-lg mb-2">💊 MIMS Plus</h4>
            <p className="text-sm text-blue-100">Tu droguería de confianza desde 2015</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Información</h4>
            <ul className="text-sm text-blue-100 space-y-1">
              <li>✓ Envíos a toda Colombia</li>
              <li>✓ Atención al cliente 24/7</li>
              <li>✓ Medicamentos certificados</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Contacto</h4>
            <p className="text-sm text-blue-100">📞 +57 (1) 2345-6789</p>
            <p className="text-sm text-blue-100">✉️ info@mimsplus.co</p>
          </div>
        </div>
        <div className="border-t border-blue-700 mt-6 pt-4 text-center text-sm text-blue-200">
          © 2025 MIMS Plus - Todos los derechos reservados | Sitio seguro SSL
        </div>
      </footer>
    </div>
  );
}
