// Suppress specific console errors that are not critical
export const suppressNonCriticalErrors = () => {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    if (errorString.includes('CORS') && errorString.includes('supabase')) return;
    if (errorString.includes('Analytics:')) return;
    if (errorString.includes('page_views') || errorString.includes('product_analytics') || errorString.includes('user_signups')) return;
    originalError.apply(console, args);
  };
};
