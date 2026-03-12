import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import LoadingState from '../components/LoadingState';
import { Product } from '../types';
import SEO from '../components/SEO';

interface ProductWithSales extends Product {
  sales_count: number;
}

export default function BestSellers() {
  const [products, setProducts] = useState<ProductWithSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PRODUCTS_PER_PAGE = 12;

  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchBestSellers(1);
  }, [filter]);

  const fetchBestSellers = async (pageNum: number = 1) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Get products with their sales count from order_items
      let query = supabase
        .from('products')
        .select(`
          *,
          order_items!inner(quantity)
        `)
        .eq('is_active', true);

      // Apply gender filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('gender', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate sales count for each product
      const productsMap = new Map<string, ProductWithSales>();
      
      data?.forEach((item: any) => {
        const productId = item.id;
        
        if (!productsMap.has(productId)) {
          productsMap.set(productId, {
            ...item,
            sales_count: 0
          });
        }
        
        const product = productsMap.get(productId)!;
        product.sales_count += item.order_items.quantity || 0;
      });

      // Convert map to array and sort by sales count
      const allSortedProducts = Array.from(productsMap.values())
        .sort((a, b) => b.sales_count - a.sales_count);

      // Pagination
      const from = (pageNum - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE;
      const paginatedProducts = allSortedProducts.slice(from, to);

      if (pageNum === 1) {
        setProducts(paginatedProducts);
      } else {
        setProducts(prev => [...prev, ...paginatedProducts]);
      }

      setHasMore(allSortedProducts.length > pageNum * PRODUCTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBestSellers(nextPage);
  };

  if (loading) {
    return <LoadingState type="page" message="Finding Best Sellers..." variant="pulse" />;
  }

  return (
    <>
      <SEO 
        title="Best Sellers - Top Trending Fashion"
        description="Shop our best-selling products. Discover what everyone is loving from Navadha Fashion Co."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        {/* Enhanced Hero Section with Filters */}
        <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400 to-pink-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="text-center">
              {/* Badge with icon */}
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-full border border-rose-200 dark:border-rose-800">
                <Award className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Most Popular
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                Best Sellers
              </h1>
              
              {/* Decorative line */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-400"></div>
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-400"></div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8 text-base sm:text-lg max-w-2xl mx-auto">
                Discover our most loved products, handpicked by customers like you
              </p>
              
              {/* Enhanced Filters */}
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`group relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <span className="relative z-10">All</span>
                  {filter === 'all' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  )}
                </button>
                <button
                  onClick={() => setFilter('women')}
                  className={`group relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    filter === 'women'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <span className="relative z-10">Women</span>
                  {filter === 'women' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  )}
                </button>
                <button
                  onClick={() => setFilter('men')}
                  className={`group relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    filter === 'men'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <span className="relative z-10">Men</span>
                  {filter === 'men' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">No best sellers available</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Check back soon for trending products!</p>
            </div>
          ) : (
            <>
              {/* Product count with decorative elements */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full"></div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Showing <span className="font-bold text-rose-600 dark:text-rose-400">{products.length}</span> best-selling {products.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <div key={product.id} className="relative group">
                    {/* Enhanced Top 3 Badge with gradient */}
                    {index < 3 && (
                      <div 
                        className="absolute -top-3 -left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transform transition-transform group-hover:scale-110"
                        style={{
                          background: index === 0 
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
                            : index === 1 
                            ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
                            : 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                          color: 'white',
                          boxShadow: index === 0 
                            ? '0 4px 15px rgba(255, 215, 0, 0.4)' 
                            : index === 1 
                            ? '0 4px 15px rgba(192, 192, 192, 0.4)'
                            : '0 4px 15px rgba(205, 127, 50, 0.4)'
                        }}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>#{index + 1}</span>
                      </div>
                    )}
                    
                    {/* Subtle hover effect container */}
                    <div className="relative overflow-hidden rounded-lg transition-all duration-300 group-hover:shadow-xl">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="group relative px-8 py-4 text-base font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:scale-105 active:scale-95"
                  >
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 transition-opacity ${loadingMore ? 'opacity-50' : 'opacity-100'}`}></div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Button content */}
                    <span className="relative z-10 text-white flex items-center gap-2">
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </span>
                    
                    {/* Shadow effect */}
                    <div className="absolute inset-0 shadow-lg shadow-rose-500/30 group-hover:shadow-rose-500/50 transition-shadow rounded-lg"></div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

