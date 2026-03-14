import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, Truck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, Return } from '../../types';

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
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && orderId) fetchOrderDetails();
  }, [user, orderId]);

  useEffect(() => {
    const handleFocus = () => { if (user && orderId) fetchOrderDetails(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    if (!user || !orderId) return;
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders').select('*').eq('id', orderId).eq('user_id', user.id).single();
      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData } = await supabase
        .from('order_items').select('*').eq('order_id', orderId);
      setOrderItems(itemsData || []);

      const { data: trackingData } = await supabase
        .from('order_tracking').select('*').eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setTracking(trackingData || []);

      const { data: returnsData } = await supabase
        .from('returns').select('*').eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setReturns(returnsData || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getItemReturnBadge = (item: OrderItem) => {
    const r = returns.find(x =>
      x.product_id === item.product_id && x.size === item.size && x.color === item.color
    );
    if (!r) return null;
    const isExch = !r.return_type || r.return_type === 'exchange';
    const typeLabel = isExch ? 'Exchange' : 'Return';
    let label = '';
    let cls = '';
    if (r.status === 'pending') {
      label = `${typeLabel} Pending`;
      cls = isExch
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    } else if (r.status === 'approved') {
      label = `${typeLabel} Approved`;
      cls = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (r.status === 'completed') {
      label = 'Exchanged';
      cls = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (r.status === 'refunded') {
      label = 'Refunded';
      cls = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (r.status === 'rejected') {
      label = `${typeLabel} Rejected`;
      cls = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    return <span className={`text-xs px-2 py-1 rounded font-medium ${cls}`}>{label}</span>;
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

  // Header badge logic
  const latestReturn = returns[0];
  const headerReturnBadge = (() => {
    if (!latestReturn) return null;
    const isExchange = !latestReturn.return_type || latestReturn.return_type === 'exchange';
    const label =
      latestReturn.status === 'completed' ? 'Exchanged' :
      latestReturn.status === 'refunded' ? 'Refunded' :
      latestReturn.status === 'approved' ? (isExchange ? 'Exchange Approved' : 'Return Approved') :
      latestReturn.status === 'rejected' ? (isExchange ? 'Exchange Rejected' : 'Return Rejected') :
      isExchange ? '🔄 Exchange Initiated' : '↩ Return Initiated';
    const cls = isExchange
      ? latestReturn.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : latestReturn.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : latestReturn.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : latestReturn.status === 'refunded' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
  })();

  // Timeline steps
  const buildTimelineSteps = () => {
    const baseSteps = ['pending', 'processing', 'shipped', 'delivered'];
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const returnSteps: { label: string; status: string }[] = [];

    if (returns.length > 0) {
      const exchangeReturn = returns.find(r => !r.return_type || r.return_type === 'exchange');
      const refundReturn = returns.find(r => r.return_type === 'refund');
      const fallback = returns[0];

      if (exchangeReturn) {
        returnSteps.push({ label: 'Exchange Initiated', status: 'exchange_initiated' });
        if (exchangeReturn.status === 'pending') {
          returnSteps.push({ label: 'Under Review', status: 'return_processing' });
        } else if (exchangeReturn.status === 'approved' || exchangeReturn.status === 'completed') {
          returnSteps.push({ label: 'Exchange Approved', status: 'exchange_approved' });
          returnSteps.push({ label: 'Exchanged', status: 'exchange_completed' });
        } else if (exchangeReturn.status === 'rejected') {
          returnSteps.push({ label: 'Exchange Rejected', status: 'return_rejected' });
        }
      }

      if (refundReturn) {
        returnSteps.push({ label: 'Return Initiated', status: 'return_initiated' });
        if (refundReturn.status === 'pending') {
          returnSteps.push({ label: 'Under Review', status: 'return_processing' });
        } else if (refundReturn.status === 'approved' || refundReturn.status === 'refunded') {
          returnSteps.push({ label: 'Return Approved', status: 'return_approved' });
          returnSteps.push({ label: 'Refunded', status: 'return_completed' });
        } else if (refundReturn.status === 'rejected') {
          returnSteps.push({ label: 'Return Rejected', status: 'return_rejected' });
        }
      }

      if (!exchangeReturn && !refundReturn && fallback) {
        returnSteps.push({ label: 'Return Initiated', status: 'return_initiated' });
        if (fallback.status === 'pending') {
          returnSteps.push({ label: 'Under Review', status: 'return_processing' });
        } else if (['approved', 'completed', 'refunded'].includes(fallback.status)) {
          returnSteps.push({ label: 'Approved', status: 'return_approved' });
          returnSteps.push({ label: 'Completed', status: 'return_completed' });
        } else if (fallback.status === 'rejected') {
          returnSteps.push({ label: 'Rejected', status: 'return_rejected' });
        }
      }
    }

    const allSteps = [
      ...baseSteps.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), status: s })),
      ...returnSteps,
    ];

    return allSteps.map((step, idx) => {
      const isBase = idx < baseSteps.length;
      const isBaseCompleted = isBase && statusOrder.indexOf(step.status) < currentStatusIndex;
      const isBaseCurrent = isBase && order.status === step.status;

      let circleClass = 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400';
      let labelClass = 'text-gray-500 dark:text-gray-400';
      let lineClass = 'bg-gray-300 dark:bg-gray-600';
      let icon = String(idx + 1);

      if (isBaseCompleted) {
        circleClass = 'bg-green-500 text-white shadow-lg shadow-green-500/50';
        labelClass = 'text-black dark:text-white'; lineClass = 'bg-green-500'; icon = '✓';
      } else if (isBaseCurrent) {
        labelClass = 'text-black dark:text-white';
        if (step.status === 'delivered') { circleClass = 'bg-green-500 text-white shadow-lg shadow-green-500/50 animate-pulse-green'; lineClass = 'bg-green-500'; icon = '✓'; }
        else if (step.status === 'shipped') { circleClass = 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse-blue'; }
        else if (step.status === 'processing') { circleClass = 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50 animate-pulse-yellow'; }
        else { circleClass = 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'; }
      } else if (step.status === 'exchange_initiated') {
        circleClass = 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'; labelClass = 'text-blue-600 dark:text-blue-400'; lineClass = 'bg-blue-400'; icon = '🔄';
      } else if (step.status === 'return_initiated') {
        circleClass = 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'; labelClass = 'text-orange-600 dark:text-orange-400'; lineClass = 'bg-orange-400'; icon = '↩';
      } else if (step.status === 'return_processing') {
        circleClass = 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50 animate-pulse-yellow'; labelClass = 'text-yellow-600 dark:text-yellow-400'; lineClass = 'bg-gray-300 dark:bg-gray-600'; icon = '⏳';
      } else if (step.status === 'exchange_approved' || step.status === 'return_approved') {
        circleClass = 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'; labelClass = 'text-blue-600 dark:text-blue-400'; lineClass = 'bg-blue-400'; icon = '✓';
      } else if (step.status === 'return_rejected') {
        circleClass = 'bg-red-500 text-white shadow-lg shadow-red-500/50'; labelClass = 'text-red-600 dark:text-red-400'; lineClass = 'bg-red-400'; icon = '✕';
      } else if (step.status === 'exchange_completed') {
        circleClass = 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'; labelClass = 'text-blue-700 dark:text-blue-300'; lineClass = 'bg-blue-500'; icon = '✓';
      } else if (step.status === 'return_completed') {
        circleClass = 'bg-green-500 text-white shadow-lg shadow-green-500/50'; labelClass = 'text-green-600 dark:text-green-400'; lineClass = 'bg-green-500'; icon = '✓';
      }

      return (
        <div key={`${step.status}-${idx}`} className="flex items-start">
          <div className="flex flex-col items-center w-16 sm:w-20">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm transition-all duration-300 ${circleClass}`}>
              {icon}
            </div>
            <p className={`text-xs mt-2 text-center font-medium leading-tight ${labelClass}`}>{step.label}</p>
          </div>
          {idx < allSteps.length - 1 && (
            <div className={`h-1 w-8 sm:w-12 mt-4 sm:mt-5 transition-all duration-300 ${lineClass}`} />
          )}
        </div>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-light">Order #{order.order_number}</h1>
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} ${
                order.status === 'delivered' ? 'animate-pulse-green' :
                order.status === 'shipped' ? 'animate-pulse-blue' :
                order.status === 'processing' ? 'animate-pulse-yellow' : ''
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              {headerReturnBadge}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-black dark:text-white">₹{order.total.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{order.payment_method || 'Online Payment'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base line-clamp-2 mb-2">{item.product_name}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.size && <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">Size: {item.size}</span>}
                      {item.color && <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">Color: {item.color}</span>}
                      <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">Qty: {item.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-lg">₹{item.subtotal.toLocaleString()}</p>
                      {getItemReturnBadge(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Timeline
            </h2>
            <div className="mb-6 sm:mb-8 overflow-x-auto">
              <div className="flex items-start min-w-max">
                {order.status === 'cancelled' ? (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm bg-red-500 text-white shadow-lg shadow-red-500/50">✕</div>
                    <p className="text-xs mt-2 text-center font-medium text-red-600 dark:text-red-400">Cancelled</p>
                  </div>
                ) : buildTimelineSteps()}
              </div>
            </div>

            {/* Tracking History */}
            {tracking.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Tracking History</h3>
                {tracking.map((track, index) => {
                  const isCompleted = index !== 0;
                  const statusColor =
                    track.status === 'cancelled' ? 'bg-red-500' :
                    isCompleted ? 'bg-green-500' :
                    track.status === 'delivered' ? 'bg-green-500' :
                    track.status === 'shipped' ? 'bg-blue-500' :
                    track.status === 'processing' ? 'bg-yellow-500' :
                    track.status === 'pending' ? 'bg-purple-500' : 'bg-gray-500';
                  return (
                    <div key={track.id} className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${statusColor} ${index === 0 ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''} ${
                          index === 0 && track.status === 'cancelled' ? 'ring-red-200 dark:ring-red-800' :
                          index === 0 && (isCompleted || track.status === 'delivered') ? 'ring-green-200 dark:ring-green-800' :
                          index === 0 && track.status === 'shipped' ? 'ring-blue-200 dark:ring-blue-800' :
                          index === 0 && track.status === 'processing' ? 'ring-yellow-200 dark:ring-yellow-800' :
                          index === 0 ? 'ring-purple-200 dark:ring-purple-800' : ''
                        }`} />
                        {index !== tracking.length - 1 && (
                          <div className={`w-0.5 h-full mt-1 ${track.status === 'cancelled' ? 'bg-red-500' : isCompleted ? 'bg-green-500' : statusColor}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-3 sm:pb-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm sm:text-base">{track.status.charAt(0).toUpperCase() + track.status.slice(1)}</p>
                          {index === 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              track.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              track.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              track.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              track.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>Current</span>
                          )}
                        </div>
                        {track.location && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words mt-1">📍 {track.location}</p>}
                        {track.notes && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words mt-1">💬 {track.notes}</p>}
                        <p className="text-xs text-gray-500 mt-1.5">
                          🕐 {new Date(track.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
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

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h2>
            <div className="text-sm space-y-2">
              <p className="font-medium text-base">{order.shipping_address.full_name}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.phone}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.address_line2}</p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
              </p>
            </div>
          </div>

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
    </div>
  );
}
