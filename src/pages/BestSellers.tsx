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
      // Step 1: Get all active products
      let productQuery = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (filter !== 'all') {
        productQuery = productQuery.eq('gender', filter);
      }

      const { data: allProducts, error: productError } = await productQuery;
      if (productError) throw productError;

      // Step 2: Get sales counts from completed orders only (exclude cancelled/refunded)
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          orders!inner(status)
        `)
        .in('orders.status', ['processing', 'shipped', 'delivered']);

      if (salesError) throw salesError;

      // Step 3: Aggregate sales per product
      const salesMap = new Map<string, number>();
      salesData?.forEach((item: any) => {
        const pid = item.product_id;
        salesMap.set(pid, (salesMap.get(pid) || 0) + (item.quantity || 0));
      });

      // Step 4: Merge and sort — products with most sales first, unsold products last
      const allSortedProducts: ProductWithSales[] = (allProducts || [])
        .map(p => ({ ...p, sales_count: salesMap.get(p.id) || 0 }))
        .sort((a, b) => b.sales_count - a.sales_count);

      // Step 5: Paginate
      const from = (pageNum - 1) * PRODUCTS_PER_PAGE;
      const paginatedProducts = allSortedProducts.slice(from, from + PRODUCTS_PER_PAGE);

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
    return <LoadingState type="page" message="Finding Most Loved..." variant="pulse" />;
  }

  return (
    <>
      <SEO 
        title="Most Loved - Top Trending Fashion"
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
                Most Loved
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
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">No most loved products available</p>
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
                {products.map((product) => (
                  <div key={product.id} className="relative group">
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

