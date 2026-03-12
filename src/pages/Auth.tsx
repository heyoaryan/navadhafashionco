import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signUp: authSignUp, signIn: authSignIn } = useAuth();
  const { addToCart } = useCart();

  // Get redirect path from location state
  const from = (location.state as any)?.from || null;
  const action = (location.state as any)?.action || null;

  // Redirect based on role when user is logged in
  useEffect(() => {
    const handlePostLoginRedirect = async () => {
      if (user && profile) {
        // Check for pending cart item
        const pendingCartItemStr = localStorage.getItem('pendingCartItem');
        
        if (pendingCartItemStr) {
          try {
            const pendingCartItem = JSON.parse(pendingCartItemStr);
            
            // Check if item is not too old (within 1 hour)
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - pendingCartItem.timestamp < oneHour) {
              // Add item to cart
              await addToCart(
                pendingCartItem.productId,
                pendingCartItem.quantity,
                pendingCartItem.size,
                pendingCartItem.color
              );
              
              // Clear the pending item
              localStorage.removeItem('pendingCartItem');
              
              // Redirect to cart page
              navigate('/cart');
              return;
            } else {
              // Item too old, clear it
              localStorage.removeItem('pendingCartItem');
            }
          } catch (error) {
            console.error('Error processing pending cart item:', error);
            localStorage.removeItem('pendingCartItem');
          }
        }
        
        // If there's a redirect path, go there
        if (from) {
          if (action === 'buyNow') {
            // If user was trying to buy now, redirect to checkout
            navigate('/checkout');
          } else if (action === 'addToCart') {
            // If user was trying to add to cart, redirect to cart
            navigate('/cart');
          } else {
            // Otherwise go back to the product page
            navigate(from);
          }
        } else if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          // Redirect to account page for regular users
          navigate('/account');
        }
      }
    };
    
    handlePostLoginRedirect();
  }, [user, profile, navigate, from, action, addToCart]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.trim()) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setSuccess('Password reset link sent! Please check your email.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccess('');
        setEmail('');
      }, 3000);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation for signup
    if (!isLogin) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (fullName.trim().length < 3) {
        setError('Full name must be at least 3 characters long.');
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await authSignIn(email, password);
      } else {
        try {
          const result: any = await authSignUp(email, password, fullName);
          
          // Track signup
          if (result?.user?.id) {
            await trackSignup(result.user.id, 'email');
          }
          
          // Check if user is automatically confirmed (email confirmation disabled)
          if (result?.user?.confirmed_at || result?.session) {
            // User is auto-confirmed, they can login immediately
            setSuccess('Account created successfully! You can now sign in.');
            setTimeout(() => {
              setIsLogin(true);
              setSuccess('');
              setPassword('');
              setConfirmPassword('');
            }, 2000);
          } else {
            // Email confirmation is required
            setSuccess('Account created! Email verification is enabled but emails may not be working. Please contact support or ask admin to disable email confirmation in Supabase dashboard.');
            setTimeout(() => {
              setIsLogin(true);
              setSuccess('');
              setPassword('');
              setConfirmPassword('');
              setEmail('');
              setFullName('');
            }, 8000);
          }
        } catch (signupError: any) {
          if (signupError.message?.includes('rate limit') || 
              signupError.message?.includes('Email rate limit exceeded')) {
            setError('Too many signup attempts. Please wait 5 minutes and try again.');
          } else if (signupError.message?.includes('User already registered') || 
              signupError.message?.includes('already registered')) {
            setError('This email is already registered. Please sign in instead or use forgot password.');
            setTimeout(() => {
              setIsLogin(true);
              setError('');
            }, 3000);
          } else if (signupError.message?.includes('Password')) {
            setError('Password must be at least 6 characters long.');
          } else {
            setError(signupError.message || 'Signup failed. Please try again or contact support.');
          }
          throw signupError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err: any) {
      
      if (err.message?.includes('Failed to fetch') || 
          err.message?.includes('NetworkError') ||
          err.message?.includes('fetch failed')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Wrong email or password. Please try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else if (!err.message?.includes('rate limit') && 
                 !err.message?.includes('already registered') &&
                 !err.message?.includes('Password')) {
        // Only set error if not already handled by signup catch
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error(`${provider} login error:`, err);
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 px-4 py-6 sm:py-8">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Card with better shadow and border */}
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 lg:p-10 transition-all duration-300">
            {/* Logo Section */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-block mb-3 sm:mb-4">
                <h1 className="brand-logo text-2xl sm:text-3xl lg:text-4xl mb-1.5 sm:mb-2 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                  NAVADHA
                </h1>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent via-rose-400 to-rose-500"></div>
                  <span className="text-[0.45rem] sm:text-[0.5rem] font-light tracking-[0.3em] text-rose-500">
                    FASHION CO
                  </span>
                  <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent via-rose-400 to-rose-500"></div>
                </div>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white mb-1.5 sm:mb-2">
                Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Enter your email to receive a reset link
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                  We'll send you a secure password reset link
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800 animate-shake">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800 animate-slideDown">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{success}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-base font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setSuccess('');
                  setEmail('');
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Card with better shadow and border */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10 transition-all duration-300">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <h1 className="brand-logo text-3xl sm:text-4xl mb-2 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                NAVADHA
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-rose-400 to-rose-500"></div>
                <span className="text-[0.5rem] font-light tracking-[0.3em] text-rose-500">
                  FASHION CO
                </span>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-rose-400 to-rose-500"></div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? 'Sign in to continue shopping' : 'Join us for exclusive fashion'}
            </p>
          </div>

        {/* Social Login Buttons or Email Form */}
        {!showEmailForm ? (
          <div className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center gap-3 font-medium text-base text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-black dark:bg-white border-2 border-black dark:border-white rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-3 font-medium text-base text-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>{isLogin ? 'Continue with Apple' : 'Sign up with Apple'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Button */}
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mail className="w-5 h-5" />
              <span>{isLogin ? 'Sign in with Email' : 'Sign up with Email'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Other sign in options
            </button>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                    placeholder="John Doe"
                    required
                    minLength={3}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 text-base bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 text-base bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800 animate-shake">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      {error}
                      {error.includes('verify your email') && (
                        <p className="mt-2 text-xs opacity-80">
                          Didn't receive the email? Check your spam folder or contact support.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800 animate-slideDown">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{success}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-base font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>

              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-rose-500 dark:text-pink-400 hover:text-rose-600 dark:hover:text-pink-300 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Toggle between Login/Signup */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setPassword('');
                setConfirmPassword('');
                setShowEmailForm(false);
              }}
              className="font-semibold text-rose-500 dark:text-pink-400 hover:text-rose-600 dark:hover:text-pink-300 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
  );
}
