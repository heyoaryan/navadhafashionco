import { useEffect, useState } from 'react';
import { MousePointerClick, Users, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../../components/LoadingState';

interface AnalyticsStats {
  totalProductClicks: number;
  todayProductClicks: number;
  totalSignups: number;
  todaySignups: number;
  totalOrders: number;
  conversionRate: string;
}

interface PopularProduct {
  product_id: string;
  product_name: string;
  click_count: number;
  product_image: string;
}

interface TopOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalProductClicks: 0,
    todayProductClicks: 0,
    totalSignups: 0,
    todaySignups: 0,
    totalOrders: 0,
    conversionRate: '0.00',
  });
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [topOrders, setTopOrders] = useState<TopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'today': { const d = new Date(now); d.setHours(0,0,0,0); return d.toISOString(); }
      case 'week': { const d = new Date(now); d.setDate(d.getDate()-7); return d.toISOString(); }
      case 'month': { const d = new Date(now); d.setMonth(d.getMonth()-1); return d.toISOString(); }
      default: return null;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const dateFilter = getDateFilter();

      const [
        { count: totalProductClicks },
        { count: todayProductClicks },
        { count: totalSignups },
        { count: todaySignups },
        { count: totalOrders },
      ] = await Promise.all([
        supabase.from('product_clicks').select('*', { count: 'exact', head: true }),
        supabase.from('product_clicks').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('signup_tracking').select('*', { count: 'exact', head: true }),
        supabase.from('signup_tracking').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
      ]);

      const clicks = timeRange === 'today' ? (todayProductClicks || 0) : (totalProductClicks || 0);
      const orders = totalOrders || 0;
      const conversionRate = clicks > 0 ? ((orders / clicks) * 100).toFixed(2) : '0.00';

      setStats({
        totalProductClicks: totalProductClicks || 0,
        todayProductClicks: todayProductClicks || 0,
        totalSignups: totalSignups || 0,
        todaySignups: todaySignups || 0,
        totalOrders: orders,
        conversionRate,
      });

      // Popular products
      let productQuery = supabase.from('product_clicks').select('product_id, products(name, main_image_url)');
      if (dateFilter) productQuery = productQuery.gte('created_at', dateFilter);
      const { data: productClicksData } = await productQuery;

      if (productClicksData) {
        const counts = productClicksData.reduce((acc: any, click: any) => {
          const id = click.product_id;
          if (!acc[id]) acc[id] = { product_id: id, product_name: click.products?.name || 'Unknown', product_image: click.products?.main_image_url || '', click_count: 0 };
          acc[id].click_count++;
          return acc;
        }, {});
        setPopularProducts(Object.values(counts).sort((a: any, b: any) => b.click_count - a.click_count).slice(0, 10) as PopularProduct[]);
      }

      // Top orders by value
      let ordersQuery = supabase.from('orders').select('id, order_number, total, status, created_at').neq('status', 'cancelled').order('total', { ascending: false }).limit(8);
      if (dateFilter) ordersQuery = ordersQuery.gte('created_at', dateFilter);
      const { data: ordersData } = await ordersQuery;
      setTopOrders(ordersData || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const rangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? '7 Days' : timeRange === 'month' ? '30 Days' : 'Total';
  const currentClicks = timeRange === 'today' ? stats.todayProductClicks : stats.totalProductClicks;
  const currentSignups = timeRange === 'today' ? stats.todaySignups : stats.totalSignups;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (loading) return <LoadingState type="page" message="Loading Analytics..." variant="spinner" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2 text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your site performance and user behavior</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats — 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <MousePointerClick className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{rangeLabel}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{currentClicks}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Product Clicks</p>
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{rangeLabel}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{currentSignups}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">New Signups</p>
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">All Time</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.conversionRate}%</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
        </div>
      </div>

      {/* Stacked sections */}
      <div className="flex flex-col gap-6">
        {/* Most Clicked Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Most Clicked Products
          </h2>
          {popularProducts.length > 0 ? (
            <div className="space-y-3">
              {popularProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-5 shrink-0">{index + 1}</span>
                  {product.product_image && (
                    <img src={product.product_image} alt={product.product_name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-400 h-1.5 rounded-full"
                          style={{ width: `${(product.click_count / (popularProducts[0]?.click_count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{product.click_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No product clicks yet</p>
          )}
        </div>

        {/* Top Orders by Value */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            Top Orders by Value
          </h2>
          {topOrders.length > 0 ? (
            <div className="space-y-2">
              {topOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">#{order.order_number}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
