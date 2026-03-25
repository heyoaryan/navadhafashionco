import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
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
  rangeClicks: number;
  rangeSignups: number;
  rangeOrders: number;
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
    rangeClicks: 0,
    rangeSignups: 0,
    rangeOrders: 0,
  });
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [topOrders, setTopOrders] = useState<TopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const debouncedStart = useDebounce(customStart, 800);
  const debouncedEnd = useDebounce(customEnd, 800);

  const isValidDate = (val: string) => {
    if (!val || val.length < 10) return false;
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2200;
  };

  useEffect(() => {
    if (timeRange !== 'custom') fetchAnalytics();
  }, [timeRange]);

  useEffect(() => {
    if (timeRange === 'custom' && isValidDate(debouncedStart) && isValidDate(debouncedEnd)) fetchAnalytics();
  }, [debouncedStart, debouncedEnd]);

  const getDateRange = (range: typeof timeRange, start?: string, end?: string) => {
    const now = new Date();
    let from: string | null = null;
    let to: string | null = null;

    switch (range) {
      case 'today': {
        const d = new Date(now); d.setHours(0, 0, 0, 0);
        from = d.toISOString();
        break;
      }
      case 'week': {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        from = d.toISOString();
        break;
      }
      case 'month': {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        from = d.toISOString();
        break;
      }
      case 'custom': {
        if (start) from = new Date(start).toISOString();
        if (end) { const d = new Date(end); d.setHours(23, 59, 59, 999); to = d.toISOString(); }
        break;
      }
      default: break;
    }
    return { from, to };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    // Safety timeout — never stay stuck loading
    const timeout = setTimeout(() => setLoading(false), 15000);
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { from, to } = getDateRange(timeRange, debouncedStart, debouncedEnd);

      // Build reusable query helpers
      const applyRange = (q: any) => {
        if (from) q = q.gte('created_at', from);
        if (to) q = q.lte('created_at', to);
        return q;
      };

      const [
        { count: totalProductClicks },
        { count: todayProductClicks },
        { count: totalSignups },
        { count: todaySignups },
        { count: totalOrders },
        { count: rangeOrdersCount },
        { count: rangeClicksCount },
        { count: rangeSignupsCount },
      ] = await Promise.all([
        supabase.from('product_clicks').select('*', { count: 'exact', head: true }),
        supabase.from('product_clicks').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('signup_tracking').select('*', { count: 'exact', head: true }),
        supabase.from('signup_tracking').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
        applyRange(supabase.from('orders').select('*', { count: 'exact', head: true }).neq('status', 'cancelled')),
        applyRange(supabase.from('product_clicks').select('*', { count: 'exact', head: true })),
        applyRange(supabase.from('signup_tracking').select('*', { count: 'exact', head: true })),
      ]);

      const clicks = rangeClicksCount || 0;
      const orders = rangeOrdersCount || 0;
      const rawRate = clicks > 0 ? (orders / clicks) * 100 : 0;
      const conversionRate = Math.min(rawRate, 100).toFixed(2);

      setStats({
        totalProductClicks: totalProductClicks || 0,
        todayProductClicks: todayProductClicks || 0,
        totalSignups: totalSignups || 0,
        todaySignups: todaySignups || 0,
        totalOrders: totalOrders || 0,
        conversionRate,
        rangeClicks: clicks,
        rangeSignups: rangeSignupsCount || 0,
        rangeOrders: orders,
      });

      // Popular products — filtered by same time range
      const { data: productClicksData } = await applyRange(
        supabase.from('product_clicks').select('product_id, products(name, main_image_url)')
      );

      if (productClicksData) {
        const counts = productClicksData.reduce((acc: any, click: any) => {
          const id = click.product_id;
          if (!acc[id]) acc[id] = {
            product_id: id,
            product_name: click.products?.name || 'Unknown',
            product_image: click.products?.main_image_url || '',
            click_count: 0,
          };
          acc[id].click_count++;
          return acc;
        }, {});
        setPopularProducts(
          Object.values(counts)
            .sort((a: any, b: any) => b.click_count - a.click_count)
            .slice(0, 10) as PopularProduct[]
        );
      } else {
        setPopularProducts([]);
      }

      // Top orders by value
      const { data: ordersData } = await applyRange(
        supabase.from('orders')
          .select('id, order_number, total, status, created_at')
          .neq('status', 'cancelled')
          .order('total', { ascending: false })
          .limit(8)
      );
      setTopOrders(ordersData || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const rangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : timeRange === 'custom' ? 'Custom Range' : 'All Time';
  const currentClicks = stats.rangeClicks;
  const currentSignups = stats.rangeSignups;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for max date

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const StatCard = ({ gradient, icon: Icon, iconColor, value, label }: {
    gradient: string; icon: any; iconColor: string; value: string | number; label: string;
  }) => (
    <div className={`p-4 sm:p-6 bg-gradient-to-br ${gradient} rounded-xl`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-6 h-6 ${iconColor}`} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{rangeLabel}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );

  if (loading) return <LoadingState type="page" message="Loading Analytics..." variant="spinner" />;

  return (
    <div className="space-y-6">
      {/* Header + Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2 text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your site performance and user behavior</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={customStart}
                max={today}
                onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onKeyPress={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onKeyUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || isValidDate(val)) {
                    setCustomStart(val);
                    if (customEnd && val && customEnd < val) setCustomEnd('');
                  }
                }}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 text-sm cursor-pointer"
              />
              <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                max={today}
                onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onKeyPress={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onKeyUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || isValidDate(val)) setCustomEnd(val);
                }}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 text-sm cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          icon={MousePointerClick}
          iconColor="text-purple-600 dark:text-purple-400"
          value={currentClicks}
          label="Product Clicks"
        />
        <StatCard
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          icon={Users}
          iconColor="text-green-600 dark:text-green-400"
          value={currentSignups}
          label="New Signups"
        />
        <StatCard
          gradient="from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20"
          icon={ShoppingCart}
          iconColor="text-rose-600 dark:text-rose-400"
          value={`${stats.conversionRate}%`}
          label="Conversion Rate"
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6">
        {/* Most Clicked Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              Most Clicked Products
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {rangeLabel}
            </span>
          </div>
          {popularProducts.length > 0 ? (
            <div className="space-y-3">
              {popularProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-5 shrink-0">{index + 1}</span>
                  {product.product_image && (
                    <img
                      src={product.product_image}
                      alt={product.product_name}
                      className="w-10 h-10 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(product.click_count / (popularProducts[0]?.click_count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{product.click_count} clicks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No product clicks for {rangeLabel.toLowerCase()}</p>
          )}
        </div>

        {/* Top Orders by Value */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              Top Orders by Value
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {rangeLabel}
            </span>
          </div>
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
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No orders for {rangeLabel.toLowerCase()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
