# RNB EVENTS - Luxury Event Design Website

A fully responsive, luxury-styled website for RNB Events, inspired by high-end event design aesthetics.

## Features

- ✨ **Fully Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🎥 **Video Hero Section** - Eye-catching video background
- 📱 **Mobile-First Navigation** - Hamburger menu with smooth animations
- 🖼️ **Portfolio Gallery** - Touch-friendly image gallery with hover/tap overlays
- 💬 **Testimonial Slider** - Auto-rotating client testimonials
- 📧 **Contact Form** - Clean, functional contact form
- 🎨 **Elegant Typography** - Professional font pairing with proper hierarchy

## Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 968px - 1200px
- **Mobile**: 600px and below
- **Small Mobile**: 400px and below

## Testing Mobile Responsiveness

### Option 1: Browser Developer Tools
1. Open the website in Chrome, Edge, or Firefox
2. Press `F12` to open Developer Tools
3. Click the device toolbar icon (or press `Ctrl+Shift+M`)
4. Select different devices (iPhone, iPad, etc.) from the dropdown
5. Test portrait and landscape orientations

### Option 2: Actual Device Testing
1. Connect your mobile device to the same network
2. Find your computer's IP address
3. Access the site via: `http://YOUR-IP-ADDRESS/path/to/index.html`

### Option 3: Online Testing Tools
- Use services like BrowserStack, LambdaTest, or Responsively App

## Mobile Optimizations Included

✅ Touch-friendly navigation with hamburger menu
✅ Proper viewport meta tag for mobile scaling
✅ Optimized font sizes for small screens
✅ Touch targets sized at minimum 44x44px
✅ Disabled zoom on form input (prevents iOS zoom-in)
✅ Responsive images and videos
✅ Stack layouts for easier scrolling
✅ Performance optimization (parallax disabled on mobile)
✅ Touch events for portfolio gallery
✅ Orientation change handling

## Files Structure

```
RNB EVENTS/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive rules
├── script.js           # Interactive features
├── FloreDecor.mp4      # Hero background video
├── *.jpeg, *.JPG       # Portfolio images
└── *.MOV               # Portfolio videos
```

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #1a1a1a;      /* Dark text/backgrounds */
    --secondary-color: #f5f5f5;    /* Light backgrounds */
    --accent-color: #d4af37;       /* Gold accents */
    --text-color: #2c2c2c;         /* Main text */
    --text-light: #666;            /* Secondary text */
}
```

### Update Content
- Edit text directly in `index.html`
- Replace email/phone in the contact section
- Update social media links in the contact section

### Add More Images
- Add image files to the folder
- Reference them in the portfolio grid in `index.html`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

## Performance Tips

- Images are optimized for web viewing
- Videos use efficient loading strategies
- Lazy loading implemented for images
- Smooth scroll behavior for better UX
- CSS animations use GPU acceleration

---

Created with ❤️ for RNB Events
