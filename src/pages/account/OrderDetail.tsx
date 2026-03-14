import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, Truck, ArrowLeft, RotateCcw, Upload, X } from 'lucide-react';
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
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin"></div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-light">Order #{order.order_number}</h1>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} ${
                  order.status === 'delivered' ? 'animate-pulse-green' :
                  order.status === 'shipped' ? 'animate-pulse-blue' :
                  order.status === 'processing' ? 'animate-pulse-yellow' :
                  ''
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-black dark:text-white">
              ₹{order.total.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {order.payment_method || 'Online Payment'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base line-clamp-2 mb-2">{item.product_name}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.size && (
                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                          Color: {item.color}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-lg">₹{item.subtotal.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        {canReturnItem(item) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedItem(item);
                              setShowReturnModal(true);
                            }}
                            className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1 font-medium"
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
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded font-medium">
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Timeline
            </h2>
            
            {/* Visual Progress Bar */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-2">
                {order.status === 'cancelled' ? (
                  // Show cancelled status
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse">
                      ✕
                    </div>
                    <p className="text-xs mt-2 text-center font-medium text-red-600 dark:text-red-400">
                      Cancelled
                    </p>
                  </div>
                ) : (
                  // Show normal progress
                  ['pending', 'processing', 'shipped', 'delivered'].map((status, idx) => {
                    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                    const currentStatusIndex = statusOrder.indexOf(order.status);
                    const thisStatusIndex = statusOrder.indexOf(status);
                    const isCompleted = thisStatusIndex < currentStatusIndex;
                    const isCurrent = order.status === status;
                    
                    return (
                      <div key={status} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm transition-all duration-300 ${
                            isCompleted
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                              : isCurrent
                              ? status === 'delivered'
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/50 animate-pulse-green'
                                : status === 'shipped'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse-blue'
                                : status === 'processing'
                                ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50 animate-pulse-yellow'
                                : 'bg-purple-500 text-white shadow-lg shadow-purple-500/50 animate-pulse-purple'
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                          }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <p className={`text-xs mt-2 text-center font-medium ${
                            isCompleted || isCurrent 
                              ? 'text-black dark:text-white' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </p>
                        </div>
                        {idx < 3 && (
                          <div className={`h-1 flex-1 mx-1 sm:mx-2 transition-all duration-300 ${
                            thisStatusIndex < currentStatusIndex
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Return Status in Timeline */}
            {returns.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Return / Exchange Status
                </h3>
                {returns.map((ret) => {
                  const statusConfig: Record<string, { bg: string; text: string; icon: string; msg: string }> = {
                    pending: {
                      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                      text: 'text-yellow-800 dark:text-yellow-200',
                      icon: '🕐',
                      msg: 'Return request submitted — under review by admin',
                    },
                    approved: {
                      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                      text: 'text-blue-800 dark:text-blue-200',
                      icon: '✅',
                      msg: 'Return approved! Pickup will be scheduled within 2 days',
                    },
                    rejected: {
                      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                      text: 'text-red-800 dark:text-red-200',
                      icon: '❌',
                      msg: `Return rejected${ret.admin_notes ? ': ' + ret.admin_notes : ' — contact support for details'}`,
                    },
                    refunded: {
                      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                      text: 'text-green-800 dark:text-green-200',
                      icon: '💰',
                      msg: 'Refund processed! Amount credited to your original payment method',
                    },
                    completed: {
                      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                      text: 'text-green-800 dark:text-green-200',
                      icon: '🔄',
                      msg: 'Exchange completed! New item has been shipped',
                    },
                  };
                  const cfg = statusConfig[ret.status] || statusConfig['pending'];
                  return (
                    <div key={ret.id} className={`rounded-lg border p-3 ${cfg.bg}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-xs font-semibold ${cfg.text}`}>
                          {cfg.icon} {ret.return_type === 'exchange' ? 'Exchange' : 'Return'} Request
                          <span className="ml-2 capitalize font-normal opacity-80">({ret.status})</span>
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {new Date(ret.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className={`text-xs ${cfg.text} opacity-90`}>{cfg.msg}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{ret.product_name}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detailed Tracking History */}
            {tracking.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Tracking History</h3>
                {tracking.map((track, index) => {
                  const isCompleted = index !== 0; // All previous steps are completed
                  const statusColor = track.status === 'cancelled' ? 'bg-red-500' :
                    isCompleted ? 'bg-green-500' : 
                    track.status === 'delivered' ? 'bg-green-500' :
                    track.status === 'shipped' ? 'bg-blue-500' :
                    track.status === 'processing' ? 'bg-yellow-500' :
                    track.status === 'pending' ? 'bg-purple-500' :
                    'bg-gray-500';
                  
                  return (
                    <div key={track.id} className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${statusColor} ${
                          index === 0 ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''
                        } ${
                          index === 0 && track.status === 'cancelled' ? 'ring-red-200 dark:ring-red-800' :
                          index === 0 && isCompleted ? 'ring-green-200 dark:ring-green-800' :
                          index === 0 && track.status === 'delivered' ? 'ring-green-200 dark:ring-green-800' :
                          index === 0 && track.status === 'shipped' ? 'ring-blue-200 dark:ring-blue-800' :
                          index === 0 && track.status === 'processing' ? 'ring-yellow-200 dark:ring-yellow-800' :
                          index === 0 ? 'ring-purple-200 dark:ring-purple-800' : ''
                        }`} />
                        {index !== tracking.length - 1 && (
                          <div className={`w-0.5 h-full mt-1 ${
                            track.status === 'cancelled' ? 'bg-red-500' :
                            isCompleted ? 'bg-green-500' : statusColor
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-3 sm:pb-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm sm:text-base">
                            {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
                          </p>
                          {index === 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              track.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              track.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              track.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              track.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              Current
                            </span>
                          )}
                        </div>
                        {track.location && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words mt-1">
                            📍 {track.location}
                          </p>
                        )}
                        {track.notes && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words mt-1">
                            💬 {track.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          🕐 {new Date(track.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary & Address */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span className="font-medium">-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-medium">₹{order.shipping_cost.toLocaleString()}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium">₹{order.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                <p className="font-medium capitalize text-sm">{order.payment_method || 'Online'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h2>
            <div className="text-sm space-y-2">
              <p className="font-medium text-base">{order.shipping_address.full_name}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.phone}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shipping_address.address_line1}
              </p>
              {order.shipping_address.address_line2 && (
                <p className="text-gray-600 dark:text-gray-400">
                  {order.shipping_address.address_line2}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                {order.shipping_address.city}, {order.shipping_address.state}{' '}
                {order.shipping_address.postal_code}
              </p>
            </div>
          </div>

          {/* Tracking Number Card */}
          {order.tracking_number && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-lg font-medium mb-3">Tracking Number</h2>
              <p className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-3 rounded-lg break-all border border-gray-200 dark:border-gray-600">
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
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
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
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
