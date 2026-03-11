import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowWarning(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowWarning(true);
    };

    // Check connection speed
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;
        
        // Show warning for slow connections (2g, slow-2g)
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setIsSlowConnection(true);
          setShowWarning(true);
        } else if (effectiveType === '3g') {
          setIsSlowConnection(true);
          setShowWarning(true);
        } else {
          setIsSlowConnection(false);
          setShowWarning(false);
        }
      }
    };

    // Initial check
    checkConnectionSpeed();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', checkConnectionSpeed);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', checkConnectionSpeed);
      }
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 max-w-sm mx-4 shadow-2xl pointer-events-auto animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {isOnline ? (
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <Wifi className="w-6 h-6 text-yellow-400" />
              </div>
            ) : (
              <div className="bg-red-500/20 p-3 rounded-full">
                <WifiOff className="w-6 h-6 text-red-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              {isOnline ? 'Slow Connection' : 'No Internet'}
            </h3>
            <p className="text-gray-300 text-sm">
              {isOnline 
                ? 'Your network is slow. Content is loading in background...'
                : 'Please check your internet connection'}
            </p>
          </div>
        </div>
        
        {/* Loading indicator for slow connection */}
        {isOnline && isSlowConnection && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse-slow"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
