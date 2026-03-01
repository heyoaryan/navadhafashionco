import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export default function About() {
  const [allImages, setAllImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductImages();
  }, []);

  const fetchProductImages = async () => {
    try {
      console.log('Fetching product images from Supabase...');
      
      // Fetch all product images from active products
      const { data, error } = await supabase
        .from('product_images')
        .select(`
          id,
          product_id,
          image_url,
          alt_text,
          display_order,
          products!inner(is_active)
        `)
        .eq('products.is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log('Fetched product images:', data);
        console.log('Total images:', data?.length);
        
        setAllImages(data || []);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create repeated array to fill marquee (minimum 12 items for smooth scroll)
  const getRepeatedImages = () => {
    if (allImages.length === 0) return [];
    
    const minItems = 12;
    const repeatedImages = [];
    
    // Repeat images until we have at least minItems
    while (repeatedImages.length < minItems) {
      repeatedImages.push(...allImages);
    }
    
    return repeatedImages;
  };

  const marqueeImages = getRepeatedImages();
  
  // Split into two rows
  const halfLength = Math.ceil(marqueeImages.length / 2);
  const firstRowImages = marqueeImages.slice(0, halfLength);
  const secondRowImages = marqueeImages.slice(halfLength);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      
      {/* Founder Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Image Side */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl blur-2xl opacity-20"></div>
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                alt="Navadha Fashion"
                className="relative rounded-2xl shadow-2xl w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2 space-y-4 sm:space-y-6 text-center">
            <div className="inline-block relative">
              {/* Glow effect behind text */}
              <div className="absolute inset-0 blur-3xl" style={{ backgroundColor: '#EE458F33' }}></div>
              
              <h1 className="brand-title text-4xl sm:text-5xl lg:text-7xl mb-3 sm:mb-4 relative drop-shadow-2xl" style={{ color: '#EE458F' }}>
                NAVADHA
              </h1>
              
              {/* Fashion Co with decorative lines */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 relative">
                <div className="h-[1px] w-8 sm:w-12 lg:w-20" style={{ background: 'linear-gradient(to right, transparent, #EE458F80, #EE458F)' }}></div>
                <span className="text-xs sm:text-sm font-light tracking-[0.3em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                  FASHION CO
                </span>
                <div className="h-[1px] w-8 sm:w-12 lg:w-20" style={{ background: 'linear-gradient(to left, transparent, #EE458F80, #EE458F)' }}></div>
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Founder - <span className="text-pink-600 dark:text-pink-400">Aanchal Mishra</span>
            </h2>
            
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              In 2026, what started as a dream inspired by my mother's passion for fashion became Navadha Fashion Co. Growing up, I watched her create beautiful garments with love and dedication.
            </p>
            
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              The name <span className="font-bold text-pink-600 dark:text-pink-400">"Navadha"</span> originates from the Ramayana, meaning <span className="italic">"nine forms of devotion"</span> or <span className="italic">"new path"</span> — reflecting our commitment to craftsmanship and innovation.
            </p>

            <div className="pt-4">
              <div className="flex items-start gap-3 bg-pink-50 dark:bg-gray-800 p-4 sm:p-6 rounded-xl">
                <Sparkles className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Creative Director's Vision</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Every piece carries forward a legacy of love, excellence, and the timeless bond between tradition and modernity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee Grid Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="mb-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our Collections
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Discover the beauty of tradition and modernity
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : allImages.length > 0 ? (
          <>
            {/* First Row - Left to Right */}
            <div className="relative mb-6">
              <div className="flex gap-6 animate-marquee">
                <div className="flex gap-6 min-w-max">
                  {firstRowImages.map((image, index) => (
                    <img 
                      key={`${image.id}-${index}`}
                      src={image.image_url} 
                      alt={image.alt_text || 'Product'}
                      onError={(e) => {
                        console.error('Image load error for:', image.image_url);
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=400&q=80';
                      }}
                      className="w-64 h-80 object-cover rounded-xl shadow-lg" 
                    />
                  ))}
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex gap-6 min-w-max">
                  {firstRowImages.map((image, index) => (
                    <img 
                      key={`${image.id}-${index}-dup`}
                      src={image.image_url} 
                      alt={image.alt_text || 'Product'}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=400&q=80';
                      }}
                      className="w-64 h-80 object-cover rounded-xl shadow-lg" 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Second Row - Right to Left */}
            <div className="relative">
              <div className="flex gap-6 animate-marquee-reverse">
                <div className="flex gap-6 min-w-max">
                  {secondRowImages.map((image, index) => (
                    <img 
                      key={`${image.id}-${index}`}
                      src={image.image_url} 
                      alt={image.alt_text || 'Product'}
                      onError={(e) => {
                        console.error('Image load error for:', image.image_url);
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80';
                      }}
                      className="w-64 h-80 object-cover rounded-xl shadow-lg" 
                    />
                  ))}
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex gap-6 min-w-max">
                  {secondRowImages.map((image, index) => (
                    <img 
                      key={`${image.id}-${index}-dup`}
                      src={image.image_url} 
                      alt={image.alt_text || 'Product'}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80';
                      }}
                      className="w-64 h-80 object-cover rounded-xl shadow-lg" 
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400">No products available at the moment.</p>
          </div>
        )}
      </div>



    </div>
  );
}
