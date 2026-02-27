import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PRODUCTS_PER_PAGE = 20;

  const selectedCategory = searchParams.get('category');
  const filterType = searchParams.get('filter'); // new, featured, etc.
  const selectedGender = searchParams.get('gender'); // men, women
  const sortBy = searchParams.get('sort') || 'latest';
  const priceRange = searchParams.get('price');
  const searchQuery = searchParams.get('search') || '';

  const isNewArrivals = filterType === 'new';

  useEffect(() => {
    fetchCategories();
    setPage(1);
    setProducts([]);
    fetchProducts(1);
  }, [selectedCategory, selectedGender, sortBy, priceRange, filterType, searchQuery]);

  useEffect(() => {
    // Lock body scroll when mobile filter is open
    if (showFilters && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFilters]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      // Filter to only show Women category (exclude Men, Streetwear, Essentials, Boutique)
      const allowedCategories = ['women'];
      const filteredCategories = (data || []).filter(cat => 
        allowedCategories.includes(cat.slug.toLowerCase())
      );
      
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (pageNum: number = 1) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Handle search query - split into words and search each word
      if (searchQuery) {
        const searchWords = searchQuery.trim().split(/\s+/); // Split by spaces
        
        if (searchWords.length === 1) {
          // Single word search
          query = query.or(`name.ilike.%${searchWords[0]}%,description.ilike.%${searchWords[0]}%`);
        } else {
          // Multiple words - search for any word match
          const searchConditions = searchWords.map(word => 
            `name.ilike.%${word}%,description.ilike.%${word}%`
          ).join(',');
          query = query.or(searchConditions);
        }
      }

      // Handle filter type (new arrivals, featured, etc.)
      if (filterType === 'new') {
        // Get products from last 10 days
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        query = query.gte('created_at', tenDaysAgo.toISOString());
      }

      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      // Filter by gender
      if (selectedGender) {
        query = query.eq('gender', selectedGender);
      }

      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        query = query.gte('price', min);
        if (max) {
          query = query.lte('price', max);
        }
      }

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price-high') {
        query = query.order('price', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.eq('is_featured', true);
      }

      // Pagination
      const from = (pageNum - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count } = await query;
      
      const hasMoreProducts = (count || 0) > pageNum * PRODUCTS_PER_PAGE;
      
      if (pageNum === 1) {
        setProducts(data || []);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore(hasMoreProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title={isNewArrivals ? 'New Arrivals - NAVADHA Fashion Co' : 'Shop Collections - NAVADHA Fashion Co'}
        description={isNewArrivals ? 'Discover the latest additions to our collection. Fresh styles and new arrivals for the modern you.' : 'Browse our complete collection of elegant fashion pieces. Premium quality clothing for every occasion.'}
        keywords="new arrivals, latest fashion, women clothing, boutique fashion, designer wear, online shopping"
      />
      {/* Hero Section for New Arrivals */}
      {isNewArrivals && (
        <section className="relative h-[30vh] sm:h-[35vh] md:h-[40vh] flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="text-center px-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EE458F' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-wider">New Arrivals</h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Discover the latest additions to our collection - fresh styles for the modern you
            </p>
          </div>
        </section>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isNewArrivals ? 'py-6 sm:py-8 md:py-12' : 'py-12'} ${showFilters ? 'lg:overflow-visible overflow-hidden' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-wider mb-1 sm:mb-2">
              {searchQuery ? `Search Results for "${searchQuery}"` : isNewArrivals ? 'Latest Collection' : 'All Collections'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm sm:text-base font-medium min-h-[44px] active:scale-95 shadow-sm hover:shadow-md"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Filters</span>
            {(selectedCategory || selectedGender || sortBy !== 'latest' || priceRange) && (
              <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                {[selectedCategory, selectedGender, sortBy !== 'latest', priceRange].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

      <div className="flex gap-8">
        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Filter Sidebar */}
        <aside
          className={`${
            showFilters ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static top-0 left-0 h-full lg:h-auto w-80 lg:w-64 bg-white dark:bg-gray-900 lg:bg-transparent z-50 lg:z-auto transition-transform duration-300 ease-in-out flex-shrink-0 overflow-y-auto lg:overflow-visible shadow-xl lg:shadow-none`}
        >
          <div className="p-6 lg:p-0 space-y-6 lg:space-y-8">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-medium">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between">
              <h3 className="text-lg font-medium">Filters</h3>
              {(selectedCategory || selectedGender || sortBy !== 'latest' || priceRange) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-500 dark:text-pink-400 hover:text-rose-600 dark:hover:text-pink-500 transition-colors font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Gender Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Gender</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      checked={selectedGender === 'women'}
                      onChange={() => handleFilterChange('gender', 'women')}
                      className="w-4 h-4 text-rose-400 focus:ring-rose-400"
                    />
                    <span className="text-sm group-hover:text-rose-400 transition-colors">Women</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      checked={selectedGender === 'men'}
                      onChange={() => handleFilterChange('gender', 'men')}
                      className="w-4 h-4 text-rose-400 focus:ring-rose-400"
                    />
                    <span className="text-sm group-hover:text-rose-400 transition-colors">Men</span>
                  </label>
                  {selectedGender && (
                    <button
                      onClick={() => handleFilterChange('gender', '')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-pink-400 transition-colors ml-6"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium mb-3">Categories</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.slug}
                        onChange={() => handleFilterChange('category', category.slug)}
                        className="w-4 h-4 text-rose-400 focus:ring-rose-400"
                      />
                      <span className="text-sm group-hover:text-rose-400 transition-colors">{category.name}</span>
                    </label>
                  ))}
                  {selectedCategory && (
                    <button
                      onClick={() => handleFilterChange('category', '')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-pink-400 transition-colors ml-6"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h4 className="text-sm font-medium mb-3">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-medium mb-3">Price Range</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Under ₹1,000', value: '0-1000' },
                    { label: '₹1,000 - ₹2,000', value: '1000-2000' },
                    { label: '₹2,000 - ₹5,000', value: '2000-5000' },
                    { label: 'Above ₹5,000', value: '5000-' },
                  ].map((range) => (
                    <label key={range.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange === range.value}
                        onChange={() => handleFilterChange('price', range.value)}
                        className="w-4 h-4 text-rose-400 focus:ring-rose-400"
                      />
                      <span className="text-sm group-hover:text-rose-400 transition-colors">{range.label}</span>
                    </label>
                  ))}
                  {priceRange && (
                    <button
                      onClick={() => handleFilterChange('price', '')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-pink-400 transition-colors ml-6"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Apply Button */}
            <div className="lg:hidden sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 -mx-6 -mb-6">
              <div className="flex gap-3">
                {(selectedCategory || selectedGender || sortBy !== 'latest' || priceRange) && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 sm:mb-3 md:mb-4"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded mb-1.5 sm:mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8 sm:mt-12">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
                    style={{ 
                      color: loadingMore ? '#999' : '#EE458F', 
                      borderColor: loadingMore ? '#999' : '#EE458F' 
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.backgroundColor = '#EE458F';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#EE458F';
                      }
                    }}
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-700 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-4">No products found</p>
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg transition-colors font-medium border-2"
                style={{ color: '#EE458F', borderColor: '#EE458F' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#D63D7F';
                  e.currentTarget.style.borderColor = '#D63D7F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#EE458F';
                  e.currentTarget.style.borderColor = '#EE458F';
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
