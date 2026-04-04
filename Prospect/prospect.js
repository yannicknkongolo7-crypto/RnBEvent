/**
 * RNB Events — Prospect Portal
 * Prospect codes and data managed here.
 * Add new prospects as entries below.
 */

(function () {
    'use strict';

    var SESSION_KEY = 'rnb_prospect_access';

    // Prospect entries: SHA-256 hash of code -> prospect data
    var PROSPECTS = {
        '163186aafe0ebf03f5369f5df213786e0db611875e2aa90b095569a675760553': {
            firstName:  'Future Client',
            eventType:  '',
            status:     'New Inquiry',
            nextStep:   'Your coordinator will reach out within 24\u201348 hours.'
        }
    };

    // Hash helper
    function sha256(str) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
            return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        });
    }

    var gate    = document.getElementById('access-gate');
    var portal  = document.getElementById('portal-content');
    var input   = document.getElementById('access-input');
    var errorEl = document.getElementById('gate-error');

    // On load: check session (stored as hash)
    (function init() {
        var saved = sessionStorage.getItem(SESSION_KEY);
        if (saved && PROSPECTS[saved]) {
            showPortal(saved);
        }
    })();

    function checkAccess() {
        var entered = (input.value || '').trim().toUpperCase();
        if (!entered) { showError('Please enter your invite code.'); return; }

        sha256(entered).then(function (hash) {
            if (PROSPECTS[hash]) {
                sessionStorage.setItem(SESSION_KEY, hash);
                clearError();
                showPortal(hash);
            } else {
                showError('Invalid invite code. Please check your code and try again.');
                input.value = '';
                input.focus();
            }
        });
    }

    function logOut() {
        sessionStorage.removeItem(SESSION_KEY);
        portal.classList.add('hidden');
        gate.style.display = 'flex';
        input.value = '';
        clearError();
    }

    function showPortal(code) {
        gate.style.display = 'none';
        portal.classList.remove('hidden');
        var p = PROSPECTS[code];
        if (!p) return;

        var nameEl   = document.getElementById('prospect-name');
        var statusEl = document.getElementById('prospect-status');
        var nextEl   = document.getElementById('prospect-next');

        if (nameEl   && p.firstName) nameEl.textContent   = p.firstName;
        if (statusEl && p.status)    statusEl.textContent = p.status;
        if (nextEl   && p.nextStep)  nextEl.textContent   = p.nextStep;

        // Apply status color
        if (statusEl) {
            statusEl.className = 'status-badge status-' + p.status.toLowerCase().replace(/\s+/g, '-');
        }
    }

    function showError(msg) { errorEl.textContent = msg; }
    function clearError()   { errorEl.textContent = ''; }

    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') checkAccess();
        });
    }

    window.checkAccess = checkAccess;
    window.logOut      = logOut;

})();
