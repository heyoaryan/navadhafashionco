import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Cart() {
  const { cartItems, cartTotal, updateCartItem, removeFromCart, loading } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Check if user is admin
    if (profile?.role === 'admin') {
      alert('Admin accounts cannot place orders. Please use a customer account.');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
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
          className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
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
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <Link
                to={`/product/${item.product?.slug}`}
                className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                <img
                  src={item.product?.main_image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1">
                  <Link
                    to={`/product/${item.product?.slug}`}
                    className="font-medium hover:text-rose-400 transition-colors text-sm sm:text-base"
                  >
                    {item.product?.name}
                  </Link>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.size && item.color && <span className="mx-2">|</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                  <p className="text-base sm:text-lg font-medium mt-2">
                    ₹{item.product?.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 sm:p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all order-2 sm:order-1 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </button>

                  <div className="flex items-center gap-1 sm:gap-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg order-1 sm:order-2 shadow-sm">
                    <button
                      onClick={() => updateCartItem(item.id, item.quantity - 1)}
                      className="p-2 sm:p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 rounded-l-lg"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="px-3 sm:px-4 text-sm sm:text-base font-medium min-w-[40px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.id, item.quantity + 1)}
                      className="p-2 sm:p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 rounded-r-lg"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 sticky top-24">
            <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-6">Order Summary</h2>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span>{cartTotal >= 2999 ? 'Free' : '₹99'}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span>₹{Math.round(cartTotal * 0.18).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 sm:pt-3 flex justify-between text-base sm:text-lg font-medium">
                <span>Total</span>
                <span>
                  ₹
                  {(
                    cartTotal +
                    (cartTotal >= 2999 ? 0 : 99) +
                    Math.round(cartTotal * 0.18)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="block w-full py-3 sm:py-3.5 md:py-4 bg-black dark:bg-white text-white dark:text-black text-center hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 mb-3 text-sm sm:text-base font-medium min-h-[48px] flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={profile?.role === 'admin'}
            >
              {profile?.role === 'admin' ? 'Admin Cannot Checkout' : 'Proceed to Checkout'}
            </button>

            <Link
              to="/shop"
              className="block w-full py-3 sm:py-3.5 md:py-4 border-2 border-gray-300 dark:border-gray-600 text-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base font-medium min-h-[48px] flex items-center justify-center"
            >
              Continue Shopping
            </Link>

            {cartTotal < 2999 && (
              <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 mt-3 sm:mt-4">
                Add ₹{(2999 - cartTotal).toLocaleString()} more to get free shipping!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
