import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    setItems((current) => [...current, { id, message, type }]);

    setTimeout(() => {
      setItems((current) => current.filter((i) => i.id !== id));
    }, 3500);
  }, []);

  const remove = (id) => {
    setItems((current) => current.filter((i) => i.id !== id));
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((i) => {
          const Icon = i.type === 'error' ? AlertCircle : i.type === 'info' ? Info : CheckCircle2;
          return (
            <div className={`toast ${i.type}`} key={i.id} role="alert">
              <Icon size={16} className="toastIcon" />
              <span className="toastText">{i.message}</span>
              <button
                type="button"
                className="toastCloseBtn"
                onClick={() => remove(i.id)}
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
