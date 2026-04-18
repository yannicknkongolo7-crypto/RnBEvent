/**
 * S3 Visit Logs -> SQL Server (Remus) Sync Pipeline
 * Pulls daily visit-log files from S3, bulk-inserts into Remus.PageViews.
 * Keeps SyncState so re-running is safe — already-imported files are skipped.
 *
 * Uses sqlcmd (named pipe) — no TCP config required.
 *
 * Run manually:  node sync-to-remus.js
 * Or schedule:   Task Scheduler -> node "C:\...\sync-to-remus.js"
 *                (run daily, e.g. 2 AM, picking up previous day's logs)
 */

const { execSync } = require('child_process');
const os           = require('os');
const fs           = require('fs');
const path         = require('path');

/* ── Config ─────────────────────────────────────────────── */
const S3_BUCKET  = 'rnbevents716';
const S3_REGION  = 'us-east-2';
const DB_SERVER  = 'localhost';
const DB_NAME    = 'Remus';

/* ── sqlcmd helper ───────────────────────────────────────── */
function runSql(tsql) {
    // Write to a temp file to avoid shell quoting issues with embedded SQL
    const tmp = path.join(os.tmpdir(), 'remus_sync_' + Date.now() + '.sql');
    fs.writeFileSync(tmp, tsql, 'utf8');
    try {
        const out = execSync(
            `sqlcmd -S "${DB_SERVER}" -d "${DB_NAME}" -E -No -i "${tmp}" -W -h -1`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        return out.trim();
    } finally {
        try { fs.unlinkSync(tmp); } catch (_) {}
    }
}

/* ── Helpers ─────────────────────────────────────────────── */
function dateStr(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

function fetchS3(s3Key) {
    // Use AWS CLI to fetch private S3 objects — no public access needed
    const tmp = path.join(os.tmpdir(), 'remus_s3_' + Date.now() + '.ndjson');
    try {
        execSync(
            `aws s3 cp "s3://${S3_BUCKET}/${s3Key}" "${tmp}" --region ${S3_REGION}`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        const data = fs.readFileSync(tmp, 'utf8');
        return data;
    } catch (e) {
        // NoSuchKey or similar = file doesn't exist yet
        if (e.stderr && e.stderr.includes('NoSuchKey')) return null;
        if (e.stderr && e.stderr.includes('does not exist')) return null;
        return null;
    } finally {
        try { fs.unlinkSync(tmp); } catch (_) {}
    }
}

function esc(v) {
    if (v === null || v === undefined) return 'NULL';
    return "'" + String(v).replace(/'/g, "''").slice(0, 2000) + "'";
}

/* ── Main ────────────────────────────────────────────────── */
async function syncVisits() {
    console.log('[' + new Date().toISOString() + '] Starting S3 logs -> Remus sync...');

    /* Verify connection */
    try {
        runSql('SELECT 1');
        console.log('  Connected to SQL Server (Remus)');
    } catch (e) {
        console.error('  FAILED to connect:', e.message);
        process.exit(1);
    }

    /* Which log files exist? Check last 7 days + today */
    var filesToCheck = [];
    for (var offset = -6; offset <= 0; offset++) {
        var date = dateStr(offset);
        filesToCheck.push('logs/visits-' + date + '.ndjson');
    }

    /* Load already-synced file list from SyncState */
    var syncedOut = runSql('SELECT LogFile FROM SyncState');
    var alreadySynced = new Set(
        syncedOut.split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
    );

    var toProcess = filesToCheck.filter(function (f) { return !alreadySynced.has(f); });

    if (toProcess.length === 0) {
        console.log('  All log files already synced. Nothing to do.');
        return;
    }

    var totalInserted = 0;

    for (var i = 0; i < toProcess.length; i++) {
        var logFile = toProcess[i];
        console.log('  Fetching: s3://' + S3_BUCKET + '/' + logFile);
        var text = fetchS3(logFile);

        if (text === null) {
            console.log('    Not found — skipping.');
            continue;
        }

        var lines = text.split('\n').filter(function (l) { return l.trim(); });
        console.log('    ' + lines.length + ' entries');

        if (lines.length === 0) {
            runSql("INSERT INTO SyncState (LogFile, Rows) VALUES (" + esc(logFile) + ", 0)");
            continue;
        }

        var inserted = 0;
        var sqlBatch = 'BEGIN TRANSACTION;\n';

        try {
            for (var j = 0; j < lines.length; j++) {
                var entry;
                try { entry = JSON.parse(lines[j]); } catch (e) { continue; }

                sqlBatch +=
                    "INSERT INTO PageViews " +
                    "(LoggedAt, Section, Page, PageTitle, Referrer, UtmSource, UtmMedium, UtmCampaign, UtmTerm, SessionId, CodeHash, LoadMs, City, Country, Type, Action) " +
                    "VALUES (" +
                        esc(entry.ts)                            + ", " +
                        esc(entry.section)                       + ", " +
                        esc(entry.page)                          + ", " +
                        esc(entry.title)                         + ", " +
                        esc(entry.referrer)                      + ", " +
                        esc(entry.utmSource)                     + ", " +
                        esc(entry.utmMedium)                     + ", " +
                        esc(entry.utmCampaign)                   + ", " +
                        esc(entry.utmTerm)                       + ", " +
                        esc(entry.sessionId)                     + ", " +
                        esc(entry.codeHash)                      + ", " +
                        (Number.isFinite(entry.loadMs) ? entry.loadMs : 'NULL') + ", " +
                        esc(entry.city    || '')                 + ", " +
                        esc(entry.country || '')                 + ", " +
                        esc(entry.type    || 'page_view')        + ", " +
                        esc(entry.action  || '')                 +
                    ");\n";
                inserted++;
            }

            sqlBatch += "INSERT INTO SyncState (LogFile, Rows) VALUES (" + esc(logFile) + ", " + inserted + ");\n";
            sqlBatch += "COMMIT;\n";

            runSql(sqlBatch);
            console.log('    Inserted ' + inserted + ' rows.');
            totalInserted += inserted;

        } catch (e) {
            console.error('    FAILED:', e.message);
        }
    }

    console.log('[' + new Date().toISOString() + '] Remus sync complete. Total inserted: ' + totalInserted);
}

syncVisits().catch(function (e) {
    console.error('Fatal:', e);
    process.exit(1);
});
