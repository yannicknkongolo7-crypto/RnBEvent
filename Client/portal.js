/* ===========================
   CLIENT PORTAL — ACCESS GATE
   Reads codes from clients-config.js (RNB_CLIENTS)
   =========================== */

(function () {
    'use strict';

    const SESSION_KEY = 'rnb_portal_access';
    const gate        = document.getElementById('access-gate');
    const portal      = document.getElementById('portal-content');
    const input       = document.getElementById('access-input');
    const errorEl     = document.getElementById('gate-error');

    // -------------------------------------------------
    // On load: check if already authenticated
    // -------------------------------------------------
    function init() {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved && findClient(saved)) {
            showPortal(saved);
        }
    }

    // -------------------------------------------------
    // Validate and grant access
    // -------------------------------------------------
    function checkAccess() {
        const entered = (input.value || '').trim().toUpperCase();

        if (!entered) {
            showError('Please enter your access code.');
            return;
        }

        const client = findClient(entered);

        if (client) {
            sessionStorage.setItem(SESSION_KEY, entered);
            clearError();
            showPortal(entered);
        } else {
            showError('Invalid access code. Please check your code and try again.');
            input.value = '';
            input.focus();
        }
    }

    // -------------------------------------------------
    // Log out / clear session
    // -------------------------------------------------
    function logOut() {
        sessionStorage.removeItem(SESSION_KEY);
        portal.classList.add('hidden');
        gate.style.display = 'flex';
        input.value = '';
        clearError();
        input.focus();
    }

    // -------------------------------------------------
    // Helpers — reads from clients-config.js
    // -------------------------------------------------
    function findClient(code) {
        return window.RNB_CLIENTS && window.RNB_CLIENTS[code.toUpperCase()];
    }

    function personalizePortal(client) {
        // Update welcome name in hero
        var nameEl = document.getElementById('portal-client-name');
        if (nameEl && client.firstName) nameEl.textContent = client.firstName + '\'s';

        // Update event info strip
        var typeEl  = document.getElementById('portal-event-type');
        var dateEl  = document.getElementById('portal-event-date');
        var venueEl = document.getElementById('portal-event-venue');
        if (typeEl)  typeEl.textContent  = client.eventType  || '–';
        if (dateEl)  dateEl.textContent  = client.eventDate  || '–';
        if (venueEl) venueEl.textContent = client.eventVenue || '–';
    }

    function showPortal(code) {
        gate.style.display = 'none';
        portal.classList.remove('hidden');
        var client = findClient(code || sessionStorage.getItem(SESSION_KEY));
        if (client) personalizePortal(client);
    }

    function showError(msg) {
        errorEl.textContent = msg;
    }

    function clearError() {
        errorEl.textContent = '';
    }

    // -------------------------------------------------
    // Allow Enter key to submit
    // -------------------------------------------------
    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                checkAccess();
            }
        });
    }

    // Expose to inline onclick handlers
    window.checkAccess = checkAccess;
    window.logOut      = logOut;

    // Boot
    init();

})();
