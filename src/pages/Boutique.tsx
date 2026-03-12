import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Package, ArrowRight, Star, Scissors, Palette, Ruler, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

// Custom hook for scroll animations
function useScrollAnimation(delay = 0) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        } else {
          // Reset animation when scrolling back up
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [delay]);

  return { elementRef, isVisible };
}

// Hook for scroll-based transformations
function useScrollTransform() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
}

export default function Boutique() {
  const [customizeProducts, setCustomizeProducts] = useState<Product[]>([]);
  const [madeProducts, setMadeProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollY = useScrollTransform();
  const card1Animation = useScrollAnimation(100);
  const card2Animation = useScrollAnimation(200);
  const howItWorksAnimation = useScrollAnimation(0);
  const readyMadeAnimation = useScrollAnimation(0);
  const benefitsAnimation = useScrollAnimation(0);
  const customizationAnimation = useScrollAnimation(0);

  // Calculate hero transformations based on scroll
  const heroOpacity = Math.max(0, 1 - scrollY / 500);
  const heroScale = Math.max(0.8, 1 - scrollY / 2000);
  const heroTranslateY = -scrollY * 0.5;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch products with 'customize' tag
      const { data: customize } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .contains('tags', ['customize'])
        .limit(4);

      // Fetch products with 'made' tag
      const { data: made } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .contains('tags', ['made'])
        .limit(4);

      setCustomizeProducts(customize || []);
      setMadeProducts(made || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
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
        
        <div 
          className="relative z-10 text-center px-4 max-w-6xl mx-auto py-20 transition-all duration-300"
          style={{
            opacity: heroOpacity,
            transform: `translateY(${heroTranslateY}px) scale(${heroScale})`,
          }}
        >
          <h1 className="brand-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6" style={{ color: '#EE458F' }}>
            The Ultimate Expression of Self
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience luxury fashion with our exclusive boutique collection. Choose from exquisite ready-made pieces or create your dream outfit with our bespoke customization service.
          </p>
        </div>

        {/* Scroll Down Indicator */}
        <div 
          className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer"
          style={{ opacity: heroOpacity }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Scroll Down
            </span>
            <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-gray-600 dark:bg-gray-400 rounded-full animate-scroll-down"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section - Separate from Hero */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Two Main Options */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Ready-Made Card */}
            <div 
              ref={card1Animation.elementRef}
              className={`animate-on-scroll animate-fade-in-left ${card1Animation.isVisible ? 'visible' : ''}`}
            >
              <Link
                to="/boutique/ready-made"
                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] block h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-8 lg:p-10 h-full flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-3 text-gray-900 dark:text-white">
                    Ready-Made Collection
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-grow">
                    Handpicked premium pieces crafted with finest fabrics. Ready to wear, perfect to impress.
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>Premium quality fabrics</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>Immediate availability</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>Fast delivery</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium group-hover:gap-4 transition-all">
                    <span>Explore Collection</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Customization Card */}
            <div 
              ref={card2Animation.elementRef}
              className={`animate-on-scroll animate-fade-in-right ${card2Animation.isVisible ? 'visible' : ''}`}
            >
              <Link
                to="/boutique/customization"
                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] block h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-8 lg:p-10 h-full flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                  </div>
                  
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-3 text-gray-900 dark:text-white">
                    Bespoke Customization
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-grow">
                    Design your dream outfit. Choose fabrics, colors, and details. Made exclusively for you.
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <Palette className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span>Personalized design choices</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <Ruler className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span>Perfect fit guarantee</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <Scissors className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span>Expert craftsmanship</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium group-hover:gap-4 transition-all">
                    <span>Start Designing</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={howItWorksAnimation.elementRef}
            className={`text-center mb-16 animate-on-scroll animate-fade-in-up ${howItWorksAnimation.isVisible ? 'visible' : ''}`}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wider mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Your journey to perfect fashion in simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Ready-Made Process */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <h3 className="text-2xl font-semibold">Ready-Made</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Browse Collection</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Explore our curated selection of premium boutique pieces
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Select Your Piece</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your favorite design and size
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Place Order</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add to cart and complete secure checkout
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Fast Delivery</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive your order within 3-5 business days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customization Process */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                <h3 className="text-2xl font-semibold">Customization</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Choose Base Design</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select from our customizable design templates
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Personalize Details</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose fabrics, colors, embellishments & provide measurements
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Expert Crafting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our artisans create your unique piece (2-3 weeks)
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Delivered to You</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive your one-of-a-kind creation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Ready-Made Section */}
        <section className="mb-24">
          <div 
            ref={readyMadeAnimation.elementRef}
            className={`text-center mb-12 animate-on-scroll animate-fade-in-up ${readyMadeAnimation.isVisible ? 'visible' : ''}`}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <h2 className="text-3xl sm:text-4xl font-light tracking-wider">Ready-Made Collection</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Handpicked boutique pieces ready to elevate your wardrobe instantly
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : madeProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {madeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="text-center">
                <Link 
                  to="/boutique/ready-made"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                >
                  View Full Collection
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-3xl border-2 border-dashed border-purple-200 dark:border-purple-900/30">
              <Package className="w-20 h-20 text-purple-300 dark:text-purple-700 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Coming Soon</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Exquisite ready-made pieces arriving soon
              </p>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="relative mb-24">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-6 py-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
              OR
            </span>
          </div>
        </div>

        {/* Customization Section */}
        <section>
          <div 
            ref={customizationAnimation.elementRef}
            className={`text-center mb-12 animate-on-scroll animate-fade-in-up ${customizationAnimation.isVisible ? 'visible' : ''}`}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              <h2 className="text-3xl sm:text-4xl font-light tracking-wider">Bespoke Customization</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Design your dream outfit with personalized fabrics, colors, and perfect measurements
            </p>
          </div>

          {/* Customization Benefits */}
          <div 
            ref={benefitsAnimation.elementRef}
            className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-on-scroll animate-scale-in ${benefitsAnimation.isVisible ? 'visible' : ''}`}
          >
            <div className="text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <Palette className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
              <h4 className="font-medium mb-2">Choose Fabrics</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select from premium materials
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <Sparkles className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
              <h4 className="font-medium mb-2">Pick Colors</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Match your unique style
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <Ruler className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
              <h4 className="font-medium mb-2">Perfect Fit</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Custom measurements
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <Clock className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
              <h4 className="font-medium mb-2">2-3 Weeks</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crafted with care
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : customizeProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {customizeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="text-center">
                <Link 
                  to="/boutique/customization"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                >
                  Start Customizing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-3xl border-2 border-dashed border-rose-200 dark:border-rose-900/30">
              <Sparkles className="w-20 h-20 text-rose-300 dark:text-rose-700 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Coming Soon</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Customization options will be available soon
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
