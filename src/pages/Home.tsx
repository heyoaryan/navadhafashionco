import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gem, Truck, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

// ── HERO INTRO COMPONENT ──────────────────────────────────────────────
const NAVADHA_LETTERS = ['N', 'A', 'V', 'A', 'D', 'H', 'A'];

function HeroIntro() {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [showFashionCo, setShowFashionCo] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Stagger each letter 120ms apart
    const timers: ReturnType<typeof setTimeout>[] = [];
    NAVADHA_LETTERS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLetters(i + 1), 200 + i * 120));
    });
    const total = 200 + NAVADHA_LETTERS.length * 120;
    timers.push(setTimeout(() => setShowFashionCo(true), total + 100));
    timers.push(setTimeout(() => setShowSubtitle(true),  total + 400));
    timers.push(setTimeout(() => setShowButtons(true),   total + 750));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background — same style as Boutique hero */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-rose-50 to-pink-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>

        {/* Animated Grid Lines */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 animate-grid-pulse" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(238, 69, 143, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(238, 69, 143, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 dark:from-gray-900/50 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">

        {/* NAVADHA — letter by letter */}
        <div className="relative inline-block mb-3 sm:mb-5">
          <div className="absolute inset-0 blur-3xl pointer-events-none" style={{ backgroundColor: '#EE458F22' }} />
          <h1
            className="brand-title text-6xl sm:text-8xl md:text-9xl relative drop-shadow-xl flex justify-center"
            style={{ color: '#EE458F' }}
          >
            {NAVADHA_LETTERS.map((letter, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: i < visibleLetters ? 1 : 0,
                  transform: i < visibleLetters ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.8)',
                  transition: 'opacity 0.45s cubic-bezier(0.34,1.56,0.64,1), transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {letter}
              </span>
            ))}
          </h1>

          {/* FASHION CO */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <div
              className="h-px w-12 sm:w-20"
              style={{
                background: 'linear-gradient(to right, transparent, #EE458F)',
                opacity: showFashionCo ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
            <span
              className="text-xs sm:text-sm font-light whitespace-nowrap"
              style={{
                color: '#EE458F',
                letterSpacing: '0.35em',
                opacity: showFashionCo ? 1 : 0,
                transform: showFashionCo ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}
            >
              FASHION CO
            </span>
            <div
              className="h-px w-12 sm:w-20"
              style={{
                background: 'linear-gradient(to left, transparent, #EE458F)',
                opacity: showFashionCo ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="text-sm sm:text-lg md:text-xl lg:text-2xl font-light text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 tracking-wide px-4 italic"
          style={{
            opacity: showSubtitle ? 1 : 0,
            transform: showSubtitle ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          From a Mother's Devotion to a Daughter's Vision
        </p>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          style={{
            opacity: showButtons ? 1 : 0,
            transform: showButtons ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <Link
            to="/shop?filter=new"
            className="group flex-shrink-0 px-8 sm:px-10 py-3.5 sm:py-4 text-white rounded-full transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold whitespace-nowrap min-h-[50px] shadow-lg hover:shadow-2xl relative overflow-hidden"
            style={{ backgroundColor: '#EE458F' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D63D7F')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EE458F')}
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
            <span className="relative z-10">New Arrivals</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/shop"
            className="flex-shrink-0 px-8 sm:px-10 py-3.5 sm:py-4 bg-transparent border-2 border-gray-800 dark:border-white hover:bg-gray-800 hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base font-medium whitespace-nowrap min-h-[50px]"
          >
            Explore Collections
          </Link>
        </div>
      </div>
    </section>
  );
}

// Minimal product fields needed for product cards — avoids fetching heavy columns like description
const PRODUCT_FIELDS = 'id, name, slug, price, compare_at_price, main_image_url, stock_quantity, low_stock_threshold, sizes, colors, gender, is_active, created_at, tags, category_id';

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [womenProducts, setWomenProducts] = useState<Product[]>([]);
  const [menProducts, setMenProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Responsive products per page
  const getProductsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 8; // Desktop: 4 columns x 2 rows
      if (window.innerWidth >= 640) return 6;  // Tablet: 2 columns x 3 rows
      return 6; // Mobile: 2 columns x 3 rows
    }
    return 6;
  };

  const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());

  // Update products per page on resize
  useEffect(() => {
    const handleResize = () => {
      setProductsPerPage(getProductsPerPage());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchInitialProducts();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, page]);

  const fetchInitialProducts = async () => {
    try {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const { data: all, count, error } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      const products = all || [];
      setNewArrivals(products.filter(p => new Date(p.created_at) >= tenDaysAgo).slice(0, productsPerPage));
      setWomenProducts(products.filter(p => p.gender === 'women').slice(0, productsPerPage));
      setMenProducts(products.filter(p => p.gender === 'men').slice(0, productsPerPage));
      setAllProducts(products.slice(0, productsPerPage));
      setHasMore((count || 0) > productsPerPage);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const from = page * productsPerPage;
      const to = from + productsPerPage - 1;

      const { data, count } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (data && data.length > 0) {
        setAllProducts(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        setHasMore((count || 0) > (page + 1) * productsPerPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, productsPerPage]);

  // Skeleton card component
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl aspect-[3/4] w-full mb-3" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
    </div>
  );

  const skeletonCount = productsPerPage;

  return (
    <div>
      <SEO />
      <HeroIntro />

      {/* New Arrivals Section */}
      {(loading || newArrivals.length > 0) && (
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 sm:mb-12">
            <div>
              <h2 className="brand-logo text-xl sm:text-3xl lg:text-4xl mb-2">New Arrivals</h2>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Fresh styles for the season</p>
            </div>
            {!loading && (
              <Link
                to="/shop?filter=new"
                className="text-xs sm:text-sm hover:text-rose-400 transition-colors flex items-center gap-2 flex-shrink-0 ml-4"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
              : newArrivals.map((product) => <ProductCard key={product.id} product={product} />)
            }
          </div>
        </section>
      )}

      {/* Women's Products Section */}
      {(loading || womenProducts.length > 0) && (
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-900/10 dark:to-rose-900/10">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8 sm:mb-12">
              <div>
                <h2 className="brand-logo text-xl sm:text-3xl lg:text-4xl mb-2">Women's Collection</h2>
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Elegant styles for every occasion</p>
              </div>
              {!loading && (
                <Link
                  to="/shop?gender=women"
                  className="text-xs sm:text-sm hover:text-rose-400 transition-colors flex items-center gap-2 flex-shrink-0 ml-4"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {loading
                ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
                : womenProducts.map((product) => <ProductCard key={product.id} product={product} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* Men's Products Section */}
      {(loading || menProducts.length > 0) && (
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 sm:mb-12">
            <div>
              <h2 className="brand-logo text-xl sm:text-3xl lg:text-4xl mb-2">Men's Collection</h2>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Contemporary fashion for modern men</p>
            </div>
            {!loading && (
              <Link
                to="/shop?gender=men"
                className="text-xs sm:text-sm hover:text-rose-400 transition-colors flex items-center gap-2 flex-shrink-0 ml-4"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
              : menProducts.map((product) => <ProductCard key={product.id} product={product} />)
            }
          </div>
        </section>
      )}

      {/* All Products with Infinite Scroll */}
      {(loading || allProducts.length > 0) && (
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8 sm:mb-12">
              <div>
                <h2 className="brand-logo text-xl sm:text-3xl lg:text-4xl mb-2">All Products</h2>
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Discover our complete collection</p>
              </div>
              {!loading && (
                <Link
                  to="/shop"
                  className="text-xs sm:text-sm hover:text-rose-400 transition-colors flex items-center gap-2 flex-shrink-0 ml-4"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {loading
                ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
                : allProducts.map((product) => <ProductCard key={product.id} product={product} />)
              }
            </div>

            {/* Infinite scroll trigger */}
            {!loading && hasMore && (
              <div ref={observerTarget} className="flex justify-center mt-8">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="rounded-full h-6 w-6 border-4 border-rose-200 border-t-rose-400 animate-spin"></div>
                    <span className="text-sm sm:text-base">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Premium Quality</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Crafted with the finest materials for lasting elegance
              </p>
            </div>
            <div className="text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Free Shipping</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Complimentary shipping on orders above ₹2,999
              </p>
            </div>
            <div className="text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Easy Returns</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                5-day hassle-free returns and exchanges
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
