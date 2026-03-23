import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { openRazorpayCheckout } from '../lib/razorpay';
import { Address } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { validatePhone, validatePincode, verifyPincode } from '../utils/validation';

// Updated: 3-Step Checkout with Security Indicators - v2.0
export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { cartItems, cartTotal, clearCart, removeFromCart } = useCart();
  const { showToast } = useToast();

  // directBuy: from router state (email login) OR query param (OAuth redirect)
  const directBuy = (() => {
    if (location.state?.directBuy) return location.state.directBuy as {
      productId: string; productName: string; productImage?: string;
      price: number; quantity: number; size?: string; color?: string;
    };
    const param = new URLSearchParams(location.search).get('directBuy');
    if (param) {
      try { return JSON.parse(decodeURIComponent(param)) as { productId: string; productName: string; productImage?: string; price: number; quantity: number; size?: string; color?: string; }; }
      catch { return undefined; }
    }
    return undefined;
  })();

  // selectedCartIds: only checkout selected items from cart
  const selectedCartIds = location.state?.selectedCartIds as string[] | undefined;

  // Use directBuy items or selected cart items
  const checkoutItems = useMemo(() => {
    if (directBuy) {
      return [{
        id: 'direct-buy',
        product_id: directBuy.productId,
        quantity: directBuy.quantity,
        size: directBuy.size,
        color: directBuy.color,
        product: {
          name: directBuy.productName,
          main_image_url: directBuy.productImage,
          price: directBuy.price,
        }
      }];
    }
    if (selectedCartIds && selectedCartIds.length > 0) {
      return cartItems.filter(i => selectedCartIds.includes(i.id));
    }
    return cartItems;
  }, [directBuy, selectedCartIds, cartItems]);

  const checkoutTotal = useMemo(() => {
    if (directBuy) return directBuy.price * directBuy.quantity;
    return checkoutItems.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
  }, [directBuy, checkoutItems]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
  const [currentStep, setCurrentStep] = useState(1);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [_confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed' | 'cancelled' | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState<{
    total: number;
    paymentMethod: 'cod' | 'online';
    deliveryMethod: 'delivery' | 'pickup';
  } | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Lock scroll when payment modal is open
  useScrollLock(paymentStatus !== null);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    // Only redirect to cart if items are empty AND order is not confirmed AND not a direct buy
    if (checkoutItems.length === 0 && !orderConfirmed && !directBuy) {
      navigate('/cart');
    }
  }, [checkoutItems, navigate, orderConfirmed, directBuy]);

  // Admin restriction - admins cannot place orders
  useEffect(() => {
    if (profile?.role === 'admin') {
      showToast('Admin accounts cannot place orders', 'error');
      navigate('/admin');
    }
  }, [profile, navigate, showToast]);

  const fetchAddresses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (data && data.length > 0) {
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default);
      setSelectedAddress(defaultAddr?.id || data[0].id);
    } else {
      setShowNewAddressForm(true);
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;

    // Validate phone
    if (!validatePhone(newAddress.phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    // Validate pincode format
    if (!validatePincode(newAddress.postal_code)) {
      setPincodeError('Please enter a valid 6-digit pincode');
      showToast('Please enter a valid 6-digit pincode', 'error');
      return;
    }

    setLoading(true);

    // Verify pincode exists
    const pincodeInfo = await verifyPincode(newAddress.postal_code);
    if (!pincodeInfo) {
      setPincodeError('Invalid pincode — please check and try again');
      showToast('Invalid pincode — please check and try again', 'error');
      setLoading(false);
      return;
    }

    // Check blacklist
    const { data: blacklistData } = await supabase
      .from('blacklist')
      .select('id')
      .eq('entity_type', 'area')
      .eq('is_active', true)
      .or(`area_pincode.eq.${newAddress.postal_code},and(area_city.eq.${newAddress.city},area_state.eq.${newAddress.state})`)
      .maybeSingle();

    if (blacklistData) {
      setPincodeError('We currently do not deliver to this area');
      showToast(`Sorry, we don't deliver to ${newAddress.city}, ${newAddress.state} (${newAddress.postal_code})`, 'error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert([{ ...newAddress, user_id: user.id, is_default: addresses.length === 0 }])
        .select()
        .single();

      if (error) throw error;

      setAddresses([...addresses, data]);
      setSelectedAddress(data.id);
      setShowNewAddressForm(false);
      setPhoneError('');
      setPincodeError('');
      setNewAddress({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
      });
    } catch (error) {
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  // Coupon attempt rate limiting (client-side)
  const couponAttemptsRef = useRef<{ count: number; resetAt: number }>({ count: 0, resetAt: 0 });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    // Sanitize coupon code — only alphanumeric + dash allowed, max 50 chars
    const sanitizedCode = couponCode.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 50);
    if (!sanitizedCode) {
      setCouponError('Invalid coupon code format');
      return;
    }

    // Rate limit: max 5 attempts per minute
    const now = Date.now();
    if (now > couponAttemptsRef.current.resetAt) {
      couponAttemptsRef.current = { count: 0, resetAt: now + 60_000 };
    }
    couponAttemptsRef.current.count += 1;
    if (couponAttemptsRef.current.count > 5) {
      setCouponError('Too many attempts. Please wait a minute and try again.');
      return;
    }

    setCouponError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', sanitizedCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setCouponError('Invalid coupon code');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('This coupon has expired');
        return;
      }

      // Check usage limit
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setCouponError('This coupon has reached its usage limit');
        return;
      }

      // Check minimum purchase amount
      if (data.min_purchase_amount && checkoutTotal < data.min_purchase_amount) {
        setCouponError(`Minimum purchase amount is ₹${data.min_purchase_amount}`);
        return;
      }

      setAppliedCoupon(data);
      setCouponError('');
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    let discount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      discount = (checkoutTotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount) {
        discount = Math.min(discount, appliedCoupon.max_discount_amount);
      }
    } else {
      discount = appliedCoupon.discount_value;
    }

    return Math.min(discount, checkoutTotal);
  };

  // Helper: create order in DB after payment confirmed
  const createOrderInDB = async (paymentId?: string) => {
    if (!user) throw new Error('Not logged in');

    let shippingAddress;
    if (deliveryMethod === 'delivery') {
      const address = addresses.find(a => a.id === selectedAddress);
      if (!address) throw new Error('Selected address not found');
      shippingAddress = address;
    } else {
      shippingAddress = {
        full_name: user.email || 'Store Pickup',
        phone: 'N/A',
        address_line1: 'Navadha Fashion Co Store',
        address_line2: 'Store Pickup',
        city: 'Store Location',
        state: 'Store State',
        postal_code: '000000',
        country: 'India',
      };
    }

    // Fetch fresh prices from DB — never trust client-side prices
    const productIds = checkoutItems.map(i => i.product_id);
    const { data: freshProducts, error: priceError } = await supabase
      .from('products')
      .select('id, price, sale_price, is_active, stock_quantity')
      .in('id', productIds);

    if (priceError || !freshProducts) throw new Error('Failed to verify product prices');

    // Validate all products are active and in stock
    for (const item of checkoutItems) {
      const fp = freshProducts.find(p => p.id === item.product_id);
      if (!fp) throw new Error(`Product not found: ${item.product_id}`);
      if (!fp.is_active) throw new Error(`Product is no longer available: ${item.product?.name}`);
      if (fp.stock_quantity < item.quantity) throw new Error(`Insufficient stock for: ${item.product?.name}`);
    }

    // Calculate subtotal using server-verified prices
    const verifiedSubtotal = checkoutItems.reduce((sum, item) => {
      const fp = freshProducts.find(p => p.id === item.product_id)!;
      const unitPrice = fp.sale_price ?? fp.price;
      return sum + unitPrice * item.quantity;
    }, 0);

    const discount = calculateDiscount();
    // Ensure discount doesn't exceed subtotal
    const safeDiscount = Math.min(discount, verifiedSubtotal);
    const shippingCost = deliveryMethod === 'pickup' ? 0 : ((verifiedSubtotal - safeDiscount) >= 2999 ? 0 : 99);
    const tax = Math.round((verifiedSubtotal - safeDiscount) * 0.05);
    const total = verifiedSubtotal - safeDiscount + shippingCost + tax;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        status: 'processing',
        payment_status: paymentId ? 'paid' : 'pending',
        payment_method: paymentMethod,
        payment_id: paymentId || null,
        subtotal: verifiedSubtotal,
        discount: safeDiscount,
        shipping_cost: shippingCost,
        tax,
        total,
        coupon_code: appliedCoupon?.code || null,
        shipping_address: shippingAddress,
        notes: deliveryMethod === 'pickup' ? 'Store Pickup Order' : (() => {
          const bespoke = localStorage.getItem('bespokeCustomization');
          if (bespoke) {
            try { return JSON.stringify({ type: 'bespoke', ...JSON.parse(bespoke) }); } catch { return null; }
          }
          return null;
        })(),
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = checkoutItems.map(item => {
      const fp = freshProducts.find(p => p.id === item.product_id)!;
      const unitPrice = fp.sale_price ?? fp.price;
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_image: item.product?.main_image_url || null,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    if (appliedCoupon) {
      await supabase
        .from('coupons')
        .update({ used_count: appliedCoupon.used_count + 1 })
        .eq('id', appliedCoupon.id);
    }

    return { order, total };
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (isProcessingOrder || loading) return;

    if (deliveryMethod === 'delivery' && !selectedAddress) {
      showToast('Please select a delivery address', 'error');
      return;
    }

    setLoading(true);
    setIsProcessingOrder(true);

    try {
      const subtotal = checkoutTotal;
      const discount = calculateDiscount();
      const shippingCost = deliveryMethod === 'pickup' ? 0 : ((subtotal - discount) >= 2999 ? 0 : 99);
      const tax = Math.round((subtotal - discount) * 0.05);
      const total = subtotal - discount + shippingCost + tax;

      if (paymentMethod === 'cod') {
        // COD: create order directly
        const { order, total: verifiedTotal } = await createOrderInDB();
        setConfirmedOrderDetails({ total: verifiedTotal, paymentMethod, deliveryMethod });
        if (!directBuy) await clearCart();
        localStorage.removeItem('bespokeCustomization');
        setConfirmedOrderId(order.id);
        setOrderConfirmed(true);
        setIsProcessingOrder(false);
        setLoading(false);
      } else {
        // Online: fetch verified total first, then open Razorpay
        const productIds = checkoutItems.map(i => i.product_id);
        const { data: freshProducts } = await supabase
          .from('products')
          .select('id, price, sale_price')
          .in('id', productIds);

        const verifiedSubtotal = checkoutItems.reduce((sum, item) => {
          const fp = freshProducts?.find(p => p.id === item.product_id);
          const unitPrice = fp ? (fp.sale_price ?? fp.price) : (item.product?.price || 0);
          return sum + unitPrice * item.quantity;
        }, 0);

        const discount = calculateDiscount();
        const safeDiscount = Math.min(discount, verifiedSubtotal);
        const shippingCost = deliveryMethod === 'pickup' ? 0 : ((verifiedSubtotal - safeDiscount) >= 2999 ? 0 : 99);
        const tax = Math.round((verifiedSubtotal - safeDiscount) * 0.05);
        const verifiedTotal = verifiedSubtotal - safeDiscount + shippingCost + tax;

        setConfirmedOrderDetails({ total: verifiedTotal, paymentMethod, deliveryMethod });
        setLoading(false);
        setIsProcessingOrder(false);
        await initiateRazorpayPayment(verifiedTotal);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      showToast(error?.message || 'Failed to place order. Please try again.', 'error');
      setIsProcessingOrder(false);
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = async (amount: number) => {
    try {
      setPaymentError('');

      const tempOrderRef = `ORD-${Date.now()}`;

      await openRazorpayCheckout(
        {
          orderId: tempOrderRef,
          orderNumber: tempOrderRef,
          amount,
          customerName: profile?.full_name || user?.email || 'Customer',
          customerEmail: user?.email || '',
          customerPhone: addresses.find(a => a.id === selectedAddress)?.phone || '9999999999',
        },
        async (paymentData) => {
          // Success — verify payment server-side BEFORE saving order
          setPaymentStatus('processing');
          try {
            // Step 1: Verify with Edge Function
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            const verifyRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: paymentData.razorpay_payment_id,
                  razorpay_order_id: paymentData.razorpay_order_id,
                  razorpay_signature: paymentData.razorpay_signature,
                }),
              }
            );

            const verifyResult = await verifyRes.json();

            if (!verifyResult.verified) {
              setPaymentStatus('failed');
              setPaymentError('Payment verification failed. If money was deducted, contact support with your payment ID: ' + paymentData.razorpay_payment_id);
              setIsProcessingOrder(false);
              return;
            }

            // Step 2: Payment verified — save order
            const { order } = await createOrderInDB(paymentData.razorpay_payment_id);
            if (!directBuy) await clearCart();
            localStorage.removeItem('bespokeCustomization');
            setPaymentStatus('success');
            setConfirmedOrderId(order.id);
            setOrderConfirmed(true);
            setIsProcessingOrder(false);
          } catch (error) {
            console.error('Order creation failed after payment:', error);
            setPaymentStatus('failed');
            setPaymentError(
              `Payment received (ID: ${paymentData.razorpay_payment_id}) but order creation failed. Please contact support — we will resolve this within 24 hours.`
            );
            setIsProcessingOrder(false);
          }
        },
        (error) => {
          setIsProcessingOrder(false);
          setPaymentStatus('failed');
          if (error.type === 'NETWORK_ERROR') {
            setPaymentError('Network error. Please check your connection and try again.');
          } else if (error.type === 'PAYMENT_CANCELLED') {
            setPaymentStatus('cancelled');
            setPaymentError('');
          } else {
            setPaymentError(error.message || 'Payment could not be completed. Please try again.');
          }
        },
        () => {
          setIsProcessingOrder(false);
          setPaymentStatus('cancelled');
          setPaymentError('');
        }
      );
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setPaymentStatus('failed');
      setPaymentError(error?.message || 'Failed to initiate payment. Please check your connection and try again.');
      setIsProcessingOrder(false);
    }
  };

  // Read bespoke customization data from localStorage
  const bespokeCustomization = (() => {
    try {
      const raw = localStorage.getItem('bespokeCustomization');
      return raw ? JSON.parse(raw) as {
        urgency: 'standard' | 'express' | 'rush';
        complexity: 'simple' | 'moderate' | 'complex';
        complexityCharge: number;
        urgencyCharge: number;
        basePrice: number;
        designerCharge: number;
        [key: string]: any;
      } : null;
    } catch { return null; }
  })();

  const isBespokeOrder = !!(location.state?.isBespokeOrder || bespokeCustomization);

  // Bespoke delivery timeline info
  const bespokeTimeline = bespokeCustomization?.urgency === 'rush'
    ? { label: 'Rush', days: '7–13 days' }
    : bespokeCustomization?.urgency === 'express'
    ? { label: 'Express', days: '14–20 days' }
    : isBespokeOrder
    ? { label: 'Standard', days: '21–30 days' }
    : null;

  const subtotal = checkoutTotal;
  const discount = calculateDiscount();
  const shippingCost = deliveryMethod === 'pickup' ? 0 : ((subtotal - discount) >= 2999 ? 0 : 99);
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + shippingCost + tax;

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate delivery method
      if (deliveryMethod === 'delivery' && !selectedAddress) {
        showToast('Please select a delivery address', 'error');
        return;
      }

      // Check if selected address area is blacklisted
      if (deliveryMethod === 'delivery' && selectedAddress) {
        const addr = addresses.find(a => a.id === selectedAddress);
        if (addr) {
          const { data: blacklistData } = await supabase
            .from('blacklist')
            .select('id')
            .eq('entity_type', 'area')
            .eq('is_active', true)
            .or(`area_pincode.eq.${addr.postal_code},and(area_city.eq.${addr.city},area_state.eq.${addr.state})`)
            .maybeSingle();

          if (blacklistData) {
            showToast(`We're unable to deliver to ${addr.city}, ${addr.state} (${addr.postal_code}). This area is currently restricted.`, 'error');
            return;
          }
        }
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [fetchingLocation, setFetchingLocation] = useState(false);

  const FALLBACK_IMG = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400';
  const getProductImage = (item: any): string =>
    item.product?.main_image_url || FALLBACK_IMG;

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const addr = data.address;
          setNewAddress(prev => ({
            ...prev,
            address_line1: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ') || prev.address_line1,
            city: addr.city || addr.town || addr.village || addr.county || prev.city,
            state: addr.state || prev.state,
            postal_code: addr.postcode || prev.postal_code,
          }));
          showToast('Location fetched successfully', 'success');
        } catch {
          showToast('Could not fetch location details', 'error');
        } finally {
          setFetchingLocation(false);
        }
      },
      () => {
        showToast('Location access denied. Please allow location permission.', 'error');
        setFetchingLocation(false);
      }
    );
  };

  // Order Confirmation Screen
  if (orderConfirmed && confirmedOrderDetails) {
    const { total: orderTotal, paymentMethod: orderPaymentMethod, deliveryMethod: orderDeliveryMethod } = confirmedOrderDetails;

    const getPaymentMethodText = () => {
      if (orderPaymentMethod === 'online') return 'Online Payment';
      if (orderDeliveryMethod === 'pickup') return 'Pay at Store';
      return 'Cash on Delivery';
    };

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">

            {/* Top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

            <div className="px-5 sm:px-8 py-6 sm:py-8 text-center">

              {/* Animated checkmark */}
              <div className="flex items-center justify-center mb-4 sm:mb-5">
                <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80" fill="none">
                  <style>{`
                    @keyframes circleGrow {
                      0%   { stroke-dashoffset: 251; opacity: 0; }
                      20%  { opacity: 1; }
                      100% { stroke-dashoffset: 0; opacity: 1; }
                    }
                    @keyframes checkDraw {
                      0%   { stroke-dashoffset: 50; opacity: 0; }
                      100% { stroke-dashoffset: 0; opacity: 1; }
                    }
                    @keyframes fillIn {
                      0%   { opacity: 0; }
                      100% { opacity: 1; }
                    }
                    .circle-anim {
                      stroke-dasharray: 251;
                      stroke-dashoffset: 251;
                      animation: circleGrow 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
                    }
                    .fill-anim {
                      opacity: 0;
                      animation: fillIn 0.3s ease 0.65s forwards;
                    }
                    .check-anim {
                      stroke-dasharray: 50;
                      stroke-dashoffset: 50;
                      opacity: 0;
                      animation: checkDraw 0.4s cubic-bezier(0.4,0,0.2,1) 0.75s forwards;
                    }
                  `}</style>
                  {/* Shadow/glow */}
                  <circle cx="40" cy="40" r="38" fill="#bbf7d0" className="fill-anim" />
                  {/* Animated circle border */}
                  <circle
                    className="circle-anim"
                    cx="40" cy="40" r="36"
                    stroke="url(#cg)" strokeWidth="4"
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                  {/* Gradient def */}
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Animated checkmark */}
                  <path
                    className="check-anim"
                    d="M22 41l12 12 24-24"
                    stroke="#16a34a"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {orderPaymentMethod === 'cod' ? 'Order Confirmed!' : 'Payment Successful!'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-5">
                {orderPaymentMethod === 'cod'
                  ? 'Your order has been placed successfully'
                  : 'Your payment was processed successfully'}
              </p>

              {/* Order details */}
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 text-left space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Order Total</span>
                  <span className="text-lg sm:text-xl font-bold text-rose-500">₹{orderTotal.toLocaleString()}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Payment</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">{getPaymentMethodText()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Delivery</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {orderDeliveryMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
                  </span>
                </div>
              </div>

              {/* Info message */}
              <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-4 sm:mb-5 text-left">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-0.5">
                    {orderDeliveryMethod === 'pickup'
                      ? 'Ready in 2-3 hours'
                      : orderPaymentMethod === 'cod'
                      ? `Keep ₹${orderTotal.toLocaleString()} ready`
                      : 'Order is being processed'}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    {orderDeliveryMethod === 'pickup'
                      ? 'Visit our store to collect your order. We will notify you when ready.'
                      : orderPaymentMethod === 'cod'
                      ? "We'll contact you shortly to confirm your delivery details."
                      : 'You will receive updates on your order status via email.'}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/account/orders')}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-md shadow-rose-200 dark:shadow-rose-900/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View My Orders
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-2.5 sm:py-3 border border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl font-medium transition-all text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detect if this is a "payment succeeded but order save failed" scenario
  const isOrderSaveFailure = paymentStatus === 'failed' && paymentError.includes('Payment received');

  // Payment Status Screen
  const renderPaymentStatusModal = () => {
    if (!paymentStatus || paymentStatus === 'success') return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

            {/* Top accent bar */}
            <div className={`h-1.5 w-full ${
              paymentStatus === 'processing' ? 'bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse' :
              paymentStatus === 'cancelled' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
              isOrderSaveFailure ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'
            }`} />

            <div className="px-6 sm:px-8 py-7 sm:py-9 text-center">

              {/* ── PROCESSING ── */}
              {paymentStatus === 'processing' && (
                <>
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-blue-50 dark:bg-blue-900/20" />
                    <div className="absolute inset-2 rounded-full border-4 border-blue-100 dark:border-blue-900 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Processing Payment</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment confirmed. Creating your order...</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                    Please do not close this window
                  </p>
                </>
              )}

              {/* ── PAYMENT FAILED (no debit) ── */}
              {paymentStatus === 'failed' && !isOrderSaveFailure && (
                <>
                  {/* Animated X icon */}
                  <div className="flex items-center justify-center mb-6">
                    <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                      <style>{`
                        @keyframes pf-circle{0%{stroke-dashoffset:251;opacity:0}20%{opacity:1}100%{stroke-dashoffset:0}}
                        @keyframes pf-fill{0%{opacity:0}100%{opacity:1}}
                        @keyframes pf-x{0%{stroke-dashoffset:60;opacity:0}100%{stroke-dashoffset:0;opacity:1}}
                        .pf-c{stroke-dasharray:251;stroke-dashoffset:251;animation:pf-circle .55s ease .1s forwards}
                        .pf-f{opacity:0;animation:pf-fill .25s ease .6s forwards}
                        .pf-x{stroke-dasharray:60;stroke-dashoffset:60;opacity:0;animation:pf-x .35s ease .7s forwards}
                      `}</style>
                      <circle cx="40" cy="40" r="38" fill="#fee2e2" className="pf-f"/>
                      <circle className="pf-c" cx="40" cy="40" r="36" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" transform="rotate(-90 40 40)"/>
                      <path className="pf-x" d="M27 27l26 26M53 27L27 53" stroke="#dc2626" strokeWidth="5" strokeLinecap="round"/>
                    </svg>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mb-1">Payment Not Completed</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Order failed to process — no amount was charged.</p>

                  {/* Status breakdown */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Payment</p>
                        <p className="text-xs text-red-500">Not completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Order</p>
                        <p className="text-xs text-gray-400">Not placed — nothing was charged</p>
                      </div>
                    </div>
                  </div>

                  {paymentError && !paymentError.includes('cancelled') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">{paymentError}</p>
                  )}

                  <div className="space-y-2.5">
                    <button
                      onClick={() => { setPaymentStatus(null); setPaymentError(''); if (confirmedOrderDetails) initiateRazorpayPayment(confirmedOrderDetails.total); }}
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-md shadow-rose-200 dark:shadow-rose-900/30 text-sm"
                    >
                      Try Payment Again
                    </button>
                    <button
                      onClick={() => { setPaymentStatus(null); setPaymentError(''); setCurrentStep(2); }}
                      className="w-full py-2.5 border border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 text-gray-600 dark:text-gray-400 hover:text-rose-500 rounded-xl font-medium transition-all text-sm"
                    >
                      Change Payment Method
                    </button>
                  </div>
                </>
              )}

              {/* ── ORDER SAVE FAILURE (payment went through but order not saved) ── */}
              {isOrderSaveFailure && (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">Payment Received</h2>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">But order could not be saved</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Your money is safe. We will resolve this within 24 hours.</p>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-5 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Payment</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Successfully received by Razorpay</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Order</p>
                        <p className="text-xs text-red-500">Failed to save — contact support</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5 text-left">
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <span className="font-semibold">Payment ID saved:</span> {paymentError.match(/ID: ([^\s)]+)/)?.[1] || 'See Razorpay confirmation'}<br/>
                      If not resolved in 24h, a full refund will be issued automatically.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all active:scale-95 text-sm"
                  >
                    Contact Support
                  </button>
                </>
              )}

              {/* ── CANCELLED ── */}
              {paymentStatus === 'cancelled' && (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                      <style>{`
                        @keyframes pc-circle{0%{stroke-dashoffset:251;opacity:0}20%{opacity:1}100%{stroke-dashoffset:0}}
                        @keyframes pc-fill{0%{opacity:0}100%{opacity:1}}
                        @keyframes pc-dash{0%{stroke-dashoffset:40;opacity:0}100%{stroke-dashoffset:0;opacity:1}}
                        .pc-c{stroke-dasharray:251;stroke-dashoffset:251;animation:pc-circle .55s ease .1s forwards}
                        .pc-f{opacity:0;animation:pc-fill .25s ease .6s forwards}
                        .pc-d{stroke-dasharray:40;stroke-dashoffset:40;opacity:0;animation:pc-dash .35s ease .7s forwards}
                      `}</style>
                      <circle cx="40" cy="40" r="38" fill="#fef9c3" className="pc-f"/>
                      <circle className="pc-c" cx="40" cy="40" r="36" stroke="#eab308" strokeWidth="4" strokeLinecap="round" transform="rotate(-90 40 40)"/>
                      <path className="pc-d" d="M40 26v16" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round"/>
                      <circle cx="40" cy="52" r="3" fill="#ca8a04" className="pc-f"/>
                    </svg>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">Payment Cancelled</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    You closed the payment window. No amount was charged and your order was not placed.
                  </p>

                  {/* Status row */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01"/></svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">No charge made</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Your cart items are still saved</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => { setPaymentStatus(null); setPaymentError(''); if (confirmedOrderDetails) initiateRazorpayPayment(confirmedOrderDetails.total); }}
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-md shadow-rose-200 dark:shadow-rose-900/30 text-sm"
                    >
                      Complete Payment
                    </button>
                    <button
                      onClick={() => { setPaymentStatus(null); setPaymentError(''); setCurrentStep(2); }}
                      className="w-full py-2.5 border border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 text-gray-600 dark:text-gray-400 hover:text-rose-500 rounded-xl font-medium transition-all text-sm"
                    >
                      Change Payment Method
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Payment Status Modal */}
      {renderPaymentStatusModal()}
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Secure Checkout</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Complete your purchase in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= 1 ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'} text-white flex items-center justify-center font-medium text-sm sm:text-base transition-all`}>
                {currentStep > 1 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : '1'}
              </div>
              <span className={`text-xs sm:text-sm mt-2 ${currentStep >= 1 ? 'font-semibold text-rose-500' : 'text-gray-500'}`}>Delivery</span>
            </div>
            <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'} mx-2 transition-all`}></div>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= 2 ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'} text-white flex items-center justify-center font-medium text-sm sm:text-base transition-all`}>
                {currentStep > 2 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : '2'}
              </div>
              <span className={`text-xs sm:text-sm mt-2 ${currentStep >= 2 ? 'font-semibold text-rose-500' : 'text-gray-500'}`}>Payment</span>
            </div>
            <div className={`flex-1 h-0.5 ${currentStep >= 3 ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'} mx-2 transition-all`}></div>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= 3 ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'} text-white flex items-center justify-center font-medium text-sm sm:text-base transition-all`}>
                3
              </div>
              <span className={`text-xs sm:text-sm mt-2 ${currentStep >= 3 ? 'font-semibold text-rose-500' : 'text-gray-500'}`}>Confirm</span>
            </div>
          </div>
        </div>

      {/* Order Summary - Mobile Only (Steps 1 & 2) */}
      {currentStep !== 3 && (
        <div className="lg:hidden mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order Summary
            </h2>
            
            <div className="space-y-3 mb-3 max-h-56 overflow-y-auto">
              {checkoutItems.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={getProductImage(item)}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm leading-snug line-clamp-2">{item.product?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    <p className="font-semibold text-xs text-rose-500 mt-0.5">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                  </div>
                  {!directBuy && item.id && (
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                      title="Remove item"
                    >
                      <svg className="w-3.5 h-3.5 text-red-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
              {bespokeCustomization ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Base Price</span>
                    <span className="font-medium">₹{(bespokeCustomization.basePrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Designer Charge</span>
                    <span className="font-medium">+₹{(bespokeCustomization.complexityCharge || 0).toLocaleString()}</span>
                  </div>
                  {(bespokeCustomization.urgencyCharge || 0) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Charge ({bespokeTimeline?.label})</span>
                      <span className="font-medium">+₹{bespokeCustomization.urgencyCharge.toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-medium text-green-600">-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-medium">{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Tax (5%)</span>
                <span className="font-medium">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span className="text-rose-500">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${currentStep !== 3 ? 'lg:grid-cols-3' : ''} gap-6 lg:gap-8`}>
        {/* Main Content */}
        <div className={`${currentStep !== 3 ? 'lg:col-span-2' : 'max-w-4xl mx-auto w-full'} space-y-6`}>
          {/* Step 1: Delivery Method */}
          {currentStep === 1 && (
          <>
          {/* Delivery Method Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold">Choose Delivery Method</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'delivery' | 'pickup')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-semibold">Home Delivery</span>
                    {deliveryMethod === 'delivery' && (
                      <svg className="w-5 h-5 text-rose-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Delivered to your doorstep
                  </p>
                  {bespokeTimeline ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      ₹99 shipping fee • {bespokeTimeline.label}: {bespokeTimeline.days}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {(subtotal - discount) >= 2999 ? '✓ Free shipping' : '₹99 shipping fee'}
                    </p>
                  )}
                </div>
              </label>

              <label
                className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'delivery' | 'pickup')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold">Store Pickup</span>
                    {deliveryMethod === 'pickup' && (
                      <svg className="w-5 h-5 text-rose-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Collect from our store
                  </p>
                  {bespokeTimeline ? (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      ✓ Free • Ready in {bespokeTimeline.days}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      ✓ Free • Ready in 2-3 hours
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {deliveryMethod === 'delivery' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold">Shipping Address</h2>
              </div>
              {addresses.length > 0 && !showNewAddressForm && (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs sm:text-sm px-3 py-1.5 text-rose-500 hover:text-rose-600 border border-rose-500 hover:border-rose-600 rounded-lg transition-colors font-medium"
                >
                  + Add New
                </button>
              )}
            </div>

            {showNewAddressForm ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 sm:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={fetchingLocation}
                  className="flex items-center gap-2 text-sm px-4 py-2 border border-rose-400 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {fetchingLocation ? 'Fetching...' : 'Use My Location'}
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newAddress.full_name}
                    maxLength={100}
                    onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value.slice(0, 100) })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits) *"
                    value={newAddress.phone}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setNewAddress({ ...newAddress, phone: value });
                      setPhoneError('');
                    }}
                    maxLength={10}
                    className={`px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border ${phoneError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent`}
                  />
                </div>
                {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                <input
                  type="text"
                  placeholder="Address Line 1 *"
                  value={newAddress.address_line1}
                  maxLength={200}
                  onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value.slice(0, 200) })}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={newAddress.address_line2}
                  maxLength={200}
                  onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value.slice(0, 200) })}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City *"
                    value={newAddress.city}
                    maxLength={100}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value.slice(0, 100) })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={newAddress.state}
                    maxLength={100}
                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value.slice(0, 100) })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code *"
                    value={newAddress.postal_code}
                    maxLength={6}
                    onChange={e => {
                      setNewAddress({ ...newAddress, postal_code: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) });
                      setPincodeError('');
                    }}
                    className={`px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border ${pincodeError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent`}
                  />
                  {pincodeError && <p className="text-red-500 text-xs mt-1 col-span-full">{pincodeError}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    onClick={handleAddAddress}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    )}
                    {loading ? 'Verifying...' : 'Save Address'}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowNewAddressForm(false)}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-95 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(address => (
                  <label
                    key={address.id}
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedAddress === address.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id}
                      onChange={e => setSelectedAddress(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-base">{address.full_name}</p>
                          {address.is_default && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 uppercase tracking-wide">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.city}, {address.state} — {address.postal_code}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          📞 {address.phone}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3 mt-0.5">
                        {selectedAddress === address.id ? (
                          <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          )}

          {deliveryMethod === 'pickup' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold">Store Location</h2>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-xl p-4 sm:p-6 border border-rose-200 dark:border-rose-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Navadha Fashion Co Store</h3>
                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <p>Shop No. 10 Apex LakeView</p>
                      <p>Opp Akramaruti Lake, Umbergaon 396171</p>
                      <p>Umargam, Gujarat 396170</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-800">
                      <div className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Store Hours: 9:00 AM - 9:00 PM (Mon-Sun)
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        ✓ Your order will be ready for pickup within 2-3 hours. We'll send you a confirmation message.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Button for Step 1 */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNextStep}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-sm sm:text-base">Continue to Payment</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          </>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
          <>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold">Secure Payment Method</h2>
                <div className="flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">SSL Encrypted & Secure</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'online'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'online')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-semibold">Online Payment</span>
                    {paymentMethod === 'online' && (
                      <svg className="w-5 h-5 text-rose-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Secure payment via Razorpay
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Secure & Encrypted</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">UPI</span>
                    <span className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">Cards</span>
                    <span className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">Wallets</span>
                  </div>
                </div>
              </label>

              <label
                className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'online')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-semibold">
                      {deliveryMethod === 'pickup' ? 'Pay at Store' : 'Cash on Delivery'}
                    </span>
                    {paymentMethod === 'cod' && (
                      <svg className="w-5 h-5 text-rose-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {deliveryMethod === 'pickup' 
                      ? 'Pay with cash when you collect from store' 
                      : 'Pay when you receive'}
                  </p>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2">
                    ✓ {deliveryMethod === 'pickup' ? 'Pay at store pickup' : 'Available for all orders'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Navigation Buttons for Step 2 */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={handlePrevStep}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-sm sm:text-base">Review Order</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          </>
          )}

          {/* Step 3: Confirm Order */}
          {currentStep === 3 && (
          <>
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Summary</h2>
            
            {/* Delivery Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="font-semibold">Delivery Method</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
              </p>
              {deliveryMethod === 'delivery' && selectedAddress && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    const addr = addresses.find(a => a.id === selectedAddress);
                    return addr ? (
                      <>
                        <p className="font-medium">{addr.full_name}</p>
                        <p>{addr.address_line1}, {addr.city}</p>
                        <p>{addr.state} {addr.postal_code}</p>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold">Items ({checkoutItems.length})</h3>
              {checkoutItems.map(item => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={getProductImage(item)}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product?.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' | '}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-sm">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3">Have a Coupon?</h3>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading}
                    className="flex-shrink-0 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">{appliedCoupon.code}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Discount applied!</p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-sm text-red-500 mt-2">{couponError}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2">
              {bespokeCustomization ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Base Price</span>
                    <span className="font-medium">₹{(bespokeCustomization.basePrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Designer Charge</span>
                    <span className="font-medium">+₹{(bespokeCustomization.complexityCharge || 0).toLocaleString()}</span>
                  </div>
                  {(bespokeCustomization.urgencyCharge || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Charge ({bespokeTimeline?.label})</span>
                      <span className="font-medium">+₹{bespokeCustomization.urgencyCharge.toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-medium text-green-600">-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-medium">{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
              </div>
              {bespokeTimeline && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Timeline</span>
                  <span className="font-medium text-rose-500">{bespokeTimeline.label} ({bespokeTimeline.days})</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax (5%)</span>
                <span className="font-medium">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span className="text-rose-500">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons for Step 3 */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={handlePrevStep}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading || isProcessingOrder}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading || isProcessingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm sm:text-base">{paymentMethod === 'online' ? 'Proceed to Secure Payment' : 'Place Order'}</span>
                </>
              )}
            </button>
          </div>
          </>
          )}
        </div>

        {/* Order Summary Sidebar - Desktop Only for Steps 1 & 2 */}
        {currentStep !== 3 && (
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order Summary
            </h2>
            
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
              {checkoutItems.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={getProductImage(item)}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug line-clamp-2">{item.product?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    <p className="font-semibold text-xs text-rose-500 mt-0.5">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              {bespokeCustomization ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Base Price</span>
                    <span className="font-medium">₹{(bespokeCustomization.basePrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Designer Charge</span>
                    <span className="font-medium">+₹{(bespokeCustomization.complexityCharge || 0).toLocaleString()}</span>
                  </div>
                  {(bespokeCustomization.urgencyCharge || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Charge ({bespokeTimeline?.label})</span>
                      <span className="font-medium">+₹{bespokeCustomization.urgencyCharge.toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-medium text-green-600">-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-medium">{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
              </div>
              {bespokeTimeline && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Timeline</span>
                  <span className="font-medium text-rose-500">{bespokeTimeline.label} ({bespokeTimeline.days})</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax (5%)</span>
                <span className="font-medium">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span className="text-rose-500">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      </div>
    </div>
  );
}

