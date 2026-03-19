// Input validation utilities

export const validateEmail = (email: string): boolean => {
  // Standard RFC 5322 email validation — no domain whitelist (too restrictive for real users)
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email.trim().toLowerCase());
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  return /^[6-9]\d{9}$/.test(cleanPhone);
};

// Indian pincode: exactly 6 digits, first digit 1-9
export const validatePincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
};

// Pincode cache to avoid repeated API calls
const pincodeCache = new Map<string, { city: string; state: string } | null>();

// Verify pincode exists via India Post API (returns city/state or null)
export const verifyPincode = async (pincode: string): Promise<{ city: string; state: string } | null> => {
  if (pincodeCache.has(pincode)) return pincodeCache.get(pincode)!;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      const result = { city: po.District, state: po.State };
      pincodeCache.set(pincode, result);
      return result;
    }
    pincodeCache.set(pincode, null);
    return null;
  } catch {
    return null;
  }
};
