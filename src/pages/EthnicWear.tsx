import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

export default function EthnicWear() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const subcategories = [
    { id: 'all', name: 'All Items' },
    { id: 'kurtis', name: 'Kurtis' },
    { id: 'kurti-set', name: 'Kurti Sets' },
    { id: 'sarees', name: 'Sarees' },
    { id: 'lehengas', name: 'Lehengas' },
    { id: 'anarkalis', name: 'Anarkalis' },
  ];

  // Hero images for different genders
  const heroImages = {
    women: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&q=80',
    men: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=1920',
    all: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&q=80',
      'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=1920'
    ]
  };

  const getCurrentHeroImage = () => {
    if (selectedGender === 'women') return heroImages.women;
    if (selectedGender === 'men') return heroImages.men;
    return heroImages.all[currentImageIndex];
  };

  useEffect(() => {
    if (selectedGender === 'all') {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => prev === 0 ? 1 : 0);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedGender]);

  useEffect(() => {
    fetchProducts();
  }, [selectedSubcategory, selectedGender]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('category', 'ethnic')
        .eq('is_active', true);

      if (selectedSubcategory !== 'all') {
        query = query.eq('subcategory', selectedSubcategory);
      }

      if (selectedGender !== 'all') {
        query = query.eq('gender', selectedGender);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden py-8 sm:py-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 blur-sm scale-110"
          style={{ backgroundImage: `url('${getCurrentHeroImage()}')` }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
          <div className="inline-block mb-3 sm:mb-4 md:mb-6 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full border border-white/30">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium tracking-widest text-gray-700 dark:text-gray-300 uppercase">TRADITIONAL ELEGANCE</span>
          </div>
          
          <h1 className="brand-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-3 sm:mb-4 md:mb-6 animate-fade-in leading-tight text-white drop-shadow-2xl">
            Ethnic
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/95 drop-shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
            Traditional elegance meets modern style
          </p>

          {/* Filters in Hero - Centered */}
          <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Gender Filter */}
            <div>
              <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-2 sm:mb-3 text-white drop-shadow-md uppercase tracking-widest">
                Select Gender
              </h3>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedGender('all')}
                  className={`px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 min-w-[80px] sm:min-w-[100px] ${
                    selectedGender === 'all'
                      ? 'text-white shadow-lg scale-105'
                      : 'bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white hover:scale-105 shadow-md border border-white/50'
                  }`}
                  style={selectedGender === 'all' ? { backgroundColor: '#EE458F' } : {}}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedGender('women')}
                  className={`px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 min-w-[80px] sm:min-w-[100px] ${
                    selectedGender === 'women'
                      ? 'text-white shadow-lg scale-105'
                      : 'bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white hover:scale-105 shadow-md border border-white/50'
                  }`}
                  style={selectedGender === 'women' ? { backgroundColor: '#EE458F' } : {}}
                >
                  Women
                </button>
                <button
                  onClick={() => setSelectedGender('men')}
                  className={`px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 min-w-[80px] sm:min-w-[100px] ${
                    selectedGender === 'men'
                      ? 'text-white shadow-lg scale-105'
                      : 'bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white hover:scale-105 shadow-md border border-white/50'
                  }`}
                  style={selectedGender === 'men' ? { backgroundColor: '#EE458F' } : {}}
                >
                  Men
                </button>
              </div>
            </div>

            {/* Subcategory Filter */}
            <div>
              <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-2 sm:mb-3 text-white drop-shadow-md uppercase tracking-widest">
                Categories
              </h3>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      selectedSubcategory === sub.id
                        ? 'text-white shadow-lg scale-105'
                        : 'bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white hover:scale-105 shadow-md border border-white/50'
                    }`}
                    style={selectedSubcategory === sub.id ? { backgroundColor: '#EE458F' } : {}}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16 sm:py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading products...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Showing {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-2xl border border-pink-100 dark:border-pink-900/30">
            <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-pink-300 dark:text-pink-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base px-4">No products found in this category</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium text-sm sm:text-base"
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
