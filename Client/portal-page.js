/**
 * RNB Events — Portal Sub-page Auth + Init
 * Included by all Client sub-pages (timeline, moodboard, etc.)
 * Fetches live data from cloud, falls back to static clients-config.js
 */

(function () {
    'use strict';

    var SESSION_KEY   = 'rnb_portal_access';
    var ROLE_KEY      = 'rnb_portal_role';
    var ROLE_NAME_KEY = 'rnb_portal_role_name';

    var code     = sessionStorage.getItem(SESSION_KEY);
    var roleVal  = sessionStorage.getItem(ROLE_KEY)      || 'couple';
    var roleName = sessionStorage.getItem(ROLE_NAME_KEY) || 'Client';

    if (!code) {
        window.location.replace('/Client');
        throw new Error('Redirecting to gate.');
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

    function bootPortal() {
        // code is the PRIMARY codeHash stored at login
        var client = window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[code];
        if (!client || client.active === false) {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace('/Client');
            return;
        }

        window.currentClient   = client;
        window.currentCode     = code;
        window.currentRole     = roleVal;
        window.currentRoleName = roleName;

        window.portalSignOut = function () {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(ROLE_KEY);
            sessionStorage.removeItem(ROLE_NAME_KEY);
            try { localStorage.removeItem('rnb_portal_remember'); } catch (e) {}
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
                    buildRolesMap();
                }
            })
            .catch(function () { buildRolesMap(); /* fallback to static */ })
            .then(bootPortal);
    } else {
        buildRolesMap();
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

    window.toDDMMYYYY = function (iso) {
        if (!iso) return '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
        var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return m[3] + '/' + m[2] + '/' + m[1];
        return String(iso);
    };

    window.toIso = function (ddmmyyyy) {
        if (!ddmmyyyy) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy;
        var m = String(ddmmyyyy).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) return m[3] + '-' + m[2] + '-' + m[1];
        return '';
    };

    window.formatNoteTs = function (isoTs) {
        if (!isoTs) return '';
        try {
            var d = new Date(isoTs);
            return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
        } catch (e) { return isoTs; }
    };

    window.RNB_SECTION_API = 'https://w8lrwbfe0f.execute-api.us-east-2.amazonaws.com/update-client-section';

    window.savePortalSection = function (section, data, statusEl, btnEl, editAction) {
        btnEl.disabled = true;
        btnEl.textContent = 'SAVING...';
        statusEl.textContent = '';
        var payload = {
            codeHash: window.currentCode,
            section: section,
            data: data
        };
        if (editAction) {
            payload.editLogEntry = {
                ts:       new Date().toISOString(),
                role:     window.currentRole     || 'couple',
                roleName: window.currentRoleName || 'Client',
                action:   editAction
            };
        }
        return fetch(window.RNB_SECTION_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
