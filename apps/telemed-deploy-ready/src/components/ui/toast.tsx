import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const colors = {
  success: 'bg-green-500/10 border-green-500/50 text-green-400',
  error: 'bg-red-500/10 border-red-500/50 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => onClose(toast.id), duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`toast-item ${colors[toast.type]} border backdrop-blur-md rounded-lg p-4 shadow-lg min-w-[300px] max-w-[420px] animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white mb-1">{toast.title}</div>
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors ml-2"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToasterProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function Toaster({ toasts, onClose }: ToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
