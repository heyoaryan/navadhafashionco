import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Package, ArrowRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function Boutique() {
  const [customizeProducts, setCustomizeProducts] = useState<Product[]>([]);
  const [madeProducts, setMadeProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(6);

      // Fetch products with 'made' tag
      const { data: made } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .contains('tags', ['made'])
        .limit(6);

      setCustomizeProducts(customize || []);
      setMadeProducts(made || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-rose-50 to-pink-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-5"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-block mb-6 px-6 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-purple-200 dark:border-purple-800">
            <span className="text-sm font-light tracking-wider text-purple-600 dark:text-purple-400">EXCLUSIVE COLLECTION</span>
          </div>
          
          <h1 className="brand-title text-4xl sm:text-6xl md:text-8xl mb-6 sm:mb-8 animate-fade-in" style={{ color: '#EE458F' }}>
            Boutique
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl font-light text-gray-700 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Where craftsmanship meets personalization. Discover handpicked ready-made pieces or create your own bespoke design.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              to="/boutique/ready-made"
              className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Explore Ready-Made
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/boutique/customization"
              className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-purple-200 dark:border-purple-800 rounded-full transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Customizing
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Star className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">Premium Quality</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Handcrafted with finest fabrics and attention to detail
              </p>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">Bespoke Designs</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Personalize every aspect to match your unique style
              </p>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">Expert Artisans</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Crafted by skilled artisans with years of experience
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Ready-Made Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
                <Package className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wider mb-2">Ready-Made Collection</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Curated pieces ready to elevate your wardrobe
                </p>
              </div>
            </div>
            <Link 
              to="/boutique/ready-made"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <div className="relative overflow-hidden">
                <div className="flex gap-8 animate-marquee hover:pause-marquee">
                  {[...madeProducts, ...madeProducts].map((product, index) => (
                    <div key={`${product.id}-${index}`} className="flex-shrink-0 w-[280px]">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-8">
                <Link 
                  to="/boutique/ready-made"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <Package className="w-16 h-16 text-purple-300 dark:text-purple-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                New ready-made pieces arriving soon
              </p>
            </div>
          )}
        </section>

        {/* Customization Section */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-xl">
                <Sparkles className="w-7 h-7 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wider mb-2">Customization</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Design your perfect outfit, made just for you
                </p>
              </div>
            </div>
            <Link 
              to="/boutique/customization"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Info Banner */}
          <div className="mb-8 p-6 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-xl border border-rose-200 dark:border-rose-900/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1 text-gray-900 dark:text-white">How It Works</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Choose a base design, customize fabrics, colors, and embellishments, provide your measurements, 
                  and our artisans will craft your unique piece. Delivery in 2-3 weeks.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <div className="relative overflow-hidden">
                <div className="flex gap-8 animate-marquee-reverse hover:pause-marquee">
                  {[...customizeProducts, ...customizeProducts].map((product, index) => (
                    <div key={`${product.id}-${index}`} className="flex-shrink-0 w-[280px]">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-8">
                <Link 
                  to="/boutique/customization"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <Sparkles className="w-16 h-16 text-rose-300 dark:text-rose-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Customization options coming soon
              </p>
            </div>
          )}
        </section>
      </div>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-purple-600 via-rose-500 to-pink-500 dark:from-purple-900 dark:via-rose-900 dark:to-pink-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wider mb-4 sm:mb-6 text-white">
            Ready to Create Something Special?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Whether you choose from our ready-made collection or design your own, 
            every piece is crafted with love and attention to detail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/boutique/ready-made"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-600 hover:bg-gray-100 rounded-full transition-all transform hover:scale-105 font-medium shadow-xl text-sm sm:text-base"
            >
              Shop Ready-Made
            </Link>
            <Link
              to="/boutique/customization"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full transition-all transform hover:scale-105 font-medium text-sm sm:text-base"
            >
              Start Customizing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
