import { useEffect, useState } from 'react';
import { Package, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function BoutiqueReadyMade() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Get products older than 6 days with 'made' tag
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .contains('tags', ['made'])
        .lt('created_at', sixDaysAgo.toISOString()); // Only products older than 6 days

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price-high') {
        query = query.order('price', { ascending: false });
      }

      const { data } = await query;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[30vh] sm:h-[35vh] md:h-[40vh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center px-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-purple-500" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-wider">Ready-Made</h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Handpicked boutique pieces crafted with premium fabrics and timeless elegance
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-light tracking-wider mb-1 sm:mb-2">Ready-Made Collection</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {products.length} {products.length === 1 ? 'piece' : 'pieces'} available
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="latest">Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 sm:mb-3 md:mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded mb-1.5 sm:mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <Package className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-300 dark:text-gray-700 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-light mb-2">No Products Available</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
              New ready-made pieces arriving soon. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
