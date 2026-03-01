import { useEffect, useState } from 'react';
import { MousePointerClick, Users, TrendingUp, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsStats {
  totalProductClicks: number;
  todayProductClicks: number;
  totalSignups: number;
  todaySignups: number;
}

interface PopularProduct {
  product_id: string;
  product_name: string;
  click_count: number;
  product_image: string;
}

interface CategoryView {
  category_name: string;
  page_path: string;
  view_count: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalProductClicks: 0,
    todayProductClicks: 0,
    totalSignups: 0,
    todaySignups: 0,
  });
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [categoryViews, setCategoryViews] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        const today = new Date(now.setHours(0, 0, 0, 0));
        return today.toISOString();
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return monthAgo.toISOString();
      default:
        return null;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateFilter = getDateFilter();

      // Total and today's product clicks
      const { count: totalProductClicks, error: pcError } = await supabase
        .from('product_clicks')
        .select('*', { count: 'exact', head: true });

      if (pcError) console.error('Product clicks error:', pcError);

      const { count: todayProductClicks, error: todayPcError } = await supabase
        .from('product_clicks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayPcError) console.error('Today product clicks error:', todayPcError);

      // Total and today's signups
      const { count: totalSignups, error: signupError } = await supabase
        .from('signup_tracking')
        .select('*', { count: 'exact', head: true });

      if (signupError) console.error('Signup tracking error:', signupError);

      const { count: todaySignups, error: todaySignupError } = await supabase
        .from('signup_tracking')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todaySignupError) console.error('Today signup error:', todaySignupError);

      setStats({
        totalProductClicks: totalProductClicks || 0,
        todayProductClicks: todayProductClicks || 0,
        totalSignups: totalSignups || 0,
        todaySignups: todaySignups || 0,
      });

      // Popular products (with time filter)
      let productQuery = supabase
        .from('product_clicks')
        .select(`
          product_id,
          products (
            name,
            main_image_url
          )
        `);

      if (dateFilter) {
        productQuery = productQuery.gte('created_at', dateFilter);
      }

      const { data: productClicksData } = await productQuery;

      if (productClicksData) {
        const productCounts = productClicksData.reduce((acc: any, click: any) => {
          const productId = click.product_id;
          if (!acc[productId]) {
            acc[productId] = {
              product_id: productId,
              product_name: click.products?.name || 'Unknown',
              product_image: click.products?.main_image_url || '',
              click_count: 0,
            };
          }
          acc[productId].click_count++;
          return acc;
        }, {});

        const sortedProducts = Object.values(productCounts)
          .sort((a: any, b: any) => b.click_count - a.click_count)
          .slice(0, 10);

        setPopularProducts(sortedProducts as PopularProduct[]);
      }

      // Category views from page_views table
      let pageQuery = supabase
        .from('page_views')
        .select('page_path');

      if (dateFilter) {
        pageQuery = pageQuery.gte('created_at', dateFilter);
      }

      const { data: pageViewsData } = await pageQuery;

      if (pageViewsData) {
        // Category mapping
        const categoryMap: { [key: string]: string } = {
          '/western-wear': 'Western Wear',
          '/indo-western': 'Indo Western',
          '/ethnic-wear': 'Ethnic Wear',
          '/work-wear': 'Work Wear',
          '/occasional-wear': 'Occasional Wear',
          '/boutique': 'Boutique',
          '/boutique/ready-made': 'Boutique - Ready Made',
          '/boutique/customization': 'Boutique - Customization',
          '/shop': 'Shop',
          '/': 'Home',
        };

        // Count category views
        const categoryCounts: { [key: string]: { category_name: string; page_path: string; view_count: number } } = {};
        
        pageViewsData.forEach((view: any) => {
          const path = view.page_path;
          const categoryName = categoryMap[path];
          
          if (categoryName) {
            if (!categoryCounts[path]) {
              categoryCounts[path] = {
                category_name: categoryName,
                page_path: path,
                view_count: 0,
              };
            }
            categoryCounts[path].view_count++;
          }
        });

        const sortedCategories = Object.values(categoryCounts)
          .sort((a, b) => b.view_count - a.view_count);

        setCategoryViews(sortedCategories);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <MousePointerClick className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {timeRange === 'today' ? 'Today' : timeRange === 'week' ? '7 Days' : timeRange === 'month' ? '30 Days' : 'Total'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">
            {timeRange === 'today' ? stats.todayProductClicks : stats.totalProductClicks}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Product Clicks</p>
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {timeRange === 'today' ? 'Today' : timeRange === 'week' ? '7 Days' : timeRange === 'month' ? '30 Days' : 'Total'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-light mb-1 text-gray-900 dark:text-gray-100">
            {timeRange === 'today' ? stats.todaySignups : stats.totalSignups}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">New Signups</p>
        </div>
      </div>

      {/* Popular Products */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Most Clicked Products
        </h2>
        {popularProducts.length > 0 ? (
          <div className="space-y-3">
            {popularProducts.map((product, index) => (
              <div key={product.product_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                {product.product_image && (
                  <img src={product.product_image} alt={product.product_name} className="w-12 h-12 object-cover rounded" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{product.product_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.click_count} clicks</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No product clicks yet</p>
        )}
      </div>

      {/* Category Views */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Category Page Views
        </h2>
        {categoryViews.length > 0 ? (
          <div className="space-y-3">
            {categoryViews.map((category, index) => (
              <div key={category.page_path} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{category.category_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{category.page_path}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.view_count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">views</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No category views yet</p>
        )}
      </div>
    </div>
  );
}
