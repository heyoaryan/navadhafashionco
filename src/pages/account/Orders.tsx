import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Loader2, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const getOrderCount = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const canReturnOrder = (order: Order) => {
    if (order.status !== 'delivered') return false;
    
    // Check if delivered within last 5 days
    const deliveredDate = new Date(order.updated_at || order.created_at);
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceDelivery <= 5;
  };

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
    
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Refresh orders
      fetchOrders();
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const getStatusMessage = (order: Order) => {
    switch (order.status) {
      case 'processing':
        return canCancelOrder(order) 
          ? 'Order is being processed (Can cancel within 30 min)'
          : 'Order is being processed';
      case 'shipped':
        return 'Order has been shipped and is on the way';
      case 'delivered':
        return canReturnOrder(order)
          ? 'Order delivered (Return/Exchange available for 5 days)'
          : 'Order delivered';
      case 'cancelled':
        return 'Order was cancelled';
      default:
        return 'Order status unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'processing'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Processing ({getOrderCount('processing')})
            </button>
            <button
              onClick={() => setStatusFilter('shipped')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'shipped'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Shipped ({getOrderCount('shipped')})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'delivered'
                  ? 'bg-green-500 text-white'
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
              className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-1">Order #{order.order_number}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusMessage(order)}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-end ${getStatusColor(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  
                  {/* Status-specific badges */}
                  {canReturnOrder(order) && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-xs font-medium self-start sm:self-end">
                      Return Available (5 days)
                    </span>
                  )}
                  {canCancelOrder(order) && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-medium self-start sm:self-end">
                      Can Cancel (30 min)
                    </span>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-black dark:text-white text-lg">
                    ₹{order.total.toLocaleString()}
                  </span>
                  <span className="ml-2 capitalize">• {order.payment_status}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {canCancelOrder(order) && (
                    <button
                      onClick={(e) => handleCancelOrder(order.id, e)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Cancel Order
                    </button>
                  )}
                  
                  {canReturnOrder(order) && (
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Return/Exchange
                    </Link>
                  )}
                  
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400 font-medium hover:underline"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}