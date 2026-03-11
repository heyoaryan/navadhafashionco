import { useEffect } from 'react';

/**
 * Custom hook to lock/unlock body scroll
 * Prevents background scrolling when modals, overlays, or loading screens are active
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Lock scroll - better approach for mobile
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none'; // Prevent touch move on mobile
      
      return () => {
        // Unlock scroll
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('left');
        document.body.style.removeProperty('right');
        document.body.style.removeProperty('width');
        document.body.style.removeProperty('touch-action');
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}
