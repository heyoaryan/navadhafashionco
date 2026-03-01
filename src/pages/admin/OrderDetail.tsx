import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string;
  product_name: string;
  product_image: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  shipping_address: any;
  order_items: OrderItem[];
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      console.log('Fetching order with ID:', orderId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .eq('id', orderId)
        .single();

      console.log('Order data:', data);
      console.log('Order error:', error);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setOrder(data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      showToast(error?.message || 'Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      
      setOrder({ ...order, status: newStatus });
      showToast('Order status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (newStatus: string) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      
      setOrder({ ...order, payment_status: newStatus });
      showToast('Payment status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Failed to update payment status', 'error');
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-medium mb-2">Order not found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unable to load order details. Please check if you have admin access.
        </p>
        <button
          onClick={() => navigate('/admin/orders')}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-wider text-gray-900 dark:text-gray-100">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(order.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.product_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Size: {item.size}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">₹{item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h2>
            <div className="space-y-2">
              <p className="text-gray-900 dark:text-gray-100">{order.profiles.full_name}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.profiles.email}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.profiles.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h2>
            <div className="text-gray-600 dark:text-gray-400">
              <p>{order.shipping_address.street}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
              <p>{order.shipping_address.pincode}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Status
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Payment Status</label>
                <select
                  value={order.payment_status}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </span>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method || 'COD'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
