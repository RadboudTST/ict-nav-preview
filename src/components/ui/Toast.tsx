import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { create } from 'zustand';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, options?: { duration?: number }) => void;
  removeToast: (id: string) => void;
}

// Zustand store for toasts
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message: string, type: ToastType = 'info', options?: { duration?: number }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // Auto-remove after duration (default 4 seconds)
    const duration = options?.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper function for easy usage
export const toast = {
  success: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast(message, 'success', options),
  error: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast(message, 'error', options),
  warning: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast(message, 'warning', options),
  info: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast(message, 'info', options),
};

// Individual toast item
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const icons = {
    success: <CheckCircle size={18} className="text-ru-green flex-shrink-0" />,
    error: <AlertCircle size={18} className="text-ru-red-impact flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
    info: <Info size={18} className="text-ru-blue flex-shrink-0" />,
  };

  const bgColors = {
    success: 'bg-ru-green/10 border-ru-green/30',
    error: 'bg-ru-red-impact/10 border-ru-red-impact/30',
    warning: 'bg-amber-50 border-amber-300',
    info: 'bg-ru-blue/10 border-ru-blue/30',
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg bg-white
        ${bgColors[toast.type]}
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <span className="mt-0.5">{icons[toast.type]}</span>
      <span className="text-sm text-ru-text flex-1 whitespace-pre-line">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-black/5 text-ru-gray hover:text-ru-text transition-colors flex-shrink-0"
        aria-label="Sluiten"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Toast container - renders all toasts
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
