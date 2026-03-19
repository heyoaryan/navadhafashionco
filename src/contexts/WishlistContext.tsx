import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Product } from '../types';

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: Product;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    if (user) {
      refreshWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const refreshWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wishlist')
        .select('*, product:products (*)')
        .eq('user_id', user.id);
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.product_id === productId);
  }, [wishlistItems]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) throw new Error('Must be logged in to add to wishlist');

    // Optimistic update — add a placeholder item immediately
    const tempItem: WishlistItem = {
      id: `temp_${productId}`,
      user_id: user.id,
      product_id: productId,
      created_at: new Date().toISOString(),
      product: {} as Product,
    };
    setWishlistItems(prev => [...prev, tempItem]);

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert([{ user_id: user.id, product_id: productId }]);

      if (error && !error.message?.includes('duplicate')) throw error;
      // Refresh to get full product data
      await refreshWishlist();
    } catch (error: any) {
      // Rollback optimistic update
      setWishlistItems(prev => prev.filter(i => i.id !== `temp_${productId}`));
      if (!error.message?.includes('duplicate')) throw error;
    }
  }, [user, refreshWishlist]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user) return;

    // Optimistic update — remove immediately
    const previous = wishlistItems;
    setWishlistItems(prev => prev.filter(item => item.product_id !== productId));

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    } catch (error) {
      // Rollback
      setWishlistItems(previous);
      throw error;
    }
  }, [user, wishlistItems]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        loading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
