import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import LoadingState from '../../components/LoadingState';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
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
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items (*), profiles (full_name, email, phone)')
        .eq('id', orderId)
        .single();
      if (error) throw error;
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
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      setOrder({ ...order, status: newStatus });
      showToast('Order status updated successfully', 'success');
    } catch {
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', order.id);
      if (error) throw error;
      setOrder({ ...order, payment_status: newStatus });
      showToast('Payment status updated successfully', 'success');
    } catch {
      showToast('Failed to update payment status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) return <LoadingState type="page" message="Loading Order Details..." variant="spinner" />;

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">Order not found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to load order details.</p>
        <button onClick={() => navigate('/admin/orders')} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-wider text-gray-900 dark:text-gray-100">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(order.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">{item.product_name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.size && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                          Color: {item.color}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">&#8377;{item.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>&#8377;{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Customer Information
            </h2>
            <div className="space-y-1.5">
              <p className="font-medium text-gray-900 dark:text-gray-100">{order.profiles.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{order.profiles.email}</p>
              {order.profiles.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{order.profiles.phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Shipping Address
            </h2>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p>{order.shipping_address.street}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
              <p>{order.shipping_address.pincode}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Truck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Order Status
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-60 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Payment
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Payment Status
                </label>
                <select
                  value={order.payment_status}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-60 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </span>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Payment Method
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {order.payment_method || 'COD'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
