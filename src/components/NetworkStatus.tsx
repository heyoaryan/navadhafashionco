import { useEffect, useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { showToast } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      hasShownToast.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Please check your internet connection', 'error');
      hasShownToast.current = true;
    };

    // Check connection speed
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;
        
        // Show warning for slow connections (2g, slow-2g, 3g)
        if ((effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g') && !hasShownToast.current) {
          showToast('Your Network Connection is Poor', 'warning');
          hasShownToast.current = true;
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
  }, [showToast]);

  // Component doesn't render anything - uses toast instead
  return null;
};

export default NetworkStatus;
