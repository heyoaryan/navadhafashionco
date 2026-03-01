import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Product } from '../types';
import SEO from '../components/SEO';

interface ProductWithSales extends Product {
  sales_count: number;
}

export default function BestSellers() {
  const [products, setProducts] = useState<ProductWithSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all');

  useEffect(() => {
    fetchBestSellers();
  }, [filter]);

  const fetchBestSellers = async () => {
    try {
      setLoading(true);
      
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
      const sortedProducts = Array.from(productsMap.values())
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 20); // Top 20 best sellers

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner 
          message="Finding Best Sellers..." 
          size="lg"
          variant="trending"
        />
      </div>
    );
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
          )}
        </div>
      </div>
    </>
  );
}

