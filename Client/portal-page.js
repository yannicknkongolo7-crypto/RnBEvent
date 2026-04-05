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

        /* Fill planner-email and first-name placeholders */
        function fillPlaceholders() {
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
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fillPlaceholders);
        } else {
            fillPlaceholders();
        }

        /* Notify sub-page scripts that portal data is ready */
        window._portalReady = true;
        if (typeof window.onPortalReady === 'function') {
            window.onPortalReady();
        }
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

    window.escHtml = function (s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    };

    window.RNB_SECTION_API = 'https://w8lrwbfe0f.execute-api.us-east-2.amazonaws.com/update-client-section';

    window.savePortalSection = function (section, data, statusEl, btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = 'SAVING...';
        statusEl.textContent = '';
        return fetch(window.RNB_SECTION_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codeHash: window.currentCode, section: section, data: data })
        })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            if (res && res.ok) {
                statusEl.textContent = 'Saved!';
                statusEl.className = 'tracking-save-status save-ok';
            } else {
                statusEl.textContent = 'Save failed: ' + (res.error || 'Unknown');
                statusEl.className = 'tracking-save-status save-err';
            }
        })
        .catch(function (e) {
            statusEl.textContent = 'Save failed: ' + e;
            statusEl.className = 'tracking-save-status save-err';
        })
        .then(function () {
            btnEl.disabled = false;
            btnEl.textContent = 'SAVE CHANGES';
        });
    };
})();
