// Input validation utilities for security

// List of allowed email domains
const ALLOWED_EMAIL_DOMAINS = [
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

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const trimmedEmail = email.trim().toLowerCase();
  
  // First check basic email format
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Extract domain from email
  const domain = trimmedEmail.split('@')[1];
  
  // Check if domain is in allowed list
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

// Get list of allowed email domains for display
export const getAllowedEmailDomains = (): string[] => {
  return [...ALLOWED_EMAIL_DOMAINS];
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const validatePhone = (phone: string): boolean => {
  // Exactly 10 digits, starting with 6-9 (Indian mobile numbers)
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 500); // Limit length
};

export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};
