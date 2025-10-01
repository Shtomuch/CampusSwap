import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    iconColor: 'text-green-400',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700'
  },
  error: {
    icon: XCircleIcon,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    titleColor: 'text-orange-800',
    messageColor: 'text-orange-700'
  },
  info: {
    icon: InformationCircleIcon,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700'
  }
};

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div className={`w-80 max-w-sm ${config.bgColor} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${config.borderColor} transform transition-all duration-300 ease-in-out translate-x-0 opacity-100`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${config.titleColor}`}>
              {title}
            </p>
            {message && (
              <p className={`mt-1 text-sm ${config.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onClose(id)}
              className={`rounded-md inline-flex ${config.iconColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1`}
            >
              <span className="sr-only">Закрити</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

// Context for managing toasts
const ToastContext = React.createContext<{
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
  }>;
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
} | undefined>(undefined);

// Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
  }>>([]);

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string) => addToast('success', title, message);
  const showError = (title: string, message?: string) => addToast('error', title, message);
  const showWarning = (title: string, message?: string) => addToast('warning', title, message);
  const showInfo = (title: string, message?: string) => addToast('info', title, message);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook for managing toasts
export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
