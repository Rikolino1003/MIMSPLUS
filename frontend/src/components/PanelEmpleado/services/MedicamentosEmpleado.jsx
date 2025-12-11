// src/components/PanelEmpleado/MedicamentosEmpleado.jsx
// Componente principal para la gestión de medicamentos por parte de empleados
// Incluye funcionalidades de búsqueda, filtrado y gestión de stock

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";  // Para animaciones
import { AlertCircle, X, Info } from "lucide-react";  // Íconos
import { getMedicamentos } from "../../../services/inventarioServices";
import { getMedicamentosDisponibles } from "../../../services/api";
import "../../../styles/empleadoDashboard.css";

const MedicamentosEmpleado = () => {
  // Estados del componente
  const [medicamentos, setMedicamentos] = useState([]);         // Lista de medicamentos
  const [page, setPage] = useState(1);                           // Página actual para paginación
  const [pageSize] = useState(10);                               // Cantidad de ítems por página
  const [totalCount, setTotalCount] = useState(0);               // Total de medicamentos
  const [loading, setLoading] = useState(false);                 // Estado de carga
  const [busqueda, setBusqueda] = useState("");                  // Término de búsqueda
  const [filtroStock, setFiltroStock] = useState("todos");       // Filtro de stock actual
  const [alertas, setAlertas] = useState({                       // Alertas de stock bajo y vencimientos
    stock_bajo: [], 
    proximo_vencimiento: [] 
  });
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);  // Medicamento seleccionado para ver detalles
  const [mostrarModal, setMostrarModal] = useState(false);       // Control de visibilidad del modal

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const loadData = async () => {
      try {
        await cargarMedicamentos();
        
        // Verificar permisos antes de cargar alertas
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        const tienePermisos = usuario?.rol && ['admin', 'empleado'].includes(usuario.rol);
        
        if (tienePermisos && isMounted) {
          await cargarAlertas();
        } else if (isMounted) {
          setAlertas({ stock_bajo: [], proximo_vencimiento: [] });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    
    timeoutId = setTimeout(loadData, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [page, busqueda, filtroStock]);

  /**
   * Verifica si un medicamento está vencido
   * @param {string} fechaVencimiento - Fecha de vencimiento del medicamento
   * @returns {boolean} true si está vencido, false en caso contrario
   */
  const esVencido = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    return vencimiento < hoy;
  };

  /**
   * Carga los medicamentos desde la API según los filtros actuales
   * NOTA: Excluye automáticamente medicamentos vencidos
   * @returns {Promise<void>}
   */
  const cargarMedicamentos = async () => {
    setLoading(true);
    try {
      // Configuración de parámetros para la petición a la API
      const params = {
        page,                       // Página actual
        page_size: pageSize,        // Cantidad de ítems por página
        search: busqueda,           // Término de búsqueda
        stock: filtroStock === 'todos' ? '' : filtroStock  // Filtro de stock
      };

      // Realiza la petición a la API para obtener los medicamentos
      const response = await getMedicamentosDisponibles(params);
      
      if (response && response.data) {
        // Procesa la respuesta de la API
        const medicamentosData = response.data.results || response.data;
        const total = response.data.count || medicamentosData.length;
        
        // FILTRO: Excluir medicamentos vencidos
        const medicamentosNoVencidos = Array.isArray(medicamentosData) 
          ? medicamentosData.filter(med => !esVencido(med.fecha_vencimiento))
          : [];
        
        // Actualiza el estado con los datos obtenidos (sin vencidos)
        setMedicamentos(medicamentosNoVencidos);
        setTotalCount(medicamentosNoVencidos.length);
        
        console.log('Medicamentos cargados correctamente:', medicamentosData.length);
      } else {
        // Manejo de respuesta inesperada
        console.error('Formato de respuesta inesperado:', response);
        setMedicamentos([]);
        setTotalCount(0);
      }
      
    } catch (error) {
      console.error("Error al cargar medicamentos:", error);
      setMedicamentos([]);
      setTotalCount(0);
      
      // Mostrar mensaje de error en la interfaz
      // setError('No se pudieron cargar los medicamentos. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Estado para manejar mensajes flotantes
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  /**
   * Muestra un mensaje temporal en la interfaz
   * @param {string} texto - El mensaje a mostrar
   * @param {string} [tipo='exito'] - Tipo de mensaje (éxito, error, info)
   */
  const mostrarMensaje = (texto, tipo = 'exito') => {
    setMensaje({ texto, tipo });
    // El mensaje se oculta automáticamente después de 5 segundos
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  /**
   * Muestra un diálogo de confirmación al usuario
   * @param {string} mensaje - El mensaje a mostrar en el diálogo
   * @returns {boolean} true si el usuario confirma, false si cancela
   */
  const mostrarConfirmacion = (mensaje) => {
    return window.confirm(mensaje);
  };

  /**
   * Actualiza el stock de un medicamento en la base de datos
   * @param {number} medicamentoId - ID del medicamento a actualizar
   * @param {number} nuevoStock - Nueva cantidad de stock
   * @returns {Promise<void>}
   */
  const actualizarStock = async (medicamentoId, nuevoStock) => {
    // Mostrar diálogo de confirmación
    const confirmacion = mostrarConfirmacion(
      `¿Está seguro de actualizar el stock a ${nuevoStock} unidades?`
    );
    
    if (!confirmacion) {
      mostrarMensaje('❌ Operación cancelada por el usuario', 'info');
      return;
    }

    try {
      setLoading(true);
      
      // Actualización optimista del estado local para mejor experiencia de usuario
      setMedicamentos(prevMedicamentos => 
        prevMedicamentos.map(med => 
          med.id === medicamentoId 
            ? { ...med, stock_actual: parseInt(nuevoStock) } 
            : med
        )
      );
      
      // Llamada a la API para actualizar el stock en el servidor
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/inventario/medicamentos/${medicamentoId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_actual: parseInt(nuevoStock)
        })
      });
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error('Error al actualizar el stock');
      }
      
      // Sincronizar con los datos del servidor
      await cargarMedicamentos();
      
      // Mostrar mensaje de éxito
      mostrarMensaje(`✅ Stock actualizado correctamente a ${nuevoStock} unidades`, 'exito');
      
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      // En caso de error, volver a cargar los datos del servidor
      await cargarMedicamentos();
      mostrarMensaje('❌ Error al actualizar el stock. Verifique su conexión e intente nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marca un medicamento como agotado (stock = 0)
   * @param {number} medicamentoId - ID del medicamento a marcar como agotado
   * @param {string} nombreMedicamento - Nombre del medicamento para mostrar en mensajes
   * @returns {Promise<void>}
   */
  const marcarAgotado = async (medicamentoId, nombreMedicamento) => {
    // Mostrar diálogo de confirmación
    const confirmacion = mostrarConfirmacion(
      `¿Está seguro de marcar como agotado el medicamento "${nombreMedicamento}"?`
    );
    
    if (!confirmacion) {
      mostrarMensaje('❌ Operación cancelada por el usuario', 'info');
      return;
    }

    try {
      setLoading(true);
      
      // Actualización optimista del estado local
      setMedicamentos(prevMedicamentos => 
        prevMedicamentos.map(med => 
          med.id === medicamentoId 
            ? { ...med, stock_actual: 0 } 
            : med
        )
      );
      
      // Llamada a la API para actualizar el estado a agotado
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/inventario/medicamentos/${medicamentoId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_actual: 0
        })
      });
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error('Error al marcar como agotado');
      }
      
      // Sincronizar con los datos del servidor
      await cargarMedicamentos();
      
      // Mostrar mensaje de éxito
      mostrarMensaje(`✅ "${nombreMedicamento}" marcado como agotado correctamente`, 'exito');
      
    } catch (error) {
      console.error('Error al marcar como agotado:', error);
      // En caso de error, volver a cargar los datos del servidor
      await cargarMedicamentos();
      mostrarMensaje(`❌ Error al marcar "${nombreMedicamento}" como agotado. Intente nuevamente.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca medicamentos por nombre o código
   * @param {string} termino - Término de búsqueda
   */
  // Función para buscar medicamentos por nombre o código
  const buscarMedicamento = (termino) => {
    setBusqueda(termino);
    setPage(1); // Reiniciar a la primera página al buscar
  };

  /**
   * Filtra los medicamentos por estado de stock
   * @param {string} filtro - Filtro de stock (todos, agotado, bajo)
   */
  const filtrarPorStock = (filtro) => {
    setFiltroStock(filtro);
    setPage(1); // Reiniciar a la primera página al filtrar
  };
  // Función para abrir el modal de detalles
  const abrirModalDetalles = (medicamento) => {
    // Calcular días para vencer antes de abrir el modal
    const medicamentoConDias = {
      ...medicamento,
      diasParaVencer: getDiasParaVencer(medicamento.fecha_vencimiento)
    };
    setMedicamentoSeleccionado(medicamentoConDias);
    setMostrarModal(true);
  };

  // Función para cargar alertas de stock bajo
  const cargarAlertas = async () => {
    try {
      // Obtener todos los medicamentos
      const todosMedicamentos = await getMedicamentos();
      
      // Filtrar los que tienen stock bajo (menor o igual al stock mínimo)
      const stockBajo = Array.isArray(todosMedicamentos) 
        ? todosMedicamentos.filter(med => med.stock_actual <= (med.stock_minimo || 0))
        : [];
      
      // Filtrar los próximos a vencer (dentro de los próximos 30 días)
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);
      
      const proximosAVencer = Array.isArray(todosMedicamentos)
        ? todosMedicamentos.filter(med => {
            if (!med.fecha_vencimiento) return false;
            const fechaVencimiento = new Date(med.fecha_vencimiento);
            return fechaVencimiento >= hoy && fechaVencimiento <= en30Dias;
          })
        : [];
      
      setAlertas({
        stock_bajo: stockBajo,
        proximo_vencimiento: proximosAVencer
      });
    } catch (error) {
      console.error("Error al cargar alertas de inventario:", error);
      setAlertas({ stock_bajo: [], proximo_vencimiento: [] });
    }
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-CO");
  };

  const getDiasParaVencer = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const dias = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return dias;
  };

  const esProximoAVencer = (fecha) => {
    const dias = getDiasParaVencer(fecha);
    return dias !== null && dias >= 0 && dias <= 7;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Notificación de mensajes */}
      {mensaje.texto && (
        <motion.div 
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            mensaje.tipo === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' : 
            'bg-green-100 border-l-4 border-green-500 text-green-700'
          }`}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {mensaje.tipo === 'error' ? '❌' : '✅'}
            </span>
            <span>{mensaje.texto}</span>
          </div>
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-4 text-slate-800 flex items-center gap-2"
      >
        💊 Medicamentos Disponibles
      </motion.h2>

      <p className="text-sm text-slate-600 mb-4">
        Búsqueda, disponibilidad y alertas de stock/vencimiento
      </p>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total de Medicamentos */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Medicamentos</p>
              <p className="text-3xl font-bold text-blue-800 mt-1">{totalCount}</p>
            </div>
            <div className="p-3 bg-white/50 rounded-xl shadow-inner">
              <span className="text-2xl">💊</span>
            </div>
          </div>
        </motion.div>

        {/* Stock Bueno */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-sm border border-green-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Stock Bueno</p>
              <p className="text-3xl font-bold text-green-800 mt-1">
                {medicamentos.filter(med => med.stock_actual > (med.stock_minimo || 0)).length}
              </p>
            </div>
            <div className="p-3 bg-white/50 rounded-xl shadow-inner">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </motion.div>

        {/* Stock Bajo */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl shadow-sm border border-amber-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Stock Bajo</p>
              <p className="text-3xl font-bold text-amber-800 mt-1">
                {medicamentos.filter(med => med.stock_actual <= (med.stock_minimo || 0)).length}
              </p>
            </div>
            <div className="p-3 bg-white/50 rounded-xl shadow-inner">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </motion.div>
      </div>

      {(alertas.stock_bajo?.length > 0 ||
        alertas.proximo_vencimiento?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">⚠️ Alertas Activas</p>
                {alertas.stock_bajo?.length > 0 && (
                  <p className="text-sm text-amber-800">
                    {alertas.stock_bajo.length} medicamento(s) con stock bajo
                  </p>
                )}
                {alertas.proximo_vencimiento?.length > 0 && (
                  <p className="text-sm text-amber-800">
                    {alertas.proximo_vencimiento.length} medicamento(s) próximo a
                    vencer
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

      <div className="busqueda-filtros">
        <div className="busqueda-container">
          <input
            type="text"
            placeholder="Buscar medicamento por nombre..."
            value={busqueda}
            onChange={(e) => {
              // Solo actualizamos la búsqueda y la página, sin tocar el filtro de stock
              setBusqueda(e.target.value);
              setPage(1);
            }}
            className="busqueda-input"
          />

          <button
            onClick={() => {
              setBusqueda("");
              setFiltroStock("todos");
              setPage(1);
            }}
            className="btn-reset"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="filtros-container">
          <div className="filtro-grupo">
            <label className="filtro-label">Filtrar por Stock</label>
            <select
              value={filtroStock}
              onChange={(e) => {
                setFiltroStock(e.target.value);
                setPage(1);
              }}
              className="filtro-select"
            >
              <option value="todos">Todos los stocks</option>
              <option value="bajo">Stock bajo (≤ Mínimo)</option>
              <option value="medio">Stock medio</option>
              <option value="alto">Stock alto</option>
            </select>
          </div>
        </div>

        <div className="contador-resultados">
          Mostrando <span>{medicamentos.length}</span> de <span>{totalCount}</span> medicamentos
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">
          <div className="inline-block animate-spin">⏳</div>{" "}
          Cargando medicamentos...
        </div>
      ) : medicamentos.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm"
        >
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Medicamento
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Lote
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Ubicación
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Precio
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Stock Actual
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Mínimo
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Vencimiento (Vigentes)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {medicamentos.filter(med => !esVencido(med.fecha_vencimiento)).map((med) => {
                const diasVencer = getDiasParaVencer(med.fecha_vencimiento);
                const stockBajo = med.stock_actual <= med.stock_minimo;
                const vencimientoCercano =
                  esProximoAVencer(med.fecha_vencimiento);
                const vencido = esVencido(med.fecha_vencimiento);

                return (
                  <motion.tr
                    key={med.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border-b border-slate-100 transition ${
                      vencido ? 'bg-red-50 opacity-50' : 'hover:bg-blue-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {med.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        Categoría: {med.categoria?.nombre || "N/A"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {med.lote || "N/A"}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {med.ubicacion || "N/A"}
                    </td>

                    {/* CORRECCIÓN APLICADA */}
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ${Number(med.precio_venta ?? 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${stockBajo
                          ? "bg-red-100 text-red-700"
                          : med.stock_actual > 50
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {med.stock_actual}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-700 font-medium">
                      {med.stock_minimo}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {stockBajo && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          🔴 Bajo
                        </span>
                      )}

                      {!stockBajo && med.stock_actual > 50 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          ✅ OK
                        </span>
                      )}

                      {!stockBajo &&
                        med.stock_actual <= 50 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            ⚠️ Medio
                          </span>
                        )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="text-sm font-medium text-slate-700">
                        {formatoFecha(med.fecha_vencimiento)}
                      </div>

                      {vencimientoCercano && (
                        <div className="text-xs text-red-600 font-semibold flex items-center justify-center gap-1">
                          <Calendar size={12} /> {diasVencer}d
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="acciones-celda">
                        <button
                          onClick={() => abrirModalDetalles(med)}
                          className="btn-accion btn-ver"
                          title="Ver detalles"
                        >
                          <Info size={18} />
                        </button>
                        
                        <button
                          onClick={() => {
                            const nuevoStock = prompt(`Ingrese la nueva cantidad de stock para ${med.nombre}:`, med.stock_actual);
                            if (nuevoStock !== null && !isNaN(nuevoStock)) {
                              actualizarStock(med.id, parseInt(nuevoStock));
                            }
                          }}
                          className="btn-accion btn-editar"
                          title="Actualizar stock"
                          disabled={loading}
                        >
                          {loading ? (
                            <svg className="animate-spin" viewBox="0 0 24 24" width="18" height="18">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={() => marcarAgotado(med.id, med.nombre)}
                          className="btn-accion btn-eliminar"
                          title="Marcar como agotado"
                          disabled={loading || med.stock_actual === 0}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200"
        >
          <p className="text-slate-600 font-medium">
            No hay medicamentos que coincidan con tu búsqueda
          </p>
        </motion.div>
      )}

      {totalCount > pageSize && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition font-medium"
          >
            ← Anterior
          </button>

          <span className="px-4 py-2 text-sm font-semibold text-slate-700">
            Página {page} de {Math.ceil(totalCount / pageSize)}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(totalCount / pageSize)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition font-medium"
          >
            Siguiente →
          </button>
        </motion.div>
      )}

      {/* Modal de Detalles Mejorado */}
      <AnimatePresence>
        {mostrarModal && medicamentoSeleccionado && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{medicamentoSeleccionado.nombre}</h2>
                    <p className="text-blue-100 opacity-90">
                      {medicamentoSeleccionado.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    medicamentoSeleccionado.stock_actual <= medicamentoSeleccionado.stock_minimo
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {medicamentoSeleccionado.stock_actual} unidades en stock
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-6">
                    {/* Información Básica */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Información Básica</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-slate-500 w-32 flex-shrink-0">Categoría</span>
                          <span className="font-medium text-slate-800">{medicamentoSeleccionado.categoria?.nombre || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-slate-500 w-32 flex-shrink-0">Código de Barras</span>
                          <span className="font-mono bg-slate-50 px-2 py-1 rounded text-sm">
                            {medicamentoSeleccionado.codigo_barra || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-slate-500 w-32 flex-shrink-0">Ubicación</span>
                          <span className="font-medium text-slate-800">{medicamentoSeleccionado.ubicacion || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-slate-500 w-32 flex-shrink-0">Lote</span>
                          <span className="font-medium text-slate-800">{medicamentoSeleccionado.lote || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-slate-500 w-32 flex-shrink-0">Proveedor</span>
                          <span className="font-medium text-slate-800">{medicamentoSeleccionado.proveedor || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Precios */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.616 1.076 2.652 1.063A5.998 5.998 0 0016 8c0-3.314-3.134-6-7-6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Precios</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                          <span className="text-slate-600">Precio de Venta</span>
                          <span className="font-bold text-green-700">
                            ${Number(medicamentoSeleccionado.precio_venta || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <span className="text-slate-600">Costo de Compra</span>
                          <span className="font-medium text-slate-800">
                            ${Number(medicamentoSeleccionado.costo_compra || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-6">
                    {/* Inventario */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Inventario</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-slate-600">Stock Actual</span>
                          <span className="font-semibold text-slate-800">
                            {medicamentoSeleccionado.stock_actual.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                          <span className="text-slate-600">Stock Mínimo</span>
                          <span className="font-semibold text-amber-700">
                            {medicamentoSeleccionado.stock_minimo.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-slate-600">Stock Reservado</span>
                          <span className="font-medium text-slate-700">
                            {(medicamentoSeleccionado.stock_reservado || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                          <span className="text-slate-700 font-medium">Disponible</span>
                          <span className="font-bold text-blue-700">
                            {(medicamentoSeleccionado.stock_actual - (medicamentoSeleccionado.stock_reservado || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Fechas Importantes</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-slate-600">Fecha de Ingreso</span>
                          <span className="font-medium text-slate-800">
                            {formatoFecha(medicamentoSeleccionado.fecha_ingreso)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-slate-600">Vencimiento</span>
                          <span className="font-medium text-slate-800">
                            {formatoFecha(medicamentoSeleccionado.fecha_vencimiento)}
                          </span>
                        </div>
                        {medicamentoSeleccionado.fecha_vencimiento && (
                          <div className={`flex items-center justify-between p-3 rounded-lg ${
                            medicamentoSeleccionado.diasParaVencer <= 30 
                              ? 'bg-red-50' 
                              : 'bg-green-50'
                          }`}>
                            <span className="font-medium">Días para vencer</span>
                            <span className={`font-bold ${
                              medicamentoSeleccionado.diasParaVencer <= 30 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {medicamentoSeleccionado.diasParaVencer} días
                              {medicamentoSeleccionado.diasParaVencer <= 30 && (
                                <span className="ml-2 text-red-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicamentosEmpleado;
