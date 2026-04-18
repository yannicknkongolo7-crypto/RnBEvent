# 🚀 Demo/Staging Area

## Overview
The demo page is a secure, hidden staging environment where you can test new features before deploying them to the live website. This allows you to vet changes, test functionality, and catch issues without affecting your customers.

---

## 🔐 Access Information

**URL:** https://rnbevents716.com/demo

**Authentication:** Same 2FA credentials as the Admin Dashboard
- **Step 1:** Admin password (same as admin dashboard)
- **Step 2:** 6-digit TOTP code from your authenticator app (Google Authenticator, Authy, etc.)

**Session:** Stays logged in during browser session (sessionStorage)

---

## ✨ Currently Testing

### Chatbot Feature
- **Status:** In development, hidden from main site
- **Location:** Demo page shows active chatbot
- **Testing:** Full functionality - ask questions, test responses, verify accuracy
- **Features:**
  - 60+ FAQ database covering services, pricing, booking, etc.
  - Smart pattern matching (no LLM needed)
  - Quote triggering for pricing questions
  - Typing animation with sample questions
  - Responsive design (mobile-friendly)

---

## 🎯 How to Use

### 1. Access the Demo Page
```
1. Navigate to https://rnbevents716.com/demo
2. Enter admin password
3. Enter TOTP code from authenticator app
4. You're in! Test away.
```

### 2. Test Features
- **Chatbot:** Ask various questions to test accuracy
  - Location questions: "Where are you located?"
  - Service questions: "Do you do corporate events?"
  - Pricing questions: "How much does it cost?"
  - Event types: "Do you do birthdays?"
  - Contact info: "What's your phone number?"

### 3. Verify Before Go-Live
- Test on mobile devices
- Check all edge cases
- Verify quote triggering works
- Ensure no broken functionality

### 4. Deploy to Production
Once satisfied with testing:
```css
/* In styles.css, change: */
.chatbot-section {
    display: none;  /* Remove this line */
}

/* To: */
.chatbot-section {
    display: block;  /* Or just remove display property */
}
```

---

## 🛡️ Security Features

- **Hidden from public:** `noindex, nofollow` meta tags
- **2FA protected:** Same security as admin dashboard
- **Session-based:** Auto-logout when browser closes
- **Rate limiting:** 5 failed attempts = lockout
- **HTTPS-only:** SHA-256 password hashing
- **No public links:** Not linked from any public pages

---

## 📋 Best Practices

### Before Testing
- [ ] Clear browser cache
- [ ] Test on desktop AND mobile
- [ ] Open browser console (F12) to check for errors
- [ ] Have authenticator app ready

### During Testing
- [ ] Test happy paths (normal questions)
- [ ] Test edge cases (weird questions)
- [ ] Verify mobile responsiveness
- [ ] Check typing animation works
- [ ] Confirm quote button triggers correctly

### After Testing
- [ ] Document any issues found
- [ ] Fix bugs before deploying to production
- [ ] Test again after fixes
- [ ] Update FAQ database if needed

---

## 🔄 Adding New Features to Demo

When you want to test a new feature:

1. **Keep it hidden on main site:**
   ```css
   .new-feature {
       display: none;  /* Hidden from public */
   }
   ```

2. **Override in demo.html:**
   ```css
   <style>
       .new-feature {
           display: block !important;  /* Show in demo */
       }
   </style>
   ```

3. **Test thoroughly in demo environment**

4. **Deploy to production when ready**

---

## 📞 Support

If you encounter issues with the demo page:
- Check browser console for JavaScript errors (F12)
- Verify you're using HTTPS (required for auth)
- Ensure authenticator app is synced with correct time
- Try clearing cache and sessionStorage

---

## 🎨 Future Features to Test Here

Potential features to vet in demo before production:
- ✅ **Chatbot** (currently testing)
- ⏳ Enhanced quote form with live validation
- ⏳ Interactive portfolio gallery
- ⏳ Client testimonials carousel
- ⏳ Real-time availability calendar
- ⏳ Package comparison tool

---

**Remember:** The demo area is YOUR sandbox. Break things, test extensively, and deploy with confidence! 🚀
