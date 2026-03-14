import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';
import { Product } from '../../types';

export default function MenGymAttire() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : products;

  const heroImage = 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=1920';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'gym')
        .eq('gender', 'men')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden py-8 sm:py-0">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
          style={{ backgroundImage: `url('${heroImage}')` }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
          <div className="inline-block mb-3 sm:mb-4 md:mb-6 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full border border-white/30">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium tracking-widest text-gray-700 dark:text-gray-300 uppercase">MEN'S COLLECTION</span>
          </div>
          
          <h1 className="brand-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-3 sm:mb-4 md:mb-6 animate-fade-in leading-tight text-white drop-shadow-2xl">
            Gym Attire
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/95 drop-shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
            Performance wear for your fitness journey
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {loading ? (
          <div className="flex justify-center items-center py-16 sm:py-20">
            <div className="text-center">
              <div className="rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-200 border-t-green-500 animate-[spin_1s_linear_infinite_reverse] mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {searchQuery ? `${filteredProducts.length} result${filteredProducts.length === 1 ? '' : 's'} for "${searchQuery}"` : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
            <Dumbbell className="w-12 h-12 sm:w-16 sm:h-16 text-green-300 dark:text-green-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base px-4">
              {searchQuery ? `No products found for "${searchQuery}"` : 'No products found in this category'}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm sm:text-base"
            >
              Browse all products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
