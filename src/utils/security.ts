// Security utilities

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

// Sanitize user-generated content
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Check if user is admin
export const isAdmin = (role?: string): boolean => {
  return role === 'admin';
};

// Secure local storage wrapper
export const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, btoa(value)); // Basic encoding
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  getItem: (key: string): string | null => {
    try {
      const value = localStorage.getItem(key);
      return value ? atob(value) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};
