import { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, Ban, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import LoadingState from '../../components/LoadingState';

interface AreaStats {
  city: string;
  state: string;
  pincode: string;
  total_orders: number;
  total_returns: number;
  return_rate: number;
  unique_customers: number;
  is_blacklisted: boolean;
}

export default function AreaAnalytics() {
  const [areaStats, setAreaStats] = useState<AreaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaStats | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistNotes, setBlacklistNotes] = useState('');

  useEffect(() => {
    fetchAreaStats();
  }, []);

  useEffect(() => {
    if (showBlacklistModal) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [showBlacklistModal]);

  const fetchAreaStats = async () => {
    try {
      // Get all orders with their addresses
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id, shipping_address');

      if (ordersError) throw ordersError;

      // Get all returns — only actual returns (return_type = 'refund'), not exchanges
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select('order_id, user_id, return_type')
        .eq('return_type', 'refund');

      if (returnsError) throw returnsError;

      // Get all addresses from addresses table
      const { data: addresses, error: addressesError } = await supabase
        .from('addresses')
        .select('city, state, postal_code, user_id');

      if (addressesError) throw addressesError;

      // Get blacklisted areas
      const { data: blacklist, error: blacklistError } = await supabase
        .from('blacklist')
        .select('*')
        .eq('entity_type', 'area')
        .eq('is_active', true);

      if (blacklistError) throw blacklistError;

      // Process data to calculate area-wise statistics
      const areaMap = new Map<string, {
        city: string;
        state: string;
        pincode: string;
        total_orders: number;
        total_returns: number;
        return_rate: number;
        unique_customers: Set<string>;
        is_blacklisted: boolean;
      }>();

      // Process orders and their addresses
      orders?.forEach((order: any) => {
        const addr = order.shipping_address;
        if (!addr || !addr.city || !addr.state || !addr.postal_code) return;

        const key = `${addr.city}-${addr.state}-${addr.postal_code}`;
        
        if (!areaMap.has(key)) {
          areaMap.set(key, {
            city: addr.city,
            state: addr.state,
            pincode: addr.postal_code,
            total_orders: 0,
            total_returns: 0,
            return_rate: 0,
            unique_customers: new Set<string>(),
            is_blacklisted: blacklist?.some(
              (b: any) => 
                (b.area_pincode === addr.postal_code) ||
                (b.area_city === addr.city && b.area_state === addr.state)
            ) || false
          });
        }

        const stats = areaMap.get(key)!;
        stats.total_orders++;
        
        // Track unique customers
        if (order.user_id) {
          stats.unique_customers.add(order.user_id);
        }
        
        // Check if this order has returns
        const hasReturn = returns?.some((r: any) => r.order_id === order.id);
        if (hasReturn) {
          stats.total_returns++;
        }
      });

      // Also add areas from addresses table that might not have orders yet
      addresses?.forEach((addr: any) => {
        if (!addr.city || !addr.state || !addr.postal_code) return;

        const key = `${addr.city}-${addr.state}-${addr.postal_code}`;
        
        if (!areaMap.has(key)) {
          areaMap.set(key, {
            city: addr.city,
            state: addr.state,
            pincode: addr.postal_code,
            total_orders: 0,
            total_returns: 0,
            return_rate: 0,
            unique_customers: new Set<string>(),
            is_blacklisted: blacklist?.some(
              (b: any) => 
                (b.area_pincode === addr.postal_code) ||
                (b.area_city === addr.city && b.area_state === addr.state)
            ) || false
          });
        }
      });

      // Convert to array and calculate final stats
      const statsArray = Array.from(areaMap.values()).map(stats => ({
        city: stats.city,
        state: stats.state,
        pincode: stats.pincode,
        total_orders: stats.total_orders,
        total_returns: stats.total_returns,
        return_rate: stats.total_orders > 0 
          ? (stats.total_returns / stats.total_orders) * 100 
          : 0,
        unique_customers: stats.unique_customers.size,
        is_blacklisted: stats.is_blacklisted
      }));

      // Sort by return rate (highest first), then by total orders
      statsArray.sort((a, b) => {
        if (b.return_rate !== a.return_rate) {
          return b.return_rate - a.return_rate;
        }
        return b.total_orders - a.total_orders;
      });

      setAreaStats(statsArray);
    } catch (error) {
      console.error('Error fetching area stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const blacklistArea = async () => {
    if (!selectedArea || !blacklistReason.trim()) {
      alert('Please provide a reason for blacklisting');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('blacklist')
        .insert({
          entity_type: 'area',
          area_pincode: selectedArea.pincode,
          area_city: selectedArea.city,
          area_state: selectedArea.state,
          reason: blacklistReason,
          notes: blacklistNotes,
          blacklisted_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      alert('Area blacklisted successfully');
      setShowBlacklistModal(false);
      setBlacklistReason('');
      setBlacklistNotes('');
      setSelectedArea(null);
      fetchAreaStats();
    } catch (error) {
      console.error('Error blacklisting area:', error);
      alert('Failed to blacklist area');
    }
  };

  const removeBlacklist = async (area: AreaStats) => {
    if (!confirm(`Remove blacklist for ${area.city}, ${area.state}?`)) return;

    try {
      const { error } = await supabase
        .from('blacklist')
        .update({ is_active: false })
        .eq('entity_type', 'area')
        .or(`area_pincode.eq.${area.pincode},and(area_city.eq.${area.city},area_state.eq.${area.state})`);

      if (error) throw error;

      alert('Area removed from blacklist');
      fetchAreaStats();
    } catch (error) {
      console.error('Error removing blacklist:', error);
      alert('Failed to remove blacklist');
    }
  };

  const filteredAreas = areaStats.filter(area =>
    area.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.pincode.includes(searchTerm)
  );

  if (loading) {
    return <LoadingState type="page" message="Loading Area Analytics..." variant="spinner" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-light tracking-wider mb-2 text-gray-900 dark:text-gray-100">
            Area-wise Return Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {areaStats.length} areas tracked • {areaStats.filter(a => a.is_blacklisted).length} blacklisted
          </p>
        </div>
      </div>

      {areaStats.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by city, state, or pincode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Areas</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {areaStats.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk Areas</h3>
          </div>
          <p className="text-3xl font-semibold text-yellow-600 dark:text-yellow-400">
            {areaStats.filter(a => a.return_rate > 30).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Return rate &gt; 30%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Blacklisted</h3>
          </div>
          <p className="text-3xl font-semibold text-red-600 dark:text-red-400">
            {areaStats.filter(a => a.is_blacklisted).length}
          </p>
        </div>
      </div>

      {/* Area Table */}
      {filteredAreas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No areas found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Location
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Orders
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Returns
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Return Rate
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAreas.map((area, index) => {
                  const isHighRisk = area.return_rate > 30;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {area.city}, {area.state}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PIN: {area.pincode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {area.total_orders}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {area.total_returns}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isHighRisk 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {area.return_rate.toFixed(1)}%
                          </span>
                          {isHighRisk && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {area.is_blacklisted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <Ban className="w-3 h-3" />
                            Blacklisted
                          </span>
                        ) : isHighRisk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <AlertTriangle className="w-3 h-3" />
                            High Risk
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        {area.is_blacklisted ? (
                          <button
                            onClick={() => removeBlacklist(area)}
                            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-500 text-white rounded hover:bg-green-600 whitespace-nowrap"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedArea(area);
                              setShowBlacklistModal(true);
                            }}
                            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 ml-auto whitespace-nowrap"
                          >
                            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                            Blacklist
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blacklist Modal */}
      {showBlacklistModal && selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">
              Blacklist Area
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Blacklist {selectedArea.city}, {selectedArea.state} ({selectedArea.pincode})?
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason *
                </label>
                <select
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select reason</option>
                  <option value="high_return_rate">High Return Rate</option>
                  <option value="fraud_pattern">Fraud Pattern Detected</option>
                  <option value="delivery_issues">Repeated Delivery Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={blacklistNotes}
                  onChange={(e) => setBlacklistNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Add any additional details..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={blacklistArea}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirm Blacklist
              </button>
              <button
                onClick={() => {
                  setShowBlacklistModal(false);
                  setBlacklistReason('');
                  setBlacklistNotes('');
                  setSelectedArea(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
