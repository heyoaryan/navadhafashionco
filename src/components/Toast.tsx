import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-md z-[9999] flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-xl animate-slide-in ${getBgColor()}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <p className="flex-1 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed break-words pr-2">
        {message}
      </p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
