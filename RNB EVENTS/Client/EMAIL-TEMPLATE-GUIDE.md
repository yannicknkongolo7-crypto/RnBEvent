# Quick Start: Using the Branded Email Template

## Step 1: Copy the Template

The branded HTML email template is located at:
📄 **[Client/emailjs-template.html](emailjs-template.html)**

## Step 2: Set Up in EmailJS

1. Go to your EmailJS Dashboard: https://dashboard.emailjs.com/
2. Navigate to **Email Templates**
3. Click on your template (template_ov3vejp) or create a new one
4. Switch to **HTML Editor** mode
5. Copy the entire content from `emailjs-template.html`
6. Paste into the EmailJS template editor

## Step 3: Configure Template Variables

Make sure these variables are properly set in your template:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `{{client_name}}` | Client's first name or full name | "Joelle & Laurent" |
| `{{passcode}}` | 6-digit OTP code | "846291" |
| `{{time}}` | Time when code expires (15 min) | "3:45 PM" |
| `{{to_email}}` | Recipient email address | (auto-filled) |
| `{{reply_to}}` | Reply-to email address | "hello@rnbevents716.com" |

**These are automatically passed from portal.js** - no manual configuration needed!

## Step 4: Customize (Optional)

### Update Logo URL
Find this line in the template:
```html
<img src="https://rnbevents716.com/Content/Home/logo.png" ... />
```

Replace with your actual logo URL, or use EmailJS attachment feature.

### Adjust Brand Colors
Current colors match RNB Events branding:
- Primary Green: `#2c3e2c`
- Sage Medium: `#527141`
- Background: `#f8f9f8`

### Update Contact Information
In the footer section, verify:
- Company name
- Address
- Phone number
- Email addresses
- Website links

## What the Email Looks Like

✅ **RNB Events logo** at the top  
✅ **Personal greeting** with client's name  
✅ **Clean OTP display** in bordered box with brand colors  
✅ **Expiry countdown** showing when code expires  
✅ **Security warning** about phishing with highlighted box  
✅ **Company footer** with contact information  
✅ **Simple & lightweight** for fast delivery  
✅ **Mobile responsive** design  

## Testing

### Test Email Send

1. Use the demo account:
   - Access Code: `DEMO2024`
   - Email: Your actual email address (for testing)

2. Edit [clients-config.js](clients-config.js) temporarily:
   ```javascript
   email: 'your.email@example.com', // Use YOUR email for testing
   ```

3. Visit: https://rnbevents716.com/Client
4. Enter access code and your email
5. Check your inbox for the verification email

### What to Check

- [ ] Email arrives within 10 seconds
- [ ] Logo displays correctly
- [ ] Client name is personalized
- [ ] 6-digit code is clearly visible
- [ ] Expiry time shows correct time (15 min from send)
- [ ] Security warning is prominent
- [ ] Footer links work correctly
- [ ] Email looks good on mobile

## Troubleshooting

**Email not received?**
- Check EmailJS dashboard for send status
- Verify Service ID and Template ID in portal.js
- Check spam/junk folder
- Verify email service is connected in EmailJS

**Logo not showing?**
- Use absolute URL (https://...)
- Or upload logo as EmailJS attachment
- Check image file is publicly accessible

**Formatting issues?**
- EmailJS sometimes strips certain CSS
- Current template uses inline styles and simple divs for maximum compatibilitymail, Outlook, etc.)
- Inline styles (already used) work best

**Wrong time displayed?**
- Expiry time uses client's local timezone
- Calculated as current time + 15 minutes
- Time format: "3:45 PM" (12-hour format)

## Email Template Variables (Auto-Generated)

All these are **automatically calculated and sent** by portal.js:

```javascript
{
  to_email: 'client@example.com',           // From input or config
  passcode: '846291',                       // Random 6-digit number
  time: '3:45 PM',       291',              // Random 6-digit number
  expiry_time: '3:45 PM',                   // Current time + 15 minutes
  reply_to: 'hello@rnbevents716.com'       // RNB Events email
}
```

## Next Steps

After template is set up in EmailJS:

1. ✅ Save template in EmailJS dashboard
2. ✅ Test with your email address
3. ✅ Update client emails in [clients-config.js](clients-config.js)
4. ✅ Share access codes with clients
5. ✅ Monitor EmailJS dashboard for delivery status

## Need Help?

- **EmailJS Docs**: https://www.emailjs.com/docs/
- **Template Issues**: Check EmailJS dashboard logs
- **Portal Issues**: Check browser console for JavaScript errors

---

**Template Location**: [Client/emailjs-template.html](emailjs-template.html)  
**Last Updated**: April 16, 2026
