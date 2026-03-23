import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, Zap, ChevronDown, ChevronUp, Share2, Scissors, Ruler, Palette, Phone, Plus, Minus, Camera, X, Play, CheckCircle, Lock, Bell } from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabase';
import { savePendingIntent } from '../lib/pendingIntent';
import { Product, ProductImage, Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';
import ImageLightbox from '../components/ImageLightbox';
import { trackProductAction } from '../utils/analytics';
import SEO from '../components/SEO';

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
  const [fetchError, setFetchError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [buyRipple, setBuyRipple] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMediaFiles, setReviewMediaFiles] = useState<File[]>([]);
  const [reviewMediaPreviews, setReviewMediaPreviews] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{ days: number; message: string; location: string } | null>(null);
  const [pincodeError, setPincodeError] = useState('');

  // Bespoke customization state
  const [showBespokeForm, setShowBespokeForm] = useState(false);
  const [bespokeDesignNotes, setBespokeDesignNotes] = useState('');
  const [bespokeMeasurements, setBespokeMeasurements] = useState('');
  const [bespokePhone, setBespokePhone] = useState('');
  const [bespokeFabric, setBespokeFabric] = useState('');
  const [bespokeEmbroidery, setBespokeEmbroidery] = useState('');
  const [bespokeUrgency, setBespokeUrgency] = useState<'standard' | 'express' | 'rush'>('standard');
  const [bespokeComplexity, setBespokeComplexity] = useState<'simple' | 'moderate' | 'complex'>('simple');
  const [bespokeSubmitting, setBespokeSubmitting] = useState(false);

  // Interest / notify me state
  const [interestRegistered, setInterestRegistered] = useState(false);
  const [registeringInterest, setRegisteringInterest] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showInterestForm, setShowInterestForm] = useState(false);

  const inWishlist = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    if (slug) {
      setProduct(null);
      setImages([]);
      setReviews([]);
      setSelectedImage(0);
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  // Check if user has purchased this product (delivered order)
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user || !product) { setHasPurchased(false); return; }
      setCheckingPurchase(true);
      const timeout = setTimeout(() => setCheckingPurchase(false), 8000);
      try {
        const { data } = await supabase
          .from('order_items')
          .select('id, order:orders!inner(status, user_id)')
          .eq('product_id', product.id)
          .eq('order.user_id', user.id)
          .eq('order.status', 'delivered')
          .limit(1);
        setHasPurchased((data?.length ?? 0) > 0);
      } catch { setHasPurchased(false); }
      finally { clearTimeout(timeout); setCheckingPurchase(false); }
    };
    checkPurchase();
  }, [user, product]);

  const fetchProduct = async () => {
    setLoading(true);
    setFetchError(false);
    // Safety timeout — never stay stuck on loading screen
    const timeout = setTimeout(() => { setLoading(false); setFetchError(true); }, 15000);
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        setFetchError(true);
      } else if (productData) {
        setProduct(productData);
        
        // Track product view only once
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
            .select(`id, rating, title, comment, created_at, is_verified_purchase, media_urls, user:profiles(full_name, avatar_url)`)
            .eq('product_id', productData.id)
            .order('created_at', { ascending: false })
            .limit(20)
        ]);

        setImages(imagesResult.data || []);
        setReviews(reviewsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setFetchError(true);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;
    
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, main_image_url, stock_quantity, sizes, colors, gender, is_active, tags, category_id')
        .eq('is_active', true)
        .eq('gender', product.gender || 'women')
        .neq('id', product.id)
        .limit(4);

      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      if (product) {
        savePendingIntent({ action: 'addToCart', productId: product.id, quantity, size: selectedSize || undefined, color: selectedColor || undefined });
      }
      navigate('/auth', { state: { from: `/product/${slug}`, action: 'addToCart' } });
      return;
    }
    
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity, selectedSize, selectedColor);
      // Track add to cart action
      trackProductAction(product.id, 'add_to_cart');
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    const productPrice = (product as any)?.sale_price ?? product?.price ?? 0;

    if (!user) {
      if (product) {
        savePendingIntent({ action: 'buyNow', productId: product.id, productName: product.name, price: productPrice, quantity, size: selectedSize || undefined, color: selectedColor || undefined });
      }
      navigate('/auth', { state: { from: `/product/${slug}`, action: 'buyNow' } });
      return;
    }

    if (!product) return;

    navigate('/checkout', {
      state: {
        directBuy: {
          productId: product.id,
          productName: product.name,
          productImage: images[0]?.image_url || product.main_image_url || '',
          price: productPrice,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        }
      }
    });
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

  const handleShare = async () => {
    const url = window.location.href;
    const imageUrl = images[0]?.image_url || product?.main_image_url || '';
    const shareData = {
      title: product?.name || 'Check out this product',
      text: `${product?.name} — ₹${product?.price.toLocaleString()} on NAVADHA Fashion Co.`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or error
      }
    } else {
      // fallback: copy link
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch {
        prompt('Copy this link:', url);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || reviewRating === 0) return;

    setSubmittingReview(true);
    try {
      // Upload media files first
      let uploadedUrls: string[] = [];
      if (reviewMediaFiles.length > 0) {
        setUploadingMedia(true);
        for (const file of reviewMediaFiles) {
          const ext = file.name.split('.').pop();
          const path = `${user.id}/${product.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('review-media')
            .upload(path, file, { upsert: false });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('review-media').getPublicUrl(path);
            uploadedUrls.push(urlData.publicUrl);
          }
        }
        setUploadingMedia(false);
      }

      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        user_id: user.id,
        rating: Math.min(5, Math.max(1, Math.round(reviewRating))),
        title: reviewTitle ? reviewTitle.trim().slice(0, 200) : null,
        comment: reviewComment.trim().slice(0, 2000),
        is_verified_purchase: hasPurchased,
        is_approved: true,
        media_urls: uploadedUrls,
      });

      if (error) throw error;

      alert('Thank you for your review!');
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
      setReviewMediaFiles([]);
      setReviewMediaPreviews([]);
      // Refresh reviews list
      const { data: updatedReviews } = await supabase
        .from('reviews')
        .select(`id, rating, title, comment, created_at, is_verified_purchase, media_urls, user:profiles(full_name, avatar_url)`)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setReviews(updatedReviews || []);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
      setUploadingMedia(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      const isImage = f.type.startsWith('image/');
      const isVideo = f.type.startsWith('video/');
      return (isImage || isVideo) && f.size <= 50 * 1024 * 1024; // 50MB max
    });
    const remaining = 5 - reviewMediaFiles.length;
    const toAdd = valid.slice(0, remaining);
    setReviewMediaFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(file => {
      const url = URL.createObjectURL(file);
      setReviewMediaPreviews(prev => [...prev, url]);
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const removeMediaFile = (index: number) => {
    URL.revokeObjectURL(reviewMediaPreviews[index]);
    setReviewMediaFiles(prev => prev.filter((_, i) => i !== index));
    setReviewMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const checkDeliveryAvailability = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/product/${slug}` } });
      return;
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit pincode');
      return;
    }

    setPincodeError('');
    setCheckingDelivery(true);

    try {
      // Fetch real location from India Post Pincode API
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();

      if (!data || data[0]?.Status !== 'Success' || !data[0]?.PostOffice?.length) {
        setPincodeError('Invalid pincode. Please enter a valid Indian pincode.');
        return;
      }

      const postOffice = data[0].PostOffice[0];
      const area = postOffice.Name;       // e.g. "Navrangpura"
      const city = postOffice.District;   // e.g. "Ahmedabad"
      const state = postOffice.State;     // e.g. "Gujarat"

      const locationLabel = `${area}, ${city}, ${state}`;

      // Delivery days based on state
      const gujaratStates = ['Gujarat'];
      const nearbyStates = ['Rajasthan', 'Maharashtra', 'Madhya Pradesh', 'Daman and Diu', 'Dadra and Nagar Haveli'];
      const farStates = ['West Bengal', 'Assam', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura', 'Arunachal Pradesh', 'Sikkim'];

      let deliveryDays = 5;
      if (gujaratStates.includes(state)) {
        deliveryDays = 3;
      } else if (nearbyStates.includes(state)) {
        deliveryDays = 4;
      } else if (farStates.includes(state)) {
        deliveryDays = 7;
      }

      setDeliveryInfo({
        days: deliveryDays,
        location: locationLabel,
        message: `Delivery available to ${locationLabel}`
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

  const isBespoke = product?.tags?.includes('customization') ?? false;
  const isReadyMade = product?.tags?.includes('made') ?? false;

  // Designer charge based on complexity + urgency
  const designerCharge = (() => {
    const complexityCharge = { simple: 500, moderate: 1000, complex: 2000 }[bespokeComplexity];
    const urgencyCharge = { standard: 0, express: 500, rush: 1000 }[bespokeUrgency];
    return complexityCharge + urgencyCharge;
  })();

  const handleBespokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth', { state: { from: `/product/${slug}` } });
      return;
    }
    if (!product || !bespokePhone.trim()) return;

    const cleanPhone = bespokePhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return;

    setBespokeSubmitting(true);
    try {
      // Save customization request to localStorage so checkout can attach it to the order
      const complexityCharge = { simple: 500, moderate: 1000, complex: 2000 }[bespokeComplexity];
      const urgencyCharge = { standard: 0, express: 500, rush: 1000 }[bespokeUrgency];
      const bespokeData = {
        phone: cleanPhone,
        designNotes: bespokeDesignNotes.trim(),
        measurements: bespokeMeasurements.trim(),
        fabric: bespokeFabric.trim(),
        embroidery: bespokeEmbroidery.trim(),
        complexity: bespokeComplexity,
        urgency: bespokeUrgency,
        complexityCharge,
        urgencyCharge,
        designerCharge,
        basePrice: product.price,
        productId: product.id,
      };
      localStorage.setItem('bespokeCustomization', JSON.stringify(bespokeData));

      const basePrice = product.price;
      const totalPrice = basePrice + designerCharge;

      navigate('/checkout', {
        state: {
          directBuy: {
            productId: product.id,
            productName: `${product.name} (Bespoke Customization)`,
            productImage: images[0]?.image_url || product.main_image_url,
            price: totalPrice,
            quantity: 1,
            size: selectedSize,
            color: selectedColor,
          },
          isBespokeOrder: true,
        }
      });
    } catch (error) {
      console.error('Bespoke request error:', error);
    } finally {
      setBespokeSubmitting(false);
    }
  };

  const handleRegisterInterest = async () => {
    if (!product) return;
    setRegisteringInterest(true);
    try {
      if (user) {
        // Logged-in user
        const { error } = await supabase.from('product_interest').upsert(
          { product_id: product.id, user_id: user.id, email: user.email, name: user.email },
          { onConflict: 'product_id,user_id', ignoreDuplicates: true }
        );
        if (!error) setInterestRegistered(true);
      } else {
        // Guest — validate email
        if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) return;
        const { error } = await supabase.from('product_interest').upsert(
          { product_id: product.id, user_id: null, email: guestEmail, name: guestName || null },
          { onConflict: 'product_id,email', ignoreDuplicates: true }
        );
        if (!error) { setInterestRegistered(true); setShowInterestForm(false); }
      }
    } catch (err) {
      console.error('Interest registration error:', err);
    } finally {
      setRegisteringInterest(false);
    }
  };

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
    if (fetchError) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-light mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Could not load the product. Please check your connection and try again.</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => fetchProduct()} className="px-5 py-2.5 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors">
              Try Again
            </button>
            <Link to="/shop" className="text-rose-400 hover:text-rose-500 text-sm">
              Continue shopping
            </Link>
          </div>
        </div>
      );
    }
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

  const productImage = images[0]?.image_url || product.main_image_url || '';
  const productUrl = `https://navadha.com/product/${product.slug}`;
  const productDescription = product.description
    ? product.description.replace(/<[^>]*>/g, '').slice(0, 160)
    : `Shop ${product.name} at NAVADHA Fashion Co. ₹${product.price.toLocaleString()} — Premium quality fashion.`;

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": productDescription,
    "image": productImage,
    "url": productUrl,
    "brand": {
      "@type": "Brand",
      "name": "NAVADHA Fashion Co"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "INR",
      "price": (product as any).sale_price ?? product.price,
      "availability": product.stock_quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "NAVADHA Fashion Co"
      }
    },
    ...(reviews.length > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": reviews.length,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <SEO
        title={`${product.name} | NAVADHA Fashion Co`}
        description={productDescription}
        image={productImage}
        url={productUrl}
        type="product"
        structuredData={productStructuredData}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
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
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
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
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
              <div>
                {isReadyMade && !isBespoke && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <span>✦</span> Navadha Special
                  </div>
                )}
                {isBespoke && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                    <Scissors className="w-3 h-3" /> Bespoke Customization
                  </div>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">{product.name}</h1>
              </div>
              <button
                onClick={handleShare}
                title="Share this product"
                className="flex-shrink-0 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-rose-400 hover:text-rose-500 transition-all hover:scale-105 active:scale-95 mt-1"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
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
            {!showBespokeForm && (
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-medium">₹{product.price.toLocaleString()}</span>
                {product.compare_at_price != null && product.compare_at_price > product.price && (
                  <span className="text-lg sm:text-xl text-gray-500 line-through">
                    ₹{product.compare_at_price.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── BESPOKE MODE: full form replaces product options ── */}
          {showBespokeForm ? (
            <div className="space-y-4">
              {/* Back link */}
              <button
                onClick={() => setShowBespokeForm(false)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to product
              </button>

              {/* Price summary */}
              <div className="flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800/50">
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                  <div className="flex justify-between gap-8">
                    <span>Base price</span>
                    <span>₹{product.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span>Designer charge</span>
                    <span className="text-rose-500">+₹{{ simple: 500, moderate: 1000, complex: 2000 }[bespokeComplexity].toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span>Delivery charge</span>
                    <span className="text-rose-500">
                      {{ standard: 0, express: 500, rush: 1000 }[bespokeUrgency] > 0
                        ? `+₹${{ standard: 0, express: 500, rush: 1000 }[bespokeUrgency].toLocaleString()}`
                        : 'Free'}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">₹{(product.price + designerCharge).toLocaleString()}</p>
                </div>
              </div>

              {/* Complexity + Urgency pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Customization Level</label>
                  <div className="space-y-2">
                    {([
                      { value: 'simple', label: 'Simple', desc: 'Minor tweaks', charge: 500 },
                      { value: 'moderate', label: 'Moderate', desc: 'Design changes', charge: 1000 },
                      { value: 'complex', label: 'Complex', desc: 'Full custom', charge: 2000 },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setBespokeComplexity(opt.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${bespokeComplexity === opt.value ? 'border-rose-500 bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 font-medium' : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'}`}>
                        <span className="font-medium">{opt.label}</span><span className="text-gray-400"> +₹{opt.charge}</span><br />
                        <span className="text-gray-400 dark:text-gray-500">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Delivery Timeline</label>
                  <div className="space-y-2">
                    {([
                      { value: 'standard', label: 'Standard', desc: '21–30 days', charge: 0 },
                      { value: 'express', label: 'Express', desc: '14–20 days', charge: 500 },
                      { value: 'rush', label: 'Rush', desc: '7–13 days', charge: 1000 },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setBespokeUrgency(opt.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${bespokeUrgency === opt.value ? 'border-rose-500 bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 font-medium' : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'}`}>
                        <span className="font-medium">{opt.label}</span>{opt.charge > 0 && <span className="text-gray-400"> +₹{opt.charge}</span>}<br />
                        <span className="text-gray-400 dark:text-gray-500">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleBespokeSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Design Notes
                  </label>
                  <textarea value={bespokeDesignNotes} onChange={(e) => setBespokeDesignNotes(e.target.value)}
                    placeholder="Colors, embroidery style, neckline, sleeve length, fabric preferences..."
                    rows={3} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> Your Measurements <span className="text-rose-500">*</span>
                  </label>
                  <textarea value={bespokeMeasurements} onChange={(e) => setBespokeMeasurements(e.target.value)}
                    placeholder="Bust, waist, hip, height, shoulder width... (inches or cm)"
                    required
                    rows={2} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fabric Preference <span className="text-rose-500">*</span></label>
                    <input type="text" value={bespokeFabric} onChange={(e) => setBespokeFabric(e.target.value)}
                      required placeholder="e.g. Pure silk, Cotton" className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Embroidery / Work <span className="text-rose-500">*</span></label>
                    <input type="text" value={bespokeEmbroidery} onChange={(e) => setBespokeEmbroidery(e.target.value)}
                      required placeholder="e.g. Zari, Gota, None" className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input type="tel" value={bespokePhone} onChange={(e) => setBespokePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Designer will call to confirm details" required
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
                <button type="submit" disabled={bespokeSubmitting || bespokePhone.replace(/\D/g, '').length < 10 || !bespokeMeasurements.trim() || !bespokeFabric.trim() || !bespokeEmbroidery.trim()}
                  className="w-full py-3.5 px-6 text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 shadow-lg">
                  <Scissors className="w-4 h-4" />
                  {bespokeSubmitting ? 'Processing...' : `Proceed to Payment — ₹${(product.price + designerCharge).toLocaleString()}`}
                </button>
                {!user && (
                  <p className="text-xs text-center text-gray-500">
                    <button type="button" onClick={() => navigate('/auth', { state: { from: `/product/${slug}` } })} className="text-rose-500 underline">Sign in</button> to place a bespoke order
                  </p>
                )}
              </form>
            </div>
          ) : (
            <>
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Size</span>
                <Link to="/size-guide" className="text-sm text-rose-400 hover:text-rose-500">
                  Size Guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 sm:px-4 py-2 text-sm border rounded-lg transition-all whitespace-nowrap ${
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
              <span className="text-sm font-medium block mb-3">Color: <span className="font-normal text-gray-600 dark:text-gray-400">{selectedColor}</span></span>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color: { name: string; hex: string }) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.name}
                    className={`group relative`}
                  >
                    {color.hex === '#multicolor' || color.name.toLowerCase() === 'multicolor' ? (
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 ${
                          selectedColor === color.name
                            ? 'border-black dark:border-white scale-110'
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        } transition-transform`}
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-transform ${
                          selectedColor === color.name
                            ? 'border-black dark:border-white scale-110'
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    )}
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
                  onClick={() => setQuantity(Math.min(product.stock_quantity ?? 99, quantity + 1))}
                  disabled={quantity >= (product.stock_quantity ?? 99)}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95 rounded-r-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
              {product.stock_quantity != null && quantity >= product.stock_quantity && product.stock_quantity > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Max {product.stock_quantity} available
                </p>
              )}
            </div>
          </div>

          {/* Stock Status Messages */}
          {product.stock_quantity === 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 font-semibold text-center">
                Sold Out — But Worth the Wait ✨
              </p>
              <p className="text-sm text-red-500 dark:text-red-300 text-center mt-1">
                This piece has found its people. Add to wishlist and be the first to know when it's back.
              </p>

              {/* Notify Me / Interest section */}
              <div className="mt-4">
                {interestRegistered ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    We'll notify you when it's back in stock!
                  </div>
                ) : user ? (
                  <button
                    onClick={handleRegisterInterest}
                    disabled={registeringInterest}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <Bell className="w-4 h-4" />
                    {registeringInterest ? 'Registering...' : 'Notify Me When Back in Stock'}
                  </button>
                ) : showInterestForm ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <input
                      type="email"
                      placeholder="Your email address *"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      onClick={handleRegisterInterest}
                      disabled={registeringInterest || !guestEmail}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                      <Bell className="w-4 h-4" />
                      {registeringInterest ? 'Registering...' : 'Notify Me'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInterestForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-rose-400 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg text-sm font-medium transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    Notify Me When Back in Stock
                  </button>
                )}
              </div>
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

          {/* Bespoke Customization toggle button — above buy buttons on mobile */}
          {isBespoke && !showBespokeForm && (
            <button
              onClick={() => setShowBespokeForm(true)}
              className="sm:hidden w-full py-3.5 px-6 text-sm font-semibold rounded-lg transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 border-2 border-rose-400 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500 hover:text-rose-600"
            >
              <Scissors className="w-4 h-4" />
              Bespoke Customization — Design Yours
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {isBespoke ? (
              // Bespoke: show normal buy buttons + a "Customize This" button
              product.stock_quantity > 0 ? (
                <>
                  <button
                    onClick={() => { setBuyRipple(true); setTimeout(() => setBuyRipple(false), 600); handleBuyNow(); }}
                    disabled={buyingNow}
                    className="relative overflow-hidden flex-1 py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-medium min-h-[52px] shadow-lg hover:shadow-rose-300 hover:shadow-xl disabled:opacity-50 disabled:scale-100"
                  >
                    {buyRipple && (
                      <span className="absolute inset-0 pointer-events-none">
                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-lg bg-white opacity-20" />
                      </span>
                    )}
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-medium min-h-[52px] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:scale-100 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    {cartSuccess ? 'Added!' : addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    disabled={isTogglingWishlist}
                    className="p-3.5 sm:p-4 border-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center disabled:opacity-50"
                    style={{ borderColor: inWishlist ? '#E91E63' : undefined, backgroundColor: inWishlist ? '#E91E6310' : undefined }}
                  >
                    <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${inWishlist ? 'fill-current' : ''}`} style={inWishlist ? { color: '#E91E63' } : {}} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-medium min-h-[52px] shadow-md disabled:opacity-50 border-2"
                  style={{ borderColor: inWishlist ? '#E91E63' : '#d1d5db', backgroundColor: inWishlist ? '#E91E6310' : 'transparent', color: inWishlist ? '#E91E63' : undefined }}
                >
                  <Heart className={`w-5 h-5 flex-shrink-0 transition-all ${inWishlist ? 'fill-current' : ''}`} style={inWishlist ? { color: '#E91E63' } : {}} />
                  {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </button>
              )
            ) : product.stock_quantity > 0 ? (
              <>
                <button
                  onClick={() => { setBuyRipple(true); setTimeout(() => setBuyRipple(false), 600); handleBuyNow(); }}
                  disabled={buyingNow}
                  className="relative overflow-hidden flex-1 py-3.5 sm:py-4 md:py-4.5 px-4 sm:px-6 text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-medium min-h-[52px] shadow-lg hover:shadow-rose-300 hover:shadow-xl disabled:opacity-50 disabled:scale-100"
                >
                  {buyRipple && (
                    <span className="absolute inset-0 pointer-events-none">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-lg bg-white opacity-20" />
                    </span>
                  )}
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden xs:inline">Buy Now</span>
                  <span className="xs:hidden">Buy</span>
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 py-3.5 sm:py-4 md:py-4.5 px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-medium min-h-[52px] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:scale-100 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{cartSuccess ? 'Added!' : addingToCart ? 'Adding...' : 'Add to Cart'}</span>
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
                onClick={handleToggleWishlist}
                disabled={isTogglingWishlist}
                className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-medium min-h-[52px] shadow-md disabled:opacity-50 border-2"
                style={{
                  borderColor: inWishlist ? '#E91E63' : '#d1d5db',
                  backgroundColor: inWishlist ? '#E91E6310' : 'transparent',
                  color: inWishlist ? '#E91E63' : undefined,
                }}
              >
                <Heart
                  className={`w-5 h-5 flex-shrink-0 transition-all ${inWishlist ? 'fill-current' : ''}`}
                  style={inWishlist ? { color: '#E91E63' } : {}}
                />
                <span>{inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
              </button>
            )}
          </div>

          {/* Bespoke Customization toggle button — below buy buttons on desktop only */}
          {isBespoke && !showBespokeForm && (
            <button
              onClick={() => setShowBespokeForm(true)}
              className="hidden sm:flex w-full py-3.5 px-6 text-sm font-semibold rounded-lg transition-all transform hover:scale-[1.01] active:scale-95 items-center justify-center gap-2 border-2 border-rose-400 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500 hover:text-rose-600"
            >
              <Scissors className="w-4 h-4" />
              Bespoke Customization — Design Yours
            </button>
          )}
          </>
          )}


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
                  disabled={checkingDelivery || !user || !/^\d{6}$/.test(pincode)}
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
                        {deliveryInfo.location}
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
            <div className="border-t border-gray-200 dark:border-gray-800">
              <button
                className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
                onClick={() => setOpenAccordion(openAccordion === 'fabric' ? null : 'fabric')}
              >
                <span>Fabric Details</span>
                {openAccordion === 'fabric' ? <Minus className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
              </button>
              {openAccordion === 'fabric' && (
                <div
                  className="pb-4 text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.fabric_details) }}
                />
              )}
            </div>
          )}

          {product.care_instructions && (
            <div className="border-t border-gray-200 dark:border-gray-800">
              <button
                className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
                onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
              >
                <span>Care Instructions</span>
                {openAccordion === 'care' ? <Minus className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
              </button>
              {openAccordion === 'care' && (
                <div
                  className="pb-4 text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.care_instructions) }}
                />
              )}
            </div>
          )}

          {product.description && (
            <div className="border-t border-gray-200 dark:border-gray-800">
              <button
                className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
                onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
              >
                <span>Description</span>
                {openAccordion === 'description' ? <Minus className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
              </button>
              {openAccordion === 'description' && (
                <div className="pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div
                    className={`prose prose-sm dark:prose-invert max-w-none ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
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
                        <>Read less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Read more <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
        {/* Reviews Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-light">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {averageRating.toFixed(1)} out of 5 &middot; {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {/* Write Review Button */}
          {!user ? (
            <button
              onClick={() => navigate('/auth', { state: { from: `/product/${slug}` } })}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:border-rose-400 hover:text-rose-500 transition-colors"
            >
              <Lock className="w-4 h-4" /> Sign in to Review
            </button>
          ) : !checkingPurchase && !hasPurchased ? (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
              <span>Purchase to review</span>
            </div>
          ) : hasPurchased ? (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: '#E91E63', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D63D7F'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E91E63'}
            >
              <Star className="w-4 h-4" />
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          ) : null}
        </div>

        {/* Review Form */}
        {showReviewForm && user && hasPurchased && (
          <div className="mb-10 p-5 sm:p-6 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-base font-medium">Verified Purchase Review</h3>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm text-gray-500 self-center">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Title <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  maxLength={100}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Review *</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts — fit, quality, fabric, styling..."
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  required
                />
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Photos / Videos <span className="text-gray-400 font-normal">(up to 5, max 50MB each)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {reviewMediaPreviews.map((preview, idx) => {
                    const isVideo = reviewMediaFiles[idx]?.type.startsWith('video/');
                    return (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        {isVideo ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <img src={preview} alt="" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaFile(idx)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center hover:bg-black transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    );
                  })}
                  {reviewMediaFiles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 hover:border-rose-400 hover:text-rose-500 transition-colors text-gray-400 flex-shrink-0"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px]">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaSelect}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submittingReview || reviewRating === 0}
                  className="px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: '#E91E63' }}
                  onMouseEnter={(e) => !submittingReview && (e.currentTarget.style.backgroundColor = '#D63D7F')}
                  onMouseLeave={(e) => !submittingReview && (e.currentTarget.style.backgroundColor = '#E91E63')}
                >
                  {submittingReview ? (uploadingMedia ? 'Uploading media...' : 'Submitting...') : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewRating(0);
                    setReviewTitle('');
                    setReviewComment('');
                    reviewMediaPreviews.forEach(url => URL.revokeObjectURL(url));
                    setReviewMediaFiles([]);
                    setReviewMediaPreviews([]);
                  }}
                  className="px-6 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-0">
            {(showAllReviews ? reviews : reviews.slice(0, 6)).map((review) => (
              <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 py-6 first:pt-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {review.user?.full_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{review.user?.full_name || 'Anonymous'}</span>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                            <CheckCircle className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {review.title && (
                  <p className="text-sm font-semibold mb-1.5 text-gray-900 dark:text-gray-100">{review.title}</p>
                )}
                {review.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{review.comment}</p>
                )}

                {/* Review Media */}
                {review.media_urls && review.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {review.media_urls.map((url, idx) => {
                      const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i);
                      return (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 hover:opacity-90 transition-opacity relative"
                        >
                          {isVideo ? (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <img src={url} alt={`Review media ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {reviews.length > 6 && (
              <div className="pt-6 text-center">
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="px-6 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:border-rose-400 hover:text-rose-500 transition-colors inline-flex items-center gap-2"
                >
                  {showAllReviews ? (
                    <><ChevronUp className="w-4 h-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show All {reviews.length} Reviews</>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
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
