import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Cart() {
  const { cartItems, updateCartItem, removeFromCart, loading } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // Auto-select newly added items
  const allIds = cartItems.map(i => i.id);
  // Sync: if selectedIds has ids not in cart anymore, they'll just be ignored

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const selectedItems = cartItems.filter(i => selectedIds.has(i.id));
  const selectedTotal = selectedItems.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
  const shipping = selectedTotal >= 2999 ? 0 : selectedTotal > 0 ? 99 : 0;
  const tax = Math.round(selectedTotal * 0.05);
  const total = selectedTotal + shipping + tax;

  const handleCheckout = () => {
    if (profile?.role === 'admin') {
      alert('Admin accounts cannot place orders.');
      return;
    }
    if (selectedItems.length === 0) return;
    navigate('/checkout', { state: { selectedCartIds: Array.from(selectedIds) } });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl font-light mb-4">Your bag is empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Discover our latest collections and find your perfect style.
        </p>
        <Link
          to="/shop"
          className="inline-block px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-light tracking-wider mb-6 sm:mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-3 px-1 pb-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedIds.size === cartItems.length && cartItems.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
            <label htmlFor="select-all" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              Select All ({cartItems.length})
            </label>
          </div>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                selectedIds.has(item.id)
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/10'
                  : 'border-transparent bg-gray-50 dark:bg-gray-800'
              }`}
            >
              {/* Checkbox */}
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Image */}
              <Link
                to={`/product/${item.product?.slug}`}
                className="w-20 h-24 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                <img
                  src={item.product?.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Details */}
              <div className="flex-1 flex flex-col sm:flex-row justify-between gap-2">
                <div className="flex-1">
                  <Link
                    to={`/product/${item.product?.slug}`}
                    className="font-medium hover:text-rose-400 transition-colors text-sm sm:text-base"
                  >
                    {item.product?.name}
                  </Link>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.size && item.color && <span className="mx-2">|</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                  <p className="text-base sm:text-lg font-medium mt-2">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>

                  <div className="flex items-center gap-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                    <button
                      onClick={() => updateCartItem(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 rounded-l-md"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[32px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.id, Math.min(item.product?.stock_quantity ?? 99, item.quantity + 1))}
                      disabled={item.quantity >= (item.product?.stock_quantity ?? 99)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 rounded-r-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {item.product?.stock_quantity != null && item.quantity >= item.product.stock_quantity && item.product.stock_quantity > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      Only {item.product.stock_quantity} available
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary - only shows when items selected */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 sticky top-24">
            <h2 className="text-lg sm:text-xl font-medium mb-4">Order Summary</h2>

            {selectedItems.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select items to see summary</p>
              </div>
            ) : (
              <>
                {/* Selected items list */}
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span className="font-medium flex-shrink-0">
                        ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span>₹{selectedTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax (5%)</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {selectedTotal < 2999 && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">
                    Add ₹{(2999 - selectedTotal).toLocaleString()} more for free shipping
                  </p>
                )}
              </>
            )}

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0 || profile?.role === 'admin'}
              className="w-full py-3 sm:py-3.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base font-medium min-h-[48px] flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {selectedItems.length === 0
                ? 'Select items to checkout'
                : `Checkout (${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''})`}
            </button>

            <Link
              to="/shop"
              className="block w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-medium mt-3"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
