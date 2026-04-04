/**
 * RNB Events — Client Data Configuration
 * Keys are SHA-256 hashes of access codes.
 * To add a client: hash the code with SHA-256, use the hash as property key.
 */

window.RNB_CLIENTS = {};
window.RNB_CLIENTS_RAW = {

    /* Demo / Default */
    '684973f6603b162f638b24ac44c5c3412272de00fd98656232567ff0786bbaad': {
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

    /* To add clients, hash the new access code with SHA-256
       and add a new entry using the hash as key. */
};
