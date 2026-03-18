import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, RotateCcw, X, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order, Return } from '../../types';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { useToast } from '../../contexts/ToastContext';

export default function Orders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('defective');
  const [returnDetails, setReturnDetails] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (showCancelModal || showReturnModal) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [showCancelModal, showReturnModal]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allOrders: Order[] = data || [];

      // Auto-cancel stuck pending orders (payment not completed)
      const pendingOrders = allOrders.filter(o => o.status === 'pending');
      if (pendingOrders.length > 0) {
        await Promise.all(
          pendingOrders.map(o => {
            const cancelNote = o.payment_method === 'online'
              ? 'Order cancelled due to incomplete payment. If amount was debited, it will be refunded within 5-7 business days.'
              : 'Order cancelled due to incomplete checkout.';
            // Preserve bespoke notes
            let finalNote = cancelNote;
            try {
              const parsed = o.notes ? JSON.parse(o.notes) : null;
              if (parsed?.type === 'bespoke') {
                finalNote = JSON.stringify({ ...parsed, cancelReason: cancelNote });
              }
            } catch {}
            return supabase.from('orders').update({ status: 'cancelled', notes: finalNote }).eq('id', o.id);
          })
        );
        // Re-fetch after update
        const { data: refreshed } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setOrders(refreshed || []);
      } else {
        setOrders(allOrders);
      }

      // Fetch returns for all orders
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (returnsError) throw returnsError;
      setReturns(returnsData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
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


  const getOrderReturns = (orderId: string) => {
    return returns.filter(r => r.order_id === orderId);
  };

  const isBespokeOrder = (order: Order) => {
    try {
      const parsed = order.notes ? JSON.parse(order.notes) : null;
      return parsed?.type === 'bespoke';
    } catch { return false; }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'bespoke') return isBespokeOrder(order);
    return order.status === statusFilter;
  });

  const getOrderCount = (status: string) => {
    if (status === 'all') return orders.length;
    if (status === 'bespoke') return orders.filter(isBespokeOrder).length;
    return orders.filter(o => o.status === status).length;
  };

  // Returns the type of next action: 'exchange' (1st time), 'refund' (2nd time), or null
  const getNextReturnAction = (order: Order): 'exchange' | 'refund' | null => {
    if (order.status !== 'delivered') return null;

    const deliveredDate = new Date(order.updated_at || order.created_at);
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 5) return null;

    const orderReturns = getOrderReturns(order.id);

    // No returns yet → show Exchange
    if (orderReturns.length === 0) return 'exchange';

    // Has an exchange request that was approved/completed → show Return (refund)
    const hasApprovedExchange = orderReturns.some(
      r => (!r.return_type || r.return_type === 'exchange') && (r.status === 'approved' || r.status === 'completed')
    );
    // Already has a refund request pending/approved → nothing more
    const hasRefundRequest = orderReturns.some(r => r.return_type === 'refund');

    if (hasApprovedExchange && !hasRefundRequest) return 'refund';

    return null;
  };

  const canReturnOrder = (order: Order) => getNextReturnAction(order) !== null;

  const canCancelOrder = (order: Order) => {
    if (order.status !== 'processing') return false;
    
    // Check if order placed within last 30 minutes
    const orderDate = new Date(order.created_at);
    const minutesSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60));
    
    return minutesSinceOrder <= 30;
  };

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Refresh orders
      await fetchOrders();
      setShowCancelModal(false);
      setSelectedOrder(null);
      showToast('Order cancelled successfully. Refund will be processed within 5-7 business days.', 'success');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order. Please try again.', 'error');
    } finally {
      setCancelling(false);
    }
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
    if (!selectedOrder || !user) return;
    
    if (!returnDetails.trim()) {
      showToast('Please provide return details', 'error');
      return;
    }
    
    const returnType = getNextReturnAction(selectedOrder);
    if (!returnType) return;

    setSubmittingReturn(true);
    try {
      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrder.id);

      if (itemsError) throw itemsError;

      // Find previous exchange return id if this is a refund
      const orderReturns = getOrderReturns(selectedOrder.id);
      const previousReturn = returnType === 'refund'
        ? orderReturns.find(r => r.return_type === 'exchange' && (r.status === 'approved' || r.status === 'completed'))
        : null;

      // Create return for all items in the order
      for (const item of (orderItems || [])) {
        const { error: insertError } = await supabase.from('returns').insert({
          order_id: selectedOrder.id,
          order_item_id: item.id,
          user_id: user.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          reason: returnReason,
          reason_details: returnDetails,
          refund_amount: item.subtotal,
          images: returnImages,
          return_type: returnType,
          previous_return_id: previousReturn?.id || null,
          status: 'pending'
        });
        if (insertError) {
          console.error('[RETURN INSERT ERROR]', insertError);
          throw insertError;
        }
      }
      
      showToast(
        returnType === 'exchange'
          ? 'Exchange request submitted! Admin will review shortly.'
          : 'Return & refund request submitted! Admin will review shortly.',
        'success'
      );
      setShowReturnModal(false);
      setSelectedOrder(null);
      setReturnReason('defective');
      setReturnDetails('');
      setReturnImages([]);
      fetchOrders();
    } catch (error) {
      console.error('Error submitting return:', error);
      showToast('Failed to submit request', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getStatusMessage = (order: Order) => {
    const orderReturns = getOrderReturns(order.id);
    if (orderReturns.length > 0) {
      const latestReturn = orderReturns[0];
      const isExchange = !latestReturn.return_type || latestReturn.return_type === 'exchange';
      if (isExchange) {
        if (latestReturn.status === 'pending') return 'Exchange request under admin review';
        if (latestReturn.status === 'approved') return 'Exchange approved! Pickup will be scheduled';
        if (latestReturn.status === 'completed') return 'Exchange completed! New item shipped';
        if (latestReturn.status === 'rejected') return 'Exchange rejected. You may request a return';
      } else {
        if (latestReturn.status === 'pending') return 'Return & refund request under admin review';
        if (latestReturn.status === 'approved') return 'Return approved! Refund will be processed';
        if (latestReturn.status === 'refunded') return 'Refund completed! Amount credited';
        if (latestReturn.status === 'rejected') return 'Return rejected. Contact support for help';
      }
    }
    switch (order.status) {
      case 'processing':
        return canCancelOrder(order) 
          ? 'Order is being processed (Can cancel within 30 min)'
          : 'Order is being processed';
      case 'shipped':
        return 'Order has been shipped and is on the way';
      case 'delivered':
        return getNextReturnAction(order)
          ? `Order delivered (${getNextReturnAction(order) === 'exchange' ? 'Exchange' : 'Return'} available for 5 days)`
          : 'Order delivered';
      case 'pending':
        return 'Order placed, awaiting confirmation';
      case 'cancelled':
        return order.notes?.includes('debited')
          ? 'Order cancelled. If amount was debited, refund in 5-7 business days.'
          : order.notes?.includes('incomplete payment')
          ? 'Order cancelled due to incomplete payment.'
          : 'Order was cancelled';
      default:
        return 'Order placed successfully';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-light mb-6 sm:mb-8">My Orders</h1>

      {/* Status Filter Tabs */}
      {orders.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All ({getOrderCount('all')})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                statusFilter === 'processing'
                  ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50 animate-pulse-yellow'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Processing ({getOrderCount('processing')})
            </button>
            <button
              onClick={() => setStatusFilter('shipped')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                statusFilter === 'shipped'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse-blue'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Shipped ({getOrderCount('shipped')})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                statusFilter === 'delivered'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/50 animate-pulse-green'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Delivered ({getOrderCount('delivered')})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Cancelled ({getOrderCount('cancelled')})
            </button>
            {getOrderCount('bespoke') > 0 && (
              <button
                onClick={() => setStatusFilter('bespoke')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'bespoke'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ✂ Bespoke ({getOrderCount('bespoke')})
              </button>
            )}
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't placed any orders yet</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No orders found with this status</p>
          <button
            onClick={() => setStatusFilter('all')}
            className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            View All Orders
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-medium text-lg">Order #{order.order_number}</h3>
                    {(() => {
                      try {
                        const parsed = order.notes ? JSON.parse(order.notes) : null;
                        if (parsed?.type === 'bespoke') return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                            ✂ Bespoke
                          </span>
                        );
                      } catch {}
                      return null;
                    })()}
                    {(() => {
                      const orderReturns = getOrderReturns(order.id);
                      const latestReturn = orderReturns[0];
                      if (latestReturn) {
                        // null/undefined return_type → treat as exchange (1st return)
                        const isExchange = !latestReturn.return_type || latestReturn.return_type === 'exchange';
                        const statusLabel = latestReturn.status === 'completed' ? 'Exchanged'
                          : latestReturn.status === 'refunded' ? 'Refunded'
                          : latestReturn.status === 'approved' ? (isExchange ? 'Exchange Approved' : 'Return Approved')
                          : latestReturn.status === 'rejected' ? (isExchange ? 'Exchange Rejected' : 'Return Rejected')
                          : isExchange ? '🔄 Exchange Initiated' : '↩ Return Initiated';
                        const cls = isExchange
                          ? latestReturn.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : latestReturn.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : latestReturn.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : latestReturn.status === 'refunded' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
                            {statusLabel}
                          </span>
                        );
                      }
                      return (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${getStatusColor(order.status)} ${
                            order.status === 'delivered' ? 'animate-pulse-green' :
                            order.status === 'shipped' ? 'animate-pulse-blue' :
                            order.status === 'processing' ? 'animate-pulse-yellow' : ''
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {order.status === 'delivered' && (
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1 font-medium">
                      ✓ Delivered on {new Date(order.updated_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusMessage(order)}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="text-right">
                    <p className="font-semibold text-xl text-black dark:text-white">
                      ₹{order.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {order.payment_status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status-specific Info Badges */}
              {(canReturnOrder(order) || canCancelOrder(order)) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {canReturnOrder(order) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-medium">
                      <RotateCcw className="w-3 h-3" />
                      {getNextReturnAction(order) === 'exchange' ? 'Exchange Available (5 days)' : 'Return Available (5 days)'}
                    </span>
                  )}
                  {canCancelOrder(order) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium">
                      <X className="w-3 h-3" />
                      Can be cancelled (30 min window)
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to={`/account/orders/${order.id}`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
                
                {canReturnOrder(order) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setShowReturnModal(true);
                    }}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg transition-colors font-medium text-sm ${
                      getNextReturnAction(order) === 'exchange'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {getNextReturnAction(order) === 'exchange' ? 'Request Exchange' : 'Request Return'}
                  </button>
                )}
                
                {canCancelOrder(order) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setShowCancelModal(true);
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Return/Exchange compact badges */}
              {getOrderReturns(order.id).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {getOrderReturns(order.id).map((returnItem) => {
                    const isExch = !returnItem.return_type || returnItem.return_type === 'exchange';
                    const typeIcon = isExch ? '🔄' : '↩';
                    const typeLabel = isExch ? 'Exchange' : 'Return';
                    const statusLabel =
                      returnItem.status === 'completed' ? 'Completed' :
                      returnItem.status === 'refunded' ? 'Refunded' :
                      returnItem.status === 'approved' ? 'Approved' :
                      returnItem.status === 'rejected' ? 'Rejected' : 'Pending';
                    const cls =
                      returnItem.status === 'completed' || returnItem.status === 'refunded'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                        : returnItem.status === 'approved'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                        : returnItem.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
                    return (
                      <span
                        key={returnItem.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}
                      >
                        {typeIcon} {typeLabel} · {statusLabel}
                        {returnItem.status === 'refunded' && (returnItem.refund_amount ?? 0) > 0 && (
                          <span className="font-semibold"> · ₹{(returnItem.refund_amount ?? 0).toLocaleString()}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 animate-fade-in-fast">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">Cancel Order</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-3">Order Details:</p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Order Number:</span>
                    <span className="font-medium text-black dark:text-white">#{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium text-black dark:text-white">₹{selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-medium text-black dark:text-white capitalize">{selectedOrder.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium text-black dark:text-white capitalize">
                      {selectedOrder.payment_method || 'Online'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  💰 Refund Information
                </p>
                {selectedOrder.payment_method === 'cod' ? (
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Since you selected Cash on Delivery, no refund is needed. Your order will be cancelled immediately.
                  </p>
                ) : (
                  <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <p>✓ Your payment was made online</p>
                    <p>✓ Full refund of ₹{selectedOrder.total.toLocaleString()} will be processed</p>
                    <p>✓ Amount will be credited to your original payment method</p>
                    <p>✓ Refund timeline: 5-7 business days</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                }}
                disabled={cancelling}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={(e) => handleCancelOrder(selectedOrder.id, e)}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Yes, Cancel Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return/Exchange Modal */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-medium">
                  {getNextReturnAction(selectedOrder) === 'exchange' ? '🔄 Request Exchange' : '↩ Request Return & Refund'}
                </h2>
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedOrder(null);
                    setReturnReason('defective');
                    setReturnDetails('');
                    setReturnImages([]);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exchange vs Refund Info */}
              {getNextReturnAction(selectedOrder) === 'exchange' ? (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">🔄 This is an Exchange Request (1st Return)</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    You will receive the same product or a different size/color. No money refund at this stage.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    If exchange doesn't work out, you can request a full refund after exchange is completed.
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">💰 This is a Return & Refund Request (2nd Return)</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Your exchange was already processed. Amount will be refunded to your original payment method after admin approval.
                  </p>
                </div>
              )}

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ Admin approval required. You will be notified once reviewed.
                </p>
              </div>

              {/* Order Info */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium mb-1">Order #{selectedOrder.order_number}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total: ₹{selectedOrder.total.toLocaleString()}</p>
              </div>

              {/* Return Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
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
                    <div className="flex gap-2">
                      {/* Camera Option */}
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Package className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-[10px] text-gray-500">Camera</span>
                          </>
                        )}
                      </label>
                      
                      {/* Gallery Option */}
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-[10px] text-gray-500">Gallery</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">📸 Click photo or upload from gallery</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedOrder(null);
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
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    getNextReturnAction(selectedOrder) === 'exchange'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {submittingReturn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      {getNextReturnAction(selectedOrder) === 'exchange' ? 'Submit Exchange Request' : 'Submit Return Request'}
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