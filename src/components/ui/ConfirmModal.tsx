import { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface ConfirmStore extends ConfirmState {
  openConfirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeConfirm: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Bevestigen',
  cancelLabel: 'Annuleren',
  variant: 'warning',
  onConfirm: null,
  onCancel: null,
  openConfirm: (options) =>
    set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Bevestigen',
      cancelLabel: options.cancelLabel || 'Annuleren',
      variant: options.variant || 'warning',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel || null,
    }),
  closeConfirm: () =>
    set({
      isOpen: false,
      onConfirm: null,
      onCancel: null,
    }),
}));

// Helper function for easy usage
export const confirm = (options: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}): Promise<boolean> => {
  return new Promise((resolve) => {
    useConfirmStore.getState().openConfirm({
      ...options,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

export default function ConfirmModal() {
  const {
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    onConfirm,
    onCancel,
    closeConfirm,
  } = useConfirmStore();

  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key and focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
        return;
      }

      // Focus trapping - only when modal is open
      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    closeConfirm();
  }, [onConfirm, closeConfirm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    closeConfirm();
  }, [onCancel, closeConfirm]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-ru-red-impact',
      iconBg: 'bg-ru-red-impact/10',
      button: 'bg-ru-red-impact hover:bg-ru-berry',
    },
    warning: {
      icon: 'text-ru-orange',
      iconBg: 'bg-ru-orange/10',
      button: 'bg-ru-orange hover:bg-ru-orange/90',
    },
    info: {
      icon: 'text-ru-blue',
      iconBg: 'bg-ru-blue/10',
      button: 'bg-ru-blue hover:bg-ru-blue/90',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`p-2 rounded-lg ${styles.iconBg}`}>
            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
          </div>
          <div className="flex-1">
            <h2 id="confirm-title" className="text-lg font-semibold text-ru-text">
              {title}
            </h2>
            <p className="mt-2 text-sm text-ru-text-light">{message}</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg text-ru-gray hover:text-ru-text hover:bg-ru-light-gray transition-colors"
            aria-label="Sluiten"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-ru-border">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-ru-text bg-ru-light-gray rounded-lg hover:bg-ru-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
