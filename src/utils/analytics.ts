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
  } catch {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// --- Batching queue ---
interface AnalyticsEvent {
  table: string;
  payload: Record<string, unknown>;
}

const eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const enqueue = (table: string, payload: Record<string, unknown>) => {
  eventQueue.push({ table, payload });
  if (!flushTimer) {
    flushTimer = setTimeout(flushQueue, 2000); // flush every 2s
  }
};

const flushQueue = async () => {
  flushTimer = null;
  if (eventQueue.length === 0) return;

  // Group by table
  const byTable: Record<string, Record<string, unknown>[]> = {};
  while (eventQueue.length > 0) {
    const event = eventQueue.shift()!;
    if (!byTable[event.table]) byTable[event.table] = [];
    byTable[event.table].push(event.payload);
  }

  // Batch insert per table
  await Promise.allSettled(
    Object.entries(byTable).map(([table, rows]) =>
      supabase.from(table).insert(rows)
    )
  );
};

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushQueue();
  });
}

// Track page view
export const trackPageView = async (pageUrl: string, pageTitle?: string) => {
  try {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();
    const url = new URL(pageUrl, window.location.origin);

    enqueue('page_views', {
      page_url: pageUrl,
      page_path: url.pathname,
      page_title: pageTitle || document.title,
      user_id: user?.id || null,
      session_id: sessionId,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch {
    // Silently fail — analytics must not break the app
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

    enqueue('product_analytics', {
      product_id: productId,
      user_id: user?.id || null,
      session_id: sessionId,
      action_type: actionType,
    });
  } catch {
    // Silently fail
  }
};

// Track user signup
export const trackSignup = async (userId: string, signupMethod: string = 'email') => {
  try {
    const sessionId = getSessionId();
    enqueue('signup_tracking', {
      user_id: userId,
      session_id: sessionId,
      signup_method: signupMethod,
    });
  } catch {
    // Silently fail
  }
};
