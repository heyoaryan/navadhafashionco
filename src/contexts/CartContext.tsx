import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { CartItem, Product } from '../types';

interface CartContextType {
  cartItems: (CartItem & { product: Product })[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<(CartItem & { product: Product })[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
      setCartId(null);
    }
  }, [user]);

  const getOrCreateCart = useCallback(async (): Promise<string | null> => {
    if (cartId) return cartId;
    if (!user) return null;

    const { data: existing } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      setCartId(existing.id);
      return existing.id;
    }

    const { data: created } = await supabase
      .from('cart')
      .insert([{ user_id: user.id }])
      .select()
      .single();

    if (created) {
      setCartId(created.id);
      return created.id;
    }
    return null;
  }, [user, cartId]);

  const refreshCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const id = await getOrCreateCart();
      if (!id) return;

      const { data: items } = await supabase
        .from('cart_items')
        .select('*, product:products(id, name, slug, price, sale_price, compare_at_price, main_image_url, stock_quantity, sizes, colors, is_active)')
        .eq('cart_id', id);

      setCartItems(items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getOrCreateCart]);

  const addToCart = useCallback(async (productId: string, quantity: number, size?: string, color?: string) => {
    if (!user) throw new Error('Must be logged in to add to cart');

    const id = await getOrCreateCart();
    if (!id) return;

    const existingItem = cartItems.find(
      item => item.product_id === productId && item.size === size && item.color === color
    );

    if (existingItem) {
      // Optimistic update
      const newQty = existingItem.quantity + quantity;
      setCartItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: newQty } : i));
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existingItem.id);
      if (error) {
        // Rollback
        setCartItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: existingItem.quantity } : i));
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert([{ cart_id: id, product_id: productId, quantity, size, color }]);
      if (error) throw error;
      await refreshCart();
    }
  }, [user, cartItems, getOrCreateCart, refreshCart]);

  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    // Optimistic update
    const previous = cartItems;
    setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) {
      setCartItems(previous);
      throw error;
    }
  }, [user, cartItems]);

  const removeFromCart = useCallback(async (itemId: string) => {
    if (!user) return;

    // Optimistic update
    const previous = cartItems;
    setCartItems(prev => prev.filter(i => i.id !== itemId));

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      setCartItems(previous);
      throw error;
    }
  }, [user, cartItems]);

  const clearCart = useCallback(async () => {
    if (!user) return;

    const id = await getOrCreateCart();
    if (!id) return;

    const previous = cartItems;
    setCartItems([]);

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', id);

    if (error) {
      setCartItems(previous);
      throw error;
    }
  }, [user, cartItems, getOrCreateCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
