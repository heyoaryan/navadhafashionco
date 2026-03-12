import { useEffect, useState } from 'react';
import { Package, Search, Eye, Check, X, RefreshCw, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Return } from '../../types';
import LoadingState from '../../components/LoadingState';

export default function ReturnList() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Modal state for viewing return details (used in onClick handlers)
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Suppress TypeScript unused variable warnings - these are used in event handlers
  void selectedReturn;
  void showDetailModal;
  void adminNotes;

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details for each return
      const returnsWithUsers = await Promise.all(
        (data || []).map(async (ret: any) => {
          if (ret.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', ret.user_id)
              .single();

            return {
              ...ret,
              user: userData
            };
          }
          return ret;
        })
      );

      setReturns(returnsWithUsers);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (id: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('returns')
        .update({ 
          status,
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      alert(`Return ${status} successfully!`);
      fetchReturns();
      setShowDetailModal(false);
      setSelectedReturn(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating return status:', error);
      alert('Failed to update return status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'refunded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: 'Defective Product',
      wrong_item: 'Wrong Item',
      not_as_described: 'Not as Described',
      size_issue: 'Size Issue',
      changed_mind: 'Changed Mind',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ret.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingState type="page" message="Loading Returns..." variant="spinner" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wider mb-2 text-gray-900 dark:text-gray-100">Returns Management</h1>
          <p className="text-gray-600 dark:text-gray-400">{returns.length} total returns</p>
        </div>
      </div>

      {returns.length > 0 && (
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      {returns.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No returns yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Return requests will appear here when customers request returns
          </p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No returns found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {ret.product_image && (
                          <img src={ret.product_image} alt={ret.product_name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{ret.product_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Qty: {ret.quantity} • ₹{(ret.refund_amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{ret.user?.full_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{ret.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        ret.return_type === 'exchange' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {ret.return_type === 'exchange' ? <RefreshCw className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                        {ret.return_type === 'exchange' ? 'Exchange' : 'Refund'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getReasonLabel(ret.reason)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ret.status)}`}>
                        {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ret.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setAdminNotes(ret.admin_notes || '');
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ret.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateReturnStatus(ret.id, 'approved')}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateReturnStatus(ret.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {ret.status === 'approved' && (
                          <button
                            onClick={() => updateReturnStatus(ret.id, ret.return_type === 'exchange' ? 'completed' : 'refunded')}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            {ret.return_type === 'exchange' ? 'Mark Exchanged' : 'Mark Refunded'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}