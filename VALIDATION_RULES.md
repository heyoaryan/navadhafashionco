# Email & Phone Validation Rules

## Email Validation

### Allowed Email Domains
Only the following email domains are accepted:

1. **Gmail**: gmail.com
2. **Yahoo**: yahoo.com, yahoo.co.in
3. **Microsoft**: hotmail.com, outlook.com, live.com, msn.com
4. **Yahoo Alternatives**: ymail.com, rocketmail.com
5. **Indian**: rediffmail.com
6. **Other Popular**:
   - aol.com
   - icloud.com
   - protonmail.com
   - zoho.com
   - mail.com
   - yandex.com
   - gmx.com
   - inbox.com

### Email Format
- Must be in format: `username@domain.com`
- Case insensitive (automatically converted to lowercase)
- No spaces allowed
- Special characters allowed in username: `._%+-`

### Examples of Valid Emails
- ✅ user@gmail.com
- ✅ name.surname@yahoo.com
- ✅ contact@outlook.com
- ✅ info@rediffmail.com

### Examples of Invalid Emails
- ❌ user@company.com (company domains not allowed)
- ❌ user@example.com (example domains not allowed)
- ❌ user@custom-domain.com (custom domains not allowed)

---

## Phone Validation

### Rules
- **Exactly 10 digits** required
- Must start with **6, 7, 8, or 9** (Indian mobile numbers)
- Only numeric characters allowed
- Spaces and special characters are automatically removed

### Format
- Input: Any format with 10 digits
- Stored: 10 digits only (e.g., `9876543210`)

### Examples of Valid Phone Numbers
- ✅ 9876543210
- ✅ 8765432109
- ✅ 7654321098
- ✅ 6543210987

### Examples of Invalid Phone Numbers
- ❌ 1234567890 (doesn't start with 6-9)
- ❌ 98765 (less than 10 digits)
- ❌ 98765432109 (more than 10 digits)
- ❌ 5876543210 (starts with 5)

---

## Implementation Files

### Validation Functions
- `src/utils/validation.ts` - Main validation functions
- `src/lib/security.ts` - Security-related validation

### Forms with Validation
1. **Contact Form** (`src/pages/Contact.tsx`)
2. **Checkout Address** (`src/pages/Checkout.tsx`)
3. **User Profile** (`src/pages/account/Profile.tsx`)
4. **Address Management** (`src/pages/account/Addresses.tsx`)
5. **Job Applications** (`src/components/JobApplicationModal.tsx`)

---

## Adding New Email Domains

To add new allowed email domains, update the `ALLOWED_EMAIL_DOMAINS` array in:
- `src/utils/validation.ts`
- `src/lib/security.ts`

Example:
```typescript
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  // Add new domain here
  'newdomain.com',
];
```

---

## Error Messages

### Email Errors
- "Please use a valid email from: Gmail, Yahoo, Hotmail, Outlook, Rediffmail, etc."

### Phone Errors
- "Please enter a valid 10-digit phone number"

---

## Testing

### Test Email Validation
```typescript
import { validateEmail } from './utils/validation';

console.log(validateEmail('user@gmail.com')); // true
console.log(validateEmail('user@company.com')); // false
```

### Test Phone Validation
```typescript
import { validatePhone } from './utils/validation';

console.log(validatePhone('9876543210')); // true
console.log(validatePhone('1234567890')); // false
```
