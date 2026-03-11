import { useScrollLock } from '../hooks/useScrollLock';
import LoadingSpinner from './LoadingSpinner';

interface FullScreenLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search' | 'shopping' | 'trending';
}

/**
 * Full-screen loading component with automatic scroll lock
 * Use this for page-level loading states
 */
export default function FullScreenLoader({ 
  message = 'Loading...', 
  size = 'lg',
  variant = 'default'
}: FullScreenLoaderProps) {
  // Lock scroll when full-screen loader is active
  useScrollLock(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner 
        message={message}
        size={size}
        variant={variant}
      />
    </div>
  );
}
