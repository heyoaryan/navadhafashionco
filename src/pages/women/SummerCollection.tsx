import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sun, Wind, Droplets } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';
import LoadingState from '../../components/LoadingState';
import { Product } from '../../types';

export default function WomenSummerCollection() {
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

  useEffect(() => {
    fetchSummerProducts();
  }, []);

  const fetchSummerProducts = async () => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('gender', 'women')
        .eq('season', 'summer')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching summer products:', error);
    } finally {
      // Ensure minimum loading time of 800ms for smooth transition
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 800 - elapsedTime);
      setTimeout(() => setLoading(false), remainingTime);
    }
  };

  if (loading) {
    return <LoadingState type="page" message="Loading Summer Collection..." variant="dots" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 dark:from-orange-600 dark:via-amber-700 dark:to-yellow-600">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80" 
            alt="Summer Collection Background"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/50 via-amber-600/40 to-yellow-600/50"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-300/30 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Women's Summer Collection
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-light">
              Embrace the sunshine with our breezy, vibrant summer styles
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
                <Wind className="w-5 h-5" />
                <span className="font-medium">Lightweight Fabrics</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
                <Droplets className="w-5 h-5" />
                <span className="font-medium">Moisture Wicking</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
                <Sun className="w-5 h-5" />
                <span className="font-medium">UV Protection</span>
              </div>
            </div>

            <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full text-white text-sm">
              <span className="font-semibold">{products.length}</span> Summer Styles Available
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-amber-50 dark:text-gray-900"/>
          </svg>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Sun className="w-16 h-16 text-orange-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No summer products available at the moment.</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back soon for fresh summer styles!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Shine Bright This Summer
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover our handpicked selection of summer essentials designed to keep you cool, comfortable and effortlessly stylish
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {searchQuery && filteredProducts.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">No products found for "{searchQuery}"</p>
            )}
            {searchQuery && filteredProducts.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{filteredProducts.length} result{filteredProducts.length === 1 ? '' : 's'} for "{searchQuery}"</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
