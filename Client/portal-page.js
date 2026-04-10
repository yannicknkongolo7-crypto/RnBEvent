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
        fetch(url + '?_t=' + Date.now(), { redirect: 'follow' })
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

    window.RNB_UPLOAD_API = 'https://w8lrwbfe0f.execute-api.us-east-2.amazonaws.com/upload-file';

    /**
     * Compress an image file via Canvas then upload to S3 through the Lambda.
     * Returns a Promise that resolves to the public S3 URL.
     * @param {File} file  - Browser File object (must be image/*)
     * @param {Function} [onStatus] - optional callback(string) for progress messages
     */
    window.uploadPortalFile = function (file, onStatus) {
        function status(msg) { if (typeof onStatus === 'function') onStatus(msg); }
        return new Promise(function (resolve, reject) {
            if (!file || !file.type.startsWith('image/')) {
                return reject(new Error('Only image files are supported.'));
            }

            status('Reading file…');
            var reader = new FileReader();
            reader.onerror = function () { reject(new Error('Could not read file.')); };
            reader.onload = function (e) {
                var img = new Image();
                img.onerror = function () { reject(new Error('Could not load image.')); };
                img.onload = function () {
                    /* Resize to max 1 400 px on longest side, JPEG 82 % quality */
                    var MAX = 1400;
                    var w = img.width, h = img.height;
                    if (w > MAX || h > MAX) {
                        if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
                        else        { w = Math.round(w * MAX / h); h = MAX; }
                    }
                    var canvas = document.createElement('canvas');
                    canvas.width  = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    var b64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];

                    status('Uploading…');
                    fetch(window.RNB_UPLOAD_API, {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            codeHash:    window.currentCode,
                            fileName:    file.name,
                            contentType: 'image/jpeg',
                            data:        b64
                        })
                    })
                    .then(function (r) { return r.json(); })
                    .then(function (res) {
                        if (res && res.ok) { resolve(res.url); }
                        else { reject(new Error(res.error || 'Upload failed.')); }
                    })
                    .catch(function (err) { reject(new Error('Upload failed — check your connection.')); });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
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
                /* Keep in-memory client in sync so current session reflects the save */
                if (window.currentClient) window.currentClient[section] = data;
            } else {
                statusEl.textContent = 'Save failed: ' + (res.error || 'Unknown error — check your connection and try again.');
                statusEl.className = 'tracking-save-status save-err';
            }
        })
        .catch(function (e) {
            statusEl.textContent = 'Save failed — check your internet connection and try again.';
            statusEl.className = 'tracking-save-status save-err';
        })
        .then(function () {
            btnEl.disabled = false;
            btnEl.textContent = 'SAVE CHANGES';
        });
    };
})();
