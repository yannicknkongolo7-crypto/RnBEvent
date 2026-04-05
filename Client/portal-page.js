/**
 * RNB Events — Portal Sub-page Auth + Init
 * Included by all Client sub-pages (timeline, moodboard, etc.)
 * Fetches live data from cloud, falls back to static clients-config.js
 */

(function () {
    'use strict';

    var SESSION_KEY = 'rnb_portal_access';
    var code = sessionStorage.getItem(SESSION_KEY);

    if (!code) {
        window.location.replace('/Client');
        throw new Error('Redirecting to gate.');
    }

    function bootPortal() {
        if (!window.RNB_CLIENTS_RAW || !window.RNB_CLIENTS_RAW[code]) {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace('/Client');
            return;
        }

        window.currentClient = window.RNB_CLIENTS_RAW[code];
        window.currentCode   = code;

        window.portalSignOut = function () {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace('/Client');
        };

        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('.planner-email-link').forEach(function (el) {
                if (window.currentClient && window.currentClient.plannerEmail) {
                    el.href = 'mailto:' + window.currentClient.plannerEmail;
                }
            });
            document.querySelectorAll('.client-first-name').forEach(function (el) {
                if (window.currentClient && window.currentClient.firstName) {
                    el.textContent = window.currentClient.firstName;
                }
            });
        });
    }

    /* Fetch from S3 first, then boot */
    var url = window.RNB_CLOUD_URL;
    if (url) {
        fetch(url, { redirect: 'follow' })
            .then(function (r) { return r.json(); })
            .then(function (arr) {
                if (Array.isArray(arr)) {
                    if (!window.RNB_CLIENTS_RAW) window.RNB_CLIENTS_RAW = {};
                    arr.forEach(function (c) {
                        if (c && c.codeHash) {
                            window.RNB_CLIENTS_RAW[c.codeHash] = c;
                        }
                    });
                }
            })
            .catch(function () { /* fallback to static */ })
            .then(bootPortal);
    } else {
        bootPortal();
    }

    window.capitalize = function (s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    };

    window.renderComingSoon = function (containerId, msg) {
        var el = document.getElementById(containerId);
        if (el) {
            el.innerHTML = '<p class="section-coming">' + (msg || 'This section is being prepared by your planning team. Check back soon.') + '</p>';
        }
    };
})();
