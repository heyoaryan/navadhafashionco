import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  const [loading, setLoading] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const refreshCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: cart } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('cart')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (newCart) {
          setCartItems([]);
        }
        return;
      }

      const { data: items } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products (*)
        `)
        .eq('cart_id', cart.id);

      setCartItems(items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number, size?: string, color?: string) => {
    if (!user) throw new Error('Must be logged in to add to cart');

    const { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let cartId = cart?.id;

    if (!cartId) {
      const { data: newCart } = await supabase
        .from('cart')
        .insert([{ user_id: user.id }])
        .select()
        .single();
      cartId = newCart?.id;
    }

    const existingItem = cartItems.find(
      item =>
        item.product_id === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItem) {
      await updateCartItem(existingItem.id, existingItem.quantity + quantity);
    } else {
      await supabase
        .from('cart_items')
        .insert([
          {
            cart_id: cartId,
            product_id: productId,
            quantity,
            size,
            color,
          },
        ]);

      await refreshCart();
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    if (!user) return;
    
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    await refreshCart();
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;
    
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    await refreshCart();
  };

  const clearCart = async () => {
    if (!user) return;

    const { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cart) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      await refreshCart();
    }
  };

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
