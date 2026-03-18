import { useEffect, useState } from 'react';
import { Package, Search, Eye, Check, X, RefreshCw, DollarSign, MessageSquare } from 'lucide-react';
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

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const withUsers = await Promise.all(
        (data || []).map(async (ret: any) => {
          if (ret.user_id) {
            const { data: u } = await supabase.from('profiles').select('full_name, email').eq('id', ret.user_id).single();
            return { ...ret, user: u };
          }
          return ret;
        })
      );
      setReturns(withUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(true);
    try {
      const ret = returns.find(r => r.id === id);
      // When marking as refunded, ensure refund_amount is set (use price * qty as fallback)
      const updatePayload: Record<string, unknown> = {
        status,
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      };
      if (status === 'refunded' && ret && !ret.refund_amount) {
        updatePayload.refund_amount = (ret.price ?? 0) * (ret.quantity ?? 1);
      }
      const { error } = await supabase.from('returns').update(updatePayload).eq('id', id);
      if (error) throw error;
      if (ret && status === 'approved' && ret.return_type === 'refund') {
        await supabase.from('orders').update({ status: 'returned' }).eq('id', ret.order_id);
      }
      const isExch = !ret?.return_type || ret?.return_type === 'exchange';
      showToast(`${isExch ? 'Exchange' : 'Return'} ${status} successfully`, 'success');
      fetchReturns();
      setSelectedReturn(null);
      setAdminNotes('');
    } catch (e) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const isExchange = (ret: Return) => !ret.return_type || ret.return_type === 'exchange';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' };
      case 'approved': return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-400' };
      case 'rejected': return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-400' };
      case 'refunded': return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' };
      case 'completed': return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' };
      default: return { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' };
    }
  };

  const getStatusLabel = (ret: Return) => {
    const exch = isExchange(ret);
    if (ret.status === 'pending') return exch ? 'Exchange Pending' : 'Return Pending';
    if (ret.status === 'approved') return exch ? 'Exchange Approved' : 'Return Approved';
    if (ret.status === 'completed') return 'Exchanged';
    if (ret.status === 'refunded') return 'Refunded';
    if (ret.status === 'rejected') return exch ? 'Exchange Rejected' : 'Return Rejected';
    return ret.status;
  };

  const getReasonLabel = (reason: string) => ({
    defective: 'Defective Product', wrong_item: 'Wrong Item',
    not_as_described: 'Not as Described', size_issue: 'Size Issue',
    changed_mind: 'Changed Mind', other: 'Other',
  }[reason] || reason);

  const filters = [
    { key: 'all', label: 'All', color: 'bg-gray-800 dark:bg-white text-white dark:text-gray-900' },
    { key: 'exchange_pending', label: '🔄 Exchange', color: 'bg-blue-500 text-white' },
    { key: 'return_pending', label: '↩ Return', color: 'bg-orange-500 text-white' },
    { key: 'approved', label: 'Approved', color: 'bg-blue-500 text-white' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-500 text-white' },
    { key: 'completed', label: 'Exchanged', color: 'bg-blue-600 text-white' },
    { key: 'refunded', label: 'Refunded', color: 'bg-emerald-500 text-white' },
  ];

  const getCount = (key: string) => {
    if (key === 'all') return returns.length;
    if (key === 'exchange_pending') return returns.filter(r => isExchange(r) && r.status === 'pending').length;
    if (key === 'return_pending') return returns.filter(r => r.return_type === 'refund' && r.status === 'pending').length;
    return returns.filter(r => r.status === key).length;
  };

  const filteredReturns = returns.filter(ret => {
    const q = searchTerm.toLowerCase();
    const matchSearch = ret.product_name.toLowerCase().includes(q) ||
      ret.user?.email?.toLowerCase().includes(q) ||
      ret.user?.full_name?.toLowerCase().includes(q);
    let matchFilter = false;
    if (filterStatus === 'all') matchFilter = true;
    else if (filterStatus === 'exchange_pending') matchFilter = isExchange(ret) && ret.status === 'pending';
    else if (filterStatus === 'return_pending') matchFilter = ret.return_type === 'refund' && ret.status === 'pending';
    else matchFilter = ret.status === filterStatus;
    return matchSearch && matchFilter;
  });

  if (loading) return <LoadingState type="page" message="Loading Returns..." variant="spinner" />;

  return (
    <div className="space-y-5">

      {/* Review Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isExchange(selectedReturn) ? 'bg-blue-500' : 'bg-orange-500'}`} />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {isExchange(selectedReturn) ? '🔄 Exchange Request' : '↩ Return Request'}
                </h3>
              </div>
              <button onClick={() => { setSelectedReturn(null); setAdminNotes(''); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Product row */}
              <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                {selectedReturn.product_image && (
                  <img src={selectedReturn.product_image} alt={selectedReturn.product_name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">{selectedReturn.product_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Qty: {selectedReturn.quantity} &nbsp;·&nbsp; ₹{(selectedReturn.refund_amount || 0).toLocaleString()}
                  </p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      isExchange(selectedReturn)
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    }`}>
                      {isExchange(selectedReturn) ? <RefreshCw className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                      {isExchange(selectedReturn) ? 'Exchange' : 'Refund'}
                    </span>
                    {(() => {
                      const s = getStatusStyle(selectedReturn.status);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {getStatusLabel(selectedReturn)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Customer</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selectedReturn.user?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedReturn.user?.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Reason</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getReasonLabel(selectedReturn.reason)}</p>
                  {selectedReturn.reason_details && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{selectedReturn.reason_details}</p>
                  )}
                </div>
              </div>

              {/* Images */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Attached Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReturn.images.map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`img-${i}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Admin Notes
                </label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
                  placeholder="Notes shown to customer on rejection..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
              </div>

              {/* Action buttons */}
              {selectedReturn.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => updateReturnStatus(selectedReturn.id, 'approved', adminNotes)} disabled={updating}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-semibold disabled:opacity-60">
                    <Check className="w-4 h-4" />
                    {updating ? 'Saving...' : `Approve`}
                  </button>
                  <button onClick={() => updateReturnStatus(selectedReturn.id, 'rejected', adminNotes)} disabled={updating}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-60">
                    <X className="w-4 h-4" />
                    {updating ? 'Saving...' : `Reject`}
                  </button>
                </div>
              )}
              {selectedReturn.status === 'approved' && (
                <button onClick={() => updateReturnStatus(selectedReturn.id, isExchange(selectedReturn) ? 'completed' : 'refunded', adminNotes)}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold disabled:opacity-60">
                  <Check className="w-4 h-4" />
                  {updating ? 'Saving...' : isExchange(selectedReturn) ? 'Mark as Exchanged' : 'Mark as Refunded'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-gray-900 dark:text-gray-100">Returns</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{returns.length} total requests</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="space-y-3">
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {filters.map(({ key, label, color }) => {
              const count = getCount(key);
              const active = filterStatus === key;
              return (
                <button key={key} onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active ? color : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  {label} <span className={`ml-1 ${active ? 'opacity-80' : 'text-gray-400 dark:text-gray-500'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by product or customer..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
        </div>
      </div>

      {/* Empty States */}
      {returns.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Package className="w-14 h-14 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-900 dark:text-gray-100">No returns yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Return requests will appear here</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Search className="w-14 h-14 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-900 dark:text-gray-100">No results found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReturns.map((ret) => {
            const exch = isExchange(ret);
            const s = getStatusStyle(ret.status);
            return (
              <div key={ret.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex gap-3">
                    {/* Product image */}
                    {ret.product_image ? (
                      <img src={ret.product_image} alt={ret.product_name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 border border-gray-100 dark:border-gray-700" />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{ret.product_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 ml-2">
                          {new Date(ret.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>

                      {/* Customer */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {ret.user?.full_name || 'Unknown'} &nbsp;·&nbsp; {ret.user?.email || '—'}
                      </p>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {/* Type badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          exch ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                               : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                        }`}>
                          {exch ? <RefreshCw className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                          {exch ? 'Exchange' : 'Refund'}
                        </span>
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          {getStatusLabel(ret)}
                        </span>
                        {/* Reason */}
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {getReasonLabel(ret.reason)}
                        </span>
                      </div>

                      {/* Amount */}
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2">
                        ₹{(ret.refund_amount || 0).toLocaleString()}
                        <span className="text-xs font-normal text-gray-400 ml-1">· Qty {ret.quantity}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.admin_notes || ''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>

                  <div className="flex items-center gap-2">
                    {ret.status === 'pending' && (
                      <>
                        <button onClick={() => updateReturnStatus(ret.id, 'approved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => updateReturnStatus(ret.id, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {ret.status === 'approved' && (
                      <button onClick={() => updateReturnStatus(ret.id, exch ? 'completed' : 'refunded')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                        <Check className="w-3.5 h-3.5" />
                        {exch ? 'Mark Exchanged' : 'Mark Refunded'}
                      </button>
                    )}
                    {(ret.status === 'completed' || ret.status === 'refunded') && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Done</span>
                    )}
                    {ret.status === 'rejected' && (
                      <span className="text-xs text-red-500 font-semibold">✕ Rejected</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
