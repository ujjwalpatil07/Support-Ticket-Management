import { createContext, useCallback, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLE_MAP = {
  success: 'border-emerald-200 bg-white text-slate-900',
  error: 'border-rose-200 bg-white text-slate-900',
  info: 'border-indigo-200 bg-white text-slate-900',
};

const ICON_COLOR_MAP = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-indigo-600',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error', 5000),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const Icon = ICON_MAP[item.type] || Info;
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
                STYLE_MAP[item.type] || STYLE_MAP.info
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 mt-0.5 ${
                  ICON_COLOR_MAP[item.type] || ICON_COLOR_MAP.info
                }`}
              />
              <p className="text-sm font-medium flex-1 text-slate-800">{item.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
