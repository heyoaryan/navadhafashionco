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
  const [showEmailForm, setShowEmailForm] = useState(false);
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
      <div className="min-h-screen h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-4 overflow-hidden">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block mb-2">
              <h1 className="brand-logo text-2xl sm:text-3xl mb-1 sm:mb-2" style={{ color: '#EE458F' }}>
                NAVADHA
              </h1>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-[0.5px] w-8 sm:w-12" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }}></div>
                <span className="text-[0.4rem] sm:text-[0.5rem] font-light tracking-[0.2em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                  FASHION CO
                </span>
                <div className="h-[0.5px] w-8 sm:w-12" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }}></div>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Reset your password</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="Enter your email"
                required
              />
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
                We'll send you a password reset link
              </p>
            </div>

            {error && (
              <div className="p-3 sm:p-4 rounded-lg text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 sm:p-4 rounded-lg text-xs sm:text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <div>{success}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setSuccess('');
                setEmail('');
              }}
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-4 overflow-hidden">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="inline-block mb-2">
            <h1 className="brand-logo text-2xl sm:text-3xl mb-1" style={{ color: '#EE458F' }}>
              NAVADHA
            </h1>
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-[0.5px] w-8 sm:w-12" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }}></div>
              <span className="text-[0.4rem] sm:text-[0.5rem] font-light tracking-[0.2em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                FASHION CO
              </span>
              <div className="h-[0.5px] w-8 sm:w-12" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }}></div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Social Login Buttons or Email Form */}
        {!showEmailForm ? (
          <>
            <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 sm:gap-3 font-medium text-sm sm:text-base text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{isLogin ? 'Continue with Google' : 'Create account with Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black dark:bg-white border-2 border-black dark:border-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2 sm:gap-3 font-medium text-sm sm:text-base text-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>{isLogin ? 'Continue with Apple' : 'Create account with Apple'}</span>
              </button>
            </div>

            {/* Continue with Email Button */}
            <div className="space-y-3 sm:space-y-4">
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 sm:gap-3 font-medium text-sm sm:text-base text-gray-700 dark:text-gray-200"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{isLogin ? 'Continue with Email' : 'Create account with Email'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Divider */}
            <div className="relative mb-5 sm:mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {isLogin ? 'Sign in with email' : 'Create account with email'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                    placeholder="Enter your full name"
                    required
                    minLength={3}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
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
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
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
                <div className="p-3 sm:p-4 rounded-lg text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      {error}
                      {error.includes('verify your email') && (
                        <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs opacity-80">
                          Didn't receive the email? Check your spam folder or contact support.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-3 sm:p-4 rounded-lg text-xs sm:text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {success}
                      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs opacity-80">
                        Didn't receive the email? Check your spam folder.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>

              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 text-rose-500 dark:text-pink-400 hover:text-rose-600 dark:hover:text-pink-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 sm:gap-3 font-medium text-sm sm:text-base text-gray-700 dark:text-gray-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to other options</span>
              </button>
            </form>
          </>
        )}

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setPassword('');
              setConfirmPassword('');
              setShowEmailForm(false);
            }}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
