/**
 * RNB Events — Prospect Portal
 * Prospect codes and data managed here.
 * Add new prospects as entries below.
 */

(function () {
    'use strict';

    var SESSION_KEY = 'rnb_prospect_access';

    // Prospect entries: code -> prospect data
    var PROSPECTS = {
        'PROSPECT2026': {
            code:       'PROSPECT2026',
            firstName:  'Future Client',
            eventType:  '',
            status:     'New Inquiry',
            nextStep:   'Your coordinator will reach out within 24–48 hours.'
        }
        // Add prospects:
        // ,'JONES0726': {
        //     code:      'JONES0726',
        //     firstName: 'Jennifer',
        //     eventType: 'Birthday Celebration',
        //     status:    'In Conversation',
        //     nextStep:  'Proposal being prepared — expect it by April 8.'
        // }
    };

    var gate    = document.getElementById('access-gate');
    var portal  = document.getElementById('portal-content');
    var input   = document.getElementById('access-input');
    var errorEl = document.getElementById('gate-error');

    // On load: check session
    (function init() {
        var saved = sessionStorage.getItem(SESSION_KEY);
        if (saved && PROSPECTS[saved]) {
            showPortal(saved);
        }
    })();

    function checkAccess() {
        var entered = (input.value || '').trim().toUpperCase();
        if (!entered) { showError('Please enter your invite code.'); return; }

        if (PROSPECTS[entered]) {
            sessionStorage.setItem(SESSION_KEY, entered);
            clearError();
            showPortal(entered);
        } else {
            showError('Invalid invite code. Please check your code and try again.');
            input.value = '';
            input.focus();
        }
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
