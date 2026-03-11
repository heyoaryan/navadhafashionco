// Security utilities for frontend

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  // List of allowed email domains
  const allowedDomains = [
    'gmail.com',
    'yahoo.com',
    'yahoo.co.in',
    'hotmail.com',
    'outlook.com',
    'rediffmail.com',
    'aol.com',
    'icloud.com',
    'protonmail.com',
    'zoho.com',
    'mail.com',
    'yandex.com',
    'gmx.com',
    'inbox.com',
    'live.com',
    'msn.com',
    'ymail.com',
    'rocketmail.com'
  ];
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const trimmedEmail = email.trim().toLowerCase();
  
  // First check basic email format
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Extract domain from email
  const domain = trimmedEmail.split('@')[1];
  
  // Check if domain is in allowed list
  return allowedDomains.includes(domain);
};

// Phone validation (Indian format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Use both uppercase and lowercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Include at least one special character');

  return { score, feedback };
};

// XSS protection for displaying user content
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Rate limiting helper (client-side)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// CSRF token management
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

// Secure session storage
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  get: (key: string): any => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    sessionStorage.removeItem(key);
  },

  clear: (): void => {
    sessionStorage.clear();
  },
};

// Content Security Policy helper
export const setupCSP = (): void => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
  ].join('; ');
  document.head.appendChild(meta);
};

// Prevent clickjacking
export const preventClickjacking = (): void => {
  if (window.self !== window.top) {
    window.top!.location = window.self.location;
  }
};

// Secure form submission
export const secureFormData = (formData: Record<string, any>): Record<string, any> => {
  const secured: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      secured[key] = sanitizeInput(value);
    } else {
      secured[key] = value;
    }
  }
  
  return secured;
};

// Check if running in secure context
export const isSecureContext = (): boolean => {
  return window.isSecureContext;
};

// Validate file uploads
export const validateFileUpload = (
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
};
