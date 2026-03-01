interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search' | 'shopping' | 'trending';
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md'
}: LoadingSpinnerProps) {
  const sizes = {
    sm: {
      spinner: 'h-8 w-8',
      text: 'text-xs sm:text-sm'
    },
    md: {
      spinner: 'h-12 w-12',
      text: 'text-sm sm:text-base'
    },
    lg: {
      spinner: 'h-16 w-16',
      text: 'text-base sm:text-lg'
    }
  };

  const sizeClasses = sizes[size];

  return (
    <div className="text-center">
      <div className={`${sizeClasses.spinner} border-4 border-rose-200 border-t-rose-400 rounded-full mx-auto animate-spin`}></div>
      {message && (
        <p className={`mt-4 text-gray-600 dark:text-gray-400 ${sizeClasses.text}`}>
          {message}
        </p>
      )}
    </div>
  );
}
