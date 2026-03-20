import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';
import LoadingState from '../../components/LoadingState';
import { Product } from '../../types';
import SEO from '../../components/SEO';

const PRODUCTS_PER_PAGE = 12;

export default function WomenIndoWestern() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : products;

  const heroImage = 'https://images.pexels.com/photos/3755021/pexels-photo-3755021.jpeg?auto=compress&cs=tinysrgb&w=1920';

  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchProducts(1);
  }, [searchQuery]);

  const fetchProducts = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const from = (pageNum - 1) * PRODUCTS_PER_PAGE;
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('category', 'indo-western')
        .in('gender', ['women', 'unisex'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, from + PRODUCTS_PER_PAGE - 1);

      if (error) throw error;
      if (pageNum === 1) setProducts(data || []);
      else setProducts(prev => [...prev, ...(data || [])]);
      setHasMore((count || 0) > pageNum * PRODUCTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next);
  };

  return (
    <>
      <SEO
        title="Women's Indo-Western Wear - Fusion Fashion | NAVADHA"
        description="Shop women's indo-western wear at NAVADHA. Fusion fashion that blends Indian tradition with contemporary style. Dhoti pants, cape sets, fusion kurtas, and more."
        keywords="indo western wear women, fusion fashion India, indo western dress, contemporary Indian fashion, fusion kurta, dhoti pants women"
        url="https://navadha.com/women/indo-western"
      />
    <div className="min-h-screen">
      <section className="relative min-h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden py-8 sm:py-0">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
          style={{ backgroundImage: `url('${heroImage}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/50 via-orange-900/40 to-rose-900/50"></div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
          <div className="inline-block mb-3 sm:mb-4 md:mb-6 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full border border-white/30">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium tracking-widest text-gray-700 dark:text-gray-300 uppercase">WOMEN'S COLLECTION</span>
          </div>
          
          <h1 className="brand-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-3 sm:mb-4 md:mb-6 animate-fade-in leading-tight text-white drop-shadow-2xl">
            Indo-Western
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/95 drop-shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
            Fusion fashion that blends tradition and modernity
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {loading ? (
          <LoadingState type="skeleton" skeletonType="product" skeletonCount={8} />
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
            {hasMore && !searchQuery && (
              <div className="flex justify-center mt-10">
                <button onClick={loadMore} disabled={loadingMore} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2">
                  {loadingMore ? <><div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>Loading...</> : 'Load More'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-amber-300 dark:text-amber-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base px-4">
              {searchQuery ? `No products found for "${searchQuery}"` : 'No products found in this category'}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium text-sm sm:text-base"
            >
              Browse all products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
