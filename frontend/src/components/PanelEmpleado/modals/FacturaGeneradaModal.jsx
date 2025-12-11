import React from 'react';
import { Download } from 'lucide-react';
import { getFacturaPDF } from '../../../services/api';

const FacturaGeneradaModal = ({ open, payload, onClose }) => {
  if (!open) return null;

  const descargarPDF = async () => {
    try {
      const res = await getFacturaPDF(payload.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${payload.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error('Error descargando PDF:', e);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-3">✅ Factura generada</h3>
        <p className="mb-4">Se generó la factura #{payload?.id} correctamente.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={descargarPDF} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            <Download size={16} /> Descargar PDF
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default FacturaGeneradaModal;
