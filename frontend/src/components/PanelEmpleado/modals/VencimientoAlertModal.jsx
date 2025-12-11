import React from 'react';

const VencimientoAlertModal = ({ open, payload, onClose }) => {
  if (!open) return null;

  const items = (payload && payload.medicamentos) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-3">⏳ Alerta: Próximo a vencer</h3>
        {items.length === 0 ? (
          <p>No hay medicamentos próximos a vencer.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-auto">
            {items.map((m) => (
              <li key={m.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <div className="font-semibold">{m.nombre}</div>
                  <div className="text-sm text-gray-500">Vence: {m.fecha_vencimiento}</div>
                </div>
                <div className="text-sm text-orange-600 font-semibold">Stock: {m.stock_actual}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default VencimientoAlertModal;
