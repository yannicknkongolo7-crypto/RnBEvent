/**
 * RNB Events — Cookie Consent Banner
 * GDPR-compliant cookie consent management
 */

(function() {
    'use strict';

    var COOKIE_NAME = 'rnb_cookie_consent';
    var COOKIE_DURATION = 365; // days

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/;SameSite=Lax';
    }

    function hideConsent() {
        var banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.display = 'none';
            document.body.style.paddingBottom = '0';
        }
    }

    function acceptAll() {
        setCookie(COOKIE_NAME, 'all', COOKIE_DURATION);
        hideConsent();
        // Enable analytics if not already loaded
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    function acceptEssential() {
        setCookie(COOKIE_NAME, 'essential', COOKIE_DURATION);
        hideConsent();
        // Ensure analytics is denied
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    }

    function init() {
        var consent = getCookie(COOKIE_NAME);
        
        // If user already made choice, don't show banner
        if (consent) {
            if (consent === 'all' && typeof gtag !== 'undefined') {
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
            return;
        }

        // Set default consent to denied until user chooses
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'default', {
                'analytics_storage': 'denied'
            });
        }

        // Create and show banner
        var banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = 
            '<div class="cookie-consent-content">' +
                '<div class="cookie-consent-text">' +
                    '<p class="cookie-consent-title">We value your privacy</p>' +
                    '<p class="cookie-consent-description">We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. You can choose "Essential Only" to accept only necessary cookies.</p>' +
                '</div>' +
                '<div class="cookie-consent-actions">' +
                    '<button id="cookie-accept-essential" class="cookie-btn cookie-btn-secondary">Essential Only</button>' +
                    '<button id="cookie-accept-all" class="cookie-btn cookie-btn-primary">Accept All</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(banner);
        
        // Adjust body padding to account for fixed banner
        document.body.style.paddingBottom = banner.offsetHeight + 'px';

        // Event listeners
        document.getElementById('cookie-accept-all').addEventListener('click', acceptAll);
        document.getElementById('cookie-accept-essential').addEventListener('click', acceptEssential);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions globally if needed
    window.rnbCookieConsent = {
        acceptAll: acceptAll,
        acceptEssential: acceptEssential
    };
})();
