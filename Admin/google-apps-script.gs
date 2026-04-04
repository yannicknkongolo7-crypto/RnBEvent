/**
 * RNB Events — Google Apps Script Backend
 * ─────────────────────────────────────────
 * SETUP:
 * 1. Go to sheets.google.com → create a new spreadsheet
 * 2. Name it "RNB Events Admin" (or anything you like)
 * 3. Go to Extensions → Apps Script
 * 4. Delete the default code and paste this entire file
 * 5. Click ▶ Run → select "setup" → run it (grant permissions when asked)
 * 6. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Click Deploy → copy the URL
 * 8. Paste the URL into admin-data.js as cloudApiUrl
 *
 * The spreadsheet will have 3 tabs: Prospects, Tasks, Content
 * You can view/edit data directly in the spreadsheet too.
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter ? e.parameter.action : '') || 'getAll';

  if (action === 'getAll') {
    return respond({
      prospects: readSheet(ss, 'Prospects'),
      tasks:     readSheet(ss, 'Tasks'),
      content:   readKV(ss, 'Content')
    });
  }

  return respond({ error: 'Unknown action' });
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var body;

  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ error: 'Invalid JSON' });
  }

  if (body.prospects) {
    writeSheet(ss, 'Prospects', body.prospects,
      ['id','name','email','phone','eventType','eventDate','status','notes','added']);
  }

  if (body.tasks) {
    writeSheet(ss, 'Tasks', body.tasks,
      ['id','section','task','priority','status','githubFile']);
  }

  if (body.content) {
    writeKV(ss, 'Content', body.content);
  }

  return respond({ ok: true, ts: new Date().toISOString() });
}

/* ── Read a sheet as array of objects ── */
function readSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s || s.getLastRow() < 2) return [];
  var d = s.getDataRange().getValues();
  var h = d[0];
  var rows = [];
  for (var i = 1; i < d.length; i++) {
    var obj = {};
    for (var j = 0; j < h.length; j++) {
      obj[h[j]] = d[i][j] !== '' ? d[i][j] : '';
    }
    rows.push(obj);
  }
  return rows;
}

/* ── Read a sheet as key-value object ── */
function readKV(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s || s.getLastRow() < 2) return {};
  var d = s.getDataRange().getValues();
  var obj = {};
  for (var i = 1; i < d.length; i++) {
    if (d[i][0]) obj[d[i][0]] = d[i][1];
  }
  return obj;
}

/* ── Write an array of objects to a sheet ── */
function writeSheet(ss, name, rows, headers) {
  var s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  s.clear();
  s.appendRow(headers);
  rows.forEach(function (r) {
    s.appendRow(headers.map(function (h) { return r[h] !== undefined ? String(r[h]) : ''; }));
  });
}

/* ── Write a key-value object to a sheet ── */
function writeKV(ss, name, obj) {
  var s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  s.clear();
  s.appendRow(['key', 'value']);
  Object.keys(obj).forEach(function (k) {
    var v = String(obj[k]);
    if (v.indexOf('data:image') === 0) return; // skip large base64
    s.appendRow([k, v]);
  });
}

/* ── JSON response helper ── */
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Run once to create the tabs ── */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Prospects')) {
    ss.insertSheet('Prospects').appendRow(
      ['id','name','email','phone','eventType','eventDate','status','notes','added']);
  }
  if (!ss.getSheetByName('Tasks')) {
    ss.insertSheet('Tasks').appendRow(
      ['id','section','task','priority','status','githubFile']);
  }
  if (!ss.getSheetByName('Content')) {
    ss.insertSheet('Content').appendRow(['key','value']);
  }
}
