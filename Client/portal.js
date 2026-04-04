/* ===========================
   CLIENT PORTAL — ACCESS GATE
   Reads client data from clients-config.js (RNB_CLIENTS_RAW)
   =========================== */

(function () {
    'use strict';

    var SESSION_KEY = 'rnb_portal_access';
    var gate        = document.getElementById('access-gate');
    var portal      = document.getElementById('portal-content');
    var input       = document.getElementById('access-input');
    var errorEl     = document.getElementById('gate-error');

    function sha256(str) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
            return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        });
    }

    function findClient(hash) {
        return window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[hash] || null;
    }

    function init() {
        var saved = sessionStorage.getItem(SESSION_KEY);
        if (saved && findClient(saved)) {
            showPortal(saved);
        }
    }

    function checkAccess() {
        var entered = (input.value || '').trim().toUpperCase();
        if (!entered) { showError('Please enter your access code.'); return; }

        sha256(entered).then(function (hash) {
            var client = findClient(hash);
            if (client) {
                sessionStorage.setItem(SESSION_KEY, hash);
                errorEl.textContent = '';
                showPortal(hash);
            } else {
                showError('Invalid access code. Please check your code and try again.');
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
        errorEl.textContent = '';
        input.focus();
    }

    function personalizePortal(client) {
        var nameEl  = document.getElementById('portal-client-name');
        var typeEl  = document.getElementById('portal-event-type');
        var dateEl  = document.getElementById('portal-event-date');
        var venueEl = document.getElementById('portal-event-venue');
        if (nameEl && client.firstName) nameEl.textContent = client.firstName + '\'s';
        if (typeEl)  typeEl.textContent  = client.eventType  || '\u2013';
        if (dateEl)  dateEl.textContent  = client.eventDate  || '\u2013';
        if (venueEl) venueEl.textContent = client.eventVenue || '\u2013';
    }

    function showPortal(hash) {
        gate.style.display = 'none';
        portal.classList.remove('hidden');
        var client = findClient(hash || sessionStorage.getItem(SESSION_KEY));
        if (client) personalizePortal(client);
    }

    function showError(msg) { errorEl.textContent = msg; }

    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') checkAccess();
        });
    }

    window.checkAccess = checkAccess;
    window.logOut      = logOut;

    init();
})();
