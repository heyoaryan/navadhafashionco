import { supabase } from '../lib/supabase';

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

// Cache user ID from session — no extra DB call
let cachedUserId: string | null | undefined = undefined;
supabase.auth.getSession().then(({ data: { session } }) => {
  cachedUserId = session?.user?.id ?? null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id ?? null;
});

const getUserId = (): string | null => {
  // undefined = not yet resolved, null = logged out
  return cachedUserId ?? null;
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
    flushTimer = setTimeout(flushQueue, 3000); // flush every 3s
  }
};

const flushQueue = async () => {
  flushTimer = null;
  if (eventQueue.length === 0) return;

  const byTable: Record<string, Record<string, unknown>[]> = {};
  while (eventQueue.length > 0) {
    const event = eventQueue.shift()!;
    if (!byTable[event.table]) byTable[event.table] = [];
    byTable[event.table].push(event.payload);
  }

  await Promise.allSettled(
    Object.entries(byTable).map(([table, rows]) =>
      supabase.from(table).insert(rows)
    )
  );
};

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushQueue();
  });
}

export const trackPageView = (pageUrl: string, pageTitle?: string) => {
  try {
    const url = new URL(pageUrl, window.location.origin);
    enqueue('page_views', {
      page_url: pageUrl,
      page_path: url.pathname,
      page_title: pageTitle || document.title,
      user_id: getUserId(),
      session_id: getSessionId(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch { /* silently fail */ }
};

export const trackProductAction = (
  productId: string,
  actionType: 'view' | 'click' | 'add_to_cart' | 'add_to_wishlist'
) => {
  try {
    enqueue('product_analytics', {
      product_id: productId,
      user_id: getUserId(),
      session_id: getSessionId(),
      action_type: actionType,
    });
  } catch { /* silently fail */ }
};

export const trackSignup = async (userId: string, signupMethod: string = 'email') => {
  try {
    // Direct insert — bypass queue so it completes before page navigation
    // DB trigger already inserts on auth.users INSERT, so use upsert to avoid duplicates
    // (session_id 'server_trigger' from trigger vs real session_id from client)
    const { error } = await supabase.from('signup_tracking').insert({
      user_id: userId,
      session_id: getSessionId(),
      signup_method: signupMethod,
    });
    // Ignore duplicate key errors — trigger may have already inserted
    if (error && !error.message?.includes('duplicate') && !error.code?.includes('23505')) {
      console.warn('[analytics] trackSignup failed:', error.message);
    }
  } catch { /* silently fail */ }
};
