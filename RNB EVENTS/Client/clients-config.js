/**
 * RNB Events — Client Data Configuration
 * Keys are SHA-256 hashes of access codes.
 * Portal fetches live data from cloud; static entries below are fallback only.
 */

window.RNB_CLOUD_URL = 'https://rnbevents716.s3.us-east-2.amazonaws.com/clients.json';

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN AUTHENTICATION CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

/* Admin Google Authenticator Code (6-digit) - Replace with your actual Google Auth code */
window.RNB_ADMIN_AUTH_CODE = '123456'; // REPLACE THIS with your Google Authenticator code

/* ═══════════════════════════════════════════════════════════════════════════
   CLIENT EMAIL CONFIGURATION FOR 2FA
   ═══════════════════════════════════════════════════════════════════════════
   
   IMPORTANT: Each client MUST have a valid email address for 2FA to work.
   
   How to Add/Edit Client Emails:
   
   1. Find the client entry by their access code hash (or full name comment)
   2. Add or update the "email" field with the client's email address
   3. Save this file and push to GitHub to deploy changes
   
   Example:
   
   'abc123hash...' : {
       firstName:    'John',
       fullName:     'John & Jane Doe',
       email:        'johndoe@example.com',  ← ADD THIS LINE
       eventType:    'Wedding',
       // ... rest of config
   }
   
   Email Requirements:
   - Must be a valid email address format
   - Client will receive verification codes at this address
   - Emails are pre-filled in the portal but can be changed by client
   - For testing, use your own email address
   
   Testing:
   - Demo account email: 'client@example.com'
   - Test with your own email first before sharing with clients
   
   ═══════════════════════════════════════════════════════════════════════════ */

window.RNB_CLIENTS = {};
window.RNB_CLIENTS_RAW = {

    /* ────────────────────────────────────────────────────────────────────────
       Demo / Default Client
       Access Code: DEMO2024
       ──────────────────────────────────────────────────────────────────────── */
    '684973f6603b162f638b24ac44c5c3412272de00fd98656232567ff0786bbaad': {
        firstName:    'Valued Client',
        fullName:     'Valued Client',
        email:        'client@example.com', // ← EDIT THIS: Client email for 2FA verification
        eventType:    'Special Event',
        eventDate:    'TBD',
        eventVenue:   'TBD',
        planner:      'RNB Events Team',
        plannerEmail: 'hello@rnbevents716.com',

        timeline: [
            { date: 'April 10, 2026',     milestone: 'Kickoff Meeting',       status: 'upcoming', notes: 'Initial planning session with your coordinator.' },
            { date: 'May 1, 2026',         milestone: 'Venue Walkthrough',     status: 'upcoming', notes: 'Tour and finalize venue details.' },
            { date: 'June 15, 2026',       milestone: 'Vendor Confirmation',   status: 'upcoming', notes: 'All vendors confirmed and contracts signed.' },
            { date: 'September 1, 2026',   milestone: 'Final Details Review',  status: 'upcoming', notes: 'Final walkthrough of all event details.' }
        ],

        vendors: [
            // { name: 'Florals by Grace', role: 'Florist', phone: '716-555-0101', email: 'grace@example.com', status: 'Confirmed' }
        ],

        moodboard: {
            palette:     [],         // e.g. ['#2c3e2c', '#d0dfc8']
            images:      [],         // e.g. [{ url: 'https://...', caption: 'Floral inspo' }]
            description: 'Your mood board is being curated by your planning team. Check back soon.'
        },

        documents: [
            // { name: 'Event Contract', url: '#', date: 'April 1, 2026', type: 'Contract' }
        ],

        gallery: [
            // { url: 'https://...', caption: 'Inspiration photo' }
        ]
    },

    /* ────────────────────────────────────────────────────────────────────────
       Joelle & Laurent 2026
       Access Code: LAUJO2026
       ──────────────────────────────────────────────────────────────────────── */
    'df6c3337ce83af6846eb93761c3f4fa3f7f74b285098706d6ab674ebd81bb079': {
        firstName:    'Joelle & Laurent',
        fullName:     'Joelle & Laurent 2026',
        email:        'joelle.laurent@example.com', // ← EDIT THIS: Client email for 2FA verification
        eventType:    'Wedding',
        eventDate:    '20/11/2026', // DD/MM/YYYY format
        eventVenue:   'TBD',
        planner:      'RNB Events Team',
        plannerEmail: 'hello@rnbevents716.com',

        timeline: [],
        vendors: [],
        moodboard: {
            palette:     [],
            images:      [],
            description: 'Your mood board is being curated by your planning team. Check back soon.'
        },
        documents: [],
        gallery: []
    }
};
