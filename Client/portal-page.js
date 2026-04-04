/**
 * RNB Events — Portal Sub-page Auth + Init
 * Included by all Client sub-pages (timeline, moodboard, etc.)
 * Must be loaded AFTER clients-config.js
 * Fetches dynamic clients from cloud backend for admin-managed codes
 */

(function () {
    'use strict';

    var SESSION_KEY = 'rnb_portal_access';
    var code = sessionStorage.getItem(SESSION_KEY);

    function findStaticClient(hash) {
        return window.RNB_CLIENTS_RAW && window.RNB_CLIENTS_RAW[hash];
    }

    function boot(client) {
        window.currentClient = client;
        window.currentCode   = code;

        window.portalSignOut = function () {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace('/Client');
        };

        document.addEventListener('DOMContentLoaded', function () {
            var emailLinks = document.querySelectorAll('.planner-email-link');
            emailLinks.forEach(function (el) {
                if (client && client.plannerEmail) {
                    el.href = 'mailto:' + client.plannerEmail;
                }
            });
            var nameEls = document.querySelectorAll('.client-first-name');
            nameEls.forEach(function (el) {
                if (client && client.firstName) {
                    el.textContent = client.firstName;
                }
            });
        });

        window.capitalize = function (s) {
            return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
        };

        window.renderComingSoon = function (containerId, msg) {
            var el = document.getElementById(containerId);
            if (el) {
                el.innerHTML = '<p class="section-coming">' + (msg || 'This section is being prepared by your planning team. Check back soon.') + '</p>';
            }
        };
    }

    // Try static first
    if (code && findStaticClient(code)) {
        boot(findStaticClient(code));
        return;
    }

    // Try cloud
    var url = window.RNB_CLOUD_URL;
    if (!code || !url) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('/Client');
        return;
    }

    // Fetch cloud clients and find match
    fetch(url + '?action=getClients', { redirect: 'follow' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var client = null;
            if (Array.isArray(data.clients)) {
                for (var i = 0; i < data.clients.length; i++) {
                    if (data.clients[i] && data.clients[i].codeHash === code) {
                        client = data.clients[i];
                        break;
                    }
                }
            }
            if (client) {
                boot(client);
            } else {
                sessionStorage.removeItem(SESSION_KEY);
                window.location.replace('/Client');
            }
        })
        .catch(function () {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace('/Client');
        });

})();
