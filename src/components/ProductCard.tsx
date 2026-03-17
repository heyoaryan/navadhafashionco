import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { trackProductAction } from '../utils/analytics';
import OptimizedImage from './OptimizedImage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const inWishlist = isInWishlist(product.id);

  useEffect(() => {
    fetchProductImages();
  }, [product.id]);

  useEffect(() => {
    // Auto-rotate images every 5 seconds if multiple images exist
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [images.length]);

  const fetchProductImages = async () => {
    try {
      const { data } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      if (data && data.length > 0) {
        setImages(data.map(img => img.image_url));
      } else if (product.main_image_url) {
        setImages([product.main_image_url]);
      } else {
        setImages(['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600']);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setImages([product.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600']);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      // Store pending cart item in localStorage
      const pendingCartItem = {
        productId: product.id,
        quantity: 1,
        size: undefined,
        color: undefined,
        timestamp: Date.now()
      };
      localStorage.setItem('pendingCartItem', JSON.stringify(pendingCartItem));
      
      // Redirect to auth with action flag
      navigate('/auth', { 
        state: { 
          from: `/product/${product.slug}`,
          action: 'addToCart'
        } 
      });
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth', { state: { from: `/product/${product.slug}` } });
      return;
    }

    setIsTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const discountPercentage = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      onClick={() => trackProductAction(product.id, 'click')}
      className="group block relative overflow-hidden rounded-lg"
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {/* Image Slideshow with Optimization */}
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <OptimizedImage
              src={image}
              alt={`${product.name} - View ${index + 1}`}
              className="group-hover:scale-110 transition-transform duration-500"
              aspectRatio="3/4"
              priority={index === 0} // Load first image with priority
            />
          </div>
        ))}
        
        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {discountPercentage > 0 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            {discountPercentage}% OFF
          </div>
        )}
        {product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Low Stock
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Out of Stock
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          {product.stock_quantity > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 bg-white text-black py-2.5 sm:py-3 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none font-medium text-sm sm:text-base min-h-[44px] shadow-lg"
            >
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{isAdding ? 'Adding...' : 'Add to Cart'}</span>
              <span className="sm:hidden">{isAdding ? '...' : 'Add'}</span>
            </button>
          )}
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist}
            className="bg-white text-black p-2.5 sm:p-3 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg disabled:opacity-50"
          >
            <Heart 
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                inWishlist ? 'fill-current' : ''
              }`}
              style={inWishlist ? { color: '#EE458F' } : {}}
            />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">₹{product.price.toLocaleString()}</span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-500 line-through">
              ₹{product.compare_at_price.toLocaleString()}
            </span>
          )}
        </div>
        
        {/* Stock Status Messages */}
        {product.stock_quantity === 0 ? (
          <div className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
            Out of Stock
          </div>
        ) : product.stock_quantity <= 3 ? (
          <div className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <span className="animate-pulse">⚡</span>
            Hurry! Few Left
          </div>
        ) : null}
        
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.sizes.slice(0, 6).map((size) => (
              <span
                key={size}
                className="text-xs px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded whitespace-nowrap"
              >
                {size}
              </span>
            ))}
            {product.sizes.length > 6 && (
              <span className="text-xs px-1.5 py-0.5 text-gray-400">+{product.sizes.length - 6}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
