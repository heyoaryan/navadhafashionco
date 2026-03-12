import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, ProductImage, Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';
import ImageLightbox from '../components/ImageLightbox';
import { trackProductAction } from '../utils/analytics';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{ days: number; message: string } | null>(null);
  const [pincodeError, setPincodeError] = useState('');

  const inWishlist = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (productData) {
        setProduct(productData);
        
        // Track product view
        trackProductAction(productData.id, 'view');
        
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0].name);
        }

        // Fetch images and reviews in parallel
        const [imagesResult, reviewsResult] = await Promise.all([
          supabase
            .from('product_images')
            .select('*')
            .eq('product_id', productData.id)
            .order('display_order')
            .limit(6),
          supabase
            .from('reviews')
            .select(`
              *,
              user:profiles(full_name, avatar_url)
            `)
            .eq('product_id', productData.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        setImages(imagesResult.data || []);
        setReviews(reviewsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;
    
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(4);

      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      // Store pending cart item in localStorage
      if (product) {
        const pendingCartItem = {
          productId: product.id,
          quantity: quantity,
          size: selectedSize,
          color: selectedColor,
          timestamp: Date.now()
        };
        localStorage.setItem('pendingCartItem', JSON.stringify(pendingCartItem));
      }
      
      // Redirect to auth with action flag
      navigate('/auth', { 
        state: { 
          from: `/product/${slug}`,
          action: 'addToCart'
        } 
      });
      return;
    }
    
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity, selectedSize, selectedColor);
      // Track add to cart action
      trackProductAction(product.id, 'add_to_cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/product/${slug}`, action: 'buyNow' } });
      return;
    }
    
    if (!product) return;

    setBuyingNow(true);
    try {
      await addToCart(product.id, quantity, selectedSize, selectedColor);
      navigate('/checkout');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setBuyingNow(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/product/${slug}` } });
      return;
    }
    
    if (!product) return;

    setIsTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
      // Track add to wishlist action
      if (!inWishlist) {
        trackProductAction(product.id, 'add_to_wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || reviewRating === 0) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        user_id: user.id,
        rating: reviewRating,
        title: reviewTitle || null,
        comment: reviewComment,
        is_verified_purchase: false,
        is_approved: false,
      });

      if (error) throw error;

      alert('Thank you for your review! It will be published after approval.');
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const checkDeliveryAvailability = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/product/${slug}` } });
      return;
    }

    if (!pincode || pincode.length !== 6) {
      setPincodeError('Please enter a valid 6-digit pincode');
      return;
    }

    setPincodeError('');
    setCheckingDelivery(true);
    
    try {
      // Simulate API call - In production, integrate with actual courier API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get first digit of pincode to determine region
      const firstDigit = parseInt(pincode[0]);
      
      // Gujarat pincodes start with 3 or 4
      // Calculate delivery days based on region
      let deliveryDays = 5; // Default
      let region = '';
      
      if (firstDigit === 3 || firstDigit === 4) {
        // Gujarat - faster delivery
        deliveryDays = 3;
        region = 'Gujarat';
      } else if (firstDigit === 1 || firstDigit === 2) {
        // North India
        deliveryDays = 5;
        region = 'North India';
      } else if (firstDigit === 5 || firstDigit === 6) {
        // South India
        deliveryDays = 6;
        region = 'South India';
      } else if (firstDigit === 7 || firstDigit === 8) {
        // East & Northeast India
        deliveryDays = 7;
        region = 'East India';
      } else {
        // Other regions
        deliveryDays = 5;
        region = 'your area';
      }
      
      setDeliveryInfo({
        days: deliveryDays,
        message: `Delivery to ${region} (${pincode})`
      });
    } catch (error) {
      console.error('Error checking delivery:', error);
      setPincodeError('Unable to check delivery. Please try again.');
    } finally {
      setCheckingDelivery(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-light mb-4">Product not found</h2>
        <Link to="/shop" className="text-rose-400 hover:text-rose-500">
          Continue shopping
        </Link>
      </div>
    );
  }

  // Combine images and video into gallery items
  const galleryItems = [];
  
  // Add images
  if (images.length > 0) {
    galleryItems.push(...images.map(img => ({ type: 'image' as const, url: img.image_url || '', alt: img.alt_text || product.name })));
  } else if (product.main_image_url) {
    galleryItems.push({ type: 'image' as const, url: product.main_image_url, alt: product.name });
  }
  
  // Add video if exists
  if (product.video_url) {
    galleryItems.push({ type: 'video' as const, url: product.video_url, alt: `${product.name} video` });
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev + 1) % galleryItems.length);
  };

  const handlePreviousImage = () => {
    setSelectedImage((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <div 
            className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer group relative"
            onClick={() => setIsLightboxOpen(true)}
          >
            {galleryItems[selectedImage]?.type === 'video' ? (
              <video
                src={galleryItems[selectedImage]?.url || ''}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <>
                <img
                  src={galleryItems[selectedImage]?.url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={galleryItems[selectedImage]?.alt || product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">
                    Click to view full size
                  </span>
                </div>
              </>
            )}
          </div>
          {galleryItems.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {galleryItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all relative ${
                    selectedImage === index
                      ? 'border-rose-400'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {item.type === 'video' ? (
                    <>
                      <video
                        src={item.url || ''}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.url || ''}
                      alt={item.alt || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide mb-3 sm:mb-4">{product.name}</h1>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {averageRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-medium">₹{product.price.toLocaleString()}</span>
              {product.compare_at_price && (
                <span className="text-lg sm:text-xl text-gray-500 line-through">
                  ₹{product.compare_at_price.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Size</span>
                <Link to="/size-guide" className="text-sm text-rose-400 hover:text-rose-500">
                  Size Guide
                </Link>
              </div>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base border rounded-lg transition-all ${
                      selectedSize === size
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                        : 'border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div>
              <span className="text-sm font-medium block mb-3">Color</span>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color: { name: string; hex: string }) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`group relative`}
                  >
                    {color.hex === '#multicolor' || color.name.toLowerCase() === 'multicolor' ? (
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 ${
                          selectedColor === color.name
                            ? 'border-black dark:border-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                          selectedColor === color.name
                            ? 'border-black dark:border-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-sm font-medium block mb-3">Quantity</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95 rounded-l-lg font-medium"
                >
                  -
                </button>
                <span className="px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium min-w-[60px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95 rounded-r-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Stock Status Messages */}
          {product.stock_quantity === 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 font-semibold text-center">
                Out of Stock
              </p>
              <p className="text-sm text-red-500 dark:text-red-300 text-center mt-1">
                This product is currently unavailable
              </p>
            </div>
          ) : product.stock_quantity <= 3 ? (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-orange-600 dark:text-orange-400 font-semibold text-center flex items-center justify-center gap-2">
                <span className="animate-pulse text-lg">⚡</span>
                Hurry! Few Left
              </p>
              <p className="text-sm text-orange-500 dark:text-orange-300 text-center mt-1">
                Only {product.stock_quantity} {product.stock_quantity === 1 ? 'item' : 'items'} remaining in stock
              </p>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {product.stock_quantity > 0 ? (
              <>
                <button
                  onClick={handleBuyNow}
                  disabled={buyingNow || addingToCart}
                  className="flex-1 py-3.5 sm:py-4 md:py-4.5 px-4 sm:px-6 text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none font-medium min-h-[52px] shadow-lg hover:shadow-xl"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden xs:inline">{buyingNow ? 'Processing...' : 'Buy Now'}</span>
                  <span className="xs:hidden">{buyingNow ? '...' : 'Buy'}</span>
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || buyingNow}
                  className="flex-1 py-3.5 sm:py-4 md:py-4.5 px-4 sm:px-6 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none font-medium min-h-[52px] shadow-lg hover:shadow-xl"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden xs:inline">{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  <span className="xs:hidden">{addingToCart ? '...' : 'Add'}</span>
                </button>
                <button 
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  className="p-3.5 sm:p-4 md:p-4.5 border-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center disabled:opacity-50"
                  style={{
                    borderColor: inWishlist ? '#E91E63' : undefined,
                    backgroundColor: inWishlist ? '#E91E6310' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!inWishlist) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!inWishlist) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Heart 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${
                      inWishlist ? 'fill-current' : ''
                    }`}
                    style={inWishlist ? { color: '#E91E63' } : {}}
                  />
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex-1 py-3.5 sm:py-4 md:py-4.5 px-4 sm:px-6 text-sm sm:text-base bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-medium min-h-[52px] flex items-center justify-center"
              >
                Out of Stock
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs font-medium">Free Shipping</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Pan India 3-7 days</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs font-medium">5-Day Returns</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Easy & Hassle-free</p>
            </div>
            <div className="text-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs font-medium">Secure Payment</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">100% Protected</p>
            </div>
          </div>

          {/* Delivery Time Checker */}
          <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Check Delivery Time
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPincode(value);
                    setPincodeError('');
                    setDeliveryInfo(null);
                  }}
                  placeholder="Enter pincode"
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  maxLength={6}
                  disabled={!user}
                />
                <button
                  onClick={checkDeliveryAvailability}
                  disabled={checkingDelivery || !user || pincode.length !== 6}
                  className="px-6 py-2.5 text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {checkingDelivery ? 'Checking...' : 'Check'}
                </button>
              </div>
              
              {!user && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Please <button onClick={() => navigate('/auth', { state: { from: `/product/${slug}` } })} className="text-rose-500 hover:text-rose-600 underline">sign in</button> to check delivery time
                </p>
              )}
              
              {pincodeError && (
                <p className="text-xs text-red-500">{pincodeError}</p>
              )}
              
              {deliveryInfo && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {deliveryInfo.message}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Expected delivery in {deliveryInfo.days} days
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {product.fabric_details && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium mb-2">Fabric Details</h3>
              <div 
                className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.fabric_details }}
              />
            </div>
          )}

          {product.care_instructions && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium mb-2">Care Instructions</h3>
              <div 
                className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.care_instructions }}
              />
            </div>
          )}

          {product.description && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <div 
                  className={`prose prose-sm dark:prose-invert max-w-none ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
                {product.description.length > 200 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-sm font-medium flex items-center gap-1 transition-colors"
                    style={{ color: '#E91E63' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#D63D7F'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#E91E63'}
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Read less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light">Customer Reviews</h2>
          {user && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ backgroundColor: '#E91E63', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D63D7F'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E91E63'}
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {showReviewForm && user && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Write Your Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-colors"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Sum up your review"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product"
                  rows={4}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingReview || reviewRating === 0}
                  className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#E91E63' }}
                  onMouseEnter={(e) => !submittingReview && (e.currentTarget.style.backgroundColor = '#D63D7F')}
                  onMouseLeave={(e) => !submittingReview && (e.currentTarget.style.backgroundColor = '#E91E63')}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewRating(0);
                    setReviewTitle('');
                    setReviewComment('');
                  }}
                  className="px-6 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {review.user?.full_name || 'Anonymous'}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <h4 className="font-medium mb-2">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="text-gray-600 dark:text-gray-400">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-12 mt-12">
          <h2 className="text-2xl font-light mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {isLightboxOpen && (
        <ImageLightbox
          items={galleryItems}
          currentIndex={selectedImage}
          onClose={() => setIsLightboxOpen(false)}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
        />
      )}
    </div>
  );
}
