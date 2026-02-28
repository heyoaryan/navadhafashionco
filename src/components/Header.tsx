import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [searchOpen]);

  // Close search on outside click (but keep the query stored)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
        // Don't clear searchQuery - keep it stored
      }
    };

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  // Real-time search - trigger on every keystroke
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      // Navigate to shop with search query immediately
      navigate(`/shop?search=${encodeURIComponent(value.trim())}`);
    } else {
      // If empty, go to shop without search
      navigate('/shop');
    }
  };

  const categories = [
    { name: 'Western', path: '/western-wear' },
    { name: 'Indo Western', path: '/indo-western' },
    { name: 'Ethnic', path: '/ethnic-wear' },
    { name: 'Work', path: '/work-wear' },
    { name: 'Occasional', path: '/occasional-wear' },
    { name: 'Boutique', path: '/boutique' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors" ref={searchContainerRef}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-8">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center flex-shrink-0">
              <div className="text-center">
                <h1 className="brand-logo text-lg sm:text-xl md:text-2xl leading-tight mb-0.5" style={{ color: '#EE458F' }}>
                  NAVADHA
                </h1>
                <span className="text-[0.45rem] sm:text-[0.5rem] md:text-[0.55rem] font-light tracking-[0.2em] sm:tracking-[0.25em] block" style={{ color: '#EE458F' }}>
                  FASHION CO
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  className="relative text-sm font-semibold tracking-wide whitespace-nowrap group"
                >
                  {category.name}
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#EE458F' }}></span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Search Button - Same for all screens */}
            <button
              onClick={() => {
                if (searchOpen) {
                  // If closing, clear the search query
                  setSearchOpen(false);
                  setSearchQuery('');
                } else {
                  // If opening, just open
                  setSearchOpen(true);
                }
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
              aria-label="Search products"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleTheme}
              className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex-shrink-0 min-w-[40px] min-h-[40px] items-center justify-center active:scale-95"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link
                  to="/wishlist"
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
                  aria-label={`Wishlist with ${wishlistCount} items`}
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium shadow-md" style={{ backgroundColor: '#EE458F' }}>
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
                  aria-label={`Shopping cart with ${cartCount} items`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium shadow-md" style={{ backgroundColor: '#EE458F' }}>
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={profile?.role === 'admin' ? '/admin' : '/account'}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
                  aria-label="View account"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-medium text-xs sm:text-sm border-2 border-gray-200 dark:border-gray-700">
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-3 sm:px-4 md:px-6 py-2 text-xs sm:text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 rounded-lg whitespace-nowrap flex-shrink-0 min-h-[36px] sm:min-h-[40px] flex items-center justify-center shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {category.name}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between py-3 px-4 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span>Theme</span>
              <span className="flex items-center gap-2">
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Light</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Dark</span>
                  </>
                )}
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Search Dropdown - All screens */}
      {searchOpen && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 animate-in slide-in-from-top duration-300 shadow-lg">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search for products..."
              className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base"
              style={{ borderColor: '#EE458F' }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white rounded-lg transition-all active:scale-95"
              style={{ backgroundColor: '#EE458F' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D63D7F'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EE458F'}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-3xl mx-auto">
            Press Enter or click the search button to find products
          </p>
        </div>
      )}
    </header>
  );
}
