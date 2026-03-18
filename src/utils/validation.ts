// Input validation utilities

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com',
  'rediffmail.com', 'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com',
  'mail.com', 'yandex.com', 'gmx.com', 'inbox.com', 'live.com',
  'msn.com', 'ymail.com', 'rocketmail.com'
];

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const trimmedEmail = email.trim().toLowerCase();
  if (!emailRegex.test(trimmedEmail)) return false;
  const domain = trimmedEmail.split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  return /^[6-9]\d{9}$/.test(cleanPhone);
};

// Indian pincode: exactly 6 digits, first digit 1-9
export const validatePincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
};

// Verify pincode exists via India Post API (returns city/state or null)
export const verifyPincode = async (pincode: string): Promise<{ city: string; state: string } | null> => {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return { city: po.District, state: po.State };
    }
    return null;
  } catch {
    return null;
  }
};
