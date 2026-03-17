interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  variant = 'spinner',
  className = ''
}: LoadingSpinnerProps) {
  const sizes = {
    sm: {
      spinner: 'h-6 w-6 border-2',
      dot: 'h-2 w-2',
      bar: 'h-8 w-1',
      text: 'text-xs'
    },
    md: {
      spinner: 'h-10 w-10 border-3',
      dot: 'h-3 w-3',
      bar: 'h-12 w-1.5',
      text: 'text-sm'
    },
    lg: {
      spinner: 'h-14 w-14 border-4',
      dot: 'h-4 w-4',
      bar: 'h-16 w-2',
      text: 'text-base'
    },
    xl: {
      spinner: 'h-20 w-20 border-4',
      dot: 'h-5 w-5',
      bar: 'h-20 w-2.5',
      text: 'text-lg'
    }
  };

  const sizeClasses = sizes[size];

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex items-center justify-center gap-2">
            <div className={`${sizeClasses.dot} bg-rose-400 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses.dot} bg-rose-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses.dot} bg-rose-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className="relative flex items-center justify-center">
            <div className={`${sizeClasses.spinner} bg-rose-400 rounded-full animate-ping absolute opacity-75`}></div>
            <div className={`${sizeClasses.spinner} bg-rose-500 rounded-full relative`}></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className="flex items-end justify-center gap-1.5">
            <div className={`${sizeClasses.bar} bg-rose-400 rounded-full animate-pulse`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses.bar} bg-rose-500 rounded-full animate-pulse`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses.bar} bg-rose-600 rounded-full animate-pulse`} style={{ animationDelay: '300ms' }}></div>
            <div className={`${sizeClasses.bar} bg-rose-500 rounded-full animate-pulse`} style={{ animationDelay: '450ms' }}></div>
            <div className={`${sizeClasses.bar} bg-rose-400 rounded-full animate-pulse`} style={{ animationDelay: '600ms' }}></div>
          </div>
        );
      
      case 'spinner':
      default:
        return (
          <div className="relative flex items-center justify-center">
            <div className={`${sizeClasses.spinner} border-rose-200 dark:border-rose-900 border-t-rose-500 dark:border-t-rose-400 rounded-full animate-spin`}></div>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderLoader()}
      {message && (
        <p className={`mt-4 text-gray-600 dark:text-gray-400 font-medium ${sizeClasses.text} animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
}
