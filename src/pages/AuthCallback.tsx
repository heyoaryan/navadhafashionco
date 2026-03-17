import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for AuthContext onAuthStateChange to process blacklist check first
      // It will redirect to /auth?blocked=1 if blacklisted
      // We just need to handle the redirect for non-blocked users

      // Poll for session — onAuthStateChange sets it after blacklist check passes
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }

      if (!session) {
        // Either blacklisted (already redirected) or error
        navigate('/auth', { replace: true });
        return;
      }

      const userId = session.user.id;

      // Fetch profile for redirect logic
      let profileData: { role: string } | null = null;
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        if (data) { profileData = data; break; }
        await new Promise(r => setTimeout(r, 500));
      }

      // Handle pending cart item
      const pendingCartItemStr = localStorage.getItem('pendingCartItem');
      if (pendingCartItemStr) {
        try {
          const pendingCartItem = JSON.parse(pendingCartItemStr);
          if (Date.now() - pendingCartItem.timestamp < 60 * 60 * 1000) {
            navigate('/cart', { replace: true });
            return;
          }
        } catch { /* ignore */ }
        localStorage.removeItem('pendingCartItem');
      }

      // Handle pending redirect
      const pendingRedirect = localStorage.getItem('pendingRedirect');
      if (pendingRedirect) {
        localStorage.removeItem('pendingRedirect');
        navigate(pendingRedirect, { replace: true });
        return;
      }

      if (profileData?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
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
