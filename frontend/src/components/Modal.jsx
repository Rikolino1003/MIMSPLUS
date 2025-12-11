// src/components/Modal.jsx
import React from "react";

export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 mx-4">
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="mb-4">{children}</div>

        {footer ? (
          <div className="flex justify-end gap-3">{footer}</div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
