/* ===========================
   CLIENT PORTAL — ACCESS GATE
   =========================== */

(function () {
    'use strict';

    // -------------------------------------------------
    // CONFIG
    // To add or change codes, update this array.
    // Each entry: { code: 'XXXXX', name: 'Client Name' }
    // Keep codes out of public repos — use environment
    // variables or a backend for production.
    // -------------------------------------------------
    const VALID_CODES = [
        { code: 'RNB2026', name: 'Client' },
        // Add more client codes here:
        // { code: 'SMITHWEDDING', name: 'The Smith Wedding' },
    ];

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
        if (saved && findCode(saved)) {
            showPortal();
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

        const match = findCode(entered);

        if (match) {
            sessionStorage.setItem(SESSION_KEY, entered);
            clearError();
            showPortal();
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
    // Helpers
    // -------------------------------------------------
    function findCode(code) {
        return VALID_CODES.find(function (entry) {
            return entry.code === code.toUpperCase();
        });
    }

    function showPortal() {
        gate.style.display = 'none';
        portal.classList.remove('hidden');
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
