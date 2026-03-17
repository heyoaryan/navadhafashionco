import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlistItems, loading } = useWishlist();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <SEO title="Wishlist - NAVADHA Fashion Co" />
        <h2 className="text-3xl font-light mb-4">Sign in to view your wishlist</h2>
        <Link
          to="/auth"
          className="inline-block px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl font-light mb-4">Your wishlist is empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Save items you love for later.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <SEO 
        title="My Wishlist - NAVADHA Fashion Co"
        description="View and manage your saved items. Shop your favorite products from NAVADHA Fashion Co."
      />
      
      <Link
        to="/account"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Account
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider">My Wishlist</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {wishlistItems.map((item) => (
          <div key={item.id}>
            {item.product && <ProductCard product={item.product} />}
          </div>
        ))}
      </div>
    </div>
  );
}
