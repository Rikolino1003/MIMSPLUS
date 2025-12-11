import React, { Suspense, lazy } from 'react';
import { useModal } from '../services/ModalContext';

// Lazy load modal components
const StockAlertModal = lazy(() => import('./StockAlertModal'));
const VencimientoAlertModal = lazy(() => import('./VencimientoAlertModal'));
const FacturaGeneradaModal = lazy(() => import('./FacturaGeneradaModal'));
const ConfirmModal = lazy(() => import('./ConfirmModal'));
const ErrorModal = lazy(() => import('./ErrorModal'));

// Loading component for Suspense fallback
const ModalLoading = () => <div className="p-4">Cargando...</div>;

const GlobalModals = () => {
  const { modals, closeModal, resolveConfirm } = useModal();

  return (
    <Suspense fallback={<ModalLoading />}>
      {modals.stockAlert.open && (
        <StockAlertModal
          open={true}
          payload={modals.stockAlert.payload}
          onClose={() => closeModal('stockAlert')}
        />
      )}

      {modals.vencimientoAlert.open && (
        <VencimientoAlertModal
          open={true}
          payload={modals.vencimientoAlert.payload}
          onClose={() => closeModal('vencimientoAlert')}
        />
      )}

      {modals.facturaGenerada.open && (
        <FacturaGeneradaModal
          open={true}
          payload={modals.facturaGenerada.payload}
          onClose={() => closeModal('facturaGenerada')}
        />
      )}

      {modals.confirm.open && (
        <ConfirmModal
          open={true}
          payload={modals.confirm.payload}
          onCancel={() => resolveConfirm(false)}
          onConfirm={() => resolveConfirm(true)}
        />
      )}

      {modals.error.open && (
        <ErrorModal
          open={true}
          payload={modals.error.payload}
          onClose={() => closeModal('error')}
        />
      )}
    </Suspense>
  );
};

export default GlobalModals;
