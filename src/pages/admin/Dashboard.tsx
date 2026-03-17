import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, TrendingUp, IndianRupee, XCircle, RotateCcw, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../../components/LoadingState';

interface Stats {
  todaySales: number;
  todayOrders: number;
  todayCancelled: number;
  todayReturns: number;
  totalRevenue: number;
  totalOrders: number;
  totalCancelled: number;
  totalRefund: number;
  totalExchange: number;
  totalProducts: number;
  totalCustomers: number;
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
    todayCancelled: 0,
    todayReturns: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalCancelled: 0,
    totalRefund: 0,
    totalExchange: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Month/Year filter for revenue card — only years/months with actual data
  const now = new Date();
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [displayRevenue, setDisplayRevenue] = useState(0);
  const animRef = useRef<number | null>(null);

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
    // Fetch all distinct year-months that have orders
    supabase.from('orders').select('created_at').then(({ data }) => {
      if (!data) return;
      const yearSet = new Set<number>();
      const monthSet = new Set<number>();
      data.forEach(o => {
        const d = new Date(o.created_at);
        yearSet.add(d.getFullYear());
        // collect months for current selYear — we'll filter in the year change handler
      });
      const years = Array.from(yearSet).sort((a, b) => b - a);
      setAvailableYears(years);
      // months for current year
      const monthsForYear = new Set<number>();
      data.forEach(o => {
        const d = new Date(o.created_at);
        if (d.getFullYear() === now.getFullYear()) monthsForYear.add(d.getMonth() + 1);
      });
      const months = Array.from(monthsForYear).sort((a, b) => a - b);
      setAvailableMonths(months);
      // default to current month if exists, else latest available
      if (!months.includes(now.getMonth() + 1) && months.length > 0) {
        setSelMonth(months[months.length - 1]);
      }
    });
  }, []);

  // When year changes, update available months for that year
  const handleYearChange = async (year: number) => {
    setSelYear(year);
    const { data } = await supabase.from('orders').select('created_at');
    if (!data) return;
    const monthsForYear = new Set<number>();
    data.forEach(o => {
      const d = new Date(o.created_at);
      if (d.getFullYear() === year) monthsForYear.add(d.getMonth() + 1);
    });
    const months = Array.from(monthsForYear).sort((a, b) => a - b);
    setAvailableMonths(months);
    setSelMonth(months[months.length - 1] ?? 1);
  };

  // Fetch revenue when year/month changes
  useEffect(() => {
    const start = new Date(selYear, selMonth - 1, 1).toISOString();
    const end = new Date(selYear, selMonth, 1).toISOString();
    supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', start)
      .lt('created_at', end)
      .then(({ data }) => {
        const rev = data?.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0) || 0;
        setMonthRevenue(rev);
      });
  }, [selYear, selMonth]);

  // Counting animation whenever monthRevenue changes
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = 0;
    const end = monthRevenue;
    const duration = 800;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayRevenue(Math.floor(eased * end));
      if (progress < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [monthRevenue]);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's orders (non-cancelled)
      const { data: todayOrdersData } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString());

      const todayNonCancelled = todayOrdersData?.filter(o => o.status !== 'cancelled') || [];
      const todaySales = todayNonCancelled.reduce((sum, o) => sum + Number(o.total), 0);
      const todayOrders = todayNonCancelled.length;
      const todayCancelled = todayOrdersData?.filter(o => o.status === 'cancelled').length || 0;

      // Today's returns
      const { count: todayReturnsCount } = await supabase
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // All orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total, status');

      const totalRevenue = allOrders
        ?.filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total), 0) || 0;

      const totalOrders = allOrders?.filter(o => o.status !== 'cancelled').length || 0;
      const totalCancelled = allOrders?.filter(o => o.status === 'cancelled').length || 0;

      // Total refund: only 2nd returns (return_type = 'refund'), completed
      const { data: refundReturns } = await supabase
        .from('returns')
        .select('refund_amount, return_type')
        .eq('status', 'completed');

      const totalRefund = refundReturns
        ?.filter(r => r.return_type === 'refund')
        .reduce((sum, r) => sum + Number(r.refund_amount), 0) || 0;

      // Total exchange count: 1st returns (return_type = 'exchange')
      const totalExchange = refundReturns?.filter(r => r.return_type === 'exchange').length || 0;

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      setStats({
        todaySales,
        todayOrders,
        todayCancelled,
        todayReturns: todayReturnsCount || 0,
        totalRevenue,
        totalOrders,
        totalCancelled,
        totalRefund,
        totalExchange,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
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

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
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

  if (loading) {
    return <LoadingState type="page" message="Loading Dashboard..." variant="spinner" />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2 text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Top Row: Today's stats (left) + Total Revenue hero (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's 4 mini cards — takes 2/3 width */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <IndianRupee className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
            </div>
            <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">₹{stats.todaySales.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sales Today</p>
          </div>

          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
            </div>
            <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.todayOrders}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Orders Today</p>
          </div>

          <div className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
            </div>
            <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.todayCancelled}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cancelled Today</p>
          </div>

          <div className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <RotateCcw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
            </div>
            <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.todayReturns}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Returns Today</p>
          </div>
        </div>

        {/* Total Revenue hero card — takes 1/3 width */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">All Time</span>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-gray-100 mb-2">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          </div>
          {/* Month + Year selector + animated count */}
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <div className="flex gap-2 mb-2">
              {/* Month dropdown */}
              <div className="relative flex-1">
                <select
                  value={selMonth}
                  onChange={e => setSelMonth(Number(e.target.value))}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  className="w-full appearance-none bg-white/60 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 pr-6 focus:outline-none cursor-pointer"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-green-600 dark:text-green-400 pointer-events-none" />
              </div>
              {/* Year dropdown */}
              <div className="relative flex-1">
                <select
                  value={selYear}
                  onChange={e => handleYearChange(Number(e.target.value))}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  className="w-full appearance-none bg-white/60 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 pr-6 focus:outline-none cursor-pointer"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-green-600 dark:text-green-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-xl font-light text-gray-900 dark:text-gray-100">
              ₹{displayRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Revenue this month</p>
          </div>
        </div>
      </div>

      {/* Overall Totals Row: Orders, Cancelled, Refunded, Exchange, Customers */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalOrders}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalCancelled}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Cancelled</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <IndianRupee className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">₹{stats.totalRefund.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Refunded</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <RefreshCw className="w-6 h-6 text-teal-500 dark:text-teal-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalExchange}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Exchange</p>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-light mb-1 text-gray-900 dark:text-gray-100">{stats.totalCustomers}</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light text-gray-900 dark:text-gray-100">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-rose-500 hover:text-rose-600">View all</Link>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
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
                        {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
