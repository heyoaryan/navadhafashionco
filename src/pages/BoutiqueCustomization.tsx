import { useEffect, useState } from 'react';
import { Sparkles, Filter, Palette, Ruler, Scissors, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function BoutiqueCustomization() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .contains('tags', ['customize']);

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
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-pink-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-rose-900/20 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-5"></div>
        
        <div className="relative z-10 text-center px-4 py-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg">
              <Sparkles className="w-10 h-10 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-wider mb-6 text-gray-900 dark:text-white">
            Bespoke Customization
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
            Create your dream outfit with personalized fabrics, colors, and perfect measurements. 
            Crafted exclusively for you by expert artisans.
          </p>

          {/* Customization Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <Palette className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Choose Fabrics</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Pick Colors</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <Ruler className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Perfect Fit</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <Scissors className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Expert Craft</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border-2 border-rose-200 dark:border-rose-800 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 rounded-xl">
              <Clock className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                How Customization Works
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Select a design below, then customize fabrics, colors, embellishments, and provide your measurements. 
                Our skilled artisans will craft your unique piece with meticulous attention to detail.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                <Clock className="w-4 h-4" />
                <span>Delivery time: 2-3 weeks from order confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Choose Your Base Design</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {products.length} {products.length === 1 ? 'design' : 'designs'} available for customization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            >
              <option value="latest">Latest Designs</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl">
              <Sparkles className="w-20 h-20 text-rose-300 dark:text-rose-700 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Our bespoke customization service is being prepared. 
                Soon you'll be able to create your dream outfit!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
