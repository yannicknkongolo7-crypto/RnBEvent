    // Set this to your API Gateway endpoint for Lambda upload
    window.RNB_UPLOAD_API = window.RNB_UPLOAD_API || 'https://w8lrwbfe0f.execute-api.us-east-2.amazonaws.com/upload-clients';
(function () {
    'use strict';

    /* ── Global error safety net ─────────────────────── */
    window.onerror = function (msg, src, line) {
        console.error('Admin error:', msg, src, line);
        var t = document.getElementById('admin-toast');
        if (t) { t.textContent = 'Something went wrong — check console.'; t.classList.add('toast-visible'); setTimeout(function () { t.classList.remove('toast-visible'); }, 4000); }
    };

    var SESSION_KEY     = 'rnb_admin_access';
    var STORAGE_PROS    = 'rnb_admin_prospects';
    var STORAGE_TASKS   = 'rnb_admin_tasks';
    var STORAGE_CONTENT         = 'rnb_content_drafts';
    var STORAGE_CONTENT_HISTORY = 'rnb_content_drafts_history';
    var STORAGE_CLIENTS         = 'rnb_admin_clients';

    var CONTENT_PAGE_URLS = {
        home:     'https://rnbevents716.com/',
        service:  'https://rnbevents716.com/service',
        lovebook: 'https://rnbevents716.com/lovebook',
        about:    'https://rnbevents716.com/about',
        crafting: 'https://rnbevents716.com/crafting-moments'
    };

    var CONTENT_SCHEMA = {
        home: [
            { key: 'home_hero_headline', label: 'Hero — Main Headline',      type: 'text',     hint: 'Primary heading on the home page' },
            { key: 'home_hero_subtitle', label: 'Hero — Tagline / Subtitle', type: 'text',     hint: 'Subheading below the main headline' },
            { key: 'home_intro_text',    label: 'Intro Paragraph',           type: 'textarea', hint: 'Opening paragraph below hero section' },
            { key: 'home_cta_label',     label: 'CTA Button Text',           type: 'text',     hint: 'e.g. “Book a Consultation”' },
            { key: 'home_wedding_img',   label: 'Weddings Card — Photo',    type: 'image',    hint: 'Service card image for Weddings',         currentSrc: 'https://rnbevents716.com/Weddings.jpeg' },
            { key: 'home_corp_img',      label: 'Corporate Card — Photo',   type: 'image',    hint: 'Service card image for Corporate Events', currentSrc: 'https://rnbevents716.com/Corporate%20Event.jpg' },
            { key: 'home_social_img',    label: 'Social Card — Photo',      type: 'image',    hint: 'Service card image for Social Events',    currentSrc: 'https://rnbevents716.com/Social%20Event.jpeg' }
        ],
        service: [
            { key: 'svc_headline', label: 'Services — Page Headline', type: 'text',     hint: 'e.g. “Our Services”' },
            { key: 'svc_intro',    label: 'Services — Intro Text',    type: 'textarea', hint: 'Opening paragraph for the Services page' },
            { key: 'svc_cta',      label: 'Services — CTA Text',      type: 'text',     hint: 'Call-to-action button label' }
        ],
        lovebook: [
            { key: 'lb_headline', label: 'Love Book — Headline',   type: 'text',     hint: 'e.g. “The Love Book”' },
            { key: 'lb_intro',    label: 'Love Book — Intro Text', type: 'textarea', hint: 'Description at the top of the Love Book page' },
            { key: 'lb_photo_1',  label: 'Gallery Photo 1',          type: 'image',    hint: 'First gallery photo',  currentSrc: 'https://rnbevents716.com/1.jpeg' },
            { key: 'lb_photo_2',  label: 'Gallery Photo 2',          type: 'image',    hint: 'Second gallery photo', currentSrc: 'https://rnbevents716.com/2.jpeg' },
            { key: 'lb_photo_3',  label: 'Gallery Photo 3',          type: 'image',    hint: 'Third gallery photo',  currentSrc: 'https://rnbevents716.com/3.jpeg' },
            { key: 'lb_photo_4',  label: 'Gallery Photo 4',          type: 'image',    hint: 'Fourth gallery photo', currentSrc: 'https://rnbevents716.com/4.JPG' }
        ],
        about: [
            { key: 'about_headline', label: 'About — Page Headline', type: 'text',     hint: 'e.g. “About RNB Events”' },
            { key: 'about_bio',      label: 'Bio / Description',     type: 'textarea', hint: 'Main bio or brand description text' },
            { key: 'about_mission',  label: 'Mission Statement',     type: 'textarea', hint: 'Your mission or values statement' },
            { key: 'about_photo_1',  label: 'About Photo 1',         type: 'image',    hint: 'First about-us gallery photo',  currentSrc: 'https://rnbevents716.com/about-1.jpeg' },
            { key: 'about_photo_2',  label: 'About Photo 2',         type: 'image',    hint: 'Second about-us gallery photo', currentSrc: 'https://rnbevents716.com/about-2.JPG' },
            { key: 'about_photo_3',  label: 'About Photo 3',         type: 'image',    hint: 'Third about-us gallery photo',  currentSrc: 'https://rnbevents716.com/about-3.JPG' }
        ],
        crafting: [
            { key: 'cm_headline', label: 'Crafting Moments — Headline', type: 'text',     hint: 'Page hero headline' },
            { key: 'cm_intro',    label: 'Intro Paragraph',             type: 'textarea', hint: 'Opening text for the Crafting Moments page' },
            { key: 'cm_photo_1',  label: 'Gallery Photo 1',             type: 'image',    hint: 'First gallery photo',  currentSrc: 'https://rnbevents716.com/crafting-1.jpeg' },
            { key: 'cm_photo_2',  label: 'Gallery Photo 2',             type: 'image',    hint: 'Second gallery photo', currentSrc: 'https://rnbevents716.com/crafting-2.jpeg' },
            { key: 'cm_photo_3',  label: 'Gallery Photo 3',             type: 'image',    hint: 'Third gallery photo',  currentSrc: 'https://rnbevents716.com/crafting-3.jpeg' },
            { key: 'cm_photo_4',  label: 'Gallery Photo 4',             type: 'image',    hint: 'Fourth gallery photo', currentSrc: 'https://rnbevents716.com/crafting-4.jpeg' },
            { key: 'cm_photo_5',  label: 'Gallery Photo 5',             type: 'image',    hint: 'Fifth gallery photo',  currentSrc: 'https://rnbevents716.com/crafting-5.jpeg' }
        ]
    };

    var gate    = document.getElementById('access-gate');
    var content = document.getElementById('admin-content');
    var input   = document.getElementById('access-input');

    /* ── State ───────────────────────────────────────── */
    var state = {
        prospects:    [],
        tasks:        [],
        clients:      [],
        activeFilter: 'all'
    };
    var contentDrafts        = {};
    var activeContentPage    = 'home';
    var contentPreviewActive = false;
    var kanbanPendingMap     = {};

    function decodeTotpKey() {
        var arr = (window.ADMIN_CONFIG || {}).totpKey;
        if (!arr || !arr.length) return '';
        return arr.map(function (c) { return String.fromCharCode(c); }).join('');
    }

    /* ── Random access code generator ───────────────── */
    function generateRandomCode(prefix) {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var code = prefix + '-';
        for (var i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /* Generate unique planner and team codes for a client */
    function generateClientCodes(coupleCode) {
        var plannerCode, teamCode;
        do { plannerCode = generateRandomCode('PLAN'); }
        while (state.clients.some(function (c) { return c.plannerCode === plannerCode || c.accessCode === plannerCode; }));
        do { teamCode = generateRandomCode('TEAM'); }
        while (state.clients.some(function (c) { return c.teamCode === teamCode || c.accessCode === teamCode; }));
        return { plannerCode: plannerCode, teamCode: teamCode };
    }

    function fillGeneratedCodes() {
        var coupleInput = document.getElementById('c-code');
        var plannerInput = document.getElementById('c-planner-code');
        var teamInput = document.getElementById('c-team-code');
        if (!plannerInput || !teamInput) return;
        var couple = (coupleInput ? coupleInput.value || '' : '').trim().toUpperCase() || 'CODE';
        var codes = generateClientCodes(couple);
        plannerInput.value = codes.plannerCode;
        teamInput.value    = codes.teamCode;
    }
    window.fillGeneratedCodes = fillGeneratedCodes;

    var pendingAuth = false; // step 1 passed, waiting for TOTP

    /* ── Auth Lockout ────────────────────────────────── */
    var AUTH_MAX_ATTEMPTS = 5;
    var AUTH_LOCKOUT_MS   = 300000; // 5 minutes
    var authAttempts  = parseInt(sessionStorage.getItem('rnb_auth_attempts') || '0', 10);
    var authLockUntil = parseInt(sessionStorage.getItem('rnb_auth_lockuntil') || '0', 10);

    function recordFailedAttempt(errId) {
        authAttempts++;
        sessionStorage.setItem('rnb_auth_attempts', String(authAttempts));
        if (authAttempts >= AUTH_MAX_ATTEMPTS) {
            authLockUntil = Date.now() + AUTH_LOCKOUT_MS;
            sessionStorage.setItem('rnb_auth_lockuntil', String(authLockUntil));
            showErr(errId, 'Too many failed attempts. Try again in 5 minutes.');
            return true;
        }
        return false;
    }

    function isLockedOut(errId) {
        if (authLockUntil && Date.now() < authLockUntil) {
            showErr(errId, 'Too many failed attempts. Try again in 5 minutes.');
            return true;
        }
        if (authLockUntil && Date.now() >= authLockUntil) {
            authAttempts = 0; authLockUntil = 0;
            sessionStorage.removeItem('rnb_auth_attempts');
            sessionStorage.removeItem('rnb_auth_lockuntil');
        }
        return false;
    }

    function sha256Hex(str) {
        if (!crypto || !crypto.subtle) {
            return Promise.reject(new Error('Secure context required'));
        }
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
            return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        });
    }

    /* ── Boot ────────────────────────────────────────── */
    (function init() {
        if (sessionStorage.getItem(SESSION_KEY) === 'ok') {
            showDashboard();
        }
    })();

    /* ══════════════════════════════════════════════════
       TWO-FACTOR AUTH
    ══════════════════════════════════════════════════ */

    /** Step 1 — validate admin code (SHA-256 hash comparison) */
    function adminStep1() {
        if (isLockedOut('gate-error-1')) return;

        var entered = (input ? input.value : '').trim();
        var cfg = window.ADMIN_CONFIG || {};

        if (!entered) {
            showErr('gate-error-1', 'Invalid admin code.');
            if (input) { input.value = ''; input.focus(); }
            return;
        }

        sha256Hex(entered).then(function (hash) {
            if (hash !== cfg.codeHash) {
                if (!recordFailedAttempt('gate-error-1')) {
                    showErr('gate-error-1', 'Invalid admin code.');
                }
                if (input) { input.value = ''; input.focus(); }
                return;
            }

            authAttempts = 0;
            sessionStorage.removeItem('rnb_auth_attempts');
            sessionStorage.removeItem('rnb_auth_lockuntil');
            clearErr('gate-error-1');
            pendingAuth = true;

            document.getElementById('gate-step1').classList.add('hidden');
            var step2 = document.getElementById('gate-step2');
            step2.classList.remove('hidden');
            var totpInput = document.getElementById('totp-input');
            if (totpInput) totpInput.focus();
        }).catch(function () {
            showErr('gate-error-1', 'Authentication error. Ensure you are using HTTPS.');
        });
    }

    /** Step 2 — validate TOTP code */
    function adminStep2() {
        if (!pendingAuth) return;
        if (isLockedOut('gate-error-2')) return;

        var token  = (document.getElementById('totp-input').value || '').trim();
        var secret = decodeTotpKey();
        var btn    = document.getElementById('totp-verify-btn');

        // If no secret is configured, skip TOTP (backwards compat)
        if (!secret) {
            sessionStorage.setItem(SESSION_KEY, 'ok');
            pendingAuth = false;
            showDashboard();
            return;
        }

        if (token.length !== 6 || !/^\d{6}$/.test(token)) {
            showErr('gate-error-2', 'Please enter a 6-digit code.');
            return;
        }

        if (btn) { btn.textContent = 'VERIFYING\u2026'; btn.disabled = true; }

        verifyTOTP(secret, token).then(function (valid) {
            if (btn) { btn.textContent = 'VERIFY'; btn.disabled = false; }

            if (valid) {
                authAttempts = 0;
                sessionStorage.removeItem('rnb_auth_attempts');
                sessionStorage.removeItem('rnb_auth_lockuntil');
                pendingAuth = false;
                clearErr('gate-error-2');
                sessionStorage.setItem(SESSION_KEY, 'ok');
                showDashboard();
            } else {
                if (!recordFailedAttempt('gate-error-2')) {
                    showErr('gate-error-2', 'Invalid or expired code. Please try again.');
                }
                document.getElementById('totp-input').value = '';
                document.getElementById('totp-input').focus();
            }
        });
    }

    /** Go back to step 1 */
    function backToStep1() {
        pendingAuth = false;
        document.getElementById('gate-step2').classList.add('hidden');
        document.getElementById('gate-step1').classList.remove('hidden');
        document.getElementById('totp-input').value = '';
        clearErr('gate-error-2');
        if (input) input.focus();
    }

    /** Sign out */
    function adminLogout() {
        sessionStorage.removeItem(SESSION_KEY);
        content.classList.add('hidden');
        gate.style.display = 'flex';
        // Reset to step 1
        document.getElementById('gate-step2').classList.add('hidden');
        document.getElementById('gate-step1').classList.remove('hidden');
        if (input) { input.value = ''; }
        pendingAuth = false;
    }

    /* ══════════════════════════════════════════════════
       TOTP — RFC 6238 via Web Crypto API (no libs)
    ══════════════════════════════════════════════════ */

    function base32Decode(base32) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        var clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
        var bits = 0, val = 0, idx = 0;
        var out = new Uint8Array(Math.floor(clean.length * 5 / 8));
        for (var i = 0; i < clean.length; i++) {
            var c = chars.indexOf(clean[i]);
            if (c === -1) continue;
            val = (val << 5) | c;
            bits += 5;
            if (bits >= 8) {
                out[idx++] = (val >>> (bits - 8)) & 0xff;
                bits -= 8;
            }
        }
        return out.buffer;
    }

    function verifyTOTP(secret, token) {
        var keyData;
        try { keyData = base32Decode(secret); } catch (e) { return Promise.resolve(false); }

        return crypto.subtle.importKey(
            'raw', keyData,
            { name: 'HMAC', hash: { name: 'SHA-1' } },
            false, ['sign']
        ).then(function (cryptoKey) {
            var now = Math.floor(Date.now() / 1000 / 30);
            // Check ±1 window (90 s grace for clock drift)
            var checks = [-1, 0, 1].map(function (delta) {
                var buf  = new ArrayBuffer(8);
                var view = new DataView(buf);
                view.setUint32(4, now + delta, false); // counter in low 4 bytes (big-endian)
                return crypto.subtle.sign('HMAC', cryptoKey, buf).then(function (sig) {
                    var hash   = new Uint8Array(sig);
                    var offset = hash[19] & 0xf;
                    var code   = (
                        ((hash[offset]     & 0x7f) << 24) |
                        ((hash[offset + 1] & 0xff) << 16) |
                        ((hash[offset + 2] & 0xff) <<  8) |
                         (hash[offset + 3] & 0xff)
                    ) % 1000000;
                    return code.toString().padStart(6, '0') === token;
                });
            });
            return Promise.all(checks).then(function (results) {
                return results.some(Boolean);
            });
        }).catch(function () { return false; });
    }

    /* ══════════════════════════════════════════════════
       2FA SETUP MODAL
    ══════════════════════════════════════════════════ */

    function showSetup() {
        var secret  = decodeTotpKey();
        var display = document.getElementById('setup-secret-display');
        if (display) display.textContent = formatSecret(secret);
        document.getElementById('modal-2fa-setup').classList.remove('hidden');
    }

    function formatSecret(s) {
        // Group into blocks of 4 for readability: XXXX XXXX XXXX XXXX
        return s.toUpperCase().replace(/(.{4})/g, '$1 ').trim();
    }

    function copySecret() {
        var secret = decodeTotpKey();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(secret).then(function () {
                var btn = document.getElementById('copy-secret-btn');
                if (btn) { btn.textContent = 'COPIED!'; setTimeout(function () { btn.textContent = 'COPY'; }, 2000); }
            });
        }
    }

    /* ══════════════════════════════════════════════════
       DASHBOARD
    ══════════════════════════════════════════════════ */

    var S3_CLIENTS_URL = 'https://rnbevents716.s3.us-east-2.amazonaws.com/clients.json';

    function fetchS3Clients() {
        return fetch(S3_CLIENTS_URL + '?t=' + Date.now())
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (arr) {
                if (!Array.isArray(arr)) arr = [];

                /* If local has clients that S3 doesn't, push them up first.
                   Lambda will merge so nothing in S3 gets lost. */
                if (state.clients.length) {
                    var s3Ids = {};
                    arr.forEach(function (c) { if (c && c.id) s3Ids[c.id] = true; });
                    var localHasExtra = state.clients.some(function (c) { return c.id && !s3Ids[c.id]; });
                    if (localHasExtra || !arr.length) {
                        autoPublishClients();
                    }
                }

                /* S3 → local: adopt any clients from S3 that we don't have locally */
                var localIds = {};
                state.clients.forEach(function (c) { if (c.id) localIds[c.id] = true; });
                var added = false;
                arr.forEach(function (sc) {
                    if (sc && sc.id && !localIds[sc.id]) {
                        state.clients.push(sc);
                        added = true;
                    }
                });

                /* Also update fields of existing local clients from S3 (S3 has fresher data from other machines) */
                arr.forEach(function (sc) {
                    if (sc && sc.id && localIds[sc.id]) {
                        var idx = state.clients.findIndex(function (c) { return c.id === sc.id; });
                        if (idx > -1) { state.clients[idx] = sc; added = true; }
                    }
                });

                if (added) {
                    safeSave(STORAGE_CLIENTS, state.clients);
                    renderAll();
                }
            })
            .catch(function (e) { console.warn('S3 client fetch:', e); });
    }

    function showDashboard() {
        gate.style.display = 'none';
        content.classList.remove('hidden');
        loadState();
        renderAll();
        syncFromCloud();
        fetchS3Clients();
    }

    /* ── State load/save ─────────────────────────────── */
    function loadState() {
        var cfg = window.ADMIN_CONFIG || {};

        // Prospects: merge seed + localStorage additions
        var stored = safeJSON(localStorage.getItem(STORAGE_PROS));
        state.prospects = Array.isArray(stored) && stored.length ? stored : (cfg.prospects || []).slice();

        // Tasks: merge seed + localStorage additions
        var storedT = safeJSON(localStorage.getItem(STORAGE_TASKS));
        state.tasks = Array.isArray(storedT) && storedT.length ? storedT : (cfg.websiteTasks || []).slice();

        // Content drafts
        contentDrafts = safeJSON(localStorage.getItem(STORAGE_CONTENT)) || {};

        // Clients
        var storedC = safeJSON(localStorage.getItem(STORAGE_CLIENTS));
        state.clients = Array.isArray(storedC) ? storedC : [];
    }

    function safeSave(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            showToast('Storage full — clear old data or remove image drafts.');
            console.error('localStorage write failed:', e);
            return false;
        }
    }

    function saveProspectsToStorage() {
        safeSave(STORAGE_PROS, state.prospects);
        cloudPush({ prospects: state.prospects });
    }

    function saveTasksToStorage() {
        safeSave(STORAGE_TASKS, state.tasks);
        cloudPush({ tasks: state.tasks });
    }

    function saveClientsToStorage() {
        safeSave(STORAGE_CLIENTS, state.clients);
        cloudPush({ clients: state.clients });
        autoPublishClients();
    }

    function autoPublishClients() {
        var api = window.RNB_UPLOAD_API;
        if (!api || !state.clients.length) return;
        fetch(api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clients: state.clients })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data && data.ok) {
                updateSyncStatus('synced');
            } else {
                console.warn('Auto-publish failed:', data && data.error);
                updateSyncStatus('error');
            }
        })
        .catch(function (e) {
            console.warn('Auto-publish error:', e);
            updateSyncStatus('error');
        });
    }

    /* ══════════════════════════════════════════════════
       CLOUD SYNC — Google Sheets via Apps Script
    ══════════════════════════════════════════════════ */

    var CLOUD_URL = (window.ADMIN_CONFIG || {}).cloudApiUrl || '';

    function cloudGet() {
        if (!CLOUD_URL) { updateSyncStatus('local'); return Promise.resolve(null); }
        updateSyncStatus('syncing');
        return fetch(CLOUD_URL + '?action=getAll', { redirect: 'follow' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                var ct = r.headers.get('content-type') || '';
                if (ct.indexOf('application/json') === -1 && ct.indexOf('text/json') === -1) throw new Error('Not JSON');
                return r.json();
            })
            .then(function (data) { updateSyncStatus('synced'); return data; })
            .catch(function (e) { console.error('Cloud fetch:', e); updateSyncStatus('local'); return null; });
    }

    function cloudPush(payload) {
        if (!CLOUD_URL) return;
        updateSyncStatus('syncing');
        fetch(CLOUD_URL, {
            method:   'POST',
            headers:  { 'Content-Type': 'text/plain' },
            body:     JSON.stringify(filterCloudPayload(payload)),
            redirect: 'follow'
        })
        .then(function () { updateSyncStatus('synced'); })
        .catch(function (e) { console.error('Cloud push:', e); updateSyncStatus('error'); });
    }

    function filterCloudPayload(payload) {
        if (!payload.content) return payload;
        var clean = {};
        Object.keys(payload.content).forEach(function (k) {
            if (String(payload.content[k]).indexOf('data:image') !== 0) {
                clean[k] = payload.content[k];
            }
        });
        payload.content = clean;
        return payload;
    }

    function syncFromCloud() {
        cloudGet().then(function (data) {
            if (!data) return;
            var changed = false;
            if (Array.isArray(data.prospects) && data.prospects.length) {
                state.prospects = data.prospects;
                safeSave(STORAGE_PROS, state.prospects);
                changed = true;
            }
            if (Array.isArray(data.tasks) && data.tasks.length) {
                state.tasks = data.tasks;
                safeSave(STORAGE_TASKS, state.tasks);
                changed = true;
            }
            if (data.content && Object.keys(data.content).length) {
                Object.keys(data.content).forEach(function (k) {
                    if (!contentDrafts.hasOwnProperty(k)) {
                        contentDrafts[k] = data.content[k];
                    }
                });
                safeSave(STORAGE_CONTENT, contentDrafts);
                changed = true;
            }
            if (Array.isArray(data.clients) && data.clients.length) {
                state.clients = data.clients;
                safeSave(STORAGE_CLIENTS, state.clients);
                changed = true;
            }
            if (changed) renderAll();
        });
    }

    function updateSyncStatus(status) {
        var el = document.getElementById('sync-status');
        if (!el) return;
        el.className = 'sync-indicator sync-' + status;
        if (status === 'syncing') el.textContent = '\u21BB Syncing\u2026';
        else if (status === 'synced')  el.textContent = '\u2713 Synced';
        else if (status === 'local')   el.textContent = '\u2713 Local';
        else if (status === 'error')   el.textContent = '\u2715 Offline';
        else el.textContent = '';
    }

    /* ══════════════════════════════════════════════════
       IMAGE COMPRESSION — Canvas API
    ══════════════════════════════════════════════════ */

    function compressImage(file, maxDim, quality) {
        maxDim  = maxDim  || 1200;
        quality = quality || 0.7;
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onerror = reject;
            reader.onload = function (e) {
                var img = new Image();
                img.onerror = reject;
                img.onload = function () {
                    var w = img.width, h = img.height;
                    if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
                    if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
                    var canvas = document.createElement('canvas');
                    canvas.width  = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /* ── Render all ──────────────────────────────────── */
    function renderAll() {
        try { renderStats(); } catch (e) { console.error('renderStats', e); }
        try { renderCRM(state.activeFilter); } catch (e) { console.error('renderCRM', e); }
        try { renderDashboardClients(); } catch (e) { console.error('renderDashboardClients', e); }
        try { renderKanban(); } catch (e) { console.error('renderKanban', e); }
    }

    /* ── Stats Row ───────────────────────────────────── */
    function renderStats() {
        var ps    = state.prospects;
        var total = ps.length;
        var booked   = ps.filter(function (p) { return p.status === 'Booked'; }).length;
        var inTalks  = ps.filter(function (p) { return p.status === 'In Conversation' || p.status === 'Proposal Sent'; }).length;
        var newLeads = ps.filter(function (p) { return p.status === 'New Lead'; }).length;
        var clients  = state.clients.filter(function (c) { return c.active !== false; }).length;

        var el = document.getElementById('stats-row');
        el.innerHTML =
            stat(total,    'Total Prospects') +
            stat(newLeads, 'New Leads') +
            stat(inTalks,  'In Progress') +
            stat(booked,   'Booked') +
            stat(clients,  'Active Clients');
    }

    function stat(num, label) {
        return '<div class="stat-card"><div class="stat-number">' + num +
               '</div><div class="stat-label">' + label + '</div></div>';
    }

    /* ── CRM ─────────────────────────────────────────── */
    function renderCRM(filter) {
        state.activeFilter = filter || 'all';
        var list = filter && filter !== 'all'
            ? state.prospects.filter(function (p) { return p.status === filter; })
            : state.prospects;

        var el  = document.getElementById('crm-table');
        if (!list.length) {
            el.innerHTML = '<p style="padding:24px 28px;font-size:12px;color:#527141;font-weight:300;letter-spacing:0.5px">No prospects in this category.</p>';
            return;
        }

        var html = '<div class="crm-row crm-head">' +
            '<span>Name</span><span>Email</span><span>Event</span><span>Date</span><span>Status</span><span>Actions</span>' +
            '</div>';

        list.forEach(function (p) {
            var statusCls = (p.status || '').replace(/\s+/g, '-');
            html += '<div class="crm-row" data-id="' + p.id + '">' +
                '<span class="crm-name">' + esc(p.name) + (p.phone ? '<br><small style="font-size:10px;color:#527141;">' + esc(p.phone) + '</small>' : '') + '</span>' +
                '<span class="crm-email">' + (p.email ? '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : '–') + '</span>' +
                '<span class="crm-event">' + esc(p.eventType || '–') + '</span>' +
                '<span class="crm-date">'  + esc(p.eventDate  || '–') + '</span>' +
                '<span><span class="crm-status ' + statusCls + '">' + esc(p.status) + '</span></span>' +
                '<span class="crm-actions">' +
                    '<button class="crm-act-btn" onclick="editProspect(\'' + escJS(p.id) + '\')">EDIT</button>' +
                    '<button class="crm-act-btn del-btn" onclick="deleteProspect(\'' + escJS(p.id) + '\')">DEL</button>' +
                '</span>' +
            '</div>';
        });

        el.innerHTML = html;
    }

    function filterProspects(filter, btn) {
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderCRM(filter);
    }

    /* ── Tasks Board ─────────────────────────────────── */
    function renderTasks() {
        var el = document.getElementById('tasks-board');
        if (!state.tasks.length) {
            el.innerHTML = '<p style="font-size:12px;color:#527141;font-weight:300;">No tasks yet. Add one to get started.</p>';
            return;
        }

        var html = '';
        state.tasks.forEach(function (t) {
            var githubLink = t.githubFile
                ? '<span class="task-file-ref">&#128196; ' + esc(t.githubFile) + '</span>'
                : '';
            html += '<div class="task-row status-' + (t.status || '').replace(/\s+/g, '-') + '" data-id="' + t.id + '">' +
                '<div class="task-left">' +
                    '<div class="task-section-badge">' + esc(t.section || '') + '</div>' +
                    '<div class="task-text">' + esc(t.task) + '</div>' +
                    '<span class="task-priority ' + (t.priority || 'Low') + '">' + esc(t.priority || 'Low') + '</span>' +
                '</div>' +
                '<div class="task-right">' +
                    '<select class="task-status-sel" onchange="updateTaskStatus(\'' + escJS(t.id) + '\', this.value)">' +
                        taskOption('Pending',     t.status) +
                        taskOption('In Progress', t.status) +
                        taskOption('Done',        t.status) +
                    '</select>' +
                    githubLink +
                    '<button class="task-del-btn" onclick="deleteTask(\'' + escJS(t.id) + '\')">REMOVE</button>' +
                '</div>' +
            '</div>';
        });
        el.innerHTML = html;
    }

    function taskOption(val, current) {
        return '<option value="' + val + '"' + (val === current ? ' selected' : '') + '>' + val + '</option>';
    }

    /* ── Prospect CRUD ───────────────────────────────── */
    var editingId = null;

    function openAddProspect() {
        editingId = null;
        clearProspectForm();
        document.getElementById('modal-prospect').classList.remove('hidden');
    }

    function editProspect(id) {
        var p = state.prospects.find(function (x) { return x.id === id; });
        if (!p) return;
        editingId = id;
        document.getElementById('f-name').value   = p.name      || '';
        document.getElementById('f-email').value  = p.email     || '';
        document.getElementById('f-phone').value  = p.phone     || '';
        document.getElementById('f-etype').value  = p.eventType || '';
        setDateInput('f-edate', p.eventDate || '');
        document.getElementById('f-status').value = p.status    || 'New Lead';
        document.getElementById('f-notes').value  = p.notes     || '';
        document.getElementById('modal-prospect').classList.remove('hidden');
    }

    function saveProspect() {
        var name = document.getElementById('f-name').value.trim();
        if (!name) { alert('Name is required.'); return; }

        var data = {
            id:        editingId || 'p' + Date.now(),
            name:      name,
            email:     document.getElementById('f-email').value.trim(),
            phone:     document.getElementById('f-phone').value.trim(),
            eventType: document.getElementById('f-etype').value.trim(),
            eventDate: readDateInput('f-edate'),
            status:    document.getElementById('f-status').value,
            notes:     document.getElementById('f-notes').value.trim(),
            added:     editingId ? (state.prospects.find(function(x){return x.id===editingId;})||{}).added || today() : today()
        };

        if (editingId) {
            var idx = state.prospects.findIndex(function (x) { return x.id === editingId; });
            if (idx > -1) state.prospects[idx] = data;
        } else {
            state.prospects.unshift(data);
        }

        saveProspectsToStorage();
        closeModal('modal-prospect');
        renderStats();
        renderCRM(state.activeFilter);
        if (data.status === 'Booked') autoCreateClientFromProspect(data);
    }

    function deleteProspect(id) {
        if (!confirm('Remove this prospect? This cannot be undone.')) return;
        state.prospects = state.prospects.filter(function (p) { return p.id !== id; });
        saveProspectsToStorage();
        renderStats();
        renderCRM(state.activeFilter);
    }

    function clearProspectForm() {
        ['f-name','f-email','f-phone','f-etype','f-edate','f-notes'].forEach(function (id) {
            document.getElementById(id).value = '';
        });
        document.getElementById('f-status').value = 'New Lead';
    }

    /* ── Task CRUD ───────────────────────────────────── */
    function openAddTask() {
        document.getElementById('t-section').value  = '';
        document.getElementById('t-task').value     = '';
        document.getElementById('t-priority').value = 'Medium';
        document.getElementById('t-file').value     = '';
        document.getElementById('modal-task').classList.remove('hidden');
    }

    function saveTask() {
        var task = document.getElementById('t-task').value.trim();
        if (!task) { alert('Task description is required.'); return; }

        state.tasks.unshift({
            id:         't' + Date.now(),
            section:    document.getElementById('t-section').value.trim(),
            task:       task,
            priority:   document.getElementById('t-priority').value,
            status:     'Pending',
            githubFile: document.getElementById('t-file').value.trim()
        });

        saveTasksToStorage();
        closeModal('modal-task');
        renderStats();
        renderTasks();
    }

    function updateTaskStatus(id, newStatus) {
        var t = state.tasks.find(function (x) { return x.id === id; });
        if (t) { t.status = newStatus; saveTasksToStorage(); renderStats(); renderTasks(); }
    }

    function deleteTask(id) {
        if (!confirm('Remove this task?')) return;
        state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
        saveTasksToStorage();
        renderStats();
        renderTasks();
    }

    /* ══════════════════════════════════════════════════
       ADMIN TOOLS — KANBAN BOARD
    ══════════════════════════════════════════════════ */

    var KANBAN_COLS = ['New Lead', 'In Conversation', 'Proposal Sent', 'Booked', 'Lost'];

    function switchTool(name, btn) {
        document.querySelectorAll('.tool-tab').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        document.getElementById('tool-kanban').classList.toggle('hidden', name !== 'kanban');
        document.getElementById('tool-content').classList.toggle('hidden', name !== 'content');
        document.getElementById('tool-clients').classList.toggle('hidden', name !== 'clients');
        if (name === 'kanban')  renderKanban();
        if (name === 'content') renderContentFields(activeContentPage);
        if (name === 'clients') renderClientManager();
    }

    function renderKanban() {
        var board = document.getElementById('kanban-board');
        if (!board) return;

        var html = '';
        KANBAN_COLS.forEach(function (col) {
            var cards    = state.prospects.filter(function (p) { return p.status === col; });
            var colClass = col.replace(/\s+/g, '-');
            html += '<div class="kanban-col" data-status="' + col + '" ' +
                'ondragover="onKanbanDragOver(event)" ' +
                'ondragleave="onKanbanDragLeave(event)" ' +
                'ondrop="onKanbanDrop(event, \'' + col + '\')">' +
                '<div class="kanban-col-header kanban-status-' + colClass + '">' +
                    '<span>' + col + '</span>' +
                    '<span class="kanban-count">' + cards.length + '</span>' +
                '</div>' +
                '<div class="kanban-cards">';

            if (!cards.length) {
                html += '<div class="kanban-empty">Drop here</div>';
            }
            cards.forEach(function (p) {
                html += '<div class="kanban-card" draggable="true" ' +
                    'ondragstart="onKanbanDragStart(event, \'' + escJS(p.id) + '\')" ' +
                    'ondragend="onKanbanDragEnd(event)">' +
                    '<div class="kanban-card-name">' + esc(p.name) + '</div>' +
                    (p.eventType ? '<div class="kanban-card-meta">' + esc(p.eventType) + '</div>' : '') +
                    (p.eventDate ? '<div class="kanban-card-meta">' + esc(p.eventDate)  + '</div>' : '') +
                    (p.phone     ? '<div class="kanban-card-contact">' + esc(p.phone)   + '</div>' : '') +
                    '<button class="kanban-edit-btn" onclick="editProspect(\'' + escJS(p.id) + '\')">EDIT</button>' +
                '</div>';
            });

            html += '</div></div>';
        });

        board.innerHTML = html;
    }

    function onKanbanDragStart(e, id) {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    }

    function onKanbanDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
    }

    function onKanbanDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }

    function onKanbanDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    function onKanbanDrop(e, newStatus) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        var id = e.dataTransfer.getData('text/plain');
        var p  = state.prospects.find(function (x) { return x.id === id; });
        if (!p) return;
        var curStatus = kanbanPendingMap.hasOwnProperty(p.id) ? kanbanPendingMap[p.id] : p.status;
        if (curStatus === newStatus) return;
        kanbanPendingMap[p.id] = newStatus;
        renderKanban();
    }

    function kanbanSubmit() {
        var count = Object.keys(kanbanPendingMap).length;
        if (!count) return;
        var newlyBooked = [];
        Object.keys(kanbanPendingMap).forEach(function (id) {
            var p = state.prospects.find(function (x) { return x.id === id; });
            if (p) {
                var wasBooked = p.status === 'Booked';
                p.status = kanbanPendingMap[p.id];
                if (!wasBooked && p.status === 'Booked') newlyBooked.push(p);
            }
        });
        kanbanPendingMap = {};
        saveProspectsToStorage();
        renderAll();
        newlyBooked.forEach(function (p) { autoCreateClientFromProspect(p); });
        showToast(count + ' status change' + (count > 1 ? 's' : '') + ' submitted.');
    }

    function kanbanDiscard() {
        var count = Object.keys(kanbanPendingMap).length;
        kanbanPendingMap = {};
        renderKanban();
        if (count) showToast('Changes discarded.');
    }

    function renderKanbanSubmitBar() {
        var count = Object.keys(kanbanPendingMap).length;
        var bar   = document.getElementById('kanban-submit-bar');
        if (!bar) return;
        if (!count) {
            bar.innerHTML = '';
            bar.classList.remove('bar-visible');
            return;
        }
        bar.classList.add('bar-visible');
        bar.innerHTML =
            '<span class="kbar-msg">&#9679; ' + count + ' pending status change' + (count > 1 ? 's' : '') + '</span>' +
            '<div class="kbar-actions">' +
                '<button class="kbar-discard" onclick="kanbanDiscard()">DISCARD</button>' +
                '<button class="kbar-submit" onclick="kanbanSubmit()">SUBMIT CHANGES</button>' +
            '</div>';
    }

    /* ══════════════════════════════════════════════════
       ADMIN TOOLS — CONTENT EDITOR
    ══════════════════════════════════════════════════ */

    function switchContentTab(page, btn) {
        saveCurrentContentFields();
        activeContentPage = page;
        document.querySelectorAll('.ctab').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderContentFields(page);
        if (contentPreviewActive) {
            var iframe = document.getElementById('content-preview-iframe');
            if (iframe) iframe.src = CONTENT_PAGE_URLS[page] || '';
        }
    }

    function renderContentFields(page) {
        var fields = CONTENT_SCHEMA[page] || [];
        var el     = document.getElementById('content-editor-fields');
        if (!el) return;

        var html = '';
        fields.forEach(function (f) {
            var val = contentDrafts[f.key] || '';
            html += '<div class="content-field-row">';
            html += '<label class="content-field-label">' + esc(f.label) +
                '<span class="content-field-key">  ' + esc(f.key) + '</span></label>';

            if (f.type === 'image') {
                var fname = contentDrafts[f.key + '__filename'] || '';
                html += '<div class="img-field-row">';
                html += '<div class="img-preview-pair">';
                html += '<div class="img-preview-col">' +
                    '<div class="img-preview-label">CURRENT (LIVE)</div>' +
                    '<img src="' + esc(f.currentSrc) + '" class="img-thumb" ' +
                    'onerror="this.style.display=\'none\'">' +
                    '</div>';
                if (val && sanitizeImageSrc(val)) {
                    html += '<div class="img-preview-col">' +
                        '<div class="img-preview-label draft-lbl">DRAFT (PENDING)</div>' +
                        '<img src="' + sanitizeImageSrc(val) + '" class="img-thumb img-thumb-draft">' +
                        '<button class="img-remove-btn" onclick="removeImageDraft(\'' + escJS(f.key) + '\')">&#215; REMOVE</button>' +
                        '</div>';
                }
                html += '</div>';
                html += '<label class="img-upload-label">' +
                    '<input type="file" id="cf-' + f.key + '" class="img-file-input" ' +
                    'accept="image/*" onchange="handleImageFieldChange(\'' + f.key + '\', this)">' +
                    '<span class="img-upload-btn">' + (val ? '&#8635; REPLACE' : '+ UPLOAD NEW') + '</span>' +
                    '</label>';
                if (fname) html += '<span class="img-fname">&#128196; ' + esc(fname) + '</span>';
                html += '</div>';
            } else if (f.type === 'textarea') {
                html += '<textarea id="cf-' + f.key + '" class="content-field-input content-field-area" ' +
                    'placeholder="' + esc(f.hint) + '">' + esc(val) + '</textarea>';
            } else {
                html += '<input type="text" id="cf-' + f.key + '" class="content-field-input" ' +
                    'value="' + esc(val) + '" placeholder="' + esc(f.hint) + '">';
            }
            html += '</div>';
        });

        el.innerHTML = html;
    }

    function saveCurrentContentFields() {
        var fields = CONTENT_SCHEMA[activeContentPage] || [];
        fields.forEach(function (f) {
            if (f.type === 'image') return; // handled via handleImageFieldChange
            var el = document.getElementById('cf-' + f.key);
            if (el) contentDrafts[f.key] = el.value.trim();
        });
    }

    function saveContentDrafts() {
        saveCurrentContentFields();
        var existing = safeJSON(localStorage.getItem(STORAGE_CONTENT));
        if (existing) safeSave(STORAGE_CONTENT_HISTORY, existing);
        safeSave(STORAGE_CONTENT, contentDrafts);
        cloudPush({ content: contentDrafts });
        showToast('All drafts saved.');
    }

    function viewContentChanges() {
        saveCurrentContentFields();
        var el = document.getElementById('content-changes-list');
        if (!el) return;

        var pages = Object.keys(CONTENT_SCHEMA);
        var any   = false;
        var html  = '';

        pages.forEach(function (page) {
            var txtChanged = CONTENT_SCHEMA[page].filter(function (f) { return f.type !== 'image' && contentDrafts[f.key]; });
            var imgChanged = CONTENT_SCHEMA[page].filter(function (f) { return f.type === 'image' && contentDrafts[f.key]; });
            if (!txtChanged.length && !imgChanged.length) return;
            any = true;
            html += '<div class="change-group"><h4 class="change-page">' + page.toUpperCase() + '</h4>';
            txtChanged.forEach(function (f) {
                html += '<div class="change-item">' +
                    '<div class="change-field-label">' + esc(f.label) + '</div>' +
                    '<div class="change-content">'     + esc(contentDrafts[f.key]) + '</div>' +
                '</div>';
            });
            imgChanged.forEach(function (f) {
                var fname = contentDrafts[f.key + '__filename'] || 'uploaded-file';
                html += '<div class="change-item">' +
                    '<div class="change-field-label">' + esc(f.label) +
                        ' <span style="color:#b89a5e;font-size:9px;">[IMAGE]</span></div>' +
                    '<div class="change-img-pair">' +
                        '<div class="change-img-col">' +
                            '<div class="change-img-lbl">CURRENT</div>' +
                            '<img src="' + esc(f.currentSrc) + '" class="change-thumb">' +
                        '</div>' +
                        '<div class="change-img-arrow">&rarr;</div>' +
                        '<div class="change-img-col">' +
                            '<div class="change-img-lbl">' + esc(fname) + '</div>' +
                            '<img src="' + sanitizeImageSrc(contentDrafts[f.key]) + '" class="change-thumb change-thumb-new">' +
                        '</div>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        });

        el.innerHTML = any
            ? html
            : '<p style="font-size:11px;color:#527141;padding:20px 0;">No drafts saved yet. Use the Content Editor tab to draft changes.</p>';

        document.getElementById('modal-content-changes').classList.remove('hidden');
    }

    function copyAllChanges() {
        var lines = [];
        Object.keys(CONTENT_SCHEMA).forEach(function (page) {
            var txtChanged = CONTENT_SCHEMA[page].filter(function (f) { return f.type !== 'image' && contentDrafts[f.key]; });
            var imgChanged = CONTENT_SCHEMA[page].filter(function (f) { return f.type === 'image' && contentDrafts[f.key]; });
            if (!txtChanged.length && !imgChanged.length) return;
            lines.push('=== ' + page.toUpperCase() + ' ===');
            txtChanged.forEach(function (f) {
                lines.push(f.label + ':');
                lines.push(contentDrafts[f.key]);
                lines.push('');
            });
            imgChanged.forEach(function (f) {
                lines.push('[IMAGE CHANGE] ' + f.label + ':');
                lines.push('  Replace: ' + f.currentSrc);
                lines.push('  With file: ' + (contentDrafts[f.key + '__filename'] || 'uploaded-file'));
                lines.push('');
            });
        });
        if (!lines.length) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(lines.join('\n')).then(function () {
                var btn = document.querySelector('#modal-content-changes .modal-cancel');
                if (btn) { btn.textContent = 'COPIED!'; setTimeout(function () { btn.textContent = 'COPY ALL'; }, 2000); }
            });
        }
    }

    /* ── Additional Content Functions ───────────────── */

    function submitContentPage() {
        saveCurrentContentFields();
        var existing = safeJSON(localStorage.getItem(STORAGE_CONTENT));
        if (existing) safeSave(STORAGE_CONTENT_HISTORY, existing);
        safeSave(STORAGE_CONTENT, contentDrafts);
        cloudPush({ content: contentDrafts });
        showToast(activeContentPage.toUpperCase() + ' page changes submitted.');
    }

    function undoContentDraft() {
        var history = safeJSON(localStorage.getItem(STORAGE_CONTENT_HISTORY));
        if (!history) { showToast('No previous save to undo to.'); return; }
        contentDrafts = history;
        safeSave(STORAGE_CONTENT, contentDrafts);
        renderContentFields(activeContentPage);
        showToast('Restored to last saved state.');
    }

    function toggleContentPreview() {
        contentPreviewActive = !contentPreviewActive;
        var pane = document.getElementById('content-preview-pane');
        var btn  = document.getElementById('preview-toggle-btn');
        var iframe = document.getElementById('content-preview-iframe');
        if (contentPreviewActive) {
            if (iframe) iframe.src = CONTENT_PAGE_URLS[activeContentPage] || '';
            if (pane)  pane.classList.remove('hidden');
            if (btn)   btn.textContent = '\u00d7 HIDE PREVIEW';
        } else {
            if (iframe) iframe.src = 'about:blank';
            if (pane)  pane.classList.add('hidden');
            if (btn)   btn.textContent = '\u25a1 PREVIEW LIVE';
        }
    }

    function handleImageFieldChange(key, inputEl) {
        var file = inputEl.files && inputEl.files[0];
        if (!file) return;
        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed.');
            inputEl.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Image is larger than 10 MB. Please use a smaller file.');
            inputEl.value = '';
            return;
        }
        compressImage(file, 1200, 0.7).then(function (dataUrl) {
            contentDrafts[key] = dataUrl;
            contentDrafts[key + '__filename'] = file.name;
            renderContentFields(activeContentPage);
        }).catch(function () {
            alert('Failed to process image. Try a different file.');
        });
    }

    function removeImageDraft(key) {
        delete contentDrafts[key];
        delete contentDrafts[key + '__filename'];
        renderContentFields(activeContentPage);
    }

    /* ══════════════════════════════════════════════════
       CLIENT MANAGER — Portal Access Codes
    ══════════════════════════════════════════════════ */

    var editingClientId = null;

    function renderDashboardClients() {
        var el = document.getElementById('dashboard-clients');
        if (!el) return;
        if (!state.clients.length) {
            el.innerHTML = '<p style="padding:24px 28px;font-size:12px;color:#527141;font-weight:300;letter-spacing:0.5px">No clients yet. Prospects marked <strong>Booked</strong> will appear here automatically.</p>';
            return;
        }
        var html = '<div class="crm-row crm-head"><span>Client</span><span>Event</span><span>Date</span><span>Codes</span><span>Status</span><span>Actions</span></div>';
        state.clients.forEach(function (c) {
            var isActive = c.active !== false;
            var codeDisplay;
            if (c.accessCode) {
                codeDisplay = '<code class="client-code-badge" title="Couple">&#128149; ' + esc(c.accessCode) + '</code>';
                if (c.plannerCode) codeDisplay += '<br><code class="client-code-badge" title="Planner" style="background:#527141">&#128203; ' + esc(c.plannerCode) + '</code>';
                if (c.teamCode)    codeDisplay += '<br><code class="client-code-badge" title="RNB Team" style="background:#2d3a2d">&#9733; ' + esc(c.teamCode) + '</code>';
            } else {
                codeDisplay = '<button class="crm-act-btn" style="color:#b89a5e;font-weight:500" onclick="editClient(\'' + escJS(c.id) + '\')">SET CODE</button>';
            }
            var statusBtn = isActive
                ? '<button class="client-status-btn active" onclick="toggleClientAccess(\'' + escJS(c.id) + '\')">ACTIVE</button>'
                : '<button class="client-status-btn disabled" onclick="toggleClientAccess(\'' + escJS(c.id) + '\')">DISABLED</button>';
            html += '<div class="crm-row' + (isActive ? '' : ' client-row-disabled') + '">' +
                '<span class="crm-name">' + esc(c.fullName || c.firstName || '–') + '</span>' +
                '<span class="crm-event">' + esc(c.eventType || '–') + '</span>' +
                '<span class="crm-date">' + esc(c.eventDate || '–') + '</span>' +
                '<span class="client-code-cell">' + codeDisplay + '</span>' +
                '<span class="client-status-cell">' + statusBtn + '</span>' +
                '<span class="crm-actions">' +
                    '<button class="crm-act-btn" onclick="editClient(\'' + escJS(c.id) + '\')">EDIT</button>' +
                    '<button class="crm-act-btn del-btn" onclick="deleteClient(\'' + escJS(c.id) + '\')">DEL</button>' +
                '</span>' +
            '</div>';
        });
        el.innerHTML = html;
    }

    /* ── Auto-create client from Booked prospect ─── */
    function autoCreateClientFromProspect(prospect) {
        var existing = state.clients.find(function (c) { return c.prospectId === prospect.id; });
        if (existing) return;
        var nameParts = (prospect.name || 'CLIENT').split(' ');
        var lastName = (nameParts[nameParts.length - 1] || 'CLIENT').toUpperCase();
        var year = new Date().getFullYear();
        var suggestedCode = lastName + year;
        var base = suggestedCode;
        var counter = 1;
        while (state.clients.find(function (c) { return c.accessCode === suggestedCode; })) {
            suggestedCode = base + counter;
            counter++;
        }
        var codes = generateClientCodes(suggestedCode);
        var plannerCode = codes.plannerCode;
        var teamCode    = codes.teamCode;
        Promise.all([sha256Hex(suggestedCode), sha256Hex(plannerCode), sha256Hex(teamCode)]).then(function (hashes) {
            var clientData = {
                id:              'cl' + Date.now(),
                prospectId:      prospect.id,
                accessCode:      suggestedCode,
                plannerCode:     plannerCode,
                teamCode:        teamCode,
                codeHash:        hashes[0],
                plannerCodeHash: hashes[1],
                teamCodeHash:    hashes[2],
                active:          true,
                firstName:       nameParts[0] || '',
                fullName:        prospect.name || '',
                eventType:       prospect.eventType || '',
                eventDate:       prospect.eventDate || '',
                eventVenue:      '',
                planner:         'RNB Events Team',
                plannerEmail:    'hello@rnbevents716.com',
                timeline:        [],
                trackingNotes:   { plannerTodos: [], teamTodos: [], clientTodos: [] },
                vendors:         [],
                moodboard:       { palette: [], images: [], description: '' },
                documents:       [],
                gallery:         [],
                added:           today()
            };
            state.clients.unshift(clientData);
            saveClientsToStorage();
            renderDashboardClients();
            renderClientManager();
            renderStats();
            showToast('Client created for "' + prospect.name + '" — Couple: ' + suggestedCode + ' / Planner: ' + plannerCode + ' / Team: ' + teamCode);
        });
    }

    function renderClientManager() {
        var el = document.getElementById('clients-list');
        if (!el) return;

        if (!state.clients.length) {
            el.innerHTML = '<p style="padding:20px 0;font-size:12px;color:#527141;font-weight:300;letter-spacing:0.5px">No clients yet. Click + NEW CLIENT to create a portal access code.</p>';
            return;
        }

        var html = '<div class="crm-row crm-head"><span>Client</span><span>Event</span><span>Date</span><span>Access Codes</span><span>Status</span><span>Actions</span></div>';
        state.clients.forEach(function (c) {
            var isActive = c.active !== false;
            var statusBtn = isActive
                ? '<button class="client-status-btn active" onclick="toggleClientAccess(\'' + escJS(c.id) + '\')">ACTIVE</button>'
                : '<button class="client-status-btn disabled" onclick="toggleClientAccess(\'' + escJS(c.id) + '\')">DISABLED</button>';
            var codeHtml = '<code class="client-code-badge" title="Couple">&#128149; ' + esc(c.accessCode) + '</code>';
            if (c.plannerCode) codeHtml += '<code class="client-code-badge" title="Planner" style="background:#527141">&#128203; ' + esc(c.plannerCode) + '</code>';
            if (c.teamCode)    codeHtml += '<code class="client-code-badge" title="RNB Team" style="background:#2d3a2d">&#9733; ' + esc(c.teamCode) + '</code>';
            html += '<div class="crm-row' + (isActive ? '' : ' client-row-disabled') + '">' +
                '<span class="crm-name">' + esc(c.fullName || c.firstName || '–') + '</span>' +
                '<span class="crm-event">' + esc(c.eventType || '–') + '</span>' +
                '<span class="crm-date">' + esc(c.eventDate || '–') + '</span>' +
                '<span class="client-code-cell" style="display:flex;flex-direction:column;gap:3px">' + codeHtml + '</span>' +
                '<span class="client-status-cell">' + statusBtn + '</span>' +
                '<span class="crm-actions">' +
                    '<button class="crm-act-btn" onclick="editClient(\'' + escJS(c.id) + '\')">EDIT</button>' +
                    '<button class="crm-act-btn del-btn" onclick="deleteClient(\'' + escJS(c.id) + '\')">DEL</button>' +
                '</span>' +
            '</div>';
        });
        el.innerHTML = html;
    }

    function openAddClient() {
        editingClientId = null;
        document.getElementById('client-modal-title').textContent = 'New Client';
        ['c-name','c-first','c-etype','c-venue'].forEach(function (id) {
            document.getElementById(id).value = '';
        });
        document.getElementById('c-code').value = '';
        document.getElementById('c-code').readOnly = false;
        document.getElementById('c-edate').value = '';
        document.getElementById('c-planner').value = 'RNB Events Team';
        document.getElementById('c-pemail').value  = 'hello@rnbevents716.com';
        document.getElementById('c-timeline-rows').innerHTML = '';
        addClientTimelineRow();
        populateTrackingRows('c-planner-todos', []);
        populateTrackingRows('c-team-todos', []);
        populateTrackingRows('c-client-todos', []);

        /* Auto-generate planner and team codes */
        var codes = generateClientCodes('');
        var plannerIn = document.getElementById('c-planner-code');
        var teamIn    = document.getElementById('c-team-code');
        if (plannerIn) plannerIn.value = codes.plannerCode;
        if (teamIn)    teamIn.value    = codes.teamCode;

        document.getElementById('modal-client').classList.remove('hidden');
    }

    function editClient(id) {
        var c = state.clients.find(function (x) { return x.id === id; });
        if (!c) return;
        editingClientId = id;
        document.getElementById('client-modal-title').textContent = 'Edit Client';
        document.getElementById('c-code').value    = c.accessCode || '';
        document.getElementById('c-code').readOnly = true;
        document.getElementById('c-name').value    = c.fullName      || '';
        document.getElementById('c-first').value   = c.firstName     || '';
        document.getElementById('c-etype').value   = c.eventType     || '';
        setDateInput('c-edate', c.eventDate || '');
        document.getElementById('c-venue').value   = c.eventVenue    || '';
        document.getElementById('c-planner').value = c.planner       || 'RNB Events Team';
        document.getElementById('c-pemail').value  = c.plannerEmail  || 'hello@rnbevents716.com';

        var plannerIn = document.getElementById('c-planner-code');
        var teamIn    = document.getElementById('c-team-code');
        if (plannerIn) { plannerIn.value = c.plannerCode || ''; plannerIn.readOnly = !!c.plannerCode; }
        if (teamIn)    { teamIn.value    = c.teamCode    || ''; teamIn.readOnly    = !!c.teamCode; }

        var container = document.getElementById('c-timeline-rows');
        container.innerHTML = '';
        if (c.timeline && c.timeline.length) {
            c.timeline.forEach(function (m) { addClientTimelineRow(m); });
        } else {
            addClientTimelineRow();
        }
        var tn = c.trackingNotes || {};
        populateTrackingRows('c-planner-todos', tn.plannerTodos || []);
        populateTrackingRows('c-team-todos', tn.teamTodos || []);
        populateTrackingRows('c-client-todos', tn.clientTodos || []);
        document.getElementById('modal-client').classList.remove('hidden');
    }

    function addClientTimelineRow(data) {
        var container = document.getElementById('c-timeline-rows');
        var row = document.createElement('div');
        row.className = 'timeline-edit-row';
        row.innerHTML =
            '<input type="date" class="form-input tl-date" value="' + esc(toIso((data && data.date) || '')) + '">' +
            '<input type="text" class="form-input tl-milestone" placeholder="Milestone" value="' + esc((data && data.milestone) || '') + '">' +
            '<input type="text" class="form-input tl-notes" placeholder="Notes (optional)" value="' + esc((data && data.notes) || '') + '">' +
            '<button type="button" class="crm-act-btn del-btn" onclick="this.parentElement.remove()">&times;</button>';
        container.appendChild(row);
    }

    function addTrackingRow(containerId, data) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var row = document.createElement('div');
        row.className = 'tracking-edit-row';
        row.innerHTML =
            '<input type="text" class="form-input tr-text" placeholder="To-do item" value="' + esc((data && data.text) || '') + '">' +
            '<select class="form-input tr-status">' +
                '<option value="pending"' + (data && data.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
                '<option value="in-progress"' + (data && data.status === 'in-progress' ? ' selected' : '') + '>In Progress</option>' +
                '<option value="done"' + (data && data.status === 'done' ? ' selected' : '') + '>Done</option>' +
                '<option value="not-applicable"' + (data && data.status === 'not-applicable' ? ' selected' : '') + '>N/A</option>' +
            '</select>' +
            '<button type="button" class="crm-act-btn del-btn" onclick="this.parentElement.remove()">&times;</button>';
        container.appendChild(row);
    }
    window.addTrackingRow = addTrackingRow;

    function collectTrackingRows(containerId) {
        var items = [];
        document.querySelectorAll('#' + containerId + ' .tracking-edit-row').forEach(function (row) {
            var text = row.querySelector('.tr-text').value.trim();
            if (text) {
                items.push({ text: text, status: row.querySelector('.tr-status').value });
            }
        });
        return items;
    }

    function populateTrackingRows(containerId, items) {
        var container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
        if (items && items.length) {
            items.forEach(function (item) { addTrackingRow(containerId, item); });
        }
    }

    function saveClient() {
        var code         = (document.getElementById('c-code').value || '').trim().toUpperCase();
        var name         = (document.getElementById('c-name').value || '').trim();
        var first        = (document.getElementById('c-first').value || '').trim();
        var plannerInEl  = document.getElementById('c-planner-code');
        var teamInEl     = document.getElementById('c-team-code');
        var plannerCode  = plannerInEl ? (plannerInEl.value || '').trim().toUpperCase() : '';
        var teamCode     = teamInEl    ? (teamInEl.value    || '').trim().toUpperCase() : '';

        if (!code) { alert('Access code is required.'); return; }
        if (!name)  { alert('Client name is required.'); return; }

        var dupe = state.clients.find(function (c) {
            return c.accessCode === code && c.id !== editingClientId;
        });
        if (dupe) { alert('This access code is already assigned to ' + dupe.fullName + '.'); return; }

        var timeline = [];
        document.querySelectorAll('#c-timeline-rows .timeline-edit-row').forEach(function (row) {
            var d = toDDMMYYYY(row.querySelector('.tl-date').value.trim());
            var m = row.querySelector('.tl-milestone').value.trim();
            if (d && m) {
                timeline.push({
                    date:      d,
                    milestone: m,
                    status:    'upcoming',
                    notes:     row.querySelector('.tl-notes').value.trim()
                });
            }
        });

        var hashPromises = [sha256Hex(code)];
        if (plannerCode) hashPromises.push(sha256Hex(plannerCode));
        if (teamCode)    hashPromises.push(sha256Hex(teamCode));

        Promise.all(hashPromises).then(function (hashes) {
            var existingForActive = editingClientId ? state.clients.find(function (x) { return x.id === editingClientId; }) : null;
            var clientData = {
                id:              editingClientId || 'cl' + Date.now(),
                accessCode:      code,
                codeHash:        hashes[0],
                active:          existingForActive ? (existingForActive.active !== false) : true,
                firstName:       first || name.split(' ')[0],
                fullName:        name,
                eventType:       document.getElementById('c-etype').value.trim(),
                eventDate:       readDateInput('c-edate'),
                eventVenue:      document.getElementById('c-venue').value.trim(),
                planner:         document.getElementById('c-planner').value.trim(),
                plannerEmail:    document.getElementById('c-pemail').value.trim(),
                timeline:        timeline,
                trackingNotes:   {
                    plannerTodos: collectTrackingRows('c-planner-todos'),
                    teamTodos:    collectTrackingRows('c-team-todos'),
                    clientTodos:  collectTrackingRows('c-client-todos')
                },
                vendors:         [],
                moodboard:       { palette: [], images: [], description: 'Your mood board is being curated by your planning team. Check back soon.' },
                documents:       [],
                gallery:         [],
                added:           today()
            };

            /* Attach planner/team keys when provided */
            if (plannerCode) {
                clientData.plannerCode     = plannerCode;
                clientData.plannerCodeHash = hashes[1];
            }
            if (teamCode) {
                clientData.teamCode     = teamCode;
                clientData.teamCodeHash = plannerCode ? hashes[2] : hashes[1];
            }

            if (editingClientId) {
                var idx = state.clients.findIndex(function (x) { return x.id === editingClientId; });
                if (idx > -1) {
                    var existing = state.clients[idx];
                    clientData.vendors       = existing.vendors   || [];
                    clientData.moodboard     = existing.moodboard || clientData.moodboard;
                    clientData.documents     = existing.documents || [];
                    clientData.gallery       = existing.gallery   || [];
                    clientData.trackingNotes = clientData.trackingNotes;
                    clientData.added         = existing.added     || today();
                    /* Keep old planner/team codes if not re-entered */
                    if (!plannerCode) {
                        clientData.plannerCode     = existing.plannerCode     || '';
                        clientData.plannerCodeHash = existing.plannerCodeHash || '';
                    }
                    if (!teamCode) {
                        clientData.teamCode     = existing.teamCode     || '';
                        clientData.teamCodeHash = existing.teamCodeHash || '';
                    }
                    state.clients[idx] = clientData;
                }
            } else {
                state.clients.unshift(clientData);
            }

            saveClientsToStorage();
            closeModal('modal-client');
            renderClientManager();
            showToast('Client "' + name + '" saved. Codes — Couple: ' + code + (plannerCode ? ' / Planner: ' + plannerCode : '') + (teamCode ? ' / Team: ' + teamCode : ''));
        });
    }

    function toggleClientAccess(id) {
        var c = state.clients.find(function (x) { return x.id === id; });
        if (!c) return;
        c.active = (c.active === false) ? true : false;
        saveClientsToStorage();
        renderDashboardClients();
        renderClientManager();
        renderStats();
        /* Refresh the all-clients modal if open */
        if (!document.getElementById('modal-all-clients').classList.contains('hidden')) {
            renderAllClientsView();
        }
        showToast(c.fullName + ' access ' + (c.active ? 'enabled' : 'disabled') + '.');
    }

    var allClientsFilter = 'all';

    function viewAllClients() {
        allClientsFilter = 'all';
        renderAllClientsView();
        document.getElementById('modal-all-clients').classList.remove('hidden');
        /* Always fetch latest from S3 before showing */
        fetchS3Clients().then(function () {
            renderAllClientsView();
        });
    }

    function filterAllClients(filter, btn) {
        allClientsFilter = filter;
        document.querySelectorAll('#all-clients-filters .filter-btn').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderAllClientsView();
    }

    function renderAllClientsView() {
        var total   = state.clients.length;
        var active  = state.clients.filter(function (c) { return c.active !== false; }).length;
        var disabled = total - active;

        /* Summary */
        var sumEl = document.getElementById('all-clients-summary');
        if (sumEl) {
            sumEl.innerHTML =
                '<span class="ac-stat">' + total + ' Total</span>' +
                '<span class="ac-stat ac-active">' + active + ' Active</span>' +
                '<span class="ac-stat ac-disabled">' + disabled + ' Disabled</span>';
        }

        /* Filters */
        var filEl = document.getElementById('all-clients-filters');
        if (filEl) {
            filEl.innerHTML =
                '<button class="filter-btn' + (allClientsFilter === 'all' ? ' active' : '') + '" onclick="filterAllClients(\'all\', this)">All (' + total + ')</button>' +
                '<button class="filter-btn' + (allClientsFilter === 'active' ? ' active' : '') + '" onclick="filterAllClients(\'active\', this)">Active (' + active + ')</button>' +
                '<button class="filter-btn' + (allClientsFilter === 'disabled' ? ' active' : '') + '" onclick="filterAllClients(\'disabled\', this)">Disabled (' + disabled + ')</button>';
        }

        /* Filter clients */
        var list = state.clients;
        if (allClientsFilter === 'active')   list = list.filter(function (c) { return c.active !== false; });
        if (allClientsFilter === 'disabled') list = list.filter(function (c) { return c.active === false; });

        /* Table */
        var tblEl = document.getElementById('all-clients-table');
        if (!tblEl) return;

        if (!list.length) {
            tblEl.innerHTML = '<p style="padding:24px;font-size:12px;color:#527141;">No clients in this category.</p>';
            return;
        }

        var html = '<div class="ac-row ac-head">' +
            '<span>Client</span><span>Codes</span><span>Event</span>' +
            '<span>Date</span><span>Venue</span><span>Planner</span>' +
            '<span>Status</span><span>Sections</span><span>Added</span><span>Actions</span>' +
        '</div>';

        list.forEach(function (c) {
            var isActive = c.active !== false;
            var tlCount  = (c.timeline && c.timeline.length) || 0;
            var vnCount  = (c.vendors  && c.vendors.length)  || 0;
            var docCount = (c.documents && c.documents.length) || 0;
            var galCount = (c.gallery   && c.gallery.length)  || 0;
            var sections = tlCount + ' tl · ' + vnCount + ' vn · ' + docCount + ' doc · ' + galCount + ' img';

            var statusBadge = isActive
                ? '<span class="ac-badge ac-badge-active">ACTIVE</span>'
                : '<span class="ac-badge ac-badge-disabled">DISABLED</span>';

            var codeHtml = '<code class="client-code-badge" title="Couple">&#128149; ' + esc(c.accessCode || '–') + '</code>';
            if (c.plannerCode) codeHtml += '<br><code class="client-code-badge" title="Planner" style="background:#527141">&#128203; ' + esc(c.plannerCode) + '</code>';
            if (c.teamCode)    codeHtml += '<br><code class="client-code-badge" title="RNB Team" style="background:#2d3a2d">&#9733; ' + esc(c.teamCode) + '</code>';

            html += '<div class="ac-row' + (isActive ? '' : ' ac-row-disabled') + '">' +
                '<span class="ac-name">' + esc(c.fullName || c.firstName || '\u2013') + '</span>' +
                '<span class="ac-code">' + codeHtml + '</span>' +
                '<span>' + esc(c.eventType || '\u2013') + '</span>' +
                '<span>' + esc(c.eventDate || '\u2013') + '</span>' +
                '<span>' + esc(c.eventVenue || '\u2013') + '</span>' +
                '<span>' + esc(c.planner || '\u2013') + '</span>' +
                '<span>' + statusBadge + '</span>' +
                '<span class="ac-sections">' + sections + '</span>' +
                '<span>' + esc(c.added || '\u2013') + '</span>' +
                '<span class="crm-actions">' +
                    '<button class="crm-act-btn" onclick="closeModal(\'modal-all-clients\');editClient(\'' + escJS(c.id) + '\')">EDIT</button>' +
                    '<button class="crm-act-btn" onclick="toggleClientAccess(\'' + escJS(c.id) + '\')">' + (isActive ? 'DISABLE' : 'ENABLE') + '</button>' +
                '</span>' +
            '</div>';
        });

        tblEl.innerHTML = html;
    }

    function deleteClient(id) {
        var c = state.clients.find(function (x) { return x.id === id; });
        if (!c) return;
        if (!confirm('Remove client "' + c.fullName + '" and their portal access? This cannot be undone.')) return;
        state.clients = state.clients.filter(function (x) { return x.id !== id; });
        saveClientsToStorage();
        renderClientManager();
        showToast('Client removed.');
    }


    function exportClientsJson() {
        try {
            var blob = new Blob([JSON.stringify(state.clients, null, 2)], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'clients.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 100);
            showToast('clients.json exported. Run node upload-clients.js to push to S3.');
        } catch (e) {
            showToast('Export failed: ' + e);
        }
    }

    function publishClientsConfig() {
        if (!state.clients.length) {
            showToast('No clients to publish.');
            return;
        }
        var api = window.RNB_UPLOAD_API;
        if (!api) {
            showToast('Upload API not configured.');
            return;
        }
        fetch(api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clients: state.clients })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data && data.ok) {
                showToast('Clients published to S3 via Lambda!');
                updateSyncStatus('synced');
            } else {
                showToast('Publish failed: ' + (data && data.error ? data.error : 'Unknown error'));
                updateSyncStatus('error');
            }
        })
        .catch(function (e) {
            showToast('Publish failed: ' + e);
            updateSyncStatus('error');
        });
    }

    function copyPublishedConfig() { /* no longer needed */ }

    /* ── Helpers ─────────────────────────────────────── */
    function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
    function showErr(id, msg) { var el = document.getElementById(id); if (el) el.textContent = msg; }
    function clearErr(id)    { var el = document.getElementById(id); if (el) el.textContent = ''; }
    function esc(s)         { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
    function escJS(s)       { return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"'); }
    function sanitizeImageSrc(s) { return (typeof s === 'string' && (/^data:image\//.test(s) || /^https?:\/\//.test(s))) ? s : ''; }
    function safeJSON(s)    { try { return JSON.parse(s); } catch(e) { return null; } }
    function today()        { return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }

    /* DD/MM/YYYY ↔ YYYY-MM-DD converters */
    function toDDMMYYYY(iso) {
        if (!iso) return '';
        /* Already DD/MM/YYYY? Return as-is */
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
        /* YYYY-MM-DD → DD/MM/YYYY */
        var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return m[3] + '/' + m[2] + '/' + m[1];
        return String(iso);
    }
    function toIso(ddmmyyyy) {
        if (!ddmmyyyy) return '';
        /* Already YYYY-MM-DD? Return as-is */
        if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy;
        /* DD/MM/YYYY → YYYY-MM-DD */
        var m = String(ddmmyyyy).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) return m[3] + '-' + m[2] + '-' + m[1];
        return '';
    }
    function readDateInput(id) {
        var val = document.getElementById(id).value;
        return toDDMMYYYY(val);
    }
    function setDateInput(id, storedDate) {
        document.getElementById(id).value = toIso(storedDate);
    }
    window.toDDMMYYYY = toDDMMYYYY;
    window.toIso = toIso;

    function showToast(msg) {
        var t = document.getElementById('admin-toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('toast-visible');
        clearTimeout(t._timer);
        t._timer = setTimeout(function () { t.classList.remove('toast-visible'); }, 2800);
    }
    // Keyboard: Enter on step 1
    if (input) {
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') adminStep1(); });
    }
    // Keyboard: Enter on TOTP field
    document.addEventListener('DOMContentLoaded', function () {
        var totpInput = document.getElementById('totp-input');
        if (totpInput) {
            totpInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') adminStep2(); });
            // Auto-submit when 6 digits entered
            totpInput.addEventListener('input', function () {
                if (this.value.replace(/\D/g,'').length === 6) {
                    this.value = this.value.replace(/\D/g,'').slice(0,6);
                    adminStep2();
                }
            });
        }
    });

    /* ── Expose to HTML ──────────────────────────────── */
    window.adminStep1       = adminStep1;
    window.adminStep2       = adminStep2;
    window.backToStep1      = backToStep1;
    window.adminLogout      = adminLogout;
    window.showSetup        = showSetup;
    window.copySecret       = copySecret;
    window.filterProspects  = filterProspects;
    window.openAddProspect  = openAddProspect;
    window.editProspect     = editProspect;
    window.saveProspect     = saveProspect;
    window.deleteProspect   = deleteProspect;
    window.openAddTask      = openAddTask;
    window.saveTask         = saveTask;
    window.updateTaskStatus = updateTaskStatus;
    window.deleteTask       = deleteTask;
    window.closeModal       = closeModal;
    // Admin Tools
    window.switchTool             = switchTool;
    window.switchContentTab       = switchContentTab;
    window.saveContentDrafts      = saveContentDrafts;
    window.viewContentChanges     = viewContentChanges;
    window.copyAllChanges         = copyAllChanges;
    window.onKanbanDragStart      = onKanbanDragStart;
    window.onKanbanDragEnd        = onKanbanDragEnd;
    window.onKanbanDragOver       = onKanbanDragOver;
    window.onKanbanDragLeave      = onKanbanDragLeave;
    window.onKanbanDrop           = onKanbanDrop;
    window.kanbanSubmit           = kanbanSubmit;
    window.kanbanDiscard          = kanbanDiscard;
    window.submitContentPage      = submitContentPage;
    window.undoContentDraft       = undoContentDraft;
    window.toggleContentPreview   = toggleContentPreview;
    window.handleImageFieldChange = handleImageFieldChange;
    window.removeImageDraft       = removeImageDraft;
    // Client Manager
    window.openAddClient          = openAddClient;
    window.editClient             = editClient;
    window.saveClient             = saveClient;
    window.deleteClient           = deleteClient;
    window.addClientTimelineRow   = addClientTimelineRow;
    window.publishClientsConfig   = publishClientsConfig;
    window.copyPublishedConfig    = copyPublishedConfig;
    window.toggleClientAccess     = toggleClientAccess;
    window.viewAllClients          = viewAllClients;
    window.filterAllClients        = filterAllClients;
    window.renderDashboardClients = renderDashboardClients;

})()
