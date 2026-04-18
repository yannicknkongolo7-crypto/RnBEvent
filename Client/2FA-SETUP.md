# Client Portal 2-Factor Authentication Setup Guide

## Overview

The client portal now includes a comprehensive 2-factor authentication (2FA) system for enhanced security:

1. **Email Verification**: After entering access code, clients must verify their email address
2. **Document Re-Authentication**: Additional verification required when accessing sensitive documents
3. **Admin Fallback**: Google Authenticator code for admin access

---

## EmailJS Setup (Required)

### Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Verify your email address

### Step 2: Add Email Service

1. In EmailJS Dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup wizard to connect your email
5. **Note your Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template structure:

**Subject:**
```
RNB Events - Verification Code
```

**Content:**
```
Hello {{client_name}},

Your verification code for the RNB Events Client Portal is:

{{verification_code}}

This code will expire in 10 minutes. Do not share this code with anyone.

If you did not request this code, please contact us immediately at hello@rnbevents716.com

Best regards,
RNB Events Team

---
RNB Events Production & Coordination LLC
https://rnbevents716.com
```

4. **Note your Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key

1. Go to **Account** → **General**
2. Find your **Public Key**
3. Copy it (e.g., `abc123xyz789`)

### Step 5: Update Portal Configuration

Edit `/Client/index.html` and replace:

```javascript
emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your EmailJS public key
```

With your actual public key:
```javascript
emailjs.init("abc123xyz789");
```

Edit `/Client/portal.js` and update:

```javascript
var EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
var EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
```

With your actual IDs:
```javascript
var EMAILJS_SERVICE_ID = 'service_abc123';
var EMAILJS_TEMPLATE_ID = 'template_xyz789';
```

---

## Google Authenticator Setup (Admin Fallback)

### Step 1: Install Google Authenticator

- **iOS**: Download from App Store
- **Android**: Download from Google Play
- **Desktop**: Use Authy or other TOTP apps

### Step 2: Generate Admin Code

For this simplified implementation, you'll use a static 6-digit code. In production, implement proper TOTP (Time-based One-Time Password).

#### Option A: Simple Static Code (Current Implementation)

1. Choose a 6-digit code (e.g., `846291`)
2. Update `/Client/clients-config.js`:

```javascript
window.RNB_ADMIN_AUTH_CODE = '846291'; // Replace with your chosen code
```

**Important**: Share this code only with authorized RNB Events team members.

#### Option B: Implement Proper TOTP (Recommended for Production)

For better security, implement proper TOTP verification:

1. Use a library like `otplib` or `speakeasy`
2. Generate a secret key
3. Add QR code for Google Authenticator app
4. Verify time-based codes

---

## Client Configuration

### Adding Client Email Addresses

Edit `/Client/clients-config.js` and add email addresses for each client:

```javascript
'<client_hash>': {
    firstName: 'Client Name',
    fullName: 'Full Client Name',
    email: 'client@example.com', // ADD THIS LINE
    eventType: 'Wedding',
    // ... rest of configuration
}
```

### Email Requirements

- Must be a valid email address
- Client will receive verification codes at this address
- Can be changed by updating the config file

---

## How It Works

### Login Flow

1. Client enters access code
2. ✅ Access code verified
3. Email verification gate appears
4. Client enters their email (pre-filled if configured)
5. 6-digit code sent via EmailJS
6. Client enters code from email
7. ✅ Email verified → Portal access granted

### Document Access Flow

1. Client clicks "Documents & Payments"
2. Re-authentication modal appears
3. New 6-digit code sent to client email
4. Client enters code
5. ✅ Verified → Documents accessible

### Admin Fallback

If a client doesn't receive the email or there's an issue:

1. Click "Admin Access" during email verification
2. Enter the Google Authenticator code
3. ✅ Verified → Portal access granted

---

## Security Features

✅ **Two layers of authentication**
- Access code (something you know)
- Email verification (something you have)

✅ **Re-authentication for sensitive data**
- Documents require fresh verification
- Expires after session ends

✅ **Admin bypass available**
- Emergency access via Google Authenticator
- Only for authorized team members

✅ **Session management**
- Email verified status stored in session
- Clears on logout

---

## Testing

### Test the Full Flow

1. **Clear browser session:**
   ```javascript
   sessionStorage.clear();
   ```

2. **Test with demo account:**
   - Access Code: `DEMO2024` (hash in config)
   - Email: `client@example.com`

3. **Check EmailJS Dashboard** to see delivery status

4. **Verify codes are being generated** (6-digit numbers)

5. **Test document re-authentication:**
   - Log in successfully
   - Click "Documents & Payments"
   - Verify re-auth modal appears
   - Check new email received

### Troubleshooting

**Emails not sending:**
- Check EmailJS service is connected
- Verify Service ID and Template ID are correct
- Check EmailJS dashboard for error logs
- Ensure email template variables match: `{{client_name}}`, `{{verification_code}}`

**Admin code not working:**
- Verify `window.RNB_ADMIN_AUTH_CODE` is set in clients-config.js
- Check code is exactly 6 digits
- Ensure no spaces or special characters

**Re-authentication not triggering:**
- Check document links have `href*="/documents"` in the selector
- Verify JavaScript is running without errors (check console)

---

## Production Recommendations

### Security Enhancements

1. **Implement proper TOTP** instead of static admin code
2. **Add rate limiting** to prevent brute force attacks
3. **Implement code expiration** (10-minute timeout)
4. **Add attempt counter** (lock after 3 failed attempts)
5. **Log all verification attempts** for audit trail

### User Experience Improvements

1. **Add countdown timer** for code expiration
2. **Show "Code sent" confirmation** with animation
3. **Auto-focus** on code input fields
4. **Auto-submit** when 6 digits entered
5. **Remember email** across sessions (optional)

### EmailJS Alternatives

For production at scale, consider:
- **SendGrid** (higher volume, better deliverability)
- **AWS SES** (cost-effective for high volume)
- **Twilio SendGrid** (enterprise features)
- **Mailgun** (developer-friendly)

---

## Support

For issues with 2FA setup:
- **EmailJS Support**: https://www.emailjs.com/docs/
- **Google Authenticator**: https://support.google.com/accounts/answer/1066447

For portal customization:
- Contact: hello@rnbevents716.com

---

## Quick Reference

| Configuration | Location | What to Update |
|--------------|----------|----------------|
| EmailJS Public Key | `/Client/index.html` | `emailjs.init("YOUR_KEY")` |
| EmailJS Service ID | `/Client/portal.js` | `EMAILJS_SERVICE_ID` |
| EmailJS Template ID | `/Client/portal.js` | `EMAILJS_TEMPLATE_ID` |
| Admin Auth Code | `/Client/clients-config.js` | `RNB_ADMIN_AUTH_CODE` |
| Client Emails | `/Client/clients-config.js` | Add `email` field to each client |

---

**Last Updated:** April 16, 2026
**Version:** 1.0.0
