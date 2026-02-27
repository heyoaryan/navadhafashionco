import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, MapPin, User as UserIcon, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

export default function Account() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Redirect admin to admin panel
    if (profile?.role === 'admin') {
      navigate('/admin');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, profile, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setOrders(data || []);
      
      // Check if user is new (account created within last 5 minutes and no orders)
      if (profile?.created_at) {
        const accountAge = Date.now() - new Date(profile.created_at).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        setIsNewUser(accountAge < fiveMinutes && (!data || data.length === 0));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Section */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-semibold shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1">
                {isNewUser 
                  ? `Welcome to Navadha, ${profile?.full_name?.split(' ')[0] || 'User'}!`
                  : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}!`
                }
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{profile?.email}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                Member since {new Date(profile?.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-5 tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/account/orders"
            className="group relative overflow-hidden p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-500 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300"></div>
            <Package className="w-7 h-7 sm:w-8 sm:h-8 mb-3 text-rose-500 relative z-10" />
            <h3 className="text-base sm:text-lg font-semibold mb-1 relative z-10">Orders</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 relative z-10">Track and manage orders</p>
          </Link>

          <Link
            to="/wishlist"
            className="group relative overflow-hidden p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100 dark:bg-pink-900/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300"></div>
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 mb-3 text-pink-500 relative z-10" />
            <h3 className="text-base sm:text-lg font-semibold mb-1 relative z-10">Wishlist</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 relative z-10">View saved items</p>
          </Link>

          <Link
            to="/account/addresses"
            className="group relative overflow-hidden p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300"></div>
            <MapPin className="w-7 h-7 sm:w-8 sm:h-8 mb-3 text-blue-500 relative z-10" />
            <h3 className="text-base sm:text-lg font-semibold mb-1 relative z-10">Addresses</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 relative z-10">Manage shipping addresses</p>
          </Link>

          <Link
            to="/account/profile"
            className="group relative overflow-hidden p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300"></div>
            <UserIcon className="w-7 h-7 sm:w-8 sm:h-8 mb-3 text-purple-500 relative z-10" />
            <h3 className="text-base sm:text-lg font-semibold mb-1 relative z-10">Profile</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 relative z-10">Update your information</p>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-light tracking-wide">Recent Orders</h2>
          {orders.length > 0 && (
            <Link
              to="/account/orders"
              className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
            >
              View All →
            </Link>
          )}
        </div>
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 sm:h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="block p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-sm sm:text-base">Order #{order.order_number}</p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Total Amount</p>
                    <p className="font-bold text-base sm:text-lg text-rose-600 dark:text-rose-400">₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 sm:mb-6">Start exploring our collection and place your first order</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-sm sm:text-base bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold hover:from-rose-600 hover:to-pink-700 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ShoppingBag className="w-4 h-4" />
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
