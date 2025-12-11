import React from 'react';

const ErrorModal = ({ open, payload, onClose }) => {
  if (!open) return null;

  const message = (payload && payload.message) || 'Ocurrió un error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-3 text-red-600">❌ Error</h3>
        <p className="mb-4 text-sm text-gray-700">{message}</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
