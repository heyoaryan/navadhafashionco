import { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Shield, BarChart2, Target } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_KEY = 'navadha_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      // Small delay so it doesn't flash immediately on load
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...preferences, timestamp: Date.now() }));
    setAnimateOut(true);
    setTimeout(() => setVisible(false), 400);
  };

  const acceptAll = () => {
    dismiss({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    dismiss({ necessary: true, analytics: false, marketing: false });
  };

  const savePreferences = () => {
    dismiss(prefs);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed z-[9999]
        bottom-0 left-0 right-0
        sm:bottom-4 sm:left-4 sm:right-auto sm:w-[440px]
        transition-all duration-400 ease-in-out
        ${animateOut ? 'opacity-0 translate-y-12 scale-95' : 'opacity-100 translate-y-0 scale-100'}
      `}
      style={{ animation: animateOut ? undefined : 'cookieSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500" />

        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                  Did you like cookies? 🍪
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your privacy, your choice</p>
              </div>
            </div>
            <button
              onClick={rejectAll}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            We use cookies to enhance your shopping experience, analyze site traffic, and personalize content.
            You can choose what you're comfortable with.
          </p>

          {/* Manage section toggle */}
          <button
            onClick={() => setShowManage(v => !v)}
            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium mb-3 transition-colors"
          >
            {showManage ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Manage preferences
          </button>

          {/* Expandable preferences */}
          {showManage && (
            <div className="mb-4 space-y-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              {/* Necessary */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Necessary</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Required for the site to work</p>
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-5 bg-green-500 rounded-full flex items-center justify-end px-0.5 cursor-not-allowed opacity-70">
                    <div className="w-4 h-4 bg-white rounded-full shadow" />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Analytics</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Help us improve the experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                  className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5
                    ${prefs.analytics ? 'bg-rose-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}
                  aria-label="Toggle analytics cookies"
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow transition-all" />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Marketing</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Personalized ads & offers</p>
                  </div>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                  className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5
                    ${prefs.marketing ? 'bg-rose-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}
                  aria-label="Toggle marketing cookies"
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={`flex gap-2 ${showManage ? 'flex-col sm:flex-row' : 'flex-row'}`}>
            {showManage ? (
              <>
                <button
                  onClick={savePreferences}
                  className="flex-1 py-2.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors active:scale-95"
                >
                  Save preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 py-2.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 rounded-xl transition-colors active:scale-95"
                >
                  Accept all
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={rejectAll}
                  className="flex-1 py-2.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-95"
                >
                  Reject all
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 py-2.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors active:scale-95"
                >
                  Accept all
                </button>
              </>
            )}
          </div>

          {/* Privacy link */}
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-3">
            Learn more in our{' '}
            <a href="/privacy" className="text-rose-400 hover:text-rose-500 underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
