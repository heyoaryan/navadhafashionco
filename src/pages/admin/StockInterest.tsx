import { useEffect, useState } from 'react';
import { Bell, Search, Package, Users, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import LoadingState from '../../components/LoadingState';

interface InterestEntry {
  id: string;
  product_id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  created_at: string;
  product: {
    name: string;
    slug: string;
    main_image_url: string | null;
    stock_quantity: number;
  }[] | null;
}

interface GroupedProduct {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  stock_quantity: number;
  count: number;
  entries: InterestEntry[];
}

export default function StockInterest() {
  const [grouped, setGrouped] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchInterest();
  }, []);

  const fetchInterest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_interest')
        .select(`
          id, product_id, user_id, email, name, created_at,
          product:products(name, slug, main_image_url, stock_quantity)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching interest:', error);
        return;
      }

      // Group by product
      const map = new Map<string, GroupedProduct>();
      for (const entry of (data || []) as InterestEntry[]) {
        const prod = Array.isArray(entry.product) ? entry.product[0] : entry.product;
        if (!prod) continue;
        if (!map.has(entry.product_id)) {
          map.set(entry.product_id, {
            product_id: entry.product_id,
            product_name: prod.name,
            product_slug: prod.slug,
            product_image: prod.main_image_url,
            stock_quantity: prod.stock_quantity,
            count: 0,
            entries: [],
          });
        }
        const g = map.get(entry.product_id)!;
        g.count++;
        g.entries.push(entry);
      }

      // Sort by most interested
      setGrouped(Array.from(map.values()).sort((a, b) => b.count - a.count));
    } catch (err) {
      console.error('Error fetching interest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string, productId: string) => {
    try {
      const { error } = await supabase.from('product_interest').delete().eq('id', id);
      if (error) throw error;
      setGrouped(prev =>
        prev
          .map(g =>
            g.product_id === productId
              ? { ...g, count: g.count - 1, entries: g.entries.filter(e => e.id !== id) }
              : g
          )
          .filter(g => g.count > 0)
      );
      showToast('Entry removed', 'success');
    } catch {
      showToast('Failed to remove entry', 'error');
    }
  };

  const filtered = grouped.filter(g =>
    g.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInterested = grouped.reduce((s, g) => s + g.count, 0);

  if (loading) return <LoadingState type="page" message="Loading Stock Interest..." variant="spinner" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-gray-900 dark:text-gray-100">
            Stock Interest
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalInterested} people interested across {grouped.length} out-of-stock products
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
          <Bell className="w-5 h-5 text-rose-500" />
          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{totalInterested} waiting</span>
        </div>
      </div>

      {/* Search */}
      {grouped.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
      )}

      {/* Empty state */}
      {grouped.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Bell className="w-14 h-14 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No interest registered yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            When customers click "Notify Me" on out-of-stock products, they'll appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No products match your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => (
            <div key={g.product_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              {/* Product row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                onClick={() => setExpandedProduct(expandedProduct === g.product_id ? null : g.product_id)}
              >
                {g.product_image ? (
                  <img src={g.product_image} alt={g.product_name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug">{g.product_name}</p>
                    {g.stock_quantity === 0 && (
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                        Out of Stock
                      </span>
                    )}
                    {g.stock_quantity > 0 && (
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Back in Stock ({g.stock_quantity})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{g.count} {g.count === 1 ? 'person' : 'people'} interested</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Interest count badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-full">
                    <Users className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{g.count}</span>
                  </div>

                  <Link
                    to={`/admin/products/${g.product_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Package className="w-4 h-4" />
                  </Link>

                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedProduct === g.product_id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded entries */}
              {expandedProduct === g.product_id && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/40">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interested Users</p>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {g.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                              {(entry.name || entry.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            {entry.name && <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.name}</p>}
                            <p className="text-xs text-gray-500 dark:text-gray-400">{entry.email || (entry.user_id ? 'Logged-in user' : 'Anonymous')}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id, g.product_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
