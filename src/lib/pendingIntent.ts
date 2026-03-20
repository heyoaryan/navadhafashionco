/**
 * pendingIntent — stores what the user was trying to do before /auth
 * Uses sessionStorage: survives same-tab page reloads (OAuth redirect) but not new tabs.
 */

export type PendingIntent =
  | { action: 'buyNow'; productId: string; productName: string; price: number; quantity: number; size?: string; color?: string }
  | { action: 'addToCart'; productId: string; quantity: number; size?: string; color?: string }
  | { action: 'redirect'; to: string };

const KEY = 'pendingIntent';

export function savePendingIntent(intent: PendingIntent) {
  try { sessionStorage.setItem(KEY, JSON.stringify(intent)); } catch { /* ignore */ }
}

export function loadPendingIntent(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearPendingIntent() {
  sessionStorage.removeItem(KEY);
}

/** Called by AuthCallback so Auth.tsx knows OAuth already handled redirect */
export function markOAuthHandled() {
  try { sessionStorage.setItem('oauthHandled', '1'); } catch { /* ignore */ }
}

export function consumeOAuthHandled(): boolean {
  const v = sessionStorage.getItem('oauthHandled') === '1';
  sessionStorage.removeItem('oauthHandled');
  return v;
}

export function wasIntentHandled(): boolean {
  return false;
}
