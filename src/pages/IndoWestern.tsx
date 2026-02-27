import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

export default function IndoWestern() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  const subcategories = [
    { id: 'all', name: 'All Items' },
    { id: 'indo-western-dresses', name: 'Indo Western Dresses' },
    { id: 'kurti', name: 'Kurtis' },
    { id: 'ethnic-coords', name: 'Ethnic Coords' },
    { id: 'shoti-sets', name: 'Shoti Sets' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedSubcategory, selectedGender]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('category', 'indo-western')
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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 dark:from-gray-900 dark:via-amber-900/20 dark:to-gray-900"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-5"></div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
          <div className="inline-block mb-3 sm:mb-4 md:mb-6 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] sm:text-xs md:text-sm font-light tracking-wider text-amber-600 dark:text-amber-400">FUSION FASHION</span>
          </div>
          
          <h1 className="brand-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-3 sm:mb-4 md:mb-6 animate-fade-in leading-tight" style={{ color: '#EE458F' }}>
            Indo Western
          </h1>
          
          <p className="text-xs sm:text-base md:text-lg lg:text-xl font-light text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
            Fusion fashion that blends traditional and contemporary styles
          </p>

          {/* Filters in Hero - Centered */}
          <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Gender Filter */}
            <div>
              <h3 className="text-xs sm:text-sm md:text-base font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Select Gender
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSelectedGender('all')}
                  className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all min-w-[70px] sm:min-w-[80px] ${
                    selectedGender === 'all'
                      ? 'text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  style={selectedGender === 'all' ? { backgroundColor: '#EE458F' } : {}}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedGender('women')}
                  className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all min-w-[70px] sm:min-w-[80px] ${
                    selectedGender === 'women'
                      ? 'text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  style={selectedGender === 'women' ? { backgroundColor: '#EE458F' } : {}}
                >
                  Women
                </button>
                <button
                  onClick={() => setSelectedGender('men')}
                  className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all min-w-[70px] sm:min-w-[80px] ${
                    selectedGender === 'men'
                      ? 'text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  style={selectedGender === 'men' ? { backgroundColor: '#EE458F' } : {}}
                >
                  Men
                </button>
              </div>
            </div>

            {/* Subcategory Filter */}
            <div>
              <h3 className="text-xs sm:text-sm md:text-base font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Categories
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      selectedSubcategory === sub.id
                        ? 'text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
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
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
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
          <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-amber-300 dark:text-amber-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base px-4">No products found in this category</p>
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
  );
}
