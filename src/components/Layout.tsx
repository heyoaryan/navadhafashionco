import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const hideFooter = location.pathname === '/auth' || 
                     location.pathname.startsWith('/account') || 
                     location.pathname === '/checkout' ||
                     location.pathname.startsWith('/careers');
  const hideHeader = location.pathname.startsWith('/careers');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Don't render layout for admin routes - they have their own layout
  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {!hideHeader && <Header />}
      <main className={hideHeader ? '' : 'pt-16'}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      
      {/* Test Mode Indicator */}
      <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg font-semibold text-sm z-50">
        TEST MODE
      </div>
    </div>
  );
}
