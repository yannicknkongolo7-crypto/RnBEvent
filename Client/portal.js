(function () {
    'use strict';

    var SESSION_KEY   = 'rnb_portal_access';
    var ROLE_KEY      = 'rnb_portal_role';
    var ROLE_NAME_KEY = 'rnb_portal_role_name';
    var REMEMBER_KEY  = 'rnb_portal_remember'; // localStorage key for cached login
    var REMEMBER_DAYS = 30;

    var gate    = document.getElementById('access-gate');
    var portal  = document.getElementById('portal-content');
    var input   = document.getElementById('access-input');
    var errorEl = document.getElementById('gate-error');
    var cloudReady = false;

    function sha256(str) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
            return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        });
    }

    /* ── Build roles map: any hash → { primaryHash, role } ─── */
    function buildRolesMap() {
        window.RNB_CLIENTS_ROLES = window.RNB_CLIENTS_ROLES || {};
        var raw = window.RNB_CLIENTS_RAW || {};
        Object.keys(raw).forEach(function (primaryHash) {
            var c = raw[primaryHash];
            if (!c || !c.codeHash) return;
            window.RNB_CLIENTS_ROLES[c.codeHash] = { primaryHash: c.codeHash, role: 'couple' };
            if (c.plannerCodeHash) window.RNB_CLIENTS_ROLES[c.plannerCodeHash] = { primaryHash: c.codeHash, role: 'planner' };
            if (c.teamCodeHash)    window.RNB_CLIENTS_ROLES[c.teamCodeHash]    = { primaryHash: c.codeHash, role: 'rnbTeam' };
        });
    }

    /* ── Fetch clients from S3, merge into RNB_CLIENTS_RAW ─── */
    function fetchCloudClients() {
        var url = window.RNB_CLOUD_URL;
        if (!url) return Promise.resolve();
        return fetch(url, { redirect: 'follow' })
            .then(function (r) { return r.json(); })
            .then(function (arr) {
                if (Array.isArray(arr)) {
                    if (!window.RNB_CLIENTS_RAW) window.RNB_CLIENTS_RAW = {};
                    arr.forEach(function (c) {
                        if (c && c.codeHash) {
                            window.RNB_CLIENTS_RAW[c.codeHash] = c;
                        }
                    });
                    buildRolesMap();
                }
                cloudReady = true;
            })
            .catch(function (e) {
                console.warn('Cloud client fetch failed, using static config:', e);
                buildRolesMap(); // build from static config
                cloudReady = true;
            });
    }

    /* ── Find client + role by any hash ─────────────────────── */
    function findClientAndRole(hash) {
        buildRolesMap(); // ensure map is current
        var roles = window.RNB_CLIENTS_ROLES || {};
        var roleInfo = roles[hash];
        if (!roleInfo) return null;
        var client = window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[roleInfo.primaryHash];
        if (!client || client.active === false) return null;
        return { client: client, primaryHash: roleInfo.primaryHash, role: roleInfo.role };
    }

    /* ── Remember-me helpers ─────────────────────────────────── */
    function saveRemembered(primaryHash, role, roleName) {
        try {
            localStorage.setItem(REMEMBER_KEY, JSON.stringify({
                hash:     primaryHash,
                role:     role,
                roleName: roleName,
                expiry:   Date.now() + REMEMBER_DAYS * 24 * 3600 * 1000
            }));
        } catch (e) { /* storage may be unavailable */ }
    }

    function loadRemembered() {
        try {
            var raw = localStorage.getItem(REMEMBER_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || !data.hash || !data.expiry) return null;
            if (Date.now() > data.expiry) { localStorage.removeItem(REMEMBER_KEY); return null; }
            return data;
        } catch (e) { return null; }
    }

    function clearRemembered() {
        try { localStorage.removeItem(REMEMBER_KEY); } catch (e) {}
    }

    /* ── Init ────────────────────────────────────────────────── */
    function init() {
        fetchCloudClients().then(function () {
            // 1. Check sessionStorage first
            var savedHash = sessionStorage.getItem(SESSION_KEY);
            var savedRole = sessionStorage.getItem(ROLE_KEY);
            if (savedHash) {
                var result = findClientAndRole(savedHash);
                // backward compat: savedHash might be the primary hash directly
                if (!result) {
                    var client = window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[savedHash];
                    if (client && client.active !== false) {
                        result = { client: client, primaryHash: savedHash, role: savedRole || 'couple' };
                    }
                }
                if (result) {
                    showPortal(result.primaryHash, result.role, getRoleName(result));
                    return;
                }
                sessionStorage.removeItem(SESSION_KEY);
                sessionStorage.removeItem(ROLE_KEY);
                sessionStorage.removeItem(ROLE_NAME_KEY);
            }
            // 2. Check localStorage remember-me
            var remembered = loadRemembered();
            if (remembered) {
                var client2 = window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[remembered.hash];
                if (client2 && client2.active !== false) {
                    storeSession(remembered.hash, remembered.role, remembered.roleName);
                    showPortal(remembered.hash, remembered.role, remembered.roleName);
                } else {
                    clearRemembered();
                }
            }
        });
    }

    function getRoleName(result) {
        if (result.role === 'planner') return result.client.planner || 'Event Planner';
        if (result.role === 'rnbTeam') return 'RNB Team';
        return result.client.firstName || 'Client';
    }

    function storeSession(primaryHash, role, roleName) {
        sessionStorage.setItem(SESSION_KEY,   primaryHash);
        sessionStorage.setItem(ROLE_KEY,      role);
        sessionStorage.setItem(ROLE_NAME_KEY, roleName);
    }

    /* ── Access check ────────────────────────────────────────── */
    function checkAccess() {
        var entered = (input.value || '').trim().toUpperCase();
        if (!entered) { showError('Please enter your access code.'); return; }

        sha256(entered).then(function (hash) {
            var result = findClientAndRole(hash);
            if (result) {
                handleSuccessfulLogin(result, hash);
            } else if (!cloudReady) {
                fetchCloudClients().then(function () {
                    var r2 = findClientAndRole(hash);
                    if (r2) {
                        handleSuccessfulLogin(r2, hash);
                    } else {
                        showError('Invalid access code. Please check your code and try again.');
                        input.value = '';
                        input.focus();
                    }
                });
            } else {
                showError('Invalid access code. Please check your code and try again.');
                input.value = '';
                input.focus();
            }
        });
    }

    function handleSuccessfulLogin(result, enteredHash) {
        var roleName = getRoleName(result);
        storeSession(result.primaryHash, result.role, roleName);
        errorEl.textContent = '';
        input.value = '';

        var rememberBox = document.getElementById('remember-me-check');
        if (rememberBox && rememberBox.checked) {
            saveRemembered(result.primaryHash, result.role, roleName);
        }

        showPortal(result.primaryHash, result.role, roleName);
    }

    /* ── Log out ─────────────────────────────────────────────── */
    function logOut() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(ROLE_KEY);
        sessionStorage.removeItem(ROLE_NAME_KEY);
        clearRemembered();
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

    function showPortal(primaryHash, role, roleName) {
        gate.style.display = 'none';
        portal.classList.remove('hidden');
        var client = window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[primaryHash];
        if (client) personalizePortal(client);

        // Inject role badge into header
        var badge = document.getElementById('portal-role-badge');
        if (badge) {
            badge.className = 'role-badge role-' + role;
            var roleLabels = { couple: 'Client', planner: 'Planner', rnbTeam: 'RNB Team' };
            badge.textContent = roleLabels[role] || role;
        }
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
