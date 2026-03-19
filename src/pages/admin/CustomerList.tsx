import { useEffect, useState } from 'react';
import { Search, Users, AlertTriangle, Ban, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import LoadingState from '../../components/LoadingState';

interface CustomerWithStats extends Profile {
  order_count?: number;
  total_spent?: number;
  last_order_date?: string;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showRemoveBlacklistModal, setShowRemoveBlacklistModal] = useState(false);
  const [removingBlacklistId, setRemovingBlacklistId] = useState<string | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistNotes, setBlacklistNotes] = useState('');
  const [customerReturns, setCustomerReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (showDetailModal || showBlacklistModal) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [showDetailModal, showBlacklistModal]);

  const fetchCustomers = async () => {
    try {
      // Fetch profiles with role customer
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch ALL active blacklist entries for customers in one query
      const { data: blacklistData } = await supabase
        .from('blacklist')
        .select('entity_id')
        .eq('entity_type', 'customer')
        .eq('is_active', true);

      const blacklistedIds = new Set((blacklistData || []).map((b: any) => b.entity_id));

      // Batch fetch all orders and returns in 2 queries instead of N*3 queries
      const customerIds = (profilesData || []).map((c: any) => c.id);

      const [{ data: allOrdersData }, { data: allReturnsData }] = await Promise.all([
        supabase
          .from('orders')
          .select('user_id, total')
          .in('user_id', customerIds),
        supabase
          .from('returns')
          .select('user_id, refund_amount, return_type')
          .in('user_id', customerIds)
          .eq('return_type', 'refund'),
      ]);

      // Build lookup maps
      const ordersByUser = new Map<string, { count: number; total: number }>();
      for (const order of allOrdersData || []) {
        const existing = ordersByUser.get(order.user_id) || { count: 0, total: 0 };
        ordersByUser.set(order.user_id, {
          count: existing.count + 1,
          total: existing.total + Number(order.total),
        });
      }

      const returnsByUser = new Map<string, { count: number; total: number }>();
      for (const ret of allReturnsData || []) {
        const existing = returnsByUser.get(ret.user_id) || { count: 0, total: 0 };
        returnsByUser.set(ret.user_id, {
          count: existing.count + 1,
          total: existing.total + Number(ret.refund_amount),
        });
      }

      const customersWithStats = (profilesData || []).map((customer: any) => {
        const orders = ordersByUser.get(customer.id) || { count: 0, total: 0 };
        const returns = returnsByUser.get(customer.id) || { count: 0, total: 0 };
        const isBlacklisted = customer.is_blacklisted === true || blacklistedIds.has(customer.id);
        return {
          ...customer,
          is_blacklisted: isBlacklisted,
          order_count: orders.count,
          total_spent: orders.total,
          return_count: returns.count,
          total_returns_value: returns.total,
        };
      });
      
      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReturns = async (customerId: string) => {
    setLoadingReturns(true);
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', customerId)
        .eq('return_type', 'refund')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoadingReturns(false);
    }
  };

  const viewCustomerDetails = async (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    await fetchCustomerReturns(customer.id);
  };

  const blacklistCustomer = async () => {
    if (!selectedCustomer || !blacklistReason.trim()) {
      alert('Please provide a reason for blacklisting');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert into blacklist table — this is the source of truth
      const { error: blacklistError } = await supabase
        .from('blacklist')
        .insert({
          entity_type: 'customer',
          entity_id: selectedCustomer.id,
          reason: blacklistReason,
          notes: blacklistNotes,
          blacklisted_by: user?.id,
          is_active: true
        });

      if (blacklistError) throw blacklistError;

      // Also update profiles.is_blacklisted — ignore error if RLS blocks it
      await supabase
        .from('profiles')
        .update({ is_blacklisted: true })
        .eq('id', selectedCustomer.id);

      // Update local state immediately
      const updated = { ...selectedCustomer, is_blacklisted: true };
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
      setSelectedCustomer(updated);

      setShowBlacklistModal(false);
      setShowDetailModal(false);
      setBlacklistReason('');
      setBlacklistNotes('');
    } catch (error: any) {
      console.error('Error blacklisting customer:', error);
      alert(`Failed to blacklist customer: ${error?.message || error}`);
    }
  };

  const confirmRemoveBlacklist = (customerId: string) => {
    setRemovingBlacklistId(customerId);
    setShowRemoveBlacklistModal(true);
  };

  const removeBlacklist = async () => {
    const customerId = removingBlacklistId;
    if (!customerId) return;
    setShowRemoveBlacklistModal(false);
    setRemovingBlacklistId(null);

    try {
      // Deactivate blacklist entry — source of truth
      const { error: blacklistError } = await supabase
        .from('blacklist')
        .update({ is_active: false })
        .eq('entity_id', customerId)
        .eq('entity_type', 'customer');

      if (blacklistError) throw blacklistError;

      // Also update profiles.is_blacklisted — ignore error if RLS blocks it
      await supabase
        .from('profiles')
        .update({ is_blacklisted: false })
        .eq('id', customerId);

      // Update local state immediately
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, is_blacklisted: false } : c));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, is_blacklisted: false } : null);
      }
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Error removing blacklist:', error);
      alert(`Failed to remove blacklist: ${error?.message || error}`);
    }
  };

  const getReturnRate = (customer: CustomerWithStats) => {
    if (!customer.order_count || customer.order_count === 0) return 0;
    return ((customer.return_count || 0) / customer.order_count) * 100;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: 'Defective',
      wrong_item: 'Wrong Item',
      not_as_described: 'Not as Described',
      size_issue: 'Size Issue',
      changed_mind: 'Changed Mind',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState type="page" message="Loading Customers..." variant="spinner" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1 sm:mb-2 text-gray-900 dark:text-gray-100">
            Customers
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {customers.length} total customers • {customers.filter(c => c.is_blacklisted).length} blacklisted
          </p>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      )}

      {customers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No customers yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Customers will appear here when they sign up
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No customers found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Returns</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Return Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => {
                    const returnRate = getReturnRate(customer);
                    const isHighRisk = returnRate > 30 || (customer.return_count || 0) > 5;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {customer.full_name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{customer.phone || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {customer.order_count || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ₹{(customer.total_spent || 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {customer.return_count || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ₹{(customer.total_returns_value || 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {returnRate.toFixed(1)}%
                            </span>
                            {isHighRisk && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {customer.is_blacklisted ? (
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
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => viewCustomerDetails(customer)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-rose-500 text-white rounded hover:bg-rose-600"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filteredCustomers.map((customer) => {
              const returnRate = getReturnRate(customer);
              const isHighRisk = returnRate > 30 || (customer.return_count || 0) > 5;
              
              return (
                <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                        {customer.full_name || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{customer.email}</p>
                    </div>
                    {customer.is_blacklisted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <Ban className="w-3 h-3" />
                        Blacklisted
                      </span>
                    ) : isHighRisk && (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orders</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{customer.order_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Returns</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{customer.return_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rate</p>
                      <p className={`font-medium text-sm ${
                        isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {returnRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => viewCustomerDetails(customer)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-rose-500 text-white rounded hover:bg-rose-600"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">
                    {selectedCustomer.full_name || 'N/A'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedCustomer.order_count || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₹{(selectedCustomer.total_spent || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Returns</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {selectedCustomer.return_count || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Return Rate</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {getReturnRate(selectedCustomer).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Return History
                </h3>
                
                {loadingReturns ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
                  </div>
                ) : customerReturns.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No returns found</p>
                ) : (
                  <div className="space-y-3">
                    {customerReturns.map((ret) => (
                      <div key={ret.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{ret.product_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {ret.quantity} • ₹{(ret.refund_amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ret.status === 'refunded' || ret.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : ret.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {ret.status}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Reason:</span> {getReasonLabel(ret.reason)}
                          </p>
                          {ret.reason_details && (
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Details:</span> {ret.reason_details}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(ret.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedCustomer.is_blacklisted ? (
                  <button
                    onClick={() => confirmRemoveBlacklist(selectedCustomer.id)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Remove from Blacklist
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBlacklistModal(true)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Blacklist Customer
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBlacklistModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">
              Blacklist Customer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to blacklist {selectedCustomer.full_name || selectedCustomer.email}?
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
                  <option value="excessive_returns">Excessive Returns</option>
                  <option value="fraud_suspected">Fraud Suspected</option>
                  <option value="abuse">Abuse/Harassment</option>
                  <option value="payment_issues">Payment Issues</option>
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
                onClick={blacklistCustomer}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirm Blacklist
              </button>
              <button
                onClick={() => {
                  setShowBlacklistModal(false);
                  setBlacklistReason('');
                  setBlacklistNotes('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showRemoveBlacklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Remove from Blacklist
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove this customer from the blacklist? They will regain full access to the store.
            </p>
            <div className="flex gap-3">
              <button
                onClick={removeBlacklist}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm transition-colors"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => { setShowRemoveBlacklistModal(false); setRemovingBlacklistId(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
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
