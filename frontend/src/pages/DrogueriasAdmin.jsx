import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from 'react-router-dom'
import IconButton from '../components/IconButton'
import { User, Box, MessageCircle, FileText, Repeat, PlusSquare, ArrowRightCircle, X, Settings } from 'lucide-react'

export default function DrogueriasAdmin() {
  const [droguerias, setDroguerias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [selectedD, setSelectedD] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [inventarioLoading, setInventarioLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ origen: null, destino: null, medicamento: null, cantidad: 1 });
  const [msg, setMsg] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ nombre: '', codigo: '', direccion: '', ciudad: '', telefono: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/droguerias/");
        // Manejar respuesta: puede ser array o objeto con resultados
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
        setDroguerias(data);
      } catch (e) {
        console.error("Error cargando droguerias:", e);
        setError("No se pudieron cargar las droguerías");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const verInventario = async (drogueria) => {
    setSelectedD(drogueria);
    setInventarioLoading(true);
    setMedicamentos([]);
    try {
      const res = await API.get(`/inventario/by-drogueria/?drogueria=${drogueria.id}`);
      setMedicamentos(res.data.results || res.data || []);
    } catch (e) {
      console.error("Error cargando inventario:", e);
      setMsg({ type: 'error', text: 'No se pudo cargar inventario' });
    } finally {
      setInventarioLoading(false);
    }
  };

  // Acciones por droguería (usuarios, mensajes, facturas, pedidos)
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionData, setActionData] = useState([]);
  const [actionDrogueria, setActionDrogueria] = useState(null); // droguería del modal de acciones
  const [activeDrogueria, setActiveDrogueria] = useState(null); // droguería 'abierta' persistentemente
  const [selectedTab, setSelectedTab] = useState('empleados');
  const [infoOpen, setInfoOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [currentDrogueria, setCurrentDrogueria] = useState(null);
  
  const openAction = async (drogueria, type) => {
    setActionOpen(true);
    setActionType(type);
    setActionDrogueria(drogueria); // Guardar la droguería seleccionada
    setActionData([]);
    try {
      let res;
      switch (type) {
        case 'usuarios':
          res = await API.get(`droguerias/membresias/?drogueria=${drogueria.id}`);
          setActionData(res.data.results || res.data || []);
          break;
        case 'medicamentos':
          res = await API.get(`/inventario/by-drogueria/?drogueria=${drogueria.id}`);
          setActionData(res.data.results || res.data || []);
          break;
        case 'mensajes':
          // intentar conversaciones/mensajes relacionados
          res = await API.get(`droguerias/conversaciones/?drogueria=${drogueria.id}`);
          setActionData(res.data.results || res.data || []);
          break;
        case 'facturas':
          res = await API.get(`facturas/lista/?drogueria=${drogueria.id}`);
          setActionData(res.data.results || res.data || []);
          break;
        case 'pedidos':
          res = await API.get(`pedidos/pedidos/?drogueria=${drogueria.id}`);
          setActionData(res.data.results || res.data || []);
          break;
        default:
          setActionData([]);
      }
    } catch (e) {
      console.error('Error cargando acción:', e);
      setActionData([{ error: 'No se pudo cargar la información. Revisa la consola del navegador.' }]);
    }
  };

  const handleChangeRole = async (membresia, newRole) => {
    try {
      const res = await API.patch(`droguerias/membresias/${membresia.id}/`, { rol: newRole });
      // actualizar en estado
      setActionData(prev => prev.map(x => x.id === membresia.id ? res.data : x));
      setMsg({ type: 'success', text: 'Rol actualizado' });
    } catch (e) {
      console.error('Error actualizando rol:', e);
      setMsg({ type: 'error', text: 'No se pudo actualizar el rol' });
    }
  };

  const handleToggleActive = async (membresia, activo) => {
    try {
      const res = await API.patch(`droguerias/membresias/${membresia.id}/`, { activo: activo });
      setActionData(prev => prev.map(x => x.id === membresia.id ? res.data : x));
      setMsg({ type: 'success', text: activo ? 'Usuario activado' : 'Usuario desactivado' });
    } catch (e) {
      console.error('Error cambiando activo:', e);
      setMsg({ type: 'error', text: 'No se pudo cambiar el estado' });
    }
  };

  const abrirPersistente = async (drogueria) => {
    try {
      const res = await API.post('droguerias/set_active/', { drogueria: drogueria.id });
      // set_active devuelve la droguería en data
      const data = res.data?.drogueria || res.data;
      setActiveDrogueria(data || drogueria);
      setSelectedTab('empleados');
      // cargar empleados inmediatamente
      await openAction(data || drogueria, 'usuarios');
      setMsg({ type: 'success', text: `Droguería '${drogueria.nombre}' abierta como activa.` });
    } catch (e) {
      console.error('Error estableciendo droguería activa:', e);
      setMsg({ type: 'error', text: 'No se pudo abrir la droguería (permiso o error del servidor).' });
    }
  };

  const cerrarPersistente = async () => {
    setActiveDrogueria(null);
    setActionData([]);
    setSelectedTab('empleados');
    setMsg({ type: 'info', text: 'Droguería cerrada.' });
  };

  const crearDrogueria = async () => {
    try {
      const payload = { ...createForm };
      const res = await API.post('droguerias/', payload);
      const nuevo = res.data;
      setDroguerias([nuevo, ...droguerias]);
      setMsg({ type: 'success', text: 'Droguería creada correctamente' });
      setCreateOpen(false);
      setCreateForm({ nombre: '', codigo: '', direccion: '', ciudad: '', telefono: '', email: '' });
    } catch (e) {
      console.error('Error creando drogueria:', e);
      setMsg({ type: 'error', text: 'No se pudo crear la droguería' });
    }
  };

  const abrirTransferencia = (origen) => {
    setTransferForm({ origen: origen.id, destino: '', medicamento: '', cantidad: 1 });
    setTransferOpen(true);
  };

  const submitTransfer = async () => {
    try {
      if (!transferForm.origen || !transferForm.destino || !transferForm.medicamento || !transferForm.cantidad) {
        setMsg({ type: 'error', text: 'Completa todos los campos' });
        return;
      }
      const payload = {
        medicamento_origen: transferForm.medicamento,
        cantidad: Number(transferForm.cantidad),
        origen: transferForm.origen,
        destino: transferForm.destino,
      };
      await API.post('/inventario/prestamos/', payload);
      setMsg({ type: 'success', text: 'Solicitud de transferencia creada correctamente' });
      setTransferOpen(false);
    } catch (e) {
      console.error('Error creando prestamo:', e);
      setMsg({ type: 'error', text: 'No se pudo crear la solicitud de transferencia' });
    }
  };

  if (loading) return <div>Cargando droguerías...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Droguerías</h2>
        <div>
          <button onClick={() => setCreateOpen(true)} className="btn-primary px-3 py-1">Crear droguería</button>
        </div>
      </div>
      {msg && (
        <div className={`p-3 rounded ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(droguerias) && droguerias.length > 0 ? (
          droguerias.map((d) => (
            <div key={d.id} className="border p-4 rounded-lg bg-white flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{d.nombre}</h3>
                <p className="text-sm text-gray-600">{d.direccion || d.ciudad || '—'}</p>
                <p className="text-sm text-gray-500">{d.telefono || '—'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <IconButton onClick={() => { setCurrentDrogueria(d); setInfoOpen(true); }} className="bg-slate-50 hover:bg-slate-100" title="Información"><User size={16}/> Info</IconButton>
                <IconButton onClick={() => { setCurrentDrogueria(d); setConfigOpen(true); }} className="bg-indigo-600 text-white hover:bg-indigo-700" title="Configuración"><Settings size={16}/> Config</IconButton>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No hay droguerías disponibles</p>
        )}
      </div>

      {/* Acción modal - Mejorado */}
      {actionOpen && actionDrogueria && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActionOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-4xl max-h-[80vh] p-8 z-[1000] flex flex-col">
            {/* Encabezado con droguería */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-indigo-200">
              <div>
                <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-1">Droguería Seleccionada</div>
                <h2 className="text-3xl font-bold text-gray-900">{actionDrogueria.nombre}</h2>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>📍 {actionDrogueria.ciudad || actionDrogueria.direccion || '—'}</span>
                  <span>📞 {actionDrogueria.telefono || '—'}</span>
                  <span className="font-semibold text-indigo-600">Código: {actionDrogueria.codigo}</span>
                </div>
              </div>
              <button onClick={() => setActionOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition">
                <X size={24} />
              </button>
            </div>

            {/* Tipo de acción y contador */}
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-full text-sm capitalize">
                {actionType}
              </span>
              <span className="text-gray-600 text-sm">{actionData.length} elemento{actionData.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto pr-2">
              {actionData.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-500 text-lg">No hay elementos para mostrar en {actionDrogueria.nombre}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionData.map((item, idx) => (
                    <div key={item.id || idx} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition hover:border-indigo-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {item.usuario?.username || item.usuario?.email || item.nombre || item.titulo || `#${item.id}`}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.usuario?.nombre_completo || item.rol || item.descripcion || ''}
                          </div>
                        </div>

                        {actionType === 'usuarios' ? (
                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            <select 
                              value={item.rol || 'empleado'} 
                              onChange={(e)=>handleChangeRole(item, e.target.value)} 
                              className="input-default px-3 py-2 text-sm rounded-lg border-gray-300"
                            >
                              <option value="propietario">Propietario</option>
                              <option value="manager">Manager</option>
                              <option value="empleado">Empleado</option>
                            </select>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-2 rounded">
                              <input type="checkbox" checked={!!item.activo} onChange={(e)=>handleToggleActive(item, e.target.checked)} className="w-4 h-4" />
                              <span className="text-sm text-gray-700">Activo</span>
                            </label>
                            <button onClick={()=>navigate(`/perfilcliente?user=${item.usuario?.id || item.usuario}`)} className="btn-outline px-3 py-2 text-sm rounded-lg">
                              Perfil →
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 text-right max-w-xs">
                            {item.nombre || item.username || item.titulo || item.texto || item.estado || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-right">
              <button onClick={() => setActionOpen(false)} className="btn-secondary px-6 py-2 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info modal - Lado izquierdo */}
      {infoOpen && currentDrogueria && (
        <div className="fixed inset-0 z-50 flex items-center justify-start pointer-events-none">
          <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={() => { setInfoOpen(false); setConfigOpen(false); setActionOpen(false); }} />
          <div className="relative bg-white rounded-xl shadow-xl w-80 h-auto max-h-96 p-6 z-10 ml-10 pointer-events-auto overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Información</h3>
              <button onClick={() => setInfoOpen(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><strong>Nombre:</strong> {currentDrogueria.nombre}</div>
              <div><strong>Código:</strong> {currentDrogueria.codigo}</div>
              <div><strong>Dirección:</strong> {currentDrogueria.direccion || '-'}</div>
              <div><strong>Ciudad:</strong> {currentDrogueria.ciudad || '-'}</div>
              <div><strong>Teléfono:</strong> {currentDrogueria.telefono || '-'}</div>
              <div><strong>Email:</strong> {currentDrogueria.email || '-'}</div>
              <div><strong>Horarios:</strong> {currentDrogueria.horarios || '-'}</div>
              <div><strong>Propietario:</strong> {currentDrogueria.propietario?.nombre_completo || currentDrogueria.propietario?.username || '-'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Config modal - Lado derecho */}
      {configOpen && currentDrogueria && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
          <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={() => { setConfigOpen(false); setInfoOpen(false); setActionOpen(false); }} />
          <div className="relative bg-white rounded-xl shadow-xl w-96 h-auto max-h-96 p-6 z-10 mr-10 pointer-events-auto overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Configuración</h3>
              <button onClick={() => setConfigOpen(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Acciones rápidas</h4>
                <div className="flex flex-col gap-1 text-sm">
                  <button onClick={() => { openAction(currentDrogueria, 'usuarios'); setConfigOpen(false); }} className="text-left px-2 py-1 hover:bg-blue-50 rounded">👥 Empleados</button>
                  <button onClick={() => { openAction(currentDrogueria, 'medicamentos'); setConfigOpen(false); }} className="text-left px-2 py-1 hover:bg-green-50 rounded">📦 Inventario</button>
                  <button onClick={() => { openAction(currentDrogueria, 'mensajes'); setConfigOpen(false); }} className="text-left px-2 py-1 hover:bg-violet-50 rounded">💬 Mensajes</button>
                  <button onClick={() => { openAction(currentDrogueria, 'facturas'); setConfigOpen(false); }} className="text-left px-2 py-1 hover:bg-purple-50 rounded">📄 Facturas</button>
                  <button onClick={() => { openAction(currentDrogueria, 'pedidos'); setConfigOpen(false); }} className="text-left px-2 py-1 hover:bg-orange-50 rounded">🔄 Pedidos</button>
                </div>
              </div>

              <hr />

              <div>
                <h4 className="font-semibold text-sm mb-2">Editar datos</h4>
                <label className="block text-xs text-gray-700 mb-1">Nombre</label>
                <input value={currentDrogueria.nombre || ''} onChange={(e)=>setCurrentDrogueria({...currentDrogueria, nombre: e.target.value})} className="input-default w-full text-sm" />
                <label className="block text-xs text-gray-700 mt-2 mb-1">Dirección</label>
                <input value={currentDrogueria.direccion || ''} onChange={(e)=>setCurrentDrogueria({...currentDrogueria, direccion: e.target.value})} className="input-default w-full text-sm" />
                <label className="block text-xs text-gray-700 mt-2 mb-1">Teléfono</label>
                <input value={currentDrogueria.telefono || ''} onChange={(e)=>setCurrentDrogueria({...currentDrogueria, telefono: e.target.value})} className="input-default w-full text-sm" />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={()=>setConfigOpen(false)} className="btn-secondary px-3 py-1 text-sm">Cancelar</button>
                <button onClick={async ()=>{
                  if(!currentDrogueria.nombre?.trim()) { setMsg({type:'error', text:'El nombre es obligatorio'}); return; }
                  try{
                    const payload = { nombre: currentDrogueria.nombre, direccion: currentDrogueria.direccion, telefono: currentDrogueria.telefono };
                    const res = await API.patch(`droguerias/${currentDrogueria.id}/`, payload);
                    setDroguerias(prev => prev.map(d => d.id === res.data.id ? res.data : d));
                    setMsg({type:'success', text:'Droguería actualizada'});
                    setConfigOpen(false);
                    setInfoOpen(false);
                  }catch(e){ console.error('Error actualizando drogueria', e); setMsg({type:'error', text:'No se pudo actualizar'}); }
                }} className="btn-primary px-3 py-1 text-sm">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crear droguería modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-lg p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Crear Droguería</h3>
              <button onClick={() => setCreateOpen(false)} className="text-gray-600 hover:text-gray-800">Cerrar ✕</button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm">Nombre</label>
              <input value={createForm.nombre} onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })} className="input-default" />
              <label className="block text-sm">Código</label>
              <input value={createForm.codigo} onChange={(e) => setCreateForm({ ...createForm, codigo: e.target.value })} className="input-default" />
              <label className="block text-sm">Dirección</label>
              <input value={createForm.direccion} onChange={(e) => setCreateForm({ ...createForm, direccion: e.target.value })} className="input-default" />
              <label className="block text-sm">Ciudad</label>
              <input value={createForm.ciudad} onChange={(e) => setCreateForm({ ...createForm, ciudad: e.target.value })} className="input-default" />
              <label className="block text-sm">Teléfono</label>
              <input value={createForm.telefono} onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })} className="input-default" />
              <label className="block text-sm">Email</label>
              <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="input-default" />

              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setCreateOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                <button onClick={crearDrogueria} className="btn-primary px-4 py-2">Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel persistente: workspace de la droguería abierta */}
      {activeDrogueria && (
        <div className="mt-6 border p-4 rounded bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Workspace — {activeDrogueria.nombre}</h3>
              <p className="text-sm text-gray-600">ID: {activeDrogueria.id} • {activeDrogueria.codigo || ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectedTab('empleados'); openAction(activeDrogueria, 'usuarios'); }} className={`px-3 py-1 ${selectedTab==='empleados' ? 'btn-primary' : 'btn-outline'}`}>Empleados</button>
              <button onClick={() => { setSelectedTab('inventario'); openAction(activeDrogueria, 'medicamentos'); }} className={`px-3 py-1 ${selectedTab==='inventario' ? 'btn-primary' : 'btn-outline'}`}>Inventario</button>
              <button onClick={() => { setSelectedTab('mensajes'); openAction(activeDrogueria, 'mensajes'); }} className={`px-3 py-1 ${selectedTab==='mensajes' ? 'btn-primary' : 'btn-outline'}`}>Mensajes</button>
              <button onClick={() => { setSelectedTab('facturas'); openAction(activeDrogueria, 'facturas'); }} className={`px-3 py-1 ${selectedTab==='facturas' ? 'btn-primary' : 'btn-outline'}`}>Facturas</button>
              <button onClick={() => { setSelectedTab('pedidos'); openAction(activeDrogueria, 'pedidos'); }} className={`px-3 py-1 ${selectedTab==='pedidos' ? 'btn-primary' : 'btn-outline'}`}>Pedidos</button>
              <button onClick={cerrarPersistente} className="px-3 py-1 btn-secondary">Cerrar</button>
            </div>
          </div>

          <div className="mt-4">
            {actionData.length === 0 ? (
              <p className="text-gray-600">No hay elementos en la pestaña seleccionada.</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-auto">
                {actionData.map((it, i) => (
                  <li key={it.id || i} className="border p-2 rounded bg-white">
                    {it.nombre || it.username || it.codigo || it.texto || JSON.stringify(it)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Inventario modal */}
      {selectedD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedD(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-3xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Inventario — {selectedD.nombre}</h3>
              <button onClick={() => setSelectedD(null)} className="text-gray-600 hover:text-gray-800">Cerrar ✕</button>
            </div>
            {inventarioLoading ? (
              <div>Cargando inventario...</div>
            ) : (
              <div className="space-y-3">
                {medicamentos.length === 0 ? (
                  <p>No hay medicamentos en esta droguería.</p>
                ) : (
                  <ul className="space-y-2">
                    {medicamentos.map((m) => (
                      <li key={m.id} className="flex justify-between border p-2 rounded">
                        <div>
                          <strong>{m.nombre}</strong>
                          <div className="text-sm text-gray-500">Stock: {m.stock_actual} | Precio: ${m.precio_venta}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setTransferOpen(true); setTransferForm({ origen: selectedD.id, destino: '', medicamento: m.id, cantidad: 1 }); }} className="btn-secondary px-2 py-1 text-sm">Transferir</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTransferOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-lg p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Solicitar transferencia</h3>
              <button onClick={() => setTransferOpen(false)} className="text-gray-600 hover:text-gray-800">Cerrar ✕</button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">Origen</label>
              <select value={transferForm.origen} onChange={(e) => setTransferForm({ ...transferForm, origen: e.target.value })} className="input-default">
                <option value="">-- Seleccionar --</option>
                {droguerias.map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
              </select>

              <label className="block text-sm">Destino</label>
              <select value={transferForm.destino} onChange={(e) => setTransferForm({ ...transferForm, destino: e.target.value })} className="input-default">
                <option value="">-- Seleccionar --</option>
                {droguerias.map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
              </select>

              <label className="block text-sm">Medicamento (origen)</label>
              <input type="number" value={transferForm.medicamento} onChange={(e) => setTransferForm({ ...transferForm, medicamento: e.target.value })} className="input-default" placeholder="ID medicamento" />

              <label className="block text-sm">Cantidad</label>
              <input type="number" value={transferForm.cantidad} onChange={(e) => setTransferForm({ ...transferForm, cantidad: e.target.value })} className="input-default" />

              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setTransferOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                <button onClick={submitTransfer} className="btn-primary px-4 py-2">Crear solicitud</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
