// Utility to lock/unlock body scroll when modals, menus, or popups are open

let scrollPosition = 0;

export const lockScroll = () => {
  // Save current scroll position
  scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  // Lock body scroll
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
};

export const unlockScroll = () => {
  // Restore body scroll
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('width');
  
  // Restore scroll position
  window.scrollTo(0, scrollPosition);
};
