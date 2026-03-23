import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Package, Zap, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers, LayoutList } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import LoadingState from '../../components/LoadingState';
import { useDebounce } from '../../hooks/useDebounce';

interface QuickEditData {
  price: string;
  compare_at_price: string;
  stock_quantity: string;
  is_active: boolean;
}

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  casuals:      { label: 'Casuals',          color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  workwear:     { label: 'Workwear',         color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  ethnic:       { label: 'Ethnic',           color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  ethnics:      { label: 'Ethnics',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  'gym-attire': { label: 'Gym Attire',       color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  western:      { label: 'Western',          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  'indo-western':{ label: 'Indo-Western',    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  summer:       { label: 'Summer Collection',color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  winter:       { label: 'Winter Collection',color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  uncategorized:{ label: 'Uncategorized',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

// Categories that should be sub-grouped by gender
const GENDER_SUBCATEGORY_CATEGORIES = new Set(['workwear', 'ethnic', 'ethnics', 'casuals', 'gym-attire', 'western', 'indo-western']);

const GENDER_LABEL: Record<string, string> = {
  men: 'Men',
  women: 'Women',
  unisex: 'Unisex',
};

function getGroupKey(p: Product): string {
  if (p.season === 'summer') return 'summer';
  if (p.season === 'winter') return 'winter';
  const cat = p.category?.toLowerCase() || 'uncategorized';
  if (GENDER_SUBCATEGORY_CATEGORIES.has(cat) && p.gender) {
    return `${cat}__${p.gender.toLowerCase()}`;
  }
  return cat;
}

function getGroupLabel(key: string): { label: string; color: string } {
  if (key.includes('__')) {
    const [cat, gender] = key.split('__');
    const base = CATEGORY_CONFIG[cat] || { label: cat, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
    const genderLabel = GENDER_LABEL[gender] || gender.charAt(0).toUpperCase() + gender.slice(1);
    return { label: `${base.label} — ${genderLabel}`, color: base.color };
  }
  return CATEGORY_CONFIG[key] || { label: key.charAt(0).toUpperCase() + key.slice(1), color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [quickEditData, setQuickEditData] = useState<QuickEditData>({
    price: '', compare_at_price: '', stock_quantity: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchProducts = useCallback(async (pageNum = 1, search = '') => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (groupByCategory) {
        // Fetch all products for grouped view (no pagination)
        const { data, error, count } = await query;
        if (error) throw error;
        setProducts(data || []);
        setTotalCount(count || 0);
      } else {
        const from = (pageNum - 1) * PAGE_SIZE;
        query = query.range(from, from + PAGE_SIZE - 1);
        const { data, error, count } = await query;
        if (error) throw error;
        setProducts(data || []);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [groupByCategory]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, debouncedSearch);
  }, [debouncedSearch, fetchProducts, groupByCategory]);

  useEffect(() => {
    if (quickEditProduct) lockScroll();
    else unlockScroll();
    return () => unlockScroll();
  }, [quickEditProduct]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProducts(newPage, debouncedSearch);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts(page, debouncedSearch);
      showToast('Product deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    }
  };

  const openQuickEdit = (product: Product) => {
    setQuickEditProduct(product);
    setQuickEditData({
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
    });
  };

  const closeQuickEdit = () => {
    setQuickEditProduct(null);
    setQuickEditData({ price: '', compare_at_price: '', stock_quantity: '', is_active: true });
  };

  const handleQuickSave = async () => {
    if (!quickEditProduct) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          price: parseFloat(quickEditData.price),
          compare_at_price: quickEditData.compare_at_price ? parseFloat(quickEditData.compare_at_price) : null,
          stock_quantity: parseInt(quickEditData.stock_quantity),
          is_active: quickEditData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quickEditProduct.id);

      if (error) throw error;

      setProducts(products.map(p =>
        p.id === quickEditProduct.id
          ? { ...p, price: parseFloat(quickEditData.price), compare_at_price: quickEditData.compare_at_price ? parseFloat(quickEditData.compare_at_price) : null, stock_quantity: parseInt(quickEditData.stock_quantity), is_active: quickEditData.is_active }
          : p
      ));
      showToast('Product updated successfully', 'success');
      closeQuickEdit();
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Group products by category + gender
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const key = getGroupKey(p);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    // Sort groups: known categories first (men before women within same category), then uncategorized
    const catOrder = ['casuals', 'workwear', 'ethnic', 'ethnics', 'gym-attire', 'western', 'indo-western', 'summer', 'winter', 'uncategorized'];
    const genderOrder = ['men', 'women', 'unisex', ''];
    return [...map.entries()].sort(([a], [b]) => {
      const [aCat, aGender = ''] = a.includes('__') ? a.split('__') : [a, ''];
      const [bCat, bGender = ''] = b.includes('__') ? b.split('__') : [b, ''];
      const ai = catOrder.indexOf(aCat) === -1 ? 99 : catOrder.indexOf(aCat);
      const bi = catOrder.indexOf(bCat) === -1 ? 99 : catOrder.indexOf(bCat);
      if (ai !== bi) return ai - bi;
      return genderOrder.indexOf(aGender) - genderOrder.indexOf(bGender);
    });
  }, [products]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (loading) {
    return <LoadingState type="page" message="Loading Products..." variant="spinner" />;
  }

  // Reusable product row for table
  const ProductRow = ({ product }: { product: Product }) => (
    <tr key={product.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {product.main_image_url ? (
            <img src={product.main_image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-1">{product.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {product.sku && <span className="text-xs text-gray-400 font-mono">{product.sku}</span>}
              {product.gender && (
                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 capitalize">{product.gender}</span>
              )}
              {product.subcategory && (
                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 capitalize">{product.subcategory}</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">₹{product.price.toLocaleString()}</p>
        {product.compare_at_price && product.compare_at_price > product.price && <p className="text-xs text-gray-400 line-through">₹{product.compare_at_price.toLocaleString()}</p>}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
          product.stock_quantity > 10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
          product.stock_quantity > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        }`}>{product.stock_quantity} units</span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
          product.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-3 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openQuickEdit(product)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Quick Edit"><Zap className="w-4 h-4" /></button>
          <Link to={`/admin/products/${product.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Full Edit"><Edit className="w-4 h-4" /></Link>
          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </td>
    </tr>
  );

  // Reusable mobile card
  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* Top row: image + name + actions */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {product.main_image_url ? (
          <img src={product.main_image_url} alt={product.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-1">{product.name}</p>
          {product.sku && <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>}
          <div className="flex gap-1 mt-1 flex-wrap">
            {product.gender && <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 capitalize">{product.gender}</span>}
            {product.subcategory && <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 capitalize">{product.subcategory}</span>}
          </div>
        </div>
        {/* Action buttons - icon only, large touch targets */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => openQuickEdit(product)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors active:scale-95" title="Quick Edit"><Zap className="w-4 h-4" /></button>
          <Link to={`/admin/products/${product.id}`} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95" title="Edit"><Edit className="w-4 h-4" /></Link>
          <button onClick={() => handleDelete(product.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {/* Bottom row: price, stock, status */}
      <div className="flex items-center gap-3 px-3 pb-3">
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">₹{product.price.toLocaleString()}</p>
          {product.compare_at_price && product.compare_at_price > product.price && <p className="text-xs text-gray-400 line-through">₹{product.compare_at_price.toLocaleString()}</p>}
        </div>
        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
          product.stock_quantity > 10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
          product.stock_quantity > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        }`}>{product.stock_quantity} units</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
          product.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 animate-fade-in-fast max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Edit</h3>
              <button onClick={closeQuickEdit} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{quickEditProduct.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{quickEditProduct.sku || 'No SKU'}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price *</label>
                <input type="number" value={quickEditData.price} onChange={(e) => setQuickEditData({ ...quickEditData, price: e.target.value })} step="0.01" min="0" required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Compare at Price</label>
                <input type="number" value={quickEditData.compare_at_price} onChange={(e) => setQuickEditData({ ...quickEditData, compare_at_price: e.target.value })} step="0.01" min="0" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Stock Quantity *</label>
                <input type="number" value={quickEditData.stock_quantity} onChange={(e) => setQuickEditData({ ...quickEditData, stock_quantity: e.target.value })} min="0" required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={quickEditData.is_active} onChange={(e) => setQuickEditData({ ...quickEditData, is_active: e.target.checked })} className="w-4 h-4 text-rose-500 rounded focus:ring-rose-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleQuickSave} disabled={saving} className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={closeQuickEdit} className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1 sm:mb-2 text-gray-900 dark:text-gray-100">Products</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{totalCount} total products</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Group toggle */}
          <button
            onClick={() => setGroupByCategory(g => !g)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${groupByCategory ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            title={groupByCategory ? 'Switch to flat list' : 'Group by category'}
          >
            {groupByCategory ? <Layers className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
            <span className="hidden sm:inline">{groupByCategory ? 'Grouped' : 'Flat List'}</span>
          </button>
          <Link to="/admin/products/new" className="flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Search */}
      {products.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400" />
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">{searchTerm ? 'No products found' : 'No products yet'}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}</p>
          {!searchTerm && (
            <Link to="/admin/products/new" className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors">
              <Plus className="w-5 h-5" /> Add Your First Product
            </Link>
          )}
        </div>
      ) : groupByCategory ? (
        /* ── GROUPED VIEW ── */
        <div className="space-y-4">
          {grouped.map(([key, groupProducts]) => {
            const config = getGroupLabel(key);
            const isCollapsed = collapsedGroups.has(key);
            return (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${config.color}`}>{config.label}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{groupProducts.length} product{groupProducts.length !== 1 ? 's' : ''}</span>
                  </div>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                </button>

                {!isCollapsed && (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/20">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Price</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Stock</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {groupProducts.map(product => <ProductRow key={product.id} product={product} />)}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                      {groupProducts.map(product => <ProductCard key={product.id} product={product} />)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── FLAT LIST VIEW ── */
        <>
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Price</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Stock</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {products.map(product => <ProductRow key={product.id} product={product} />)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:hidden bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </>
      )}

      {/* Pagination - only in flat list view */}
      {!groupByCategory && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages} ({totalCount} products)</p>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === page ? 'bg-rose-500 text-white' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{pageNum}</button>
              );
            })}
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
