/**
 * RNB Events — Admin Data
 * ─────────────────────────────────────────────────────────
 * ADMIN CODES — Keep this file out of public posts/shares.
 * Prospects and website tasks are managed here.
 * ─────────────────────────────────────────────────────────
 */

window.ADMIN_CONFIG = {

    /* Admin access code – change this! */
    code: 'RNBADMIN2026',

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
