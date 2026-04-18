/**
 * S3 -> SQL Server (Romulus) Sync Pipeline
 * Pulls clients.json from S3, upserts into Romulus database.
 * Run on a schedule (Task Scheduler) or manually: node sync-to-romulus.js
 */

const https = require('https');
const sql = require('mssql');

const S3_URL = 'https://s3.us-east-2.amazonaws.com/rnbevents716/clients.json';

const DB_CONFIG = {
    server: 'Rome',
    database: 'Romulus',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

function fetchJson(url) {
    return new Promise(function (resolve, reject) {
        https.get(url, function (res) {
            var data = '';
            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function () {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
            });
        }).on('error', reject);
    });
}

async function syncClients() {
    console.log('[' + new Date().toISOString() + '] Starting S3 -> Romulus sync...');

    var clients;
    try {
        clients = await fetchJson(S3_URL);
        if (!Array.isArray(clients)) throw new Error('Expected array from S3');
        console.log('  Fetched ' + clients.length + ' clients from S3');
    } catch (e) {
        console.error('  FAILED to fetch S3:', e.message);
        process.exit(1);
    }

    var pool;
    try {
        pool = await sql.connect(DB_CONFIG);
        console.log('  Connected to SQL Server (Rome/Romulus)');
    } catch (e) {
        console.error('  FAILED to connect to SQL Server:', e.message);
        process.exit(1);
    }

    var transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];
            if (!c || !c.id) continue;

            var agr = c.agreement || {};

            // Upsert client
            await new sql.Request(transaction).query(
                "IF EXISTS (SELECT 1 FROM Clients WHERE Id = " + esc(c.id) + ") " +
                "UPDATE Clients SET " +
                    "ProspectId = " + esc(c.prospectId) + ", " +
                    "AccessCode = " + esc(c.accessCode) + ", " +
                    "CodeHash = " + esc(c.codeHash) + ", " +
                    "PlannerCode = " + esc(c.plannerCode) + ", " +
                    "PlannerCodeHash = " + esc(c.plannerCodeHash) + ", " +
                    "TeamCode = " + esc(c.teamCode) + ", " +
                    "TeamCodeHash = " + esc(c.teamCodeHash) + ", " +
                    "Active = " + (c.active === false ? '0' : '1') + ", " +
                    "FirstName = " + esc(c.firstName) + ", " +
                    "FullName = " + esc(c.fullName) + ", " +
                    "EventType = " + esc(c.eventType) + ", " +
                    "EventDate = " + esc(c.eventDate) + ", " +
                    "EventVenue = " + esc(c.eventVenue) + ", " +
                    "Planner = " + esc(c.planner) + ", " +
                    "PlannerEmail = " + esc(c.plannerEmail) + ", " +
                    "Added = " + esc(c.added) + ", " +
                    "AgreementStatus = " + esc(agr.status || 'pending') + ", " +
                    "CoupleSignature = " + esc(agr.coupleSignature) + ", " +
                    "CoupleSignedAt = " + esc(agr.coupleSignedAt) + ", " +
                    "PlannerSignature = " + esc(agr.plannerSignature) + ", " +
                    "PlannerSignedAt = " + esc(agr.plannerSignedAt) + ", " +
                    "SyncedAt = GETUTCDATE() " +
                "WHERE Id = " + esc(c.id) + " " +
                "ELSE " +
                "INSERT INTO Clients (Id, ProspectId, AccessCode, CodeHash, PlannerCode, PlannerCodeHash, TeamCode, TeamCodeHash, Active, FirstName, FullName, EventType, EventDate, EventVenue, Planner, PlannerEmail, Added, AgreementStatus, CoupleSignature, CoupleSignedAt, PlannerSignature, PlannerSignedAt) VALUES (" +
                    esc(c.id) + ", " + esc(c.prospectId) + ", " + esc(c.accessCode) + ", " + esc(c.codeHash) + ", " +
                    esc(c.plannerCode) + ", " + esc(c.plannerCodeHash) + ", " + esc(c.teamCode) + ", " + esc(c.teamCodeHash) + ", " +
                    (c.active === false ? '0' : '1') + ", " +
                    esc(c.firstName) + ", " + esc(c.fullName) + ", " + esc(c.eventType) + ", " + esc(c.eventDate) + ", " +
                    esc(c.eventVenue) + ", " + esc(c.planner) + ", " + esc(c.plannerEmail) + ", " + esc(c.added) + ", " +
                    esc(agr.status || 'pending') + ", " + esc(agr.coupleSignature) + ", " + esc(agr.coupleSignedAt) + ", " +
                    esc(agr.plannerSignature) + ", " + esc(agr.plannerSignedAt) + ")"
            );

            // Clear child tables for this client, re-insert fresh
            var cid = esc(c.id);
            await new sql.Request(transaction).query("DELETE FROM Timeline WHERE ClientId = " + cid);
            await new sql.Request(transaction).query("DELETE FROM TrackingNotes WHERE ClientId = " + cid);
            await new sql.Request(transaction).query("DELETE FROM Vendors WHERE ClientId = " + cid);
            await new sql.Request(transaction).query("DELETE FROM Documents WHERE ClientId = " + cid);
            await new sql.Request(transaction).query("DELETE FROM Gallery WHERE ClientId = " + cid);
            await new sql.Request(transaction).query("DELETE FROM Moodboard WHERE ClientId = " + cid);
            await new sql.Request(transaction).query("DELETE FROM EditLog WHERE ClientId = " + cid);

            // Timeline
            if (Array.isArray(c.timeline)) {
                for (var t = 0; t < c.timeline.length; t++) {
                    var tl = c.timeline[t];
                    await new sql.Request(transaction).query(
                        "INSERT INTO Timeline (ClientId, EventDate, Milestone, Notes, Status, SortOrder) VALUES (" +
                        cid + ", " + esc(tl.date) + ", " + esc(tl.milestone) + ", " + esc(tl.notes) + ", " + esc(tl.status) + ", " + t + ")"
                    );
                }
            }

            // Tracking notes
            var tn = c.trackingNotes || {};
            var cats = ['plannerTodos', 'teamTodos', 'clientTodos'];
            for (var ci = 0; ci < cats.length; ci++) {
                var cat = cats[ci];
                var todos = tn[cat] || [];
                for (var ti = 0; ti < todos.length; ti++) {
                    var todo = todos[ti];
                    await new sql.Request(transaction).query(
                        "INSERT INTO TrackingNotes (ClientId, Category, Text, Status, AddedBy, AddedAt, SortOrder) VALUES (" +
                        cid + ", " + esc(cat) + ", " + esc(todo.text) + ", " + esc(todo.status) + ", " + esc(todo.addedBy) + ", " + esc(todo.addedAt) + ", " + ti + ")"
                    );
                }
            }

            // Vendors
            if (Array.isArray(c.vendors)) {
                for (var v = 0; v < c.vendors.length; v++) {
                    var vn = c.vendors[v];
                    await new sql.Request(transaction).query(
                        "INSERT INTO Vendors (ClientId, Name, Role, Phone, Email, Status) VALUES (" +
                        cid + ", " + esc(vn.name) + ", " + esc(vn.role) + ", " + esc(vn.phone) + ", " + esc(vn.email) + ", " + esc(vn.status) + ")"
                    );
                }
            }

            // Documents
            if (Array.isArray(c.documents)) {
                for (var d = 0; d < c.documents.length; d++) {
                    var doc = c.documents[d];
                    await new sql.Request(transaction).query(
                        "INSERT INTO Documents (ClientId, Name, DocType, Url, DocDate) VALUES (" +
                        cid + ", " + esc(doc.name) + ", " + esc(doc.type) + ", " + esc(doc.url) + ", " + esc(doc.date) + ")"
                    );
                }
            }

            // Gallery
            if (Array.isArray(c.gallery)) {
                for (var g = 0; g < c.gallery.length; g++) {
                    var gal = c.gallery[g];
                    var gUrl = typeof gal === 'string' ? gal : (gal.url || '');
                    var gCap = typeof gal === 'object' ? (gal.caption || '') : '';
                    await new sql.Request(transaction).query(
                        "INSERT INTO Gallery (ClientId, Url, Caption) VALUES (" + cid + ", " + esc(gUrl) + ", " + esc(gCap) + ")"
                    );
                }
            }

            // Moodboard
            var mb = c.moodboard;
            if (mb && typeof mb === 'object') {
                await new sql.Request(transaction).query(
                    "INSERT INTO Moodboard (ClientId, Description, PaletteJson, ImagesJson) VALUES (" +
                    cid + ", " + esc(mb.description) + ", " + esc(JSON.stringify(mb.palette || [])) + ", " + esc(JSON.stringify(mb.images || [])) + ")"
                );
            }

            // Edit log
            if (Array.isArray(c.editLog)) {
                for (var e = 0; e < c.editLog.length; e++) {
                    var log = c.editLog[e];
                    await new sql.Request(transaction).query(
                        "INSERT INTO EditLog (ClientId, Ts, Role, RoleName, Action) VALUES (" +
                        cid + ", " + esc(log.ts) + ", " + esc(log.role) + ", " + esc(log.roleName) + ", " + esc(log.action) + ")"
                    );
                }
            }
        }

        await transaction.commit();
        console.log('  Synced ' + clients.length + ' clients to Romulus.');
        console.log('[' + new Date().toISOString() + '] Sync complete.');
    } catch (e) {
        await transaction.rollback();
        console.error('  SYNC FAILED (rolled back):', e.message);
        process.exit(1);
    } finally {
        await pool.close();
    }
}

/**
 * Escape a value for inline SQL. Uses parameterized-style quoting via N'' strings.
 * Prevents SQL injection by replacing single quotes.
 */
function esc(val) {
    if (val === null || val === undefined || val === '') return 'NULL';
    var s = String(val).replace(/'/g, "''");
    return "N'" + s + "'";
}

syncClients();
