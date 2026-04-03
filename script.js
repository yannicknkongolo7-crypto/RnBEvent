// ===========================
// MOBILE MENU TOGGLE
// ===========================

const hamburger = document.querySelector('.hamburger');
const hamburgerMenu = document.querySelector('.hamburger-menu');
const hamburgerLinks = document.querySelectorAll('.hamburger-nav a');

hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburger.classList.toggle('active');
    hamburgerMenu.classList.toggle('active');
    // Prevent body scroll when menu is open
    document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
});

hamburgerLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !hamburgerMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===========================
// TESTIMONIAL SLIDER
// ===========================

let currentSlide = 0;
const testimonialItems = document.querySelectorAll('.testimonial-item');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    testimonialItems.forEach((item, i) => {
        item.classList.remove('active');
        if (i === index) {
            item.classList.add('active');
        }
    });
    
    dots.forEach((dot, i) => {
        dot.classList.remove('active');
        if (i === index) {
            dot.classList.add('active');
        }
    });
}

// Auto-rotate testimonials
if (testimonialItems.length > 0) {
    setInterval(() => {
        currentSlide = (currentSlide + 1) % testimonialItems.length;
        showSlide(currentSlide);
    }, 5000);
}

// Manual dot navigation
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
    });
});

// ===========================
// IMAGE CAROUSEL
// ===========================

let currentCarouselSlide = 0;
const carouselSlides = document.querySelectorAll('.carousel-slide');
const carouselDots = document.querySelectorAll('.carousel-dot');
const prevButton = document.querySelector('.carousel-prev');
const nextButton = document.querySelector('.carousel-next');

function showCarouselSlide(index) {
    // Wrap around if index is out of bounds
    if (index >= carouselSlides.length) {
        currentCarouselSlide = 0;
    } else if (index < 0) {
        currentCarouselSlide = carouselSlides.length - 1;
    } else {
        currentCarouselSlide = index;
    }

    // Update slides
    carouselSlides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === currentCarouselSlide) {
            slide.classList.add('active');
        }
    });
    
    // Update dots
    carouselDots.forEach((dot, i) => {
        dot.classList.remove('active');
        if (i === currentCarouselSlide) {
            dot.classList.add('active');
        }
    });
}

// Next/Previous button functionality
if (prevButton && nextButton) {
    prevButton.addEventListener('click', () => {
        showCarouselSlide(currentCarouselSlide - 1);
    });

    nextButton.addEventListener('click', () => {
        showCarouselSlide(currentCarouselSlide + 1);
    });
}

// Dot navigation for carousel
carouselDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        showCarouselSlide(index);
    });
});

// Auto-rotate carousel every 4 seconds
if (carouselSlides.length > 0) {
    setInterval(() => {
        showCarouselSlide(currentCarouselSlide + 1);
    }, 4000);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (carouselSlides.length > 0) {
        if (e.key === 'ArrowLeft') {
            showCarouselSlide(currentCarouselSlide - 1);
        } else if (e.key === 'ArrowRight') {
            showCarouselSlide(currentCarouselSlide + 1);
        }
    }
});

// ===========================
// ABOUT US BACKGROUND CAROUSEL
// ===========================

let currentBgSlide = 0;
const bgCarouselSlides = document.querySelectorAll('.carousel-bg-slide');

function showBgCarouselSlide(index) {
    // Wrap around if index is out of bounds
    if (index >= bgCarouselSlides.length) {
        currentBgSlide = 0;
    } else if (index < 0) {
        currentBgSlide = bgCarouselSlides.length - 1;
    } else {
        currentBgSlide = index;
    }

    // Update slides
    bgCarouselSlides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === currentBgSlide) {
            slide.classList.add('active');
        }
    });
}

// Auto-rotate background carousel every 5 seconds
if (bgCarouselSlides.length > 0) {
    setInterval(() => {
        showBgCarouselSlide(currentBgSlide + 1);
    }, 5000);
}

// ===========================
// SCROLL ANIMATIONS
// ===========================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections for fade-in animation
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Observe portfolio and category items
document.querySelectorAll('.portfolio-item, .category-card, .service-card').forEach(item => {
    observer.observe(item);
});

// Immediately reveal elements already in viewport on page load
requestAnimationFrame(() => {
    document.querySelectorAll('section, .portfolio-item, .category-card, .service-card').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('visible');
        }
    });
});

// Observe portfolio items
document.querySelectorAll('.portfolio-item').forEach(item => {
    item.classList.add('fade-in');
    observer.observe(item);
});

// Observe service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.classList.add('fade-in');
    observer.observe(card);
});

// ===========================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===========================
// CONTACT FORM SUBMISSION
// ===========================

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        eventType: document.getElementById('eventType').value,
        message: document.getElementById('message').value
    };
    
    // Display success message (replace with actual form submission logic)
    alert('Thank you for your inquiry! We will get back to you shortly.');
    
    // Reset form
    contactForm.reset();
    
    // In production, you would send this data to a server:
    // fetch('/api/contact', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(formData)
    // });
});

// ===========================
// NEWSLETTER FORM SUBMISSION
// ===========================

const newsletterForm = document.querySelector('.newsletter-form');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    alert('Thank you for subscribing!');
    e.target.reset();
    
    // In production, send to server/email service
});

// ===========================
// PARALLAX EFFECT FOR HERO VIDEO
// ===========================

// Only apply parallax on desktop (better performance on mobile)
if (window.innerWidth > 968) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroVideo = document.querySelector('.hero-video');
        if (heroVideo) {
            heroVideo.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.5}px))`;
        }
    });
}

// ===========================
// TOUCH-FRIENDLY INTERACTIONS
// ===========================

// Add touch support for portfolio items
const portfolioItems = document.querySelectorAll('.portfolio-item');
portfolioItems.forEach(item => {
    item.addEventListener('touchstart', function() {
        this.classList.add('touched');
        // Remove touched class from other items
        portfolioItems.forEach(otherItem => {
            if (otherItem !== this) {
                otherItem.classList.remove('touched');
            }
        });
    });
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
    // Refresh layout after orientation change
    setTimeout(() => {
        window.scrollTo(window.scrollX, window.scrollY);
    }, 100);
});

// ===========================
// LAZY LOADING FOR IMAGES
// ===========================

if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}
