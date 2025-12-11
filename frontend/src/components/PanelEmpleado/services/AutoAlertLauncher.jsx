import React, { useEffect } from 'react';
import { getAlertasMedicamentos } from '../../services/api';
import { useModal } from './ModalContext';

const AutoAlertLauncher = () => {
  const { openModal } = useModal();

  useEffect(() => {
    let mounted = true;

    const fetchAndOpen = async () => {
      try {
        const res = await getAlertasMedicamentos();
        const data = res.data || res;

        if (!mounted) return;

        // abrir alertas según respuesta
        if (data.stock_bajo && data.stock_bajo.cantidad > 0) {
          openModal('stockAlert', { medicamentos: data.stock_bajo.medicamentos });
        }

        if (data.proximo_vencimiento && data.proximo_vencimiento.cantidad > 0) {
          openModal('vencimientoAlert', { medicamentos: data.proximo_vencimiento.medicamentos });
        }
      } catch (e) {
        // Silencioso: el modal de error puede ser mostrado por llamadas concretas
        console.error('Error obteniendo alertas automáticas:', e);
      }
    };

    fetchAndOpen();

    return () => { mounted = false; };
  }, [openModal]);

  return null;
};

export default AutoAlertLauncher;
