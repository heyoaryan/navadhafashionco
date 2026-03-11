import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import FullScreenLoader from '../components/FullScreenLoader';
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
    return <FullScreenLoader message="Finding Best Sellers..." size="lg" variant="trending" />;
  }

  return (
    <>
      <SEO 
        title="Best Sellers - Top Trending Fashion"
        description="Shop our best-selling products. Discover what everyone is loving from Navadha Fashion Co."
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Minimal Hero Section with Filters */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Best Sellers
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our most popular products
              </p>
              
              {/* Filters in Hero */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('men')}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'men'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Men
                </button>
                <button
                  onClick={() => setFilter('women')}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'women'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Women
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No best sellers available at the moment.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <div key={product.id} className="relative">
                    {index < 3 && (
                      <div className="absolute -top-2 -left-2 z-10 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        #{index + 1}
                      </div>
                    )}
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-4 text-base font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
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
          )}
        </div>
      </div>
    </>
  );
}

