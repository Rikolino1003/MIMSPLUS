import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter, ShoppingCart, X } from "lucide-react";
import { getCategoriasConMedicamentos, getCatalogo } from "../services/inventarioServices.js";
import "../styles/pages/CatalogoMedicamentos.css";

const Catalogo = ({ carrito, setCarrito, agregarAlCarrito }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalCount, setTotalCount] = useState(null);

  // droguería removida del frontend: filtrado centralizado eliminado

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [disponibleOnly, setDisponibleOnly] = useState(false);
  const [vencidoOnly, setVencidoOnly] = useState(false);
  
  const [orden, setOrden] = useState("nombre_asc");  // nuevo: orden A-Z
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);  // múltiples categorías

  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [categoriaInicio, setCategoriaInicio] = useState(0);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [filtrosActivos, setFiltrosActivos] = useState(0);

  const CATEGORIAS_VISIBLES = 5;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const catConMed = await getCategoriasConMedicamentos();
        setCategorias(catConMed || []);
        if (catConMed && catConMed.length > 0) setCategoriaActiva(catConMed[0].id);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar los datos del catálogo");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    calcularFiltrosActivos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioMin, precioMax, disponibleOnly, vencidoOnly, orden, categoriasSeleccionadas]);

  const calcularFiltrosActivos = () => {
    let count = 0;
    // droguería removida
    if (precioMin) count++;
    if (precioMax) count++;
    if (disponibleOnly) count++;
    if (vencidoOnly) count++;
    if (orden !== "nombre_asc") count++;
    if (categoriasSeleccionadas.length > 0) count++;
    setFiltrosActivos(count);
  };

  const fetchCatalogo = async (extraParams = {}) => {
    setCatLoading(true);
    try {
      const params = {
        page: extraParams.page || page,
        page_size: pageSize,
        categoria: categoriaActiva,
        orden: orden,
      };
      
      // incluir categorías seleccionadas si las hay
      if (categoriasSeleccionadas.length > 0) {
        params.categorias = categoriasSeleccionadas.join(',');
      }
      
      if (precioMin) params.precio_min = precioMin;
      if (precioMax) params.precio_max = precioMax;
      // droguería removida: no agregar parámetro
      if (disponibleOnly) params.disponible = true;
      if (vencidoOnly) params.vencido = true;
      Object.assign(params, extraParams);

      // Eliminar parámetros vacíos para no enviar, p. ej. categoria nula
      if (!params.categoria) delete params.categoria;
      if (params.categorias === "") delete params.categorias;

      const res = await getCatalogo(params);
      if (res && res.results) {
        setProductos(res.results);
        setTotalCount(res.count);
      } else {
        setProductos(res || []);
        setTotalCount(null);
      }
    } catch (e) {
      console.error("Error fetch catalogo", e);
      setProductos([]);
      setTotalCount(null);
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogo({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaActiva, precioMin, precioMax, disponibleOnly, vencidoOnly, orden, categoriasSeleccionadas, page]);

  const toggleCategoria = (catId) => {
    if (categoriasSeleccionadas.includes(catId)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== catId));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, catId]);
    }
    setPage(1);
  };

  const limpiarFiltros = () => {
    setCategoriasSeleccionadas([]);
    setPrecioMin("");
    setPrecioMax("");
    setDisponibleOnly(false);
    setVencidoOnly(false);
    setOrden("nombre_asc");
    setPage(1);
  };

  const mostrarTodos = () => {
    setCategoriasSeleccionadas([]);
    setCategoriaActiva(null);
    setPrecioMin("");
    setPrecioMax("");
    setDisponibleOnly(false);
    setVencidoOnly(false);
    setOrden("nombre_asc");
    setPage(1);
    fetchCatalogo({ page: 1, categoria: undefined, categorias: "" });
  };

  const manejarClickCategoria = (id) => {
    setCategoriaActiva(id);
    setPage(1);
    fetchCatalogo({ categoria: id, page: 1 });
  };

  const moverCategoriasIzquierda = () => setCategoriaInicio((s) => Math.max(0, s - 1));
  const moverCategoriasDerecha = () => setCategoriaInicio((s) => Math.min(s + 1, Math.max(0, categorias.length - CATEGORIAS_VISIBLES)));

  if (loading) return (
    <div className="flex items-center justify-center p-24">Cargando catálogo...</div>
  );

  if (error) return (
    <div className="flex items-center justify-center p-12 text-red-600">{error}</div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
          Catálogo de Medicamentos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">Encuentra los medicamentos que necesitas con nuestros filtros avanzados.</p>
      </motion.div>

      {/* BARRA DE FILTROS UNIFICADA */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMostrarFiltros((s) => !s)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
            <Filter size={18} />
            {mostrarFiltros ? "Ocultar" : "Mostrar"} Filtros {filtrosActivos > 0 && <span className="bg-red-500 px-2 py-0.5 rounded text-xs font-bold ml-1">{filtrosActivos}</span>}
          </button>
          <p className="text-sm text-gray-600 font-medium">📊 {productos.length} de {totalCount || 0} medicamentos</p>
        </div>

        {mostrarFiltros && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              
              {/* FILA 1: Ordenamiento y Rango de Precio (tarjetas compactas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">📋 Ordenar</label>
                  <select 
                    value={orden} 
                    onChange={(e) => { setOrden(e.target.value); setPage(1); }} 
                    className="w-full border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="nombre_asc">A → Z (Alfabético)</option>
                    <option value="nombre_desc">Z → A (Inverso)</option>
                    <option value="precio_asc">💰 Precio: Menor</option>
                    <option value="precio_desc">💰 Precio: Mayor</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">💵 Precio mínimo</label>
                  <input type="number" placeholder="0" className="w-full border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-amber-200" value={precioMin} onChange={(e) => { setPrecioMin(e.target.value); setPage(1); }} />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">💵 Precio máximo</label>
                  <input type="number" placeholder="999999" className="w-full border bg-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-amber-200" value={precioMax} onChange={(e) => { setPrecioMax(e.target.value); setPage(1); }} />
                </div>
              </div>

              {/* FILA 2: Tipos de Fármaco (Categorías) - Grid mejorado */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">💊 Tipos de Fármaco</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categorias.map((cat) => (
                    <motion.button 
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => toggleCategoria(cat.id)}
                      className={`flex items-center gap-2 justify-center text-sm font-medium p-2 rounded-lg transition border ${categoriasSeleccionadas.includes(cat.id) ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-100'}`}
                    >
                      <span className="truncate">{cat.nombre}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* FILA 3: Checkboxes de estado */}
              <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={disponibleOnly} onChange={(e) => { setDisponibleOnly(e.target.checked); setPage(1); }} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">✅ Solo disponibles</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={vencidoOnly} onChange={(e) => { setVencidoOnly(e.target.checked); setPage(1); }} className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">⚠️ Vencidos</span>
                </label>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-3 flex-wrap items-center">
                <button onClick={limpiarFiltros} className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50">
                  🔄 Limpiar
                </button>
                <button onClick={mostrarTodos} className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50">
                  📋 Mostrar todos
                </button>
                <button onClick={() => fetchCatalogo({ page: 1 })} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-md text-sm font-semibold shadow-sm hover:opacity-95">
                  🔎 Aplicar
                </button>
                {filtrosActivos > 0 && (
                  <div className="text-xs text-gray-500 ml-auto">{filtrosActivos} filtro{filtrosActivos > 1 ? 's' : ''}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {catLoading ? (
          <div className="flex justify-center py-12"><motion.p animate={{ opacity: [0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-gray-600 font-semibold">Cargando medicamentos...</motion.p></div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {productos.map((med, index) => (
              <motion.div key={med.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {med.imagen_url ? <img src={med.imagen_url} alt={med.nombre} className="h-full w-full object-cover" /> : <ShoppingCart size={48} className="text-gray-400" />}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 line-clamp-2 mb-2">{med.nombre}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{med.descripcion || 'Sin descripción'}</p>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-bold text-green-600">${med.precio_venta}</p>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {med.fecha_vencimiento && new Date(med.fecha_vencimiento) < new Date() ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">Vencido</span>
                      ) : med.stock_disponible > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Disponible</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">Agotado</span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => agregarAlCarrito && agregarAlCarrito(med)} className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:opacity-90 font-semibold text-sm transition">Añadir al carrito</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg font-semibold">No hay medicamentos que coincidan con tu búsqueda</p>
            {filtrosActivos > 0 && <button onClick={limpiarFiltros} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Limpiar filtros</button>}
          </div>
        )}
      </div>

      {totalCount !== null && Math.ceil(totalCount / pageSize) > 1 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100">← Anterior</button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(Math.ceil(totalCount / pageSize), page + 2)).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-2 rounded-lg font-semibold ${page === p ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{p}</button>
              ))}
            </div>
            <button onClick={() => setPage(Math.min(page + 1, Math.ceil(totalCount / pageSize)))} disabled={page >= Math.ceil(totalCount / pageSize)} className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogo;
