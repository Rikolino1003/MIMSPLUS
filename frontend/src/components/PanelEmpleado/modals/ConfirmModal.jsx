import React from 'react';

const ConfirmModal = ({ open, payload, onCancel, onConfirm }) => {
  if (!open) return null;

  const { title = 'Confirmar', message = '¿Deseas continuar?' } = payload || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
