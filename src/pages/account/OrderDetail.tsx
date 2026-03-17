import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, Truck, ArrowLeft, CheckCircle, Clock, XCircle, RefreshCw, RotateCcw } from 'lucide-react';
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

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtFull = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
        .order('created_at', { ascending: true });
      setTracking(trackingData || []);

      const { data: returnsData } = await supabase
        .from('returns').select('*').eq('order_id', orderId)
        .order('created_at', { ascending: true });
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
      cls = isExch ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    } else if (r.status === 'approved') {
      label = `${typeLabel} Approved`; cls = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (r.status === 'completed') {
      label = 'Exchanged'; cls = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (r.status === 'refunded') {
      label = 'Refunded'; cls = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (r.status === 'rejected') {
      label = `${typeLabel} Rejected`; cls = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    return <span className={`text-xs px-2 py-1 rounded font-medium ${cls}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin" />
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

  // Header return badge
  const latestReturn = [...returns].reverse()[0];
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

  // Get date for a base status from tracking history
  const getTrackingDate = (status: string): string | null => {
    const t = tracking.find(t => t.status === status);
    return t ? t.created_at : null;
  };

  // Delivery date: from tracking or order.updated_at when delivered
  const deliveryDate = order.status === 'delivered'
    ? (getTrackingDate('delivered') || order.updated_at)
    : null;

  // Build vertical timeline steps
  interface TimelineStep {
    key: string;
    label: string;
    sublabel?: string;
    date?: string | null;
    state: 'done' | 'active' | 'pending' | 'error' | 'info';
    icon?: React.ReactNode;
  }

  const buildTimeline = (): TimelineStep[] => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(order.status);

    if (order.status === 'cancelled') {
      return [
        { key: 'placed', label: 'Order Placed', date: order.created_at, state: 'done' },
        { key: 'cancelled', label: 'Order Cancelled', date: order.updated_at, state: 'error' },
      ];
    }

    const baseSteps: TimelineStep[] = [
      {
        key: 'pending',
        label: 'Order Placed',
        sublabel: 'We received your order',
        date: order.created_at,
        state: currentIdx >= 0 ? 'done' : 'pending',
      },
      {
        key: 'processing',
        label: 'Processing',
        sublabel: 'Your order is being prepared',
        date: getTrackingDate('processing'),
        state: currentIdx > 1 ? 'done' : currentIdx === 1 ? 'active' : 'pending',
      },
      {
        key: 'shipped',
        label: 'Shipped',
        sublabel: order.tracking_number ? `Tracking: ${order.tracking_number}` : 'On the way to you',
        date: getTrackingDate('shipped'),
        state: currentIdx > 2 ? 'done' : currentIdx === 2 ? 'active' : 'pending',
      },
      {
        key: 'delivered',
        label: 'Delivered',
        sublabel: deliveryDate ? `Delivered on ${fmt(deliveryDate)}` : 'Delivered to your address',
        date: deliveryDate,
        state: currentIdx === 3 ? 'done' : 'pending',
      },
    ];

    // Return/exchange steps
    const returnSteps: TimelineStep[] = [];
    const exchangeReturn = returns.find(r => !r.return_type || r.return_type === 'exchange');
    const refundReturn = returns.find(r => r.return_type === 'refund');

    if (exchangeReturn) {
      returnSteps.push({
        key: 'exchange_initiated',
        label: 'Exchange Requested',
        sublabel: `Reason: ${exchangeReturn.reason.replace(/_/g, ' ')}`,
        date: exchangeReturn.created_at,
        state: 'info',
        icon: <RefreshCw className="w-4 h-4" />,
      });
      if (exchangeReturn.status === 'pending') {
        returnSteps.push({ key: 'exchange_review', label: 'Under Review', sublabel: 'Admin is reviewing your request', state: 'active', icon: <Clock className="w-4 h-4" /> });
      } else if (exchangeReturn.status === 'approved' || exchangeReturn.status === 'completed') {
        returnSteps.push({ key: 'exchange_approved', label: 'Exchange Approved', date: exchangeReturn.updated_at, state: 'info', icon: <CheckCircle className="w-4 h-4" /> });
        if (exchangeReturn.status === 'completed') {
          returnSteps.push({ key: 'exchange_done', label: 'Exchange Completed', sublabel: 'New item has been shipped', date: exchangeReturn.updated_at, state: 'done', icon: <CheckCircle className="w-4 h-4" /> });
        }
      } else if (exchangeReturn.status === 'rejected') {
        returnSteps.push({ key: 'exchange_rejected', label: 'Exchange Rejected', sublabel: exchangeReturn.admin_notes || undefined, date: exchangeReturn.updated_at, state: 'error', icon: <XCircle className="w-4 h-4" /> });
      }
    }

    if (refundReturn) {
      returnSteps.push({
        key: 'return_initiated',
        label: 'Return Requested',
        sublabel: `Reason: ${refundReturn.reason.replace(/_/g, ' ')}`,
        date: refundReturn.created_at,
        state: 'info',
        icon: <RotateCcw className="w-4 h-4" />,
      });
      if (refundReturn.status === 'pending') {
        returnSteps.push({ key: 'return_review', label: 'Under Review', sublabel: 'Admin is reviewing your request', state: 'active', icon: <Clock className="w-4 h-4" /> });
      } else if (refundReturn.status === 'approved' || refundReturn.status === 'refunded') {
        returnSteps.push({ key: 'return_approved', label: 'Return Approved', date: refundReturn.updated_at, state: 'info', icon: <CheckCircle className="w-4 h-4" /> });
        if (refundReturn.status === 'refunded') {
          returnSteps.push({ key: 'refunded', label: 'Refund Completed', sublabel: 'Amount credited to your account', date: refundReturn.updated_at, state: 'done', icon: <CheckCircle className="w-4 h-4" /> });
        }
      } else if (refundReturn.status === 'rejected') {
        returnSteps.push({ key: 'return_rejected', label: 'Return Rejected', sublabel: refundReturn.admin_notes || undefined, date: refundReturn.updated_at, state: 'error', icon: <XCircle className="w-4 h-4" /> });
      }
    }

    return [...baseSteps, ...returnSteps];
  };

  const timelineSteps = buildTimeline();

  const stepColors: Record<TimelineStep['state'], { dot: string; line: string; label: string; date: string }> = {
    done:    { dot: 'bg-green-500 text-white shadow-green-500/40 shadow-md', line: 'bg-green-400', label: 'text-gray-900 dark:text-white font-medium', date: 'text-gray-500 dark:text-gray-400' },
    active:  { dot: 'bg-blue-500 text-white shadow-blue-500/40 shadow-md ring-4 ring-blue-100 dark:ring-blue-900', line: 'bg-gray-200 dark:bg-gray-700', label: 'text-blue-600 dark:text-blue-400 font-semibold', date: 'text-blue-500 dark:text-blue-400' },
    pending: { dot: 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500', line: 'bg-gray-200 dark:bg-gray-700', label: 'text-gray-400 dark:text-gray-500', date: 'text-gray-400 dark:text-gray-500' },
    error:   { dot: 'bg-red-500 text-white shadow-red-500/40 shadow-md', line: 'bg-red-300 dark:bg-red-800', label: 'text-red-600 dark:text-red-400 font-medium', date: 'text-gray-500 dark:text-gray-400' },
    info:    { dot: 'bg-blue-500 text-white shadow-blue-500/40 shadow-md', line: 'bg-blue-300 dark:bg-blue-800', label: 'text-blue-700 dark:text-blue-300 font-medium', date: 'text-gray-500 dark:text-gray-400' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Placed on {fmtFull(order.created_at)}
            </p>
            {deliveryDate && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                ✓ Delivered on {fmt(deliveryDate)}
              </p>
            )}
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

          {/* Order Timeline — vertical */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Timeline
            </h2>
            <div className="space-y-0">
              {timelineSteps.map((step, idx) => {
                const colors = stepColors[step.state];
                const isLast = idx === timelineSteps.length - 1;
                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Left: dot + line */}
                    <div className="flex flex-col items-center flex-shrink-0 w-8">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${colors.dot}`}>
                        {step.icon ?? (
                          step.state === 'done' ? <CheckCircle className="w-4 h-4" /> :
                          step.state === 'error' ? <XCircle className="w-4 h-4" /> :
                          step.state === 'active' ? <Clock className="w-4 h-4" /> :
                          <span className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      {!isLast && <div className={`w-0.5 flex-1 min-h-[2rem] mt-1 ${colors.line}`} />}
                    </div>

                    {/* Right: content */}
                    <div className={`pb-6 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className={`text-sm ${colors.label}`}>{step.label}</p>
                        {step.date && (
                          <p className={`text-xs ${colors.date} sm:text-right`}>{fmtFull(step.date)}</p>
                        )}
                      </div>
                      {step.sublabel && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.sublabel}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tracking details (location/notes from admin) */}
            {tracking.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Tracking Updates</h3>
                <div className="space-y-3">
                  {[...tracking].reverse().map((track, index) => {
                    const dotColor =
                      track.status === 'cancelled' ? 'bg-red-500' :
                      track.status === 'delivered' ? 'bg-green-500' :
                      track.status === 'shipped' ? 'bg-blue-500' :
                      track.status === 'processing' ? 'bg-yellow-500' : 'bg-purple-500';
                    const isFirst = index === 0;
                    return (
                      <div key={track.id} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full mt-0.5 ${dotColor} ${isFirst ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-opacity-30 ' + dotColor.replace('bg-', 'ring-') : ''}`} />
                          {index !== tracking.length - 1 && <div className="w-0.5 flex-1 min-h-[1.5rem] mt-1 bg-gray-200 dark:bg-gray-700" />}
                        </div>
                        <div className="flex-1 pb-3 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-medium">{track.status.charAt(0).toUpperCase() + track.status.slice(1)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{fmtFull(track.created_at)}</p>
                          </div>
                          {track.location && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📍 {track.location}</p>}
                          {track.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">💬 {track.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
              <p className="font-medium capitalize text-sm">{order.payment_method || 'Online'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h2>
            <div className="text-sm space-y-1.5">
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

          {/* Returns/Exchanges summary */}
          {returns.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Return / Exchange
              </h2>
              <div className="space-y-3">
                {returns.map((r) => {
                  const isExch = !r.return_type || r.return_type === 'exchange';
                  const statusCls =
                    r.status === 'approved' || r.status === 'completed' || r.status === 'refunded'
                      ? 'text-green-600 dark:text-green-400'
                      : r.status === 'rejected' ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400';
                  return (
                    <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-sm space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{isExch ? '🔄 Exchange' : '↩ Return'}</span>
                        <span className={`text-xs font-medium capitalize ${statusCls}`}>{r.status}</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Requested {fmt(r.created_at)}</p>
                      {r.admin_notes && <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{r.admin_notes}"</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
