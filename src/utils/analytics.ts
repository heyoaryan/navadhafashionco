import { supabase } from '../lib/supabase';

// Generate a session ID for tracking unique visitors
const getSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Track page view
export const trackPageView = async (pageUrl: string, pageTitle?: string) => {
  try {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    // Extract path from URL
    const url = new URL(pageUrl, window.location.origin);
    const pagePath = url.pathname;

    const { error } = await supabase.from('page_views').insert({
      page_url: pageUrl,
      page_path: pagePath,
      page_title: pageTitle || document.title,
      user_id: user?.id || null,
      session_id: sessionId,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });

    if (error) {
      console.error('Analytics: Page view tracking error:', error);
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error('Analytics: Could not track page view', error);
  }
};

// Track product view/click
export const trackProductAction = async (
  productId: string,
  actionType: 'view' | 'click' | 'add_to_cart' | 'add_to_wishlist'
) => {
  try {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('product_analytics').insert({
      product_id: productId,
      user_id: user?.id || null,
      session_id: sessionId,
      action_type: actionType,
    });

    if (error) {
      console.error('Analytics: Product action tracking error:', error);
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error('Analytics: Could not track product action', error);
  }
};

// Track user signup
export const trackSignup = async (userId: string, signupMethod: string = 'email') => {
  try {
    const sessionId = getSessionId();

    const { error } = await supabase.from('signup_tracking').insert({
      user_id: userId,
      session_id: sessionId,
      signup_method: signupMethod,
    });

    if (error) {
      console.error('Analytics: Signup tracking error:', error);
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error('Analytics: Could not track signup', error);
  }
};
