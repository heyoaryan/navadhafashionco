import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, Truck, Loader2, ArrowLeft, RotateCcw, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, Return, ReturnReason } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface OrderTracking {
  id: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [returnReason, setReturnReason] = useState<ReturnReason>('defective');
  const [returnDetails, setReturnDetails] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  useEffect(() => {
    if (showReturnModal) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [showReturnModal]);

  const fetchOrderDetails = async () => {
    if (!user || !orderId) return;

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

      // Fetch tracking
      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (trackingError) throw trackingError;
      setTracking(trackingData || []);

      // Fetch returns for this order
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (returnsError) throw returnsError;
      setReturns(returnsData || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const canReturnItem = (item: OrderItem) => {
    if (!order || order.status !== 'delivered') return false;
    
    // Check if delivered within last 5 days
    const deliveredDate = tracking.find(t => t.status === 'delivered')?.created_at;
    if (!deliveredDate) return false;
    
    const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 5) return false;
    
    // Check if already returned
    const itemReturns = returns.filter(r => 
      r.product_id === item.product_id && 
      r.size === item.size && 
      r.color === item.color
    );
    
    // Can't return if already returned twice (exchange + refund)
    if (itemReturns.length >= 2) return false;
    
    // Can't return if pending return exists
    if (itemReturns.some(r => r.status === 'pending')) return false;
    
    return true;
  };

  const getReturnType = (item: OrderItem): 'exchange' | 'refund' => {
    const itemReturns = returns.filter(r => 
      r.product_id === item.product_id && 
      r.size === item.size && 
      r.color === item.color &&
      r.status === 'approved'
    );
    
    // First return is exchange, second is refund
    return itemReturns.length === 0 ? 'exchange' : 'refund';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}-${i}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('returns')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('returns')
          .getPublicUrl(data.path);
        
        uploadedUrls.push(publicUrl);
      }
      
      setReturnImages([...returnImages, ...uploadedUrls]);
      showToast('Images uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast('Failed to upload images', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!selectedItem || !user || !order) return;
    
    if (!returnDetails.trim()) {
      showToast('Please provide return details', 'error');
      return;
    }
    
    setSubmittingReturn(true);
    try {
      const returnType = getReturnType(selectedItem);
      const previousReturn = returns.find(r => 
        r.product_id === selectedItem.product_id && 
        r.size === selectedItem.size && 
        r.color === selectedItem.color &&
        r.status === 'approved'
      );
      
      const { error } = await supabase
        .from('returns')
        .insert({
          order_id: order.id,
          order_item_id: selectedItem.id,
          user_id: user.id,
          product_id: selectedItem.product_id,
          product_name: selectedItem.product_name,
          product_image: selectedItem.product_image,
          quantity: selectedItem.quantity,
          size: selectedItem.size,
          color: selectedItem.color,
          reason: returnReason,
          reason_details: returnDetails,
          refund_amount: selectedItem.subtotal,
          images: returnImages,
          return_type: returnType,
          previous_return_id: previousReturn?.id || null,
          status: 'pending'
        });
      
      if (error) throw error;
      
      showToast(`Return request submitted for ${returnType}`, 'success');
      setShowReturnModal(false);
      setSelectedItem(null);
      setReturnReason('defective');
      setReturnDetails('');
      setReturnImages([]);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error submitting return:', error);
      showToast('Failed to submit return request', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-light mb-1 sm:mb-2">Order #{order.order_number}</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <span
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap self-start ${getStatusColor(order.status)}`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Order Items
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4 p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base line-clamp-2">{item.product_name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' • '}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Qty: {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="font-medium text-sm sm:text-base">₹{item.price.toLocaleString()}</p>
                      {canReturnItem(item) && (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowReturnModal(true);
                          }}
                          className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {returns.filter(r => 
                            r.product_id === item.product_id && 
                            r.size === item.size && 
                            r.color === item.color &&
                            r.status === 'approved'
                          ).length === 0 ? 'Exchange' : 'Return'}
                        </button>
                      )}
                      {returns.some(r => 
                        r.product_id === item.product_id && 
                        r.size === item.size && 
                        r.color === item.color
                      ) && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                          {returns.find(r => 
                            r.product_id === item.product_id && 
                            r.size === item.size && 
                            r.color === item.color
                          )?.status === 'pending' ? 'Return Pending' : 
                          returns.find(r => 
                            r.product_id === item.product_id && 
                            r.size === item.size && 
                            r.color === item.color
                          )?.status === 'approved' ? 'Return Approved' : 'Return Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      ₹{item.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Tracking */}
          {tracking.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                Order Tracking
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {tracking.map((track, index) => (
                  <div key={track.id} className="flex gap-3 sm:gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                        index === 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      {index !== tracking.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3 sm:pb-4 min-w-0">
                      <p className="font-medium text-sm sm:text-base">
                        {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
                      </p>
                      {track.location && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{track.location}</p>
                      )}
                      {track.notes && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{track.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(track.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              Order Summary
            </h2>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span>₹{order.shipping_cost.toLocaleString()}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span>₹{order.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex justify-between font-medium text-base sm:text-lg">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
              <p className="font-medium capitalize text-sm sm:text-base">{order.payment_status}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              Shipping Address
            </h2>
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-medium">{order.shipping_address.full_name}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.phone}</p>
              <p className="text-gray-600 dark:text-gray-400 break-words">
                {order.shipping_address.address_line1}
              </p>
              {order.shipping_address.address_line2 && (
                <p className="text-gray-600 dark:text-gray-400 break-words">
                  {order.shipping_address.address_line2}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                {order.shipping_address.city}, {order.shipping_address.state}{' '}
                {order.shipping_address.postal_code}
              </p>
            </div>
          </div>

          {order.tracking_number && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-medium mb-2">Tracking Number</h2>
              <p className="text-xs sm:text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded break-all">
                {order.tracking_number}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-medium">Request Return</h2>
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedItem(null);
                    setReturnReason('defective');
                    setReturnDetails('');
                    setReturnImages([]);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Return Type Info */}
              <div className={`mb-4 p-3 rounded-lg ${
                getReturnType(selectedItem) === 'exchange' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
              }`}>
                <p className="text-sm font-medium">
                  {getReturnType(selectedItem) === 'exchange' 
                    ? '🔄 This will be processed as an EXCHANGE (1st Return)'
                    : '💰 This will be processed as a REFUND (2nd Return)'}
                </p>
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  {getReturnType(selectedItem) === 'exchange'
                    ? 'First return: You will receive the same product or can choose different size/color. No money refund.'
                    : 'Second return: Amount will be refunded to your original payment method after admin approval.'}
                </p>
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Admin Approval Required:</strong> All returns must be approved by admin before processing. You will be notified via email once reviewed.
                  </p>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {selectedItem.product_image && (
                  <img
                    src={selectedItem.product_image}
                    alt={selectedItem.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{selectedItem.product_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedItem.size && `Size: ${selectedItem.size}`}
                    {selectedItem.size && selectedItem.color && ' • '}
                    {selectedItem.color && `Color: ${selectedItem.color}`}
                  </p>
                  <p className="text-sm font-medium mt-1">₹{selectedItem.subtotal.toLocaleString()}</p>
                </div>
              </div>

              {/* Return Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="defective">Defective Product</option>
                  <option value="wrong_item">Wrong Item Received</option>
                  <option value="not_as_described">Not as Described</option>
                  <option value="size_issue">Size Issue</option>
                  <option value="changed_mind">Changed Mind</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Return Details */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Details *</label>
                <textarea
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Upload Images (Optional, max 3)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {returnImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Return ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                      <button
                        onClick={() => setReturnImages(returnImages.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {returnImages.length < 3 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-rose-400">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400" />
                      )}
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">Upload clear photos showing the issue</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedItem(null);
                    setReturnReason('defective');
                    setReturnDetails('');
                    setReturnImages([]);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReturn}
                  disabled={submittingReturn || !returnDetails.trim()}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReturn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Submit {getReturnType(selectedItem) === 'exchange' ? 'Exchange' : 'Return'} Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
