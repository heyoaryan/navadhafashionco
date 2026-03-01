import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { openCashfreeCheckout, createPaymentSession, simulateTestPayment } from '../lib/cashfree';
import { Address } from '../types';
import { useToast } from '../contexts/ToastContext';

// Updated: 3-Step Checkout with Security Indicators - v2.0
export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
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

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    // Only redirect to cart if items are empty AND order is not confirmed
    if (cartItems.length === 0 && !orderConfirmed) {
      navigate('/cart');
    }
  }, [cartItems, navigate, orderConfirmed]);

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

    setLoading(true);
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
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
      if (data.min_purchase_amount && cartTotal < data.min_purchase_amount) {
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
      discount = (cartTotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount) {
        discount = Math.min(discount, appliedCoupon.max_discount_amount);
      }
    } else {
      discount = appliedCoupon.discount_value;
    }

    return Math.min(discount, cartTotal);
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    
    // Validate based on delivery method
    if (deliveryMethod === 'delivery' && !selectedAddress) {
      showToast('Please select a delivery address', 'error');
      return;
    }

    setLoading(true);
    try {
      let shippingAddress;
      
      if (deliveryMethod === 'delivery') {
        const address = addresses.find(a => a.id === selectedAddress);
        if (!address) return;
        shippingAddress = address;
      } else {
        // Store pickup address
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

      // Order number will be auto-generated by database
      const subtotal = cartTotal;
      const discount = calculateDiscount();
      // Free shipping for pickup or orders >= 2999
      const shippingCost = deliveryMethod === 'pickup' ? 0 : ((subtotal - discount) >= 2999 ? 0 : 99);
      const tax = Math.round((subtotal - discount) * 0.05);
      const total = subtotal - discount + shippingCost + tax;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            // order_number is auto-generated by database function
            user_id: user.id,
            status: paymentMethod === 'cod' ? 'processing' : 'pending',
            payment_status: 'pending',
            payment_method: paymentMethod,
            subtotal,
            discount,
            shipping_cost: shippingCost,
            tax,
            total,
            coupon_code: appliedCoupon?.code || null,
            shipping_address: shippingAddress,
            notes: deliveryMethod === 'pickup' ? 'Store Pickup Order' : null,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_image: item.product?.main_image_url || null,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.product?.price || 0,
        subtotal: (item.product?.price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reduce stock quantity for each product
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = Math.max(0, product.stock_quantity - item.quantity);
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);
        }
      }

      // Update coupon usage count
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Save order details before clearing cart
      setConfirmedOrderDetails({
        total,
        paymentMethod,
        deliveryMethod,
      });

      await clearCart();
      
      // Handle payment based on method
      if (paymentMethod === 'cod') {
        setConfirmedOrderId(order.id);
        setOrderConfirmed(true);
      } else {
        // Initiate Cashfree payment
        await initiateCashfreePayment(order, total);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMessage = error?.message || error?.error_description || 'Failed to place order. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const initiateCashfreePayment = async (order: any, amount: number) => {
    try {
      setPaymentStatus('processing');
      setPaymentError('');
      
      // Create payment session
      const session = await createPaymentSession({
        orderId: order.order_number,
        orderAmount: amount,
        customerName: user?.email || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: '9999999999',
      });

      // For test mode, simulate payment
      if (import.meta.env.VITE_CASHFREE_MODE === 'sandbox') {
        showToast('Test Mode: Opening payment gateway...', 'info');
        
        // Simulate payment processing
        setTimeout(async () => {
          const paymentResult = await simulateTestPayment(order.order_number);
          
          if (paymentResult.paymentStatus === 'SUCCESS') {
            // Update order payment status
            await supabase
              .from('orders')
              .update({ 
                payment_status: 'paid',
                status: 'processing'
              })
              .eq('id', order.id);
            
            setPaymentStatus('success');
            setConfirmedOrderId(order.id);
            setOrderConfirmed(true);
          } else {
            setPaymentStatus('failed');
            setPaymentError('Payment failed. Please try again.');
          }
        }, 2000);
      } else {
        // Production mode - open actual Cashfree checkout
        await openCashfreeCheckout(
          session.payment_session_id,
          async (_paymentDetails) => {
            // Payment successful
            try {
              await supabase
                .from('orders')
                .update({ 
                  payment_status: 'paid',
                  status: 'processing'
                })
                .eq('id', order.id);
              
              setPaymentStatus('success');
              setConfirmedOrderId(order.id);
              setOrderConfirmed(true);
            } catch (error) {
              console.error('Error updating order:', error);
              setPaymentStatus('failed');
              setPaymentError('Payment successful but order update failed. Please contact support.');
            }
          },
          (error) => {
            // Payment failed
            console.error('Payment failed:', error);
            setPaymentStatus('failed');
            
            if (error.type === 'PAYMENT_CANCELLED') {
              setPaymentError('Payment was cancelled. You can try again.');
            } else if (error.type === 'PAYMENT_FAILED') {
              setPaymentError(error.message || 'Payment failed. Please try again.');
            } else {
              setPaymentError('Payment could not be processed. Please try again.');
            }
          },
          () => {
            // Payment cancelled
            setPaymentStatus('cancelled');
            setPaymentError('Payment was cancelled. You can try again or choose a different payment method.');
          }
        );
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStatus('failed');
      setPaymentError('Failed to initiate payment. Please check your connection and try again.');
    }
  };

  const subtotal = cartTotal;
  const discount = calculateDiscount();
  const shippingCost = deliveryMethod === 'pickup' ? 0 : ((subtotal - discount) >= 2999 ? 0 : 99);
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + shippingCost + tax;

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate delivery method
      if (deliveryMethod === 'delivery' && !selectedAddress) {
        showToast('Please select a delivery address', 'error');
        return;
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

  // Order Confirmation Screen
  if (orderConfirmed && confirmedOrderDetails) {
    const { total: orderTotal, paymentMethod: orderPaymentMethod, deliveryMethod: orderDeliveryMethod } = confirmedOrderDetails;
    
    // Determine payment method display text
    const getPaymentMethodText = () => {
      if (orderPaymentMethod === 'online') {
        return 'Online Payment';
      }
      // For COD, check delivery method
      if (orderDeliveryMethod === 'pickup') {
        return 'Pay at Store';
      }
      return 'Cash on Delivery';
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
            {/* Success Animation */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {orderPaymentMethod === 'cod' ? 'Order Confirmed!' : 'Payment Successful!'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {orderPaymentMethod === 'cod' 
                  ? 'Your order has been placed successfully'
                  : 'Your payment was processed successfully'}
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Order Total</span>
                <span className="text-2xl font-bold text-rose-500">₹{orderTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method</span>
                <span className="text-sm font-semibold">
                  {getPaymentMethodText()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delivery</span>
                <span className="text-sm font-medium">
                  {orderDeliveryMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
                </span>
              </div>
            </div>

            {/* Success Message based on payment method and delivery */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              {orderPaymentMethod === 'cod' ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Order Confirmed
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {orderDeliveryMethod === 'pickup' 
                      ? `Pay ₹${orderTotal.toLocaleString()} when you collect from store`
                      : `Keep ₹${orderTotal.toLocaleString()} cash ready for delivery`
                    }
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    {orderDeliveryMethod === 'pickup'
                      ? 'Your order will be ready for pickup in 2-3 hours'
                      : "We'll contact you shortly to confirm delivery details"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Payment Completed
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your order is being processed
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    {orderDeliveryMethod === 'pickup'
                      ? 'Your order will be ready for pickup in 2-3 hours'
                      : 'You will receive a confirmation email shortly'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => navigate('/account/orders')}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Order Details
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Status Modal (Processing/Failed/Cancelled)
  const renderPaymentStatusModal = () => {
    if (!paymentStatus || paymentStatus === 'success') return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          {paymentStatus === 'processing' && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Processing Payment</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Please wait while we process your payment securely...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Do not close this window or press back button
              </p>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {paymentError || 'Your payment could not be processed'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPaymentStatus(null);
                    setPaymentError('');
                    setCurrentStep(3);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setPaymentStatus(null);
                    setPaymentError('');
                    setCurrentStep(2);
                  }}
                  className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Change Payment Method
                </button>
              </div>
            </div>
          )}

          {paymentStatus === 'cancelled' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Cancelled</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {paymentError || 'You cancelled the payment process'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPaymentStatus(null);
                    setPaymentError('');
                    setCurrentStep(3);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setPaymentStatus(null);
                    setPaymentError('');
                    setCurrentStep(2);
                  }}
                  className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Choose Different Method
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Payment Status Modal */}
      {renderPaymentStatusModal()}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
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
            
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-2 text-xs">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={item.product?.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-xs">{item.product?.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-xs">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
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
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {(subtotal - discount) >= 2999 ? '✓ Free shipping' : '₹99 shipping fee'}
                  </p>
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
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Free • Ready in 2-3 hours
                  </p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newAddress.full_name}
                    onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={newAddress.phone}
                    onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address Line 1 *"
                  value={newAddress.address_line1}
                  onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={newAddress.address_line2}
                  onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City *"
                    value={newAddress.city}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={newAddress.state}
                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code *"
                    value={newAddress.postal_code}
                    onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    className="px-4 py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    onClick={handleAddAddress}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none font-semibold shadow-md hover:shadow-lg"
                  >
                    Save Address
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
                        <p className="font-semibold text-base mb-1">{address.full_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">Phone:</span> {address.phone}
                        </p>
                      </div>
                      {selectedAddress === address.id && (
                        <svg className="w-6 h-6 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
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
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={() => navigate('/cart')}
              className="order-2 sm:order-1 px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg sm:border-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Cart
            </button>
            <button
              onClick={handleNextStep}
              className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                    Secure payment via Cashfree
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
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={handlePrevStep}
              className="order-2 sm:order-1 px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg sm:border-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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

            {/* Payment Method Info */}
            <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-green-900 dark:text-green-100">
                  {paymentMethod === 'online' ? 'Secure Online Payment' : 'Cash on Delivery'}
                </span>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                {paymentMethod === 'online' 
                  ? '✓ Your payment is protected with 256-bit SSL encryption'
                  : '✓ Pay cash when you receive your order'}
              </p>
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold">Items ({cartItems.length})</h3>
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={item.product?.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
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
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading}
                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={handlePrevStep}
              className="order-2 sm:order-1 px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg sm:border-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base">{loading ? 'Processing...' : (paymentMethod === 'online' ? 'Proceed to Secure Payment' : 'Place Order')}</span>
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
            
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={item.product?.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
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

