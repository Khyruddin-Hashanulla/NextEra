import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 ${
              toast.variant === 'success'
                ? 'bg-green-600 text-white'
                : toast.variant === 'error'
                ? 'bg-red-600 text-white'
                : toast.variant === 'warning'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-white'
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="text-xs opacity-90">{toast.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
