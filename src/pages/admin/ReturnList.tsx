import { useEffect, useState } from 'react';
import { Package, Search, Eye, Check, X, RefreshCw, DollarSign, MessageSquare, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Return } from '../../types';
import LoadingState from '../../components/LoadingState';
import { useToast } from '../../contexts/ToastContext';

export default function ReturnList() {
  const { showToast } = useToast();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

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

      const returnsWithUsers = await Promise.all(
        (data || []).map(async (ret: any) => {
          if (ret.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', ret.user_id)
              .single();
            return { ...ret, user: userData };
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
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('returns')
        .update({
          status,
          admin_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // If approved or rejected, also update the order status to reflect return
      const ret = returns.find(r => r.id === id);
      if (ret && status === 'approved') {
        await supabase
          .from('orders')
          .update({ status: 'returned' })
          .eq('id', ret.order_id);
      }

      showToast(`Return ${status} successfully`, 'success');
      fetchReturns();
      setSelectedReturn(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating return status:', error);
      showToast('Failed to update return status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'refunded': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: 'Defective Product',
      wrong_item: 'Wrong Item',
      not_as_described: 'Not as Described',
      size_issue: 'Size Issue',
      changed_mind: 'Changed Mind',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch =
      ret.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ret.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getCount = (status: string) =>
    status === 'all' ? returns.length : returns.filter(r => r.status === status).length;

  if (loading) return <LoadingState type="page" message="Loading Returns..." variant="spinner" />;

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Return Request Details</h3>
              <button
                onClick={() => { setSelectedReturn(null); setAdminNotes(''); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Product */}
              <div className="flex gap-3">
                {selectedReturn.product_image && (
                  <img src={selectedReturn.product_image} alt={selectedReturn.product_name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">{selectedReturn.product_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Qty: {selectedReturn.quantity} &bull; Refund: &#8377;{(selectedReturn.refund_amount || 0).toLocaleString()}
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedReturn.return_type === 'exchange'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    }`}>
                      {selectedReturn.return_type === 'exchange' ? <RefreshCw className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                      {selectedReturn.return_type === 'exchange' ? 'Exchange' : 'Refund'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusColor(selectedReturn.status)}`}>
                      {selectedReturn.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Customer</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedReturn.user?.full_name || 'N/A'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedReturn.user?.email}</p>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Return Reason</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getReasonLabel(selectedReturn.reason)}</p>
                {selectedReturn.reason_details && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{selectedReturn.reason_details}</p>
                )}
              </div>

              {/* Return Images */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Attached Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReturn.images.map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`Return image ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                  Admin Notes (shown to customer on rejection)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes for the customer..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              {/* Actions */}
              {selectedReturn.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => updateReturnStatus(selectedReturn.id, 'approved', adminNotes)}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    {updating ? 'Updating...' : 'Approve Return'}
                  </button>
                  <button
                    onClick={() => updateReturnStatus(selectedReturn.id, 'rejected', adminNotes)}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    {updating ? 'Updating...' : 'Reject Return'}
                  </button>
                </div>
              )}

              {selectedReturn.status === 'approved' && (
                <button
                  onClick={() => updateReturnStatus(
                    selectedReturn.id,
                    selectedReturn.return_type === 'exchange' ? 'completed' : 'refunded',
                    adminNotes
                  )}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  {updating ? 'Updating...' : selectedReturn.return_type === 'exchange' ? 'Mark as Exchanged' : 'Mark as Refunded'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1 text-gray-900 dark:text-gray-100">Returns</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{returns.length} total return requests</p>
      </div>

      {/* Status Filter */}
      {returns.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {['all', 'pending', 'approved', 'rejected', 'refunded', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  filterStatus === status
                    ? status === 'pending' ? 'bg-yellow-500 text-white'
                    : status === 'approved' ? 'bg-blue-500 text-white'
                    : status === 'rejected' ? 'bg-red-500 text-white'
                    : status === 'refunded' ? 'bg-emerald-500 text-white'
                    : status === 'completed' ? 'bg-gray-600 text-white'
                    : 'bg-rose-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({getCount(status)})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {returns.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      )}

      {/* Empty States */}
      {returns.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">No returns yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Return requests will appear here</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">No results found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/60">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {filteredReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {ret.product_image && (
                            <img src={ret.product_image} alt={ret.product_name}
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{ret.product_name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Qty: {ret.quantity} &bull; &#8377;{(ret.refund_amount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ret.user?.full_name || 'N/A'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{ret.user?.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          ret.return_type === 'exchange'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                        }`}>
                          {ret.return_type === 'exchange' ? <RefreshCw className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                          {ret.return_type === 'exchange' ? 'Exchange' : 'Refund'}
                        </span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{getReasonLabel(ret.reason)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(ret.status)}`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ret.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.admin_notes || ''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                          {ret.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateReturnStatus(ret.id, 'approved')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateReturnStatus(ret.id, 'rejected')}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {ret.status === 'approved' && (
                            <button
                              onClick={() => updateReturnStatus(ret.id, ret.return_type === 'exchange' ? 'completed' : 'refunded')}
                              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              <ChevronDown className="w-3 h-3" />
                              {ret.return_type === 'exchange' ? 'Exchanged' : 'Refunded'}
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredReturns.map((ret) => (
              <div key={ret.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="flex gap-3 p-3">
                  {ret.product_image && (
                    <img src={ret.product_image} alt={ret.product_name}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{ret.product_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ret.user?.full_name} &bull; {ret.user?.email}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(ret.status)}`}>
                        {ret.status}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        ret.return_type === 'exchange'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                      }`}>
                        {ret.return_type === 'exchange' ? 'Exchange' : 'Refund'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(ret.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    &bull; &#8377;{(ret.refund_amount || 0).toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.admin_notes || ''); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                    {ret.status === 'pending' && (
                      <>
                        <button onClick={() => updateReturnStatus(ret.id, 'approved')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateReturnStatus(ret.id, 'rejected')}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
