import LoadingSpinner from './LoadingSpinner';
import { useScrollLock } from '../hooks/useScrollLock';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'page' | 'section' | 'inline' | 'skeleton';
  skeletonCount?: number;
  skeletonType?: 'product' | 'list' | 'card';
  lockScroll?: boolean;
}

/**
 * Unified loading component for all loading states
 * Responsive and consistent across all screen sizes
 * Automatically locks scroll for page-level loading
 */
export default function LoadingState({
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  type = 'section',
  skeletonCount = 6,
  skeletonType = 'product',
  lockScroll = true
}: LoadingStateProps) {
  
  // Lock scroll for page-level loading by default
  const shouldLockScroll = lockScroll && (type === 'page');
  useScrollLock(shouldLockScroll);
  
  // Page-level loading (full screen)
  if (type === 'page') {
    return (
      <div className="fixed inset-0 z-50 w-full h-full flex items-center justify-center bg-white dark:bg-gray-900 px-4 overflow-hidden">
        <div className="w-full max-w-md mx-auto text-center">
          <LoadingSpinner message={message} variant={variant} size="xl" />
        </div>
      </div>
    );
  }

  // Section loading (within a page)
  if (type === 'section') {
    return (
      <div className="w-full flex items-center justify-center py-12 sm:py-16 md:py-20 px-4">
        <div className="w-full max-w-md mx-auto text-center">
          <LoadingSpinner message={message} variant={variant} size={size} />
        </div>
      </div>
    );
  }

  // Inline loading (small, within content)
  if (type === 'inline') {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner message={message} variant={variant} size="sm" />
      </div>
    );
  }

  // Skeleton loading (for product grids, lists, etc.)
  if (type === 'skeleton') {
    if (skeletonType === 'product') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 sm:mb-3 md:mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (skeletonType === 'list') {
      return (
        <div className="space-y-4">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (skeletonType === 'card') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

  // Default fallback
  return <LoadingSpinner message={message} variant={variant} size={size} />;
}
