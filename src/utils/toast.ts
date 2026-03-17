// Global toast utility - can be used anywhere
let toastCallback: ((message: string, type: 'success' | 'error' | 'info' | 'warning') => void) | null = null;

export const setToastCallback = (callback: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void) => {
  toastCallback = callback;
};

export const toast = {
  success: (message: string) => {
    if (toastCallback) {
      toastCallback(message, 'success');
    } else {
      alert(message);
    }
  },
  error: (message: string) => {
    if (toastCallback) {
      toastCallback(message, 'error');
    } else {
      alert(message);
    }
  },
  info: (message: string) => {
    if (toastCallback) {
      toastCallback(message, 'info');
    } else {
      alert(message);
    }
  },
  warning: (message: string) => {
    if (toastCallback) {
      toastCallback(message, 'warning');
    } else {
      alert(message);
    }
  }
};
