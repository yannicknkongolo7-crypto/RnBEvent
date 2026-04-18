const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: 'us-east-2' });

const BUCKET = 'rnbevents716';
const KEY = 'clients.json';
const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
};

function respond(code, data) {
    return { statusCode: code, headers: HEADERS, body: JSON.stringify(data) };
}

async function readClients() {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const text = await res.Body.transformToString();
    return JSON.parse(text);
}

async function writeClients(clients) {
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(clients),
        ContentType: 'application/json',
        CacheControl: 'no-cache, no-store, must-revalidate'
    }));
}

/* ── Section sanitizers ─────────────────────────── */

function sanitizeUrl(url) {
    url = String(url || '').slice(0, 2000);
    return /^https?:\/\//i.test(url) ? url : '';
}

/* Accepts https:// URLs and data: image URIs (device uploads) */
function sanitizeImageSrc(src) {
    src = String(src || '');
    if (/^https?:\/\//i.test(src)) return src.slice(0, 3000);
    if (/^data:image\/(jpeg|png|webp|gif);base64,/.test(src)) return src.slice(0, 200000);
    return '';
}

function sanitizeTimeline(data) {
    if (!Array.isArray(data)) return [];
    const STATUSES = ['upcoming', 'in-progress', 'done'];
    return data.slice(0, 50).map(item => ({
        date: String(item.date || '').slice(0, 100),
        milestone: String(item.milestone || '').slice(0, 200),
        notes: String(item.notes || '').slice(0, 500),
        status: STATUSES.includes(item.status) ? item.status : 'upcoming'
    })).filter(item => item.milestone.trim());
}

function sanitizeVendors(data) {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 30).map(item => ({
        name: String(item.name || '').slice(0, 200),
        role: String(item.role || '').slice(0, 100),
        phone: String(item.phone || '').replace(/[^\d\s\-\+\(\)]/g, '').slice(0, 30),
        email: String(item.email || '').slice(0, 200),
        status: String(item.status || 'TBD').slice(0, 50)
    })).filter(item => item.name.trim());
}

function sanitizeDocuments(data) {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 50).map(item => ({
        name: String(item.name || '').slice(0, 200),
        type: String(item.type || 'Document').slice(0, 100),
        url: sanitizeUrl(item.url),
        date: String(item.date || '').slice(0, 50)
    })).filter(item => item.name.trim() && item.url);
}

function sanitizeGallery(data) {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 100).map(item => {
        if (typeof item === 'string') return { url: sanitizeImageSrc(item), caption: '' };
        return {
            url: sanitizeImageSrc(String(item.url || '')),
            caption: String(item.caption || '').slice(0, 300)
        };
    }).filter(item => item.url);
}

function sanitizeMoodboard(data) {
    if (!data || typeof data !== 'object') return { palette: [], images: [], description: '' };
    return {
        description: String(data.description || '').slice(0, 2000),
        palette: Array.isArray(data.palette)
            ? data.palette.slice(0, 20).map(hex => String(hex).replace(/[^#a-fA-F0-9]/g, '').slice(0, 10))
            : [],
        images: Array.isArray(data.images)
            ? data.images.slice(0, 50).map(img => {
                if (typeof img === 'string') return { url: sanitizeImageSrc(img), caption: '' };
                return { url: sanitizeImageSrc(String(img.url || '')), caption: String(img.caption || '').slice(0, 300) };
            }).filter(img => img.url)
            : []
    };
}

const SECTION_SANITIZERS = {
    timeline: sanitizeTimeline,
    vendors: sanitizeVendors,
    documents: sanitizeDocuments,
    gallery: sanitizeGallery,
    moodboard: sanitizeMoodboard
};

exports.handler = async (event) => {
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS') {
        return respond(200, '');
    }

    const path = (event.rawPath || event.requestContext.http.path || '').replace(/\/$/, '');

    try {
        const body = JSON.parse(event.body || '{}');

        /* ── Admin: full publish ────────────────────── */
        if (path === '/upload-clients') {
            if (!body.clients || !Array.isArray(body.clients)) {
                return respond(400, { ok: false, error: 'Missing clients array' });
            }

            /* Merge: admin controls basic fields + deletions; S3 owns portal section data.
               - Clients absent from incoming list are DELETED (that's the fix).
               - For kept clients, preserve portal sections from S3 so in-progress
                 portal work is never overwritten by a stale admin session. */
            const PORTAL_SECTIONS = ['timeline','vendors','documents','gallery','moodboard','agreement','editLog','trackingNotes'];
            let existing = [];
            try { existing = await readClients(); } catch (e) { /* first write */ }
            if (!Array.isArray(existing)) existing = [];

            const existingById = {};
            existing.forEach(c => { if (c && c.id) existingById[c.id] = c; });

            const merged = body.clients.map(incoming => {
                const s3 = existingById[incoming.id];
                if (!s3) return incoming; // new client
                // Merge: take admin fields from incoming, portal sections from S3
                const out = Object.assign({}, incoming);
                PORTAL_SECTIONS.forEach(k => { if (s3[k] !== undefined) out[k] = s3[k]; });
                return out;
            });
            // Clients not in incoming are simply omitted — that's the delete

            await writeClients(merged);
            return respond(200, { ok: true, count: merged.length });
        }

        /* ── Client: update own tracking notes ──────── */
        if (path === '/update-client-notes') {
            const { codeHash, clientTodos } = body;
            if (!codeHash || typeof codeHash !== 'string') return respond(400, { ok: false, error: 'Missing codeHash' });
            if (!Array.isArray(clientTodos)) return respond(400, { ok: false, error: 'clientTodos must be an array' });

            const ALLOWED = ['pending', 'in-progress', 'done', 'not-applicable'];
            const cleaned = clientTodos.slice(0, 50).map(item => ({
                text: String(item.text || '').slice(0, 500),
                status: ALLOWED.includes(item.status) ? item.status : 'pending'
            })).filter(item => item.text.trim().length > 0);

            const clients = await readClients();
            const idx = clients.findIndex(c => c.codeHash === codeHash);
            if (idx === -1) return respond(404, { ok: false, error: 'Client not found' });
            if (!clients[idx].trackingNotes) clients[idx].trackingNotes = {};
            clients[idx].trackingNotes.clientTodos = cleaned;
            await writeClients(clients);
            return respond(200, { ok: true, count: cleaned.length });
        }

        /* ── Client: update any portal section ──────── */
        if (path === '/update-client-section') {
            const { codeHash, section, data } = body;
            if (!codeHash || typeof codeHash !== 'string') return respond(400, { ok: false, error: 'Missing codeHash' });
            if (!SECTION_SANITIZERS[section]) return respond(400, { ok: false, error: 'Invalid section: ' + section });

            const clients = await readClients();
            const idx = clients.findIndex(c => c.codeHash === codeHash);
            if (idx === -1) return respond(404, { ok: false, error: 'Client not found' });

            clients[idx][section] = SECTION_SANITIZERS[section](data);
            await writeClients(clients);
            return respond(200, { ok: true });
        }

        /* ── Client: upload image file ───────────────── */
        if (path === '/upload-file') {
            const { codeHash, fileName, contentType, data } = body;
            if (!codeHash || typeof codeHash !== 'string') return respond(400, { ok: false, error: 'Missing codeHash' });
            if (!data || typeof data !== 'string') return respond(400, { ok: false, error: 'Missing file data' });

            const ALLOWED_TYPES = {
                'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
                'application/pdf': 'pdf',
                'application/msword': 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
            };
            const ext = ALLOWED_TYPES[(contentType || '').toLowerCase()];
            if (!ext) return respond(400, { ok: false, error: 'Only images (JPEG/PNG/WebP/GIF) or documents (PDF/DOC/DOCX) are allowed.' });

            const buf = Buffer.from(data, 'base64');
            if (buf.length > 15 * 1024 * 1024) return respond(400, { ok: false, error: 'File exceeds 15 MB limit.' });

            const clients = await readClients();
            const idx = clients.findIndex(c => c.codeHash === codeHash);
            if (idx === -1) return respond(404, { ok: false, error: 'Client not found' });

            const safeName = String(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '').slice(0, 80);
            const key = `client-uploads/${clients[idx].codeHash}/${Date.now()}-${safeName}.${ext}`;
            const mimeType = contentType.startsWith('image/') ? contentType : (ext === 'pdf' ? 'application/pdf' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword');

            await s3.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: buf,
                ContentType: mimeType
            }));

            const fileUrl = `https://${BUCKET}.s3.us-east-2.amazonaws.com/${key}`;
            return respond(200, { ok: true, url: fileUrl });
        }

        /* ── Public quote request ─────────────────────── */
        if (path === '/send-quote-request') {
            const { name, email, phone, location, eventType, eventDate, guestCount, budget, serviceScale, message } = body;
            if (!name  || typeof name  !== 'string') return respond(400, { ok: false, error: 'Name is required' });
            if (!email || typeof email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(email))
                return respond(400, { ok: false, error: 'A valid email address is required' });

            const safe = s => String(s || '').replace(/[<>"]/g, '').slice(0, 500);

            const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 20px">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden">
<tr><td style="background:#2d3a2d;padding:36px 30px;text-align:center">
  <h1 style="margin:0;color:#b89a5e;font-family:Georgia,serif;font-size:26px;font-weight:300;letter-spacing:3px">RNB EVENTS</h1>
  <p style="margin:6px 0 0;color:#a3b18a;font-size:11px;letter-spacing:2px;text-transform:uppercase">New Quote Request</p>
</td></tr>
<tr><td style="padding:36px 30px">
  <h2 style="margin:0 0 6px;color:#2d3a2d;font-family:Georgia,serif;font-size:20px;font-weight:400">Quote Request from ${safe(name)}</h2>
  <p style="margin:0 0 24px;color:#888;font-size:12px">${safe(email)}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ec;border-radius:4px;margin:0 0 24px"><tr><td style="padding:24px">
    <table width="100%" cellpadding="5" cellspacing="0">
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Name</td><td style="color:#2d3a2d;font-size:13px;font-weight:600;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(name)}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Email</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(email)}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Phone</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(phone) || '—'}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Location / City</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(location) || '—'}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Event Type</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(eventType) || '—'}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Event Date</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(eventDate) || '—'}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Guest Count</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(guestCount) || '—'}</td></tr>
      <tr><td style="color:#666;font-size:12px;border-bottom:1px solid #e0dcd4;padding:8px 0">Budget Range</td><td style="color:#2d3a2d;font-size:13px;border-bottom:1px solid #e0dcd4;padding:8px 0;text-align:right">${safe(budget) || '—'}</td></tr>
      <tr><td style="color:#666;font-size:12px;padding:8px 0">Service Level</td><td style="color:#2d3a2d;font-size:13px;font-weight:600;padding:8px 0;text-align:right">${safe(serviceScale) || '—'}/10</td></tr>
    </table>
  </td></tr></table>
  ${message ? `<p style="color:#666;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px">Message</p><p style="color:#3d3d3d;font-size:14px;line-height:1.7;background:#f9f7f4;padding:16px;border-radius:4px;margin:0 0 20px">${safe(message)}</p>` : ''}
  <p style="color:#888;font-size:12px">Received ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })} ET</p>
</td></tr>
<tr><td style="background:#2d3a2d;padding:20px 30px;text-align:center">
  <p style="margin:0;color:#a3b18a;font-size:11px">RNB Events &mdash; www.rnbevents716.com</p>
</td></tr></table></td></tr></table></body></html>`;

            await ses.send(new SendEmailCommand({
                Source: RECOVERY_EMAIL,
                Destination: { ToAddresses: [RECOVERY_EMAIL] },
                ReplyToAddresses: [String(email).slice(0, 200)],
                Message: {
                    Subject: { Data: `Quote Request: ${safe(name)} — ${safe(eventType) || 'Event'}` },
                    Body: {
                        Html: { Data: htmlBody },
                        Text: { Data: `New Quote Request\n\nName: ${safe(name)}\nEmail: ${safe(email)}\nPhone: ${safe(phone)}\nLocation: ${safe(location)}\nEvent: ${safe(eventType)}\nDate: ${safe(eventDate)}\nGuests: ${safe(guestCount)}\nBudget: ${safe(budget)}\nService Level: ${safe(serviceScale)}/10\n\nMessage:\n${safe(message)}` }
                    }
                }
            }));

            return respond(200, { ok: true });
        }

        return respond(404, { ok: false, error: 'Unknown route' });
    } catch (err) {
        console.error(err);
        return respond(500, { ok: false, error: err.message });
    }
};
