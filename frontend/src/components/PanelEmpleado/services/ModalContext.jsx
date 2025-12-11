import React, { createContext, useContext, useState, useCallback } from 'react';
import GlobalModals from '../modals/GlobalModals';

const ModalContext = createContext(null);

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({
    stockAlert: { open: false, payload: null },
    vencimientoAlert: { open: false, payload: null },
    facturaGenerada: { open: false, payload: null },
    confirm: { open: false, payload: null, resolver: null },
    error: { open: false, payload: null },
  });

  const openModal = useCallback((name, payload = null) => {
    setModals((m) => ({ ...m, [name]: { ...(m[name] || {}), open: true, payload } }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals((m) => ({ ...m, [name]: { ...(m[name] || {}), open: false, payload: null } }));
  }, []);

  const showConfirm = useCallback((payload) => {
    return new Promise((resolve) => {
      setModals((m) => ({ ...m, confirm: { open: true, payload, resolver: resolve } }));
    });
  }, []);

  const resolveConfirm = useCallback((result) => {
    setModals((m) => {
      if (m.confirm && typeof m.confirm.resolver === 'function') {
        m.confirm.resolver(result);
      }
      return { ...m, confirm: { open: false, payload: null, resolver: null } };
    });
  }, []);

  const showError = useCallback((message) => {
    setModals((m) => ({ ...m, error: { open: true, payload: { message } } }));
  }, []);

  const contextValue = {
    modals,
    openModal,
    closeModal,
    showConfirm,
    resolveConfirm,
    showError,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <GlobalModals />
    </ModalContext.Provider>
  );
};

export default ModalContext;
