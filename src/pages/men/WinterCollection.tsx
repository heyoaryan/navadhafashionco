import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Snowflake, Wind, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';
import { Product } from '../../types';

export default function MenWinterCollection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const PRODUCTS_PER_PAGE = 12;

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : products;

  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchWinterProducts(1);
  }, [searchQuery]);

  const fetchWinterProducts = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const from = (pageNum - 1) * PRODUCTS_PER_PAGE;
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .in('gender', ['men', 'unisex'])
        .eq('season', 'winter')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, from + PRODUCTS_PER_PAGE - 1);

      if (error) throw error;
      if (pageNum === 1) setProducts(data || []);
      else setProducts(prev => [...prev, ...(data || [])]);
      setHasMore((count || 0) > pageNum * PRODUCTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching winter products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchWinterProducts(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 via-blue-800 to-indigo-900 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1483118714900-540cf339fd46?w=1920&q=80" 
            alt="Winter Collection Background"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-blue-900/40 to-indigo-900/50"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Snowflake className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Men's Winter Collection
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-light">
              Stay warm and stylish with our cozy winter essentials
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
                <Flame className="w-5 h-5" />
                <span className="font-medium">Thermal Insulation</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
                <Wind className="w-5 h-5" />
                <span className="font-medium">Windproof</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
                <Snowflake className="w-5 h-5" />
                <span className="font-medium">Cold Weather Ready</span>
              </div>
            </div>

            <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full text-white text-sm">
              <span className="font-semibold">{products.length}</span> Winter Styles Available
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-slate-50 dark:text-gray-900"/>
          </svg>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-xl aspect-[3/4] w-full mb-3" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Snowflake className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No winter products available at the moment.</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back soon for cozy winter styles!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Embrace the Cold in Style
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover our premium winter collection featuring warm layers, cozy fabrics, and timeless designs
              </p>
            </div>

            {searchQuery && filteredProducts.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{filteredProducts.length} result{filteredProducts.length === 1 ? '' : 's'} for "{searchQuery}"</p>
            )}
            {searchQuery && filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">No products found for "{searchQuery}"</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {hasMore && !searchQuery && (
                  <div className="flex justify-center mt-10">
                    <button onClick={loadMore} disabled={loadingMore} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2">
                      {loadingMore ? <><div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>Loading...</> : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
