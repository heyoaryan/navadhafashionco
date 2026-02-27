// Centralized error handling utility

const isDevelopment = import.meta.env.DEV;

// Suppress specific console errors that are not critical
export const suppressNonCriticalErrors = () => {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    
    // Suppress CORS errors from analytics (non-critical)
    if (errorString.includes('CORS') && errorString.includes('supabase')) {
      return;
    }
    
    // Suppress network errors from analytics
    if (errorString.includes('Analytics:')) {
      return;
    }
    
    // Suppress fetch errors from analytics tables
    if (errorString.includes('page_views') || 
        errorString.includes('product_analytics') || 
        errorString.includes('user_signups')) {
      return;
    }
    
    // Call original console.error for other errors
    originalError.apply(console, args);
  };
};

// Log errors in development only
export const logError = (message: string, error?: any) => {
  if (isDevelopment) {
    console.error(message, error);
  }
  // In production, you could send errors to a logging service here
};

// Handle async errors gracefully
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  fallbackValue: T
): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    if (isDevelopment) {
      console.debug('Async operation failed:', error);
    }
    return fallbackValue;
  }
};
