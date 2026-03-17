import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Tag, Users, LogOut, RotateCcw, Menu, X, TrendingUp, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    
    return () => {
      unlockScroll();
    };
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/returns', icon: RotateCcw, label: 'Returns' },
    { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
    { to: '/admin/area-analytics', icon: MapPin, label: 'Area Analytics' },
    { to: '/admin/careers', icon: Briefcase, label: 'Careers' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <div className="inline-block text-center">
            <h1 className="brand-logo text-xl mb-1" style={{ color: '#EE458F' }}>NAVADHA</h1>
            <div className="flex items-center justify-center gap-1">
              <div className="h-[0.5px] w-6" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }}></div>
              <span className="text-[0.35rem] font-light tracking-[0.2em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                FASHION CO
              </span>
              <div className="h-[0.5px] w-6" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }}></div>
            </div>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 hidden lg:block flex-shrink-0">
          <Link to="/" className="block mb-8">
            <div className="inline-block">
              <h1 className="brand-logo text-2xl mb-2" style={{ color: '#EE458F' }}>
                NAVADHA
              </h1>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-[0.5px] w-10" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }}></div>
                <span className="text-[0.45rem] font-light tracking-[0.2em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                  FASHION CO
                </span>
                <div className="h-[0.5px] w-10" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }}></div>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-medium tracking-wider">
              Admin Panel
            </p>
          </Link>
        </div>

        <nav className="px-4 py-6 lg:py-6 pt-20 lg:pt-6 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== '/admin';
            
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="mb-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{profile.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
