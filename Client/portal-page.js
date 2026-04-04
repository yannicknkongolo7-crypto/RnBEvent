/**
 * RNB Events — Portal Sub-page Auth + Init
 * Included by all Client sub-pages (timeline, moodboard, etc.)
 * Must be loaded AFTER clients-config.js
 */

(function () {
    'use strict';

    var SESSION_KEY = 'rnb_portal_access';

    // Redirect immediately if no valid session
    var code = sessionStorage.getItem(SESSION_KEY);
    if (!code || !window.RNB_CLIENTS || !window.RNB_CLIENTS[code]) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('/Client');
        throw new Error('Redirecting to gate.');
    }

    // Expose current client globally for page scripts
    window.currentClient = window.RNB_CLIENTS[code];
    window.currentCode   = code;

    // Sign-out helper (used by inline onclick in sub-pages)
    window.portalSignOut = function () {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('/Client');
    };

    // Populate header planner email link if present
    document.addEventListener('DOMContentLoaded', function () {
        var emailLinks = document.querySelectorAll('.planner-email-link');
        emailLinks.forEach(function (el) {
            if (window.currentClient && window.currentClient.plannerEmail) {
                el.href = 'mailto:' + window.currentClient.plannerEmail;
            }
        });

        // Update any "client name" spans
        var nameEls = document.querySelectorAll('.client-first-name');
        nameEls.forEach(function (el) {
            if (window.currentClient && window.currentClient.firstName) {
                el.textContent = window.currentClient.firstName;
            }
        });
    });

    // Helper: capitalize first letter
    window.capitalize = function (s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    };

    // Helper: render "coming soon" placeholder
    window.renderComingSoon = function (containerId, msg) {
        var el = document.getElementById(containerId);
        if (el) {
            el.innerHTML = '<p class="section-coming">' + (msg || 'This section is being prepared by your planning team. Check back soon.') + '</p>';
        }
    };

})();
