const BASE = '/SurakshaSetu';

/* Shows a red message at the top of the page (used so failures are never silent). */
function showFatal(text) {
  let b = document.getElementById('fatal');
  if (!b) {
    b = document.createElement('div');
    b.id = 'fatal';
    b.className = 'banner bad';
    (document.querySelector('main') || document.body).prepend(b);
  }
  b.className = 'banner bad';
  b.textContent = text;
}

async function api(path, opts) {
  const isPost = !!(opts && opts.method === 'POST');
  let r;
  try {
    r = await fetch(BASE + path, Object.assign({ credentials: 'same-origin' }, opts || {}));
  } catch (e) {
    const msg = 'Cannot reach the server. Is Jetty still running?';
    if (!isPost) showFatal(msg);
    return { ok: false, status: 0, data: { message: msg } };
  }

  let d = null;
  try { d = await r.json(); } catch (e) {}

  // Not logged in (or session expired): go back to the login page.
  if (r.status === 401) {
    location.href = BASE + '/index.html';
    return { ok: false, status: 401, data: {} };
  }

  if (!r.ok) {
    const message = (d && d.message) ? d.message : 'Server returned HTTP ' + r.status + ' for ' + path;
    if (!isPost) showFatal('Error ' + r.status + ': ' + message);
    return { ok: false, status: r.status, data: { message } };
  }

  return { ok: true, status: r.status, data: d === null ? {} : d };
}

function post(path, obj) {
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(obj)
  });
}

/* Redirect to login unless the session has the expected role. */
async function guard(role) {
  const r = await api('/api/me');
  if (r.status === 401) return false;                    // api() is already redirecting
  if (!r.ok) return false;                               // api() already showed the reason on screen
  if (r.data.role !== role) { location.href = BASE + '/index.html'; return false; }
  document.getElementById('who').innerHTML = 'Signed in as <b>' + esc(r.data.name) + '</b>';
  return true;
}

function esc(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function banner(id, ok, text) {
  const b = document.getElementById(id);
  b.className = 'banner ' + (ok ? 'ok' : 'bad');
  b.textContent = text;
}

function statusClass(s) {
  if (s === 'Under Investigation') return 's-accepted';
  if (s && s.indexOf('Awaiting') >= 0) return 's-awaiting';
  return 's-pending';
}

function when(iso) { return iso ? iso.replace('T', ' ').slice(0, 16) : ''; }

function officerBlock(o) {
  return '<div class="officer"><b>Police in-charge:</b> ' + esc(o.name) +
    '<br><b>Station:</b> ' + esc(o.station) + ' (' + esc(o.city) + ', ' + esc(o.district) + ', ' + esc(o.state) + ')' +
    '<br><b>Contact:</b> ' + esc(o.contactNumber) +
    '<br><b>Specialization:</b> ' + esc(o.specialization) + '</div>';
}


function money(v) { const n = Number(v); return isNaN(n) ? esc(v) : '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fsize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }

/* Extra case details (incident, money lost, evidence) shown inside a case card. */
function detailsBlock(c) {
  const d = c.details || {}, f = c.financial || {}, ev = c.evidence || [];
  const row = (k, v) => v ? '<div><span>' + k + '</span><b>' + esc(v) + '</b></div>' : '';
  let h = '';
  const inc = row('Incident', [d.incidentDate, d.incidentTime].filter(Boolean).join(' at ')) + row('Where', [d.location, d.city, d.state].filter(Boolean).join(', ')) +
    row('Jurisdiction', d.jurisdiction) + row('Platform', d.platform) + row('Identifiers', d.identifiers);
  if (inc) h += '<div class="dgrid">' + inc + '</div>';
  if (f.amountLost) h += '<div class="dgrid fin">' + '<div><span>Amount lost</span><b>' + money(f.amountLost) + '</b></div>' + row('Paid via', f.paymentMethod) +
    row('Bank / provider', f.bankName) + row('Transaction ref', f.transactionRef) + row('Transaction date', f.transactionDate) + row('Paid to', f.beneficiary) + '</div>';
  if (ev.length) h += '<div class="evlist">' + ev.map(x => '<a href="' + BASE + '/api/case?complaintId=' + c.id + '&file=' + encodeURIComponent(x.id) + '">\uD83D\uDCCE ' + esc(x.name) + ' <small>' + fsize(x.size) + '</small></a>').join('') + '</div>';
  return h ? '<div class="cdetails">' + h + '</div>' : '';
}


/* A "Report a concern" card with its photos / videos / voice notes. `actions` is trusted HTML (officer / admin controls). */
function concernMedia(c) {
  return (c.media || []).map(m => {
    const u = BASE + '/api/concern?id=' + c.id + '&file=' + encodeURIComponent(m.id);
    if (m.type.indexOf('image/') === 0) return '<a href="' + u + '" target="_blank" rel="noopener"><img class="cmedia" loading="lazy" alt="" src="' + u + '"></a>';
    if (m.type.indexOf('video/') === 0) return '<video class="cmedia" controls preload="metadata" playsinline src="' + u + '"></video>';
    return '<audio class="cmedia" controls preload="none" src="' + u + '"></audio>';
  }).join('');
}
function concernCard(c, actions) {
  return '<div class="card" id="cn' + c.id + '"><div class="top"><b>' + esc(c.reference) + '</b><span class="tag ' + esc(c.priority) + '">' + esc(c.priority) + '</span>' +
    '<span class="chip Pending">' + esc(c.status) + '</span></div>' +
    '<div class="meta">' + esc(c.type) + ' &middot; ' + esc(when(c.occurredAt)) + (c.reporter ? ' &middot; by <b>' + esc(c.reporter) + '</b>' + (c.city ? ' (' + esc(c.city) + ')' : '') : '') + '</div>' +
    (c.description ? '<p>' + esc(c.description) + '</p>' : '') +
    '<div class="meta">\uD83D\uDCCD ' + esc(c.location) + (c.lat != null ? ' &middot; <a style="color:var(--amber)" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + c.lat + ',' + c.lng + '">open map</a>' : '') + '</div>' +
    (c.media && c.media.length ? '<div class="cmwrap">' + concernMedia(c) + '</div>' : '') +
    (c.statusNote ? '<div class="reply" style="padding:8px 12px;border-left:3px solid var(--amber);background:rgba(255,255,255,.04);border-radius:8px;font-size:.88rem"><b>Police note:</b> ' + esc(c.statusNote) + '</div>' : '') +
    (actions || '') + '</div>';
}
/* Status controls for officers and admins. */
function concernActions(c) {
  const opts = ['Reported', 'Acknowledged', 'Help dispatched', 'Closed'].map(s => '<option' + (s === c.status ? ' selected' : '') + '>' + s + '</option>').join('');
  return '<div class="carea"><select id="cs' + c.id + '">' + opts + '</select><button class="btn good" onclick="setConcern(' + c.id + ')">Update</button></div>' +
    '<input id="cn-note' + c.id + '" maxlength="200" placeholder="Optional note to the citizen" style="margin-top:8px">';
}

/* One case card. `extra` is trusted HTML (buttons / placeholders) built by the page. */
function caseCard(c, extra, showFiler) {
  return '<div class="card"><div class="top"><b>Case #' + c.id + '</b>' + (c.referenceNo ? '<span class="meta">' + esc(c.referenceNo) + '</span>' : '') +
    '<span class="tag ' + esc(c.severity) + '">' + esc(c.severity) + '</span>' +
    '<span class="tag ' + statusClass(c.status) + '">' + esc(c.status) + '</span></div>' +
    '<div class="meta">' + esc(c.category) + ' &middot; ' + esc(when(c.dateFiled)) + '</div>' +
    '<p>' + esc(c.description) + '</p>' + detailsBlock(c) +
    (showFiler && c.filedBy ? '<div class="meta">Filed by <b>' + esc(c.filedBy) + '</b> &middot; ' +
      esc(c.filerPhone) + ' &middot; ' + esc(c.filerAddress) + ', ' + esc(c.filerCity) + ', ' + esc(c.filerState) + '</div>' : '') +
    (c.officer ? officerBlock(c.officer) : '') +
    (extra || '') + '</div>';
}