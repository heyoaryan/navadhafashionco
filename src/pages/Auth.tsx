import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { trackSignup } from '../utils/analytics';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(
    () => new URLSearchParams(window.location.search).get('blocked') === '1'
  );
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (new URLSearchParams(location.search).get('blocked') === '1') {
      setIsBlacklisted(true);
    }
  }, [location.search]);
  const { user, profile, signUp: authSignUp, signIn: authSignIn } = useAuth();
  const { addToCart } = useCart();

  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=85', // woman fashion
    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1400&q=85', // man fashion
  ];

  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, []);
  const from = (location.state as any)?.from || null;
  const action = (location.state as any)?.action || null;

  useEffect(() => {
    const handlePostLoginRedirect = async () => {
      if (user && profile) {
        // Check blacklist first — both fields
        if (profile.is_blacklisted) {
          setIsBlacklisted(true);
          await supabase.auth.signOut();
          return;
        }

        // Also check blacklist table
        const { data: bl } = await supabase
          .from('blacklist')
          .select('id')
          .eq('entity_id', user.id)
          .eq('entity_type', 'customer')
          .eq('is_active', true)
          .maybeSingle();

        if (bl) {
          setIsBlacklisted(true);
          await supabase.auth.signOut();
          return;
        }

        const pendingCartItemStr = localStorage.getItem('pendingCartItem');
        if (pendingCartItemStr) {
          try {
            const pendingCartItem = JSON.parse(pendingCartItemStr);
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - pendingCartItem.timestamp < oneHour) {
              await addToCart(pendingCartItem.productId, pendingCartItem.quantity, pendingCartItem.size, pendingCartItem.color);
              localStorage.removeItem('pendingCartItem');
              navigate('/cart');
              return;
            } else {
              localStorage.removeItem('pendingCartItem');
            }
          } catch {
            localStorage.removeItem('pendingCartItem');
          }
        }
        if (from) {
          if (action === 'buyNow') navigate('/checkout');
          else if (action === 'addToCart') navigate('/cart');
          else navigate(from);
        } else if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/account');
        }
      }
    };
    handlePostLoginRedirect();
  }, [user, profile, navigate, from, action, addToCart]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    if (!email.trim()) { setError('Please enter your email address.'); setLoading(false); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      setSuccess('Password reset link sent! Please check your email.');
      setTimeout(() => { setShowForgotPassword(false); setSuccess(''); setEmail(''); }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    if (!isLogin) {
      if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
      if (fullName.trim().length < 3) { setError('Full name must be at least 3 characters long.'); setLoading(false); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
    }
    if (!email.trim()) { setError('Please enter your email address.'); setLoading(false); return; }
    if (!password) { setError('Please enter your password.'); setLoading(false); return; }
    if (!isLogin && password.length < 6) { setError('Password must be at least 6 characters long.'); setLoading(false); return; }
    try {
      if (isLogin) {
        await authSignIn(email, password);
      } else {
        try {
          const result: any = await authSignUp(email, password, fullName);
          if (result?.user?.id) await trackSignup(result.user.id, 'email');
          if (result?.user?.confirmed_at || result?.session) {
            setSuccess('Account created successfully! You can now sign in.');
            setTimeout(() => { setIsLogin(true); setSuccess(''); setPassword(''); setConfirmPassword(''); }, 2000);
          } else {
            setSuccess('Account created! Please contact support if you cannot sign in.');
            setTimeout(() => { setIsLogin(true); setSuccess(''); setPassword(''); setConfirmPassword(''); setEmail(''); setFullName(''); }, 8000);
          }
        } catch (signupError: any) {
          if (signupError.message?.includes('rate limit') || signupError.message?.includes('Email rate limit exceeded')) {
            setError('Too many signup attempts. Please wait 5 minutes and try again.');
          } else if (signupError.message?.includes('User already registered') || signupError.message?.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
            setTimeout(() => { setIsLogin(true); setError(''); }, 3000);
          } else if (signupError.message?.includes('Password')) {
            setError('Password must be at least 6 characters long.');
          } else {
            setError(signupError.message || 'Signup failed. Please try again.');
          }
          throw signupError;
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (err.message === 'BLACKLISTED') {
        setIsBlacklisted(true);
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Wrong email or password. Please try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email before signing in.');
      } else if (!err.message?.includes('rate limit') && !err.message?.includes('already registered') && !err.message?.includes('Password')) {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError(''); setLoading(true);
    try {
      // Save pending redirect so callback page knows where to go
      if (from) {
        if (action === 'buyNow') localStorage.setItem('pendingRedirect', '/checkout');
        else if (action === 'addToCart') localStorage.setItem('pendingRedirect', '/cart');
        else localStorage.setItem('pendingRedirect', from);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: 'offline', prompt: 'consent' } },
      });
      if (error) throw error;
    } catch (err: any) {
      localStorage.removeItem('pendingRedirect');
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  // ── Shared UI helpers ──────────────────────────────────────────────────────
  const ErrorMsg = () => error ? (
    <div className="p-3.5 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-start gap-2.5">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
      </svg>
      <span>{error}</span>
    </div>
  ) : null;

  const SuccessMsg = () => success ? (
    <div className="p-3.5 rounded-xl text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-start gap-2.5">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
      <span>{success}</span>
    </div>
  ) : null;

  const BrandLogo = () => (
    <div className="flex flex-col items-center">
      <h1 className="brand-logo text-4xl bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent leading-tight tracking-widest">
        NAVADHA
      </h1>
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <div className="h-px w-10 bg-gradient-to-r from-transparent to-rose-400"></div>
        <span className="text-[0.5rem] font-light tracking-[0.4em] text-rose-400 uppercase">Fashion Co</span>
        <div className="h-px w-10 bg-gradient-to-l from-transparent to-rose-400"></div>
      </div>
    </div>
  );

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );

  // ── Blacklisted Screen ────────────────────────────────────────────────────
  if (isBlacklisted) {
    return (
      <div className="min-h-screen flex lg:flex-row flex-col">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
          {slides.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{ backgroundImage: `url('${src}')`, opacity: i === slideIndex ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-black/60"/>
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950/70 via-transparent to-transparent"/>
          <div className="relative z-10 flex flex-col items-center justify-center p-14 text-white w-full text-center">
            <div className="mb-10">
              <h1 className="brand-logo text-5xl leading-tight tracking-widest bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">NAVADHA</h1>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-px w-14 bg-rose-400/70"/>
                <span className="text-[0.5rem] font-light tracking-[0.4em] text-rose-300">FASHION CO</span>
                <div className="h-px w-14 bg-rose-400/70"/>
              </div>
            </div>
            <div className="max-w-sm">
              <h2 className="text-4xl font-bold leading-tight mb-4">Access<br/>Denied</h2>
              <p className="text-rose-200/80 text-base leading-relaxed">
                This account has been restricted from accessing our platform.
              </p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 px-6 py-12">
          <div className="w-full max-w-sm text-center">

            {/* Mobile brand */}
            <div className="lg:hidden mb-10">
              <BrandLogo />
            </div>

            {/* Icon */}
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Restricted</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
              Your account has been suspended due to a violation of our platform policies. If you believe this is a mistake, please reach out to our support team.
            </p>

            <a
              href="mailto:support@navadhafashion.com"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Contact Support
            </a>

            <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
              support@navadhafashion.com
            </p>

            <button
              onClick={() => setIsBlacklisted(false)}
              className="mt-8 text-xs text-gray-400 hover:text-rose-500 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot Password View ───────────────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex lg:flex-row flex-col">
        {/* Left panel – desktop only */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-rose-900 via-pink-800 to-rose-700">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80')] bg-cover bg-center opacity-30"/>
          <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
            <BrandLogo />
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">Reset your<br/>password</h2>
              <p className="text-rose-200 text-lg">We'll send a secure link to your inbox.</p>
            </div>
            <div className="flex gap-6 text-sm text-rose-200">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Secure</span>
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> Trusted</span>
            </div>
          </div>
        </div>

        {/* Right panel – form */}
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8 text-center"><BrandLogo /></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot password?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Enter your email and we'll send a reset link.</p>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="your@email.com" required/>
                </div>
              </div>
              <ErrorMsg/><SuccessMsg/>
              <button type="submit" disabled={loading}
                className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-200 dark:shadow-none">
                {loading ? <><Spinner/><span>Sending...</span></> : <><Mail className="w-4 h-4"/><span>Send Reset Link</span></>}
              </button>
            </form>

            <button onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); setEmail(''); }}
              className="mt-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Auth View ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex lg:flex-row flex-col">

      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Slideshow images – crossfade */}
        {slides.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url('${src}')`, opacity: i === slideIndex ? 1 : 0 }}
          />
        ))}
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/55"/>
        {/* Subtle rose tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/60 via-transparent to-transparent"/>

        <div className="relative z-10 flex flex-col items-center justify-center p-14 text-white w-full text-center">
          {/* Brand – centered */}
          <div className="mb-10">
            <h1 className="brand-logo text-5xl leading-tight tracking-widest bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">NAVADHA</h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px w-14 bg-rose-400/70"/>
              <span className="text-[0.5rem] font-light tracking-[0.4em] text-rose-300">FASHION CO</span>
              <div className="h-px w-14 bg-rose-400/70"/>
            </div>
          </div>

          {/* Hero text */}
          <div className="max-w-md">
            <h2 className="text-5xl font-bold leading-[1.15] mb-5">
              {isLogin ? <>Welcome<br/>back.</> : <>Join the<br/>fashion<br/>movement.</>}
            </h2>
            <p className="text-rose-200/90 text-lg leading-relaxed">
              {isLogin
                ? 'Sign in to explore your curated wardrobe, track orders, and discover new arrivals.'
                : 'Create your account and unlock exclusive collections, early access, and personalised style.'}
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 text-sm mt-10">
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Sparkles className="w-4 h-4 text-rose-300"/> Exclusive Collections
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Truck className="w-4 h-4 text-rose-300"/> Free Shipping
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <ShieldCheck className="w-4 h-4 text-rose-300"/> Secure Checkout
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 px-6 py-10 lg:py-0 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile brand – centered */}
          <div className="lg:hidden text-center mb-10 pt-4">
            <BrandLogo />
          </div>

          {/* Heading – always centered */}
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-1">
              {isLogin ? 'Welcome back' : 'Get started'}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
          </div>

          {/* ── Social buttons or email form ── */}
          {!showEmailForm ? (
            <div className="space-y-3">
              {/* Email CTA – first */}
              <button type="button" onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none">
                <Mail className="w-4 h-4"/>
                {isLogin ? 'Continue with Email' : 'Sign up with Email'}
              </button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"/>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white dark:bg-gray-950 text-xs text-gray-400 font-medium">or</span>
                </div>
              </div>

              {/* Google */}
              <button type="button" onClick={() => handleSocialLogin('google')} disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => setShowEmailForm(false)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-500 transition-colors mb-6">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Other sign in options
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="Your full name" required minLength={3}/>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="your@email.com" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="••••••••" required minLength={6}/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-11 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all placeholder:text-gray-400"
                        placeholder="••••••••" required minLength={6}/>
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                )}

                <ErrorMsg/><SuccessMsg/>

                <button type="submit" disabled={loading}
                  className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-200 dark:shadow-none mt-1">
                  {loading ? <><Spinner/><span>Please wait...</span></> : <span>{isLogin ? 'Sign In' : 'Create Account'}</span>}
                </button>

                {isLogin && (
                  <div className="text-center">
                    <button type="button" onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-gray-500 hover:text-rose-500 transition-colors">
                      Forgot your password?
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Toggle login / signup */}
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setPassword(''); setConfirmPassword(''); setShowEmailForm(false); }}
              className="font-semibold text-rose-500 hover:text-rose-600 transition-colors">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
            By continuing you agree to our{' '}
            <a href="/privacy" className="text-pink-500 hover:text-pink-600 transition-colors" style={{ textDecoration: 'none' }}>privacy policy</a>
            {' '}and{' '}
            <a href="/terms" className="text-pink-500 hover:text-pink-600 transition-colors" style={{ textDecoration: 'none' }}>terms of use</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
