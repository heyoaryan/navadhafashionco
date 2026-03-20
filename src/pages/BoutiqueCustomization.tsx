import { useEffect, useState } from 'react';
import { Scissors, Filter, Sparkles, Ruler, Palette } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function BoutiqueCustomization() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(false);
    const timeout = setTimeout(() => { setLoading(false); setError(true); }, 10000);
    try {
      let query = supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, main_image_url, stock_quantity, sizes, colors, gender, is_active, tags, category_id, created_at')
        .eq('is_active', true)
        .or('tags.cs.{"customization"},tags.cs.{"customize"},tags.cs.{"bespoke"}');

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price-high') {
        query = query.order('price', { ascending: false });
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      let result = data || [];

      // Fallback: if no tag-matched products, show all active products
      if (result.length === 0) {
        let fallbackQuery = supabase
          .from('products')
          .select('id, name, slug, price, compare_at_price, main_image_url, stock_quantity, sizes, colors, gender, is_active, tags, category_id, created_at')
          .eq('is_active', true);

        if (sortBy === 'latest') {
          fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
        } else if (sortBy === 'price-low') {
          fallbackQuery = fallbackQuery.order('price', { ascending: true });
        } else if (sortBy === 'price-high') {
          fallbackQuery = fallbackQuery.order('price', { ascending: false });
        }

        const { data: fallback } = await fallbackQuery;
        result = fallback || [];
      }

      setProducts(result);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(true);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-rose-100 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-rose-900/20 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-5"></div>
        
        <div className="relative z-10 text-center px-4 py-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg">
              <Scissors className="w-10 h-10 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-wider mb-6 text-gray-900 dark:text-white">
            Customization Collection
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
            Create your dream outfit with our bespoke customization service. 
            Tailored to perfection, designed by you.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full">
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-medium">Bespoke Design</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full">
              <Ruler className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-medium">Perfect Fit</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full">
              <Palette className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-medium">Your Choice</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Browse Collection</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {products.length} {products.length === 1 ? 'piece' : 'pieces'} available
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  <option value="latest">Latest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : error ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl">
              <Scissors className="w-20 h-20 text-rose-300 dark:text-rose-700 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                Something went wrong
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                We couldn't load the collection. Please try again.
              </p>
              <button
                onClick={fetchProducts}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl">
              <Scissors className="w-20 h-20 text-rose-300 dark:text-rose-700 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                No Products Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Our bespoke customization service is being prepared. Check back soon to create your perfect outfit!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
