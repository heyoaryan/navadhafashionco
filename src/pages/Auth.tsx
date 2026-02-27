import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signUp: authSignUp, signIn: authSignIn } = useAuth();

  // Get redirect path from location state
  const from = (location.state as any)?.from || null;
  const action = (location.state as any)?.action || null;

  // Redirect based on role when user is logged in
  useEffect(() => {
    if (user && profile) {
      // If there's a redirect path, go there
      if (from) {
        if (action === 'buyNow') {
          // If user was trying to buy now, redirect to checkout
          navigate('/checkout');
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
  }, [user, profile, navigate, from, action]);

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
          
          setSuccess('Account created successfully! Please check your email to verify your account before signing in.');
          
          setTimeout(() => {
            setIsLogin(true);
            setSuccess('');
            setPassword('');
            setConfirmPassword('');
            setEmail('');
            setFullName('');
          }, 5000);
        } catch (signupError: any) {
          if (signupError.message?.includes('rate limit') || 
              signupError.message?.includes('Email rate limit exceeded')) {
            setError('Too many signup attempts. Please wait a few minutes and try again, or use a different email address.');
          } else if (signupError.message?.includes('User already registered') || 
              signupError.message?.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else if (signupError.message?.includes('Password')) {
            setError('Password must be at least 6 characters long.');
          } else {
            setError(signupError.message || 'Signup failed. Please try again.');
          }
          throw signupError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err: any) {
      
      if (err.message?.includes('Failed to fetch') || 
          err.message?.includes('NetworkError') ||
          err.message?.includes('fetch failed')) {
        setError('❌ Cannot connect to server. Please check your internet connection.');
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

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-2">
              <h1 className="brand-logo text-3xl mb-2" style={{ color: '#EE458F' }}>
                NAVADHA
              </h1>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-[0.5px] w-10 sm:w-12" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }}></div>
                <span className="text-[0.45rem] sm:text-[0.5rem] font-light tracking-[0.2em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                  FASHION CO
                </span>
                <div className="h-[0.5px] w-10 sm:w-12" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }}></div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Reset your password</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="Enter your email"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                We'll send you a password reset link
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{success}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium min-h-[52px] flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setSuccess('');
                setEmail('');
              }}
              className="text-xs sm:text-sm px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block mb-2">
            <h1 className="brand-logo text-3xl mb-2" style={{ color: '#EE458F' }}>
              NAVADHA
            </h1>
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-[0.5px] w-10 sm:w-12" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }}></div>
              <span className="text-[0.45rem] sm:text-[0.5rem] font-light tracking-[0.2em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                FASHION CO
              </span>
              <div className="h-[0.5px] w-10 sm:w-12" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }}></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="Enter your full name"
                required
                minLength={3}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
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
            <div className="p-4 rounded-lg text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {success}
                  <p className="mt-2 text-xs opacity-80">
                    Didn't receive the email? Check your spam folder.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium min-h-[52px] flex items-center justify-center shadow-lg hover:shadow-xl"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          {isLogin && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs sm:text-sm px-3 py-2 text-rose-500 dark:text-pink-400 hover:text-rose-600 dark:hover:text-pink-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs sm:text-sm px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
