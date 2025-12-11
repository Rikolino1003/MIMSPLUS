// src/pages/Catalogo.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter, ShoppingCart } from "lucide-react";
import {
  getCategoriasConMedicamentos,
  getCatalogo,
  getProveedores,
  getDrogueriasPublic,
} from "../services/inventarioServices.js";
import "../styles/pages/CatalogoMedicamentos.css";

const Catalogo = ({ carrito, setCarrito, agregarAlCarrito }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalCount, setTotalCount] = useState(null);

  const [proveedorQ, setProveedorQ] = useState("");
  const [proveedoresOpt, setProveedoresOpt] = useState([]);
  const [proveedorSelected, setProveedorSelected] = useState("");

  const [droguerias, setDroguerias] = useState([{ id: '', nombre: 'Cargando...' }]);
  const [drogueriaSelected, setDrogueriaSelected] = useState("");

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [disponibleOnly, setDisponibleOnly] = useState(false);
  const [vencidoOnly, setVencidoOnly] = useState(false);

  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [categoriaInicio, setCategoriaInicio] = useState(0);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [filtrosActivos, setFiltrosActivos] = useState(0);

  const provDebounce = useRef(null);
  const CATEGORIAS_VISIBLES = 5;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [catConMed, drogueriasData] = await Promise.all([
          getCategoriasConMedicamentos(),
          getDrogueriasPublic().catch(e => {
            console.error("Error cargando droguerías:", e);
            return [];
          })
        ]);
        
        setCategorias(catConMed || []);
        if (catConMed && catConMed.length > 0) setCategoriaActiva(catConMed[0].id);
        setDroguerias(Array.isArray(drogueriasData) ? drogueriasData : []);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setDroguerias([]);
        setError("No se pudieron cargar los datos del catálogo");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
    getDrogueriasPublic().then((r) => setDroguerias(r || [])).catch(() => setDroguerias([]));
  }, []);

  useEffect(() => {
    calcularFiltrosActivos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedorSelected, drogueriaSelected, precioMin, precioMax, disponibleOnly, vencidoOnly]);

  const calcularFiltrosActivos = () => {
    let count = 0;
    if (proveedorSelected) count++;
    if (drogueriaSelected) count++;
    if (precioMin) count++;
    if (precioMax) count++;
    if (disponibleOnly) count++;
    if (vencidoOnly) count++;
    setFiltrosActivos(count);
  };

  const fetchCatalogo = async (extraParams = {}) => {
    setCatLoading(true);
    try {
      const params = {
        page: extraParams.page || page,
        page_size: pageSize,
        categoria: categoriaActiva,
        proveedor: proveedorSelected,
      };
      if (precioMin) params.precio_min = precioMin;
      if (precioMax) params.precio_max = precioMax;
      if (drogueriaSelected) params.drogueria = drogueriaSelected;
      if (disponibleOnly) params.disponible = true;
      if (vencidoOnly) params.vencido = true;
      Object.assign(params, extraParams);

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
  }, [categoriaActiva, proveedorSelected, drogueriaSelected, precioMin, precioMax, disponibleOnly, vencidoOnly, page]);

  const handleProveedorInput = (q) => {
    setProveedorQ(q);
    if (provDebounce.current) clearTimeout(provDebounce.current);
    provDebounce.current = setTimeout(async () => {
      if (!q) return setProveedoresOpt([]);
      try {
        const res = await getProveedores(q, 1, 10);
        const items = res.results || res || [];
        setProveedoresOpt(items);
      } catch (e) {
        console.error("Error proveedores", e);
        setProveedoresOpt([]);
      }
    }, 300);
  };

  const aplicarProveedor = () => {
    // usar el valor del input como proveedor seleccionado y recargar
    setProveedorSelected(proveedorQ);
    setPage(1);
    fetchCatalogo({ page: 1 });
  };

  const aplicarFiltros = () => {
    setPage(1);
    fetchCatalogo({ page: 1 });
  };

  const limpiarFiltros = () => {
    setProveedorSelected("");
    setProveedorQ("");
    setPrecioMin("");
    setPrecioMax("");
    setDrogueriaSelected("");
    setDisponibleOnly(false);
    setVencidoOnly(false);
    setPage(1);
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

  const categoriaSeleccionada = categorias.find((cat) => cat.id === categoriaActiva);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
          Catálogo de Medicamentos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">Explora nuestros medicamentos filtrando por proveedor, droguería o categoría.</p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 overflow-hidden bg-white rounded-lg shadow-md p-2">
          <button onClick={moverCategoriasIzquierda} disabled={categoriaInicio === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-50">
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 overflow-x-auto flex gap-2">
            {categorias.slice(categoriaInicio, categoriaInicio + CATEGORIAS_VISIBLES).map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => manejarClickCategoria(cat.id)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${cat.id === categoriaActiva ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cat.nombre}
              </motion.button>
            ))}
          </div>

          <button onClick={moverCategoriasDerecha} disabled={categoriaInicio + CATEGORIAS_VISIBLES >= categorias.length} className="p-2 hover:bg-gray-100 rounded disabled:opacity-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {categoriaSeleccionada && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-4 border-l-4 border-green-600">
            <h2 className="text-xl font-bold text-slate-800">{categoriaSeleccionada.nombre}</h2>
            <p className="text-gray-700 mt-1">{categoriaSeleccionada.descripcion || 'Sin descripción'}</p>
          </div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setMostrarFiltros((s) => !s)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            <Filter size={18} />
            Filtros {filtrosActivos > 0 && <span className="bg-red-500 px-2 py-0.5 rounded text-xs font-bold">{filtrosActivos}</span>}
          </button>
          <p className="text-sm text-gray-600">Mostrando {productos.length} de {totalCount || 0} medicamentos</p>
        </div>
      </div>

      {mostrarFiltros && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
                <div className="relative">
                  <input type="text" placeholder="Buscar proveedor..." className="input-default" value={proveedorQ} onChange={(e) => handleProveedorInput(e.target.value)} />
                  <button onClick={aplicarProveedor} className="absolute right-2 top-2 px-2 py-1 bg-blue-600 text-white rounded text-xs">Buscar</button>
                  {proveedoresOpt.length > 0 && (
                    <ul className="absolute bg-white shadow rounded mt-1 max-h-40 overflow-auto w-full z-40 border">
                      {proveedoresOpt.map((p, i) => (
                        <li key={i} className="p-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setProveedorSelected(p); setProveedorQ(p); setProveedoresOpt([]); setPage(1); }}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Droguería</label>
                <select value={drogueriaSelected} onChange={(e) => { setDrogueriaSelected(e.target.value); setPage(1); }} className="input-default">
                  <option value="">Todas</option>
                  {Array.isArray(droguerias) && droguerias.length > 0 ? (
                    droguerias.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay droguerías disponibles</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Mínimo</label>
                <input type="number" placeholder="$0" className="input-default" value={precioMin} onChange={(e) => { setPrecioMin(e.target.value); setPage(1); }} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Máximo</label>
                <input type="number" placeholder="$999999" className="input-default" value={precioMax} onChange={(e) => { setPrecioMax(e.target.value); setPage(1); }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mb-4 border-t pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={disponibleOnly} onChange={(e) => { setDisponibleOnly(e.target.checked); setPage(1); }} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Sólo disponibles</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={vencidoOnly} onChange={(e) => { setVencidoOnly(e.target.checked); setPage(1); }} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Vencidos</span>
              </label>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={aplicarFiltros} className="flex-1 btn-primary text-sm">Aplicar filtros</button>
              <button onClick={limpiarFiltros} className="flex-1 btn-secondary text-sm">Limpiar todos los filtros</button>
            </div>
          </div>
        </motion.div>
      )}

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

                  {med.proveedor && <p className="text-xs text-gray-500 mb-2">📦 {med.proveedor}</p>}

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
