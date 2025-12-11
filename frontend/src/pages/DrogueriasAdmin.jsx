import React, { useEffect, useState } from "react";
import API from "../services/api";

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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/droguerias/");
        setDroguerias(res.data || []);
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
      <h2 className="text-2xl font-bold">Droguerías</h2>
      {msg && (
        <div className={`p-3 rounded ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {droguerias.map((d) => (
          <div key={d.id} className="border p-4 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{d.nombre}</h3>
                <p className="text-sm text-gray-500">Propietario: {d.propietario?.nombre_completo || d.propietario?.username || '—'}</p>
              </div>
              <div className="text-sm text-slate-600">ID: {d.id}</div>
            </div>

            <div className="mt-2 flex gap-2">
              <button onClick={() => verInventario(d)} className="btn-secondary px-3 py-1">Ver inventario</button>
              <button onClick={() => abrirTransferencia(d)} className="btn-primary px-3 py-1">Solicitar transferencia</button>
            </div>
          </div>
        ))}
      </div>

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
