import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Package, Zap, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface QuickEditData {
  price: string;
  compare_at_price: string;
  stock_quantity: string;
  is_active: boolean;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [quickEditData, setQuickEditData] = useState<QuickEditData>({
    price: '',
    compare_at_price: '',
    stock_quantity: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
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
    setQuickEditData({
      price: '',
      compare_at_price: '',
      stock_quantity: '',
      is_active: true,
    });
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

      // Update local state
      setProducts(products.map(p => 
        p.id === quickEditProduct.id 
          ? {
              ...p,
              price: parseFloat(quickEditData.price),
              compare_at_price: quickEditData.compare_at_price ? parseFloat(quickEditData.compare_at_price) : null,
              stock_quantity: parseInt(quickEditData.stock_quantity),
              is_active: quickEditData.is_active,
            }
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 animate-fade-in-fast">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Edit</h3>
              <button
                onClick={closeQuickEdit}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{quickEditProduct.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{quickEditProduct.sku || 'No SKU'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price *</label>
                <input
                  type="number"
                  value={quickEditData.price}
                  onChange={(e) => setQuickEditData({ ...quickEditData, price: e.target.value })}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Compare at Price</label>
                <input
                  type="number"
                  value={quickEditData.compare_at_price}
                  onChange={(e) => setQuickEditData({ ...quickEditData, compare_at_price: e.target.value })}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Stock Quantity *</label>
                <input
                  type="number"
                  value={quickEditData.stock_quantity}
                  onChange={(e) => setQuickEditData({ ...quickEditData, stock_quantity: e.target.value })}
                  min="0"
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={quickEditData.is_active}
                    onChange={(e) => setQuickEditData({ ...quickEditData, is_active: e.target.checked })}
                    className="w-4 h-4 text-rose-500 rounded focus:ring-rose-400"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleQuickSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={closeQuickEdit}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1 sm:mb-2 text-gray-900 dark:text-gray-100">Products</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{products.length} total products</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Product
        </Link>
      </div>

      {products.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No products yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first product to the inventory
          </p>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Product
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No products found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.main_image_url && (
                          <img src={product.main_image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{product.sku || '-'}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">₹{product.price.toLocaleString()}</p>
                      {product.compare_at_price && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-through">₹{product.compare_at_price.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock_quantity > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {product.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openQuickEdit(product)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Quick Edit"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <Link 
                          to={`/admin/products/${product.id}`} 
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Full Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  {product.main_image_url && (
                    <img src={product.main_image_url} alt={product.name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{product.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.slug}</p>
                    {product.sku && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">SKU: {product.sku}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">₹{product.price.toLocaleString()}</p>
                    {product.compare_at_price && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-through">₹{product.compare_at_price.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Stock</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.stock_quantity > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {product.stock_quantity}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openQuickEdit(product)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                      title="Quick Edit"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <Link 
                      to={`/admin/products/${product.id}`} 
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Full Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(product.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
