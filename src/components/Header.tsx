import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X, Moon, Sun, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
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

  // Lock/unlock scroll when search opens/closes
  useEffect(() => {
    if (searchOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => {
      unlockScroll();
    };
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

  // Lock/unlock scroll when mobile menu opens/closes
  useEffect(() => {
    if (mobileMenuOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => {
      unlockScroll();
    };
  }, [mobileMenuOpen]);

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

  // Determine season based on current date
  const getCurrentSeason = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    
    // Summer: Feb 15 to Oct 4
    // Winter: Oct 5 to Feb 14
    if (month === 2 && day >= 15) {
      return 'Summer';
    } else if (month >= 3 && month <= 9) {
      return 'Summer';
    } else if (month === 10 && day >= 5) {
      return 'Winter';
    } else if (month >= 11 || month === 1) {
      return 'Winter';
    } else if (month === 2 && day < 15) {
      return 'Winter';
    } else if (month === 10 && day < 5) {
      return 'Summer';
    }
    return 'Summer'; // default
  };

  const currentSeason = getCurrentSeason();

  const categories = [
    { 
      name: 'Men', 
      path: '/shop?gender=men',
      subcategories: [
        { name: 'Casuals', path: '/men/casuals' },
        { name: 'Workwear', path: '/men/workwear' },
        { name: 'Ethnic', path: '/men/ethnic' },
        { name: 'Gym Attire', path: '/men/gym-attire' },
        { name: `${currentSeason} Collection`, path: `/shop?gender=men&category=seasonal&season=${currentSeason.toLowerCase()}` },
      ]
    },
    { 
      name: 'Women', 
      path: '/shop?gender=women',
      subcategories: [
        { name: 'Western', path: '/women/western' },
        { name: 'Indo-Western', path: '/women/indo-western' },
        { name: 'Ethnics', path: '/women/ethnics' },
        { name: 'Casuals', path: '/women/casuals' },
        { name: 'Workwear', path: '/women/workwear' },
        { name: 'Gym Attire', path: '/women/gym-attire' },
        { name: `${currentSeason} Collection`, path: `/shop?gender=women&category=seasonal&season=${currentSeason.toLowerCase()}` },
      ]
    },
    { name: 'Boutique', path: '/boutique' },
    { name: 'Best Sellers', path: '/shop?sort=bestselling' },
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
                <div
                  key={category.name}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => {
                    if (category.subcategories) {
                      setActiveDropdown(category.name);
                    } else {
                      setActiveDropdown(null);
                    }
                  }}
                  onMouseLeave={() => {}}
                >
                  {category.subcategories ? (
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === category.name ? null : category.name)}
                      className="relative text-sm font-semibold tracking-wide whitespace-nowrap group block py-2 pb-1 cursor-pointer"
                    >
                      {category.name}
                      <span 
                        className={`absolute left-0 bottom-0 h-0.5 transition-all duration-300 ${
                          activeDropdown === category.name ? 'w-full' : 'w-0 group-hover:w-full'
                        }`} 
                        style={{ backgroundColor: '#EE458F' }}
                      ></span>
                    </button>
                  ) : (
                    <Link
                      to={category.path}
                      className="relative text-sm font-semibold tracking-wide whitespace-nowrap group block py-2 pb-1"
                    >
                      {category.name}
                      <span className="absolute left-0 bottom-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#EE458F' }}></span>
                    </Link>
                  )}
                </div>
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
        <div ref={mobileMenuRef} className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg relative z-50">
          <nav className="px-4 py-4 space-y-2">
            {categories.map((category) => (
              <div key={category.name}>
                {category.subcategories ? (
                  <div>
                    <button
                      onClick={() => setExpandedMobileSection(expandedMobileSection === category.name ? null : category.name)}
                      className="w-full flex items-center justify-between py-3 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span>{category.name}</span>
                      <ChevronDown 
                        className={`w-5 h-5 transition-transform duration-300 ${
                          expandedMobileSection === category.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ${
                        expandedMobileSection === category.name ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-4 mt-1 space-y-1 pb-2">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setExpandedMobileSection(null);
                            }}
                            className="block py-2 px-4 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={category.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {category.name}
                  </Link>
                )}
              </div>
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

      {/* Overlay for mobile menu and search */}
      {(mobileMenuOpen || searchOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          style={{ top: '56px' }}
          onClick={() => {
            setMobileMenuOpen(false);
            setSearchOpen(false);
            setSearchQuery('');
          }}
        />
      )}

      {/* Full Width Dropdown Menu for Desktop */}
      {activeDropdown && (
        <div 
          className="hidden lg:block absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800 shadow-lg z-40"
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex gap-12 justify-center items-center flex-wrap">
              {categories.find(cat => cat.name === activeDropdown)?.subcategories?.map((sub) => (
                <Link
                  key={sub.name}
                  to={sub.path}
                  className="relative text-base font-medium text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-all duration-300 whitespace-nowrap group pb-1 py-2"
                  onClick={() => setActiveDropdown(null)}
                >
                  {sub.name}
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-pink-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Dropdown - All screens */}
      {searchOpen && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 animate-in slide-in-from-top duration-300 shadow-lg relative z-50">
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
