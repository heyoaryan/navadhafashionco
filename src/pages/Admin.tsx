import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
  }, [profile, navigate]);

  const fetchStats = async () => {
    try {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { data: orders } = await supabase
        .from('orders')
        .select('total');

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      setStats({
        totalOrders: ordersCount || 0,
        totalRevenue,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-light tracking-wider mb-8">Admin Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-light mb-1">{stats.totalOrders}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-light mb-1">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-light mb-1">{stats.totalProducts}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-light mb-1">{stats.totalCustomers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
        >
          <ShoppingBag className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-medium mb-1">Manage Products</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, or remove products</p>
        </button>

        <button
          onClick={() => navigate('/admin/orders')}
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
        >
          <Package className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-medium mb-1">Manage Orders</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and update order status</p>
        </button>

        <button
          onClick={() => navigate('/admin/customers')}
          className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
        >
          <Users className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-medium mb-1">Customers</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View customer information</p>
        </button>
      </div>
    </div>
  );
}
