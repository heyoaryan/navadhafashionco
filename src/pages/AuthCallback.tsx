import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loadPendingIntent, clearPendingIntent, markOAuthHandled } from '../lib/pendingIntent';
import { trackSignup } from '../utils/analytics';

async function flushAddToCart(userId: string, productId: string, quantity: number, size?: string, color?: string) {
  try {
    let { data: cart } = await supabase.from('cart').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) {
      const { data: created } = await supabase.from('cart').insert([{ user_id: userId }]).select().single();
      cart = created;
    }
    if (!cart) return;
    const { data: existing } = await supabase.from('cart_items').select('id, quantity')
      .eq('cart_id', cart.id).eq('product_id', productId)
      .eq('size', size ?? null).eq('color', color ?? null).maybeSingle();
    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert([{ cart_id: cart.id, product_id: productId, quantity, size, color }]);
    }
  } catch { /* ignore */ }
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Poll for session
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }

      if (!session) { navigate('/auth', { replace: true }); return; }

      const userId = session.user.id;

      // Detect new signup — check if this user_id already exists in signup_tracking.
      // If not, it's a brand new user. This is 100% reliable with no time windows.
      const provider = session.user.app_metadata?.provider || 'google';
      const { count } = await supabase
        .from('signup_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (count === 0) {
        trackSignup(userId, provider);
      }

      // Fetch profile role
      let role = 'customer';
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if (data) { role = data.role; break; }
        await new Promise(r => setTimeout(r, 500));
      }

      const intent = loadPendingIntent();
      clearPendingIntent();
      markOAuthHandled();

      if (intent?.action === 'buyNow') {
        // Full page redirect to avoid React state race conditions with Auth.tsx useEffect
        const state = encodeURIComponent(JSON.stringify({
          productId: intent.productId, productName: intent.productName,
          price: intent.price, quantity: intent.quantity,
          size: intent.size, color: intent.color
        }));
        window.location.replace(`/checkout?directBuy=${state}`);
        return;
      }

      if (intent?.action === 'addToCart') {
        await flushAddToCart(userId, intent.productId, intent.quantity, intent.size, intent.color);
        window.location.replace('/cart');
        return;
      }

      if (intent?.action === 'redirect') {
        // Validate same-origin before redirecting
        try {
          const url = new URL(intent.to, window.location.origin);
          if (url.origin === window.location.origin) {
            window.location.replace(url.pathname + url.search);
          } else {
            window.location.replace('/account');
          }
        } catch {
          window.location.replace('/account');
        }
        return;
      }

      navigate(role === 'admin' ? '/admin' : '/account', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
