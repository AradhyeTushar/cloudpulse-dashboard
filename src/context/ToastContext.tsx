import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, description?: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, description, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--status-running)" />}
            {toast.type === 'error' && <AlertCircle size={18} color="var(--status-error)" />}
            {toast.type === 'info' && <Info size={18} color="var(--brand-primary)" />}
            {toast.type === 'warning' && <AlertCircle size={18} color="var(--status-provisioning)" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{toast.title}</div>
              {toast.description && (
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
