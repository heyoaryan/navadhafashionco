import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, TrendingUp, IndianRupee, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../../components/LoadingState';

interface Stats {
  todaySales: number;
  todayOrders: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  activeCoupons: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    todayOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    activeCoupons: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's orders
      const { data: todayOrdersData } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', today.toISOString());

      const todaySales = todayOrdersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const todayOrders = todayOrdersData?.length || 0;

      // Total stats
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { data: allOrders } = await supabase
        .from('orders')
        .select('total');

      const totalRevenue = allOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      const { count: couponsCount } = await supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        todaySales,
        todayOrders,
        totalRevenue,
        totalOrders: ordersCount || 0,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
        activeCoupons: couponsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent orders:', error);
        return;
      }

      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
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
    return <LoadingState type="page" message="Loading Dashboard..." variant="spinner" />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2 text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600 dark:text-rose-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Today</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">₹{stats.todaySales.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sales Today</p>
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Today</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.todayOrders}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Orders Today</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalOrders}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalProducts}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Products</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalCustomers}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Customers</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/products/new"
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ShoppingBag className="w-8 h-8 mb-3 text-rose-500" />
          <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">Add Product</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create new product</p>
        </Link>

        <Link
          to="/admin/products"
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Package className="w-8 h-8 mb-3 text-blue-500" />
          <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">Products</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage inventory</p>
        </Link>

        <Link
          to="/admin/orders"
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Package className="w-8 h-8 mb-3 text-purple-500" />
          <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">Orders</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View all orders</p>
        </Link>

        <Link
          to="/admin/coupons"
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Tag className="w-8 h-8 mb-3 text-green-500" />
          <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">Coupons</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stats.activeCoupons} active</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-rose-500 hover:text-rose-600">
            View all
          </Link>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="block p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">#{order.order_number}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">₹{order.total.toLocaleString()}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
