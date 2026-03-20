import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { savePendingIntent } from '../lib/pendingIntent';
import { trackProductAction } from '../utils/analytics';
import OptimizedImage from './OptimizedImage';

interface ProductCardProps {
  product: Product;
}

export default memo(function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const isInViewRef = useRef(false);

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity === 0;

  useEffect(() => {
    if (product.main_image_url) {
      setImages([product.main_image_url]);
    } else {
      supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setImages(data.map(img => img.image_url));
          } else {
            setImages(['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600']);
          }
        })
        .catch(() => {
          setImages(['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600']);
        });
    }
  }, [product.id, product.main_image_url]);

  // Carousel only runs when card is visible in viewport — saves CPU & battery
  useEffect(() => {
    if (images.length <= 1) return;

    const observer = new IntersectionObserver(
      ([entry]) => { isInViewRef.current = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);

    const interval = setInterval(() => {
      if (isInViewRef.current) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    }, 3000);

    return () => { clearInterval(interval); observer.disconnect(); };
  }, [images.length]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      savePendingIntent({ action: 'addToCart', productId: product.id, quantity: 1 });
      navigate('/auth', { state: { from: `/product/${product.slug}`, action: 'addToCart' } });
      return;
    }
    setIsAdding(true);
    try { await addToCart(product.id, 1); }
    catch (error) { console.error('Error adding to cart:', error); }
    finally { setIsAdding(false); }
  }, [user, product.id, product.slug, addToCart, navigate]);

  const handleToggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth', { state: { from: `/product/${product.slug}` } }); return; }
    setIsTogglingWishlist(true);
    try { await toggleWishlist(product.id); }
    catch (error) { console.error('Error toggling wishlist:', error); }
    finally { setIsTogglingWishlist(false); }
  }, [user, product.id, product.slug, toggleWishlist, navigate]);

  const discountPercentage = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <Link
      ref={cardRef}
      to={`/product/${product.slug}`}
      onClick={() => trackProductAction(product.id, 'click')}
      className="group block relative overflow-hidden rounded-lg"
    >
      {/* Image container */}
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 relative rounded-lg">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <OptimizedImage
              src={image}
              alt={`${product.name} - View ${index + 1}`}
              className="transition-transform duration-500 group-hover:scale-110"
              aspectRatio="3/4"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(index); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'}`}
              />
            ))}
          </div>
        )}

        {/* Discount badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium z-10">
            {discountPercentage}% OFF
          </div>
        )}



        {/* Hover overlay */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-lg">
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-white/90 text-gray-800 py-2 rounded-lg text-xs sm:text-sm font-medium text-center shadow-lg">
                View Product
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 bg-white text-black py-2 sm:py-2.5 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 font-medium text-xs sm:text-sm min-h-[40px] shadow-lg"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{isAdding ? '...' : 'Add to Cart'}</span>
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={isTogglingWishlist}
                className="bg-white text-black p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center shadow-lg disabled:opacity-50"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-current' : ''}`}
                  style={inWishlist ? { color: '#EE458F' } : {}}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="mt-3">
        <h3 className="text-sm font-medium mb-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-medium">₹{product.price.toLocaleString()}</span>
          {product.compare_at_price && (
            <span className="text-xs sm:text-sm text-gray-500 line-through">₹{product.compare_at_price.toLocaleString()}</span>
          )}
        </div>

        {isOutOfStock ? (
          <div className="mt-1.5 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
            Out of Stock
          </div>
        ) : product.stock_quantity <= product.low_stock_threshold ? (
          <div className="mt-1.5 text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <span className="animate-pulse">⚡</span> Low Stock — Hurry!
          </div>
        ) : null}

        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.sizes.slice(0, 6).map((size) => (
              <span key={size} className="text-xs px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded whitespace-nowrap">
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
});
