/**
 * ToastContext
 * Provides a global toast notification system
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/ui/Toast';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ message, type = 'info', duration = 5000 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const success = useCallback((message, duration) => {
    return showToast({ message, type: 'success', duration });
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast({ message, type: 'error', duration });
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast({ message, type: 'info', duration });
  }, [showToast]);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, closeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </ToastContext.Provider>
  );
};
