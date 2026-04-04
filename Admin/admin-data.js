/**
 * RNB Events — Admin Data
 * ─────────────────────────────────────────────────────────
 * ADMIN CODES — Keep this file out of public posts/shares.
 * Prospects and website tasks are managed here.
 * ─────────────────────────────────────────────────────────
 */

window.ADMIN_CONFIG = {

    /* ── Admin access code (step 1) — SHA-256 hash.
     * To change, hash your new code with SHA-256 and
     * replace this value. Never store the plain code. ── */
    codeHash: '47d538bc9bbdba86910d104f78b851d87356c7fcee36e214878a5a24f7bbedf4',

    /* ── TOTP secret for Google Authenticator (step 2) ──
     * Base32 format (A-Z and 2-7 only).
     * IMPORTANT: Change this before deploying — do NOT
     * share or commit the real secret publicly.
     * Use this value when setting up your authenticator app.
     * Default: RNBEV7SECR3TADM2
     * ─────────────────────────────────────────────────── */
    totpSecret: 'RNBEV7SECR3TADM2',

    /* ── Prospect CRM ─────────────────────────────────────
     * status options:
     *   'New Lead' | 'In Conversation' | 'Proposal Sent'
     *   'Booked' | 'Lost'
     * ───────────────────────────────────────────────────── */
    prospects: [
        {
            id:        'p1',
            name:      'Sample Prospect',
            email:     'prospect@example.com',
            phone:     '716-555-0100',
            eventType: 'Wedding',
            eventDate: 'June 2027',
            status:    'New Lead',
            notes:     'Reached out via Instagram. Interested in full planning.',
            added:     'April 4, 2026'
        }
        // Add more below:
        // ,{ id:'p2', name:'Jane Doe', email:'', phone:'', eventType:'Sweet 16', eventDate:'Aug 2026', status:'In Conversation', notes:'', added:'' }
    ],

    /* ── Website Content Tasks ────────────────────────────
     * Priority: 'High' | 'Medium' | 'Low'
     * Status:   'Pending' | 'In Progress' | 'Done'
     * githubFile: path relative to repo root (for the edit link)
     * ───────────────────────────────────────────────────── */
    websiteTasks: [
        {
            id:         't1',
            section:    'Home',
            task:       'Replace hero video with new footage',
            priority:   'High',
            status:     'Pending',
            githubFile: 'index.html'
        },
        {
            id:         't2',
            section:    'Service',
            task:       'Update pricing & package descriptions',
            priority:   'Medium',
            status:     'Pending',
            githubFile: 'service.html'
        },
        {
            id:         't3',
            section:    'Love Book',
            task:       'Add 2026 event photos to gallery',
            priority:   'Medium',
            status:     'Pending',
            githubFile: 'lovebook.html'
        }
    ]
};
