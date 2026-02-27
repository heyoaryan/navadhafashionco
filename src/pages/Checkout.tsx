import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { openCashfreeCheckout, createPaymentSession, simulateTestPayment } from '../lib/cashfree';
import { Address } from '../types';
import { useToast } from '../contexts/ToastContext';

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

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

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
      alert('Please select a delivery address');
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

      // Generate order number in format N01, N02, N03...
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let orderNumber = 'N01';
      if (lastOrder && lastOrder.order_number) {
        const lastNumber = parseInt(lastOrder.order_number.substring(1));
        const nextNumber = lastNumber + 1;
        orderNumber = `N${nextNumber.toString().padStart(2, '0')}`;
      }

      const subtotal = cartTotal;
      const discount = calculateDiscount();
      // Free shipping for pickup or orders >= 2999
      const shippingCost = deliveryMethod === 'pickup' ? 0 : ((subtotal - discount) >= 2999 ? 0 : 99);
      const tax = Math.round((subtotal - discount) * 0.18);
      const total = subtotal - discount + shippingCost + tax;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            user_id: user.id,
            status: 'pending',
            payment_status: 'pending',
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

      await clearCart();
      
      // Initiate Cashfree payment
      await initiateCashfreePayment(order, total);
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Failed to place order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initiateCashfreePayment = async (order: any, amount: number) => {
    try {
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
        showToast('Test Mode: Simulating payment...', 'info');
        
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
          
          showToast('Payment successful!', 'success');
          navigate(`/account/orders/${order.id}`);
        }
      } else {
        // Production mode - open actual Cashfree checkout
        await openCashfreeCheckout(
          session.payment_session_id,
          async (_paymentDetails) => {
            // Payment successful
            await supabase
              .from('orders')
              .update({ 
                payment_status: 'paid',
                status: 'processing'
              })
              .eq('id', order.id);
            
            showToast('Payment successful!', 'success');
            navigate(`/account/orders/${order.id}`);
          },
          (error) => {
            // Payment failed
            console.error('Payment failed:', error);
            showToast('Payment failed. Please try again.', 'error');
          }
        );
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      showToast('Failed to initiate payment. Please try again.', 'error');
    }
  };

  const subtotal = cartTotal;
  const discount = calculateDiscount();
  const shippingCost = deliveryMethod === 'pickup' ? 0 : ((subtotal - discount) >= 2999 ? 0 : 99);
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + shippingCost + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-light tracking-wider mb-6 sm:mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Delivery Method Selection */}
          <div>
            <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Delivery Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-medium">Home Delivery</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get it delivered to your doorstep
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {(subtotal - discount) >= 2999 ? 'Free shipping' : '₹99 shipping fee'}
                  </p>
                </div>
              </label>

              <label
                className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium">Store Pickup</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pick up from our store
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Free • Ready in 2-3 hours
                  </p>
                </div>
              </label>
            </div>
          </div>

          {deliveryMethod === 'delivery' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h2 className="text-xl sm:text-2xl font-light">Shipping Address</h2>
              {addresses.length > 0 && !showNewAddressForm && (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs sm:text-sm px-3 py-1.5 text-rose-400 hover:text-rose-500 border border-rose-400 hover:border-rose-500 rounded-lg transition-colors"
                >
                  Add New Address
                </button>
              )}
            </div>

            {showNewAddressForm ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.full_name}
                    onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newAddress.phone}
                    onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={newAddress.address_line1}
                  onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={newAddress.address_line2}
                  onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={newAddress.postal_code}
                    onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    className="px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleAddAddress}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none whitespace-nowrap min-h-[48px] flex items-center justify-center font-medium shadow-lg hover:shadow-xl"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowNewAddressForm(false)}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap min-h-[48px] flex items-center justify-center font-medium"
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
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAddress === address.id
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                    <div>
                      <p className="font-medium">{address.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{address.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          )}

          {deliveryMethod === 'pickup' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Store Location</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-lg mb-2">Navadha Fashion Co Store</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Shop No. 10 Apex LakeView
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Opp Akramaruti Lake, Umbergaon 396171
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Umargam, Gujarat 396170
                    </p>
                    <p className="text-sm font-medium text-rose-500">
                      Store Hours: 9:00 AM - 9:00 PM (Mon-Sun)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Your order will be ready for pickup within 2-3 hours. We'll send you a confirmation message.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Order Items</h2>
            <div className="space-y-3 sm:space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={item.product?.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{item.product?.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' | '}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-sm sm:text-base">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 sticky top-24">
            <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-6">Order Summary</h2>

            {/* Coupon Section */}
            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-300 dark:border-gray-600">
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={loading || !couponCode.trim()}
                      className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {appliedCoupon.code} Applied!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      {appliedCoupon.discount_type === 'percentage' 
                        ? `${appliedCoupon.discount_value}% off` 
                        : `₹${appliedCoupon.discount_value} off`}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm sm:text-base text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Tax (18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 sm:pt-3 flex justify-between text-base sm:text-lg font-medium">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || (deliveryMethod === 'delivery' && !selectedAddress)}
              className="w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-3 min-h-[48px] flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>

            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              By placing your order, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
