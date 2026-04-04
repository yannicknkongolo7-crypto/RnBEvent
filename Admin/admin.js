/**
 * RNB Events — Admin Dashboard Logic
 * Two-factor auth: admin code (step 1) + TOTP (step 2)
 * Data persisted in localStorage (runtime changes).
 * Seed data lives in admin-data.js (ADMIN_CONFIG).
 */

(function () {
    'use strict';

    var SESSION_KEY   = 'rnb_admin_access';
    var STORAGE_PROS  = 'rnb_admin_prospects';
    var STORAGE_TASKS = 'rnb_admin_tasks';
    var GITHUB_BASE   = 'https://github.com/yannicknkongolo7-crypto/RnBEvent/edit/main/';

    var gate    = document.getElementById('access-gate');
    var content = document.getElementById('admin-content');
    var input   = document.getElementById('access-input');

    /* ── State ───────────────────────────────────────── */
    var state = {
        prospects:    [],
        tasks:        [],
        activeFilter: 'all'
    };

    var pendingAuth = false; // step 1 passed, waiting for TOTP

    /* ── Boot ────────────────────────────────────────── */
    (function init() {
        if (sessionStorage.getItem(SESSION_KEY) === 'ok') {
            showDashboard();
        }
    })();

    /* ══════════════════════════════════════════════════
       TWO-FACTOR AUTH
    ══════════════════════════════════════════════════ */

    /** Step 1 — validate admin code */
    function adminStep1() {
        var entered = (input ? input.value : '').trim();
        var cfg = window.ADMIN_CONFIG || {};

        if (!entered || entered !== cfg.code) {
            showErr('gate-error-1', 'Invalid admin code.');
            if (input) { input.value = ''; input.focus(); }
            return;
        }

        clearErr('gate-error-1');
        pendingAuth = true;

        document.getElementById('gate-step1').classList.add('hidden');
        var step2 = document.getElementById('gate-step2');
        step2.classList.remove('hidden');
        var totpInput = document.getElementById('totp-input');
        if (totpInput) totpInput.focus();
    }

    /** Step 2 — validate TOTP code */
    function adminStep2() {
        if (!pendingAuth) return;

        var token  = (document.getElementById('totp-input').value || '').trim();
        var secret = (window.ADMIN_CONFIG || {}).totpSecret;
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
                pendingAuth = false;
                clearErr('gate-error-2');
                sessionStorage.setItem(SESSION_KEY, 'ok');
                showDashboard();
            } else {
                showErr('gate-error-2', 'Invalid or expired code. Please try again.');
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
        var secret  = (window.ADMIN_CONFIG || {}).totpSecret || '';
        var display = document.getElementById('setup-secret-display');
        if (display) display.textContent = formatSecret(secret);
        document.getElementById('modal-2fa-setup').classList.remove('hidden');
    }

    function formatSecret(s) {
        // Group into blocks of 4 for readability: XXXX XXXX XXXX XXXX
        return s.toUpperCase().replace(/(.{4})/g, '$1 ').trim();
    }

    function copySecret() {
        var secret = (window.ADMIN_CONFIG || {}).totpSecret || '';
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

    function showDashboard() {
        gate.style.display = 'none';
        content.classList.remove('hidden');
        loadState();
        renderAll();
    }

    /* ── State load/save ─────────────────────────────── */
    function loadState() {
        var cfg = window.ADMIN_CONFIG || {};

        // Prospects: merge seed + localStorage additions
        var stored = safeJSON(localStorage.getItem(STORAGE_PROS));
        state.prospects = stored && stored.length ? stored : (cfg.prospects || []).slice();

        // Tasks: merge seed + localStorage additions
        var storedT = safeJSON(localStorage.getItem(STORAGE_TASKS));
        state.tasks = storedT && storedT.length ? storedT : (cfg.websiteTasks || []).slice();
    }

    function saveProspectsToStorage() {
        localStorage.setItem(STORAGE_PROS, JSON.stringify(state.prospects));
    }

    function saveTasksToStorage() {
        localStorage.setItem(STORAGE_TASKS, JSON.stringify(state.tasks));
    }

    /* ── Render all ──────────────────────────────────── */
    function renderAll() {
        renderStats();
        renderCRM(state.activeFilter);
        renderTasks();
    }

    /* ── Stats Row ───────────────────────────────────── */
    function renderStats() {
        var ps    = state.prospects;
        var total = ps.length;
        var booked   = ps.filter(function (p) { return p.status === 'Booked'; }).length;
        var inTalks  = ps.filter(function (p) { return p.status === 'In Conversation' || p.status === 'Proposal Sent'; }).length;
        var newLeads = ps.filter(function (p) { return p.status === 'New Lead'; }).length;
        var tasks    = state.tasks.filter(function (t) { return t.status !== 'Done'; }).length;

        var el = document.getElementById('stats-row');
        el.innerHTML =
            stat(total,    'Total Prospects') +
            stat(newLeads, 'New Leads') +
            stat(inTalks,  'In Progress') +
            stat(booked,   'Booked') +
            stat(tasks,    'Open Tasks');
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
                    '<button class="crm-act-btn" onclick="editProspect(\'' + p.id + '\')">EDIT</button>' +
                    '<button class="crm-act-btn del-btn" onclick="deleteProspect(\'' + p.id + '\')">DEL</button>' +
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
                ? '<a href="' + GITHUB_BASE + t.githubFile + '" target="_blank" rel="noopener" class="task-github-link">EDIT ON GITHUB</a>'
                : '';
            html += '<div class="task-row status-' + (t.status || '').replace(/\s+/g, '-') + '" data-id="' + t.id + '">' +
                '<div class="task-left">' +
                    '<div class="task-section-badge">' + esc(t.section || '') + '</div>' +
                    '<div class="task-text">' + esc(t.task) + '</div>' +
                    '<span class="task-priority ' + (t.priority || 'Low') + '">' + esc(t.priority || 'Low') + '</span>' +
                '</div>' +
                '<div class="task-right">' +
                    '<select class="task-status-sel" onchange="updateTaskStatus(\'' + t.id + '\', this.value)">' +
                        taskOption('Pending',     t.status) +
                        taskOption('In Progress', t.status) +
                        taskOption('Done',        t.status) +
                    '</select>' +
                    githubLink +
                    '<button class="task-del-btn" onclick="deleteTask(\'' + t.id + '\')">REMOVE</button>' +
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
        document.getElementById('f-edate').value  = p.eventDate || '';
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
            eventDate: document.getElementById('f-edate').value.trim(),
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

    /* ── Helpers ─────────────────────────────────────── */
    function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
    function showErr(id, msg) { var el = document.getElementById(id); if (el) el.textContent = msg; }
    function clearErr(id)    { var el = document.getElementById(id); if (el) el.textContent = ''; }
    function esc(s)         { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function safeJSON(s)    { try { return JSON.parse(s); } catch(e) { return null; } }
    function today()        { return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }

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

})();
