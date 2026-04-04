/**
 * RNB Events — Client Data Configuration
 * ──────────────────────────────────────────
 * Each access code maps to one client's full portal data.
 * Add new confirmed clients by creating a new entry below.
 *
 * Status values for timeline items: 'done' | 'upcoming' | 'pending'
 * Status values for vendors:        'Confirmed' | 'Pending' | 'TBD'
 * Type values for documents:        'Contract' | 'Invoice' | 'Proposal' | 'Other'
 */

window.RNB_CLIENTS = {

    /* ── Demo / Default ──────────────────────────────── */
    'RNB2026': {
        code:         'RNB2026',
        firstName:    'Valued Client',
        fullName:     'Valued Client',
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
    }

    /* ── Add new confirmed clients below ─────────────────
    ,
    'SMITHWED26': {
        code:         'SMITHWED26',
        firstName:    'Sarah',
        fullName:     'Sarah & Michael Smith',
        eventType:    'Wedding',
        eventDate:    'October 12, 2026',
        eventVenue:   'The Mansion on Delaware',
        planner:      'Rachael',
        plannerEmail: 'hello@rnbevents716.com',
        timeline:  [],
        vendors:   [],
        moodboard: { palette: [], images: [], description: '' },
        documents: [],
        gallery:   []
    }
    ──────────────────────────────────────────────────── */
};
