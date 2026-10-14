/* Suraksha AI crime dashboard (admin): live analytics, assign police, crime-prone map, accused links, accused files.
   Needs app.js (api, post, esc, banner). Data comes from /api/crime?view=all, refreshed every 15 seconds. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const CT = { Theft: '#F4A300', Cybercrime: '#3A86FF', Fraud: '#b583ff', Assault: '#E5534B', Harassment: '#ff7eb6', Murder: '#c0392b', 'Missing Person': '#3DBE7A' };
  const col = c => CT[c] || '#8892a6';
  const isActive = s => /Pending|Awaiting|Under Investigation/.test(s || '');
  const isClosed = s => /Closed/.test(s || '');
  const SEV = { Critical: 0, Major: 1, Minor: 2 };
  const STLAB = { Absconding: 'WANTED', Arrested: 'IN CUSTODY', Suspect: 'PERSON OF INTEREST', Convicted: 'CONVICTED', Released: 'RELEASED' };
  const ACOL = ['#E5534B', '#F4A300', '#3A86FF', '#3DBE7A', '#b583ff', '#ff7eb6', '#4dd0e1', '#ffb74d'];

  let D = { incidents: [], accused: [], reports: [], officers: [] };
  let tab = 'home', sig = '', timer = null, linkMode = 'graph', linkSel = 0, started = false;
  let pm = null, pmLayer = null, lm = null, lmLayer = null, leafletP = null;

  /* ------------------------------------------------------------ small helpers */
  const dt = iso => new Date(String(iso || '').slice(0, 19));
  const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fmt = iso => { const d = dt(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const ago = iso => { const d = dt(iso); return isNaN(d) ? 99999 : (Date.now() - d.getTime()) / 864e5; };
  const byRef = ref => D.incidents.find(i => i.caseRef === ref);
  const accById = id => D.accused.find(a => a.accusedId === id);
  const accCases = a => (a.caseRefs || []).map(byRef).filter(Boolean);
  const caseAcc = i => D.accused.filter(a => (a.caseRefs || []).indexOf(i.caseRef) >= 0);
  const repOf = i => D.reports.find(r => i.complaintId ? r.complaintId === i.complaintId : r.caseRef === i.caseRef);
  const counts = (arr, f) => { const m = {}; arr.forEach(x => { const k = f(x); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const hash = s => [...String(s)].reduce((x, c) => (x * 31 + c.charCodeAt(0)) | 0, 7);
  const loaded = () => D.incidents.length + D.accused.length > 0;
  const modalOpen = () => $('cr-modal').classList.contains('on');

  function avatar(a, flat) {
    if (a.photo) return '<img class="cr-av" src="' + esc(a.photo) + '" alt="' + esc(a.name) + '">';
    const h = Math.abs(hash(a.name)) % 360;
    return '<svg class="cr-av" viewBox="0 0 100 100" role="img" aria-label="Sample photo"><rect width="100" height="100" fill="hsl(' + h + ' 30% 24%)"/>' +
      '<circle cx="50" cy="38" r="17" fill="hsl(' + h + ' 20% 60%)"/><path d="M14 102c2-27 20-37 36-37s34 10 36 37z" fill="hsl(' + h + ' 20% 48%)"/></svg>';
  }
  function countUp(el, to) {
    const t0 = performance.now(), dur = 900;
    (function step(t) { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletP) return leafletP;
    leafletP = new Promise((res, rej) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'; document.head.appendChild(css);
      const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = res;
      s.onerror = () => { leafletP = null; rej(new Error('map library')); }; document.head.appendChild(s);
    });
    return leafletP;
  }
  const tiles = () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' });
  const emptyMsg = t => '<div class="empty">' + t + '</div>';
  const demoHint = '<div class="empty">No crime data yet. Officers add it when they submit investigation reports.<br>To see how the dashboard looks, tap <b>Load demo data</b> (fictional people and cases).</div>';

  /* ------------------------------------------------------------ data + refresh */
  async function refresh(force) {
    const r = await api('/api/crime?view=all');
    if (!r.ok) return;
    const d = r.data || {};
    D = { incidents: d.incidents || [], accused: d.accused || [], reports: d.reports || [], officers: d.officers || [] };
    const s = D.incidents.map(i => i.id + i.status + i.officerId).join() + '|' + D.accused.map(a => a.accusedId + ':' + (a.caseRefs || []).length + a.status).join() + '|' + D.reports.length;
    const t = $('cr-upd'); if (t) t.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN');
    if (force || (s !== sig && !modalOpen())) { sig = s; renderTab(); }
  }
  function renderTab() {
    const f = { home: renderHome, dash: renderDash, ask: renderAsk, assign: renderAssign, reports: renderReports, prone: renderProne, links: renderLinks, files: renderFiles, officers: renderOfficers }[tab];
    if (f) f();
  }
  function show(t) {
    tab = t;
    document.querySelectorAll('#cnav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('on', p.id === 't-' + t));
    if (t === 'cases') { if (window.load) window.load(); if (window.loadRagging) window.loadRagging(); return; }
    renderTab();
  }

  /* ------------------------------------------------------------ 1. dashboard */
  function insights() {
    const I = D.incidents, out = [];
    const located = I.filter(i => i.area && i.precise);
    const top = counts(located, i => i.area)[0];
    if (top) {
      const inTop = located.filter(i => i.area === top[0]);
      const typ = counts(inTop, i => i.category)[0];
      out.push(['red', '📍', '<b>' + esc(top[0]) + '</b> is the busiest area with ' + top[1] + ' incident' + (top[1] > 1 ? 's' : '') + ' (' + Math.round(100 * top[1] / located.length) + '% of located cases). Most common: ' + esc(typ[0]) + '.']);
    }
    const w1 = I.filter(i => ago(i.date) <= 7).length, w0 = I.filter(i => ago(i.date) > 7 && ago(i.date) <= 14).length;
    if (w1 + w0 > 0) out.push(['blu', w1 >= w0 ? '📈' : '📉', 'Last 7 days: <b>' + w1 + '</b> incidents versus ' + w0 + ' the week before' + (w0 ? ' (' + (w1 >= w0 ? '+' : '') + Math.round(100 * (w1 - w0) / w0) + '%).' : '.')]);
    D.accused.map(a => [a, accCases(a)]).filter(x => x[1].length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 2).forEach(x => {
      const ar = counts(x[1], i => i.area).map(e => e[0] + (e[1] > 1 ? ' ×' + e[1] : '')).join(', ');
      out.push(['red', '🕸️', '<b>' + esc(x[0].name) + '</b>' + (x[0].alias ? ' ("' + esc(x[0].alias) + '")' : '') + ' is linked to <b>' + x[1].length + ' cases</b>' + (ar ? ' across ' + esc(ar) : '') + '. Status: ' + esc(x[0].status) + '.']);
    });
    const crit = I.filter(i => i.status === 'Pending' && i.severity === 'Critical').length;
    if (crit) out.push(['red', '🚨', '<b>' + crit + ' critical case' + (crit > 1 ? 's' : '') + '</b> still waiting for an officer. Open Assign Police.']);
    const cause = counts(D.reports, r => r.cause)[0];
    if (cause) out.push(['', '🧭', 'Most common cause in investigation reports: <b>' + esc(cause[0]) + '</b> (' + cause[1] + ' of ' + D.reports.length + ').']);
    const unloc = I.filter(i => !i.precise).length;
    if (unloc) out.push(['blu', 'ℹ️', unloc + ' case' + (unloc > 1 ? 's have' : ' has') + ' no exact location (only the city, or nothing), so ' + (unloc > 1 ? 'they are' : 'it is') + ' left out of hotspot ranking. Ask citizens to fill the location field.']);
    return out;
  }
  function renderDash() {
    const I = D.incidents, box = $('cr-dash'), hasDemo = D.accused.some(a => a.demo) || D.reports.some(r => r.demo);
    const head = '<div class="cr-head"><div><h2>🛡️ Suraksha AI · Crime Dashboard</h2><div class="cr-sub" id="cr-upd">Updated now</div></div>' +
      '<div class="cr-tabs"><span class="cr-live"><i></i>LIVE</span>' +
      (hasDemo ? '<button class="btn bad" id="cr-demo-x">Remove demo data</button>' : '<button class="btn" id="cr-demo-l">Load demo data</button>') + '</div></div>';
    if (!loaded()) { box.innerHTML = head + demoHint; wireDemo(); return; }

    const open = I.filter(i => isActive(i.status)).length, closed = I.filter(i => isClosed(i.status)).length;
    const repeat = D.accused.filter(a => accCases(a).length >= 2).length;
    const topA = counts(I.filter(i => i.area && i.precise), i => i.area)[0];
    const kp = [['', I.length, 'Total incidents'], ['red', open, 'Open cases'], ['grn', closed, 'Closed with report'], ['blu', repeat, 'Repeat offenders'], ['', D.accused.length, 'Accused on file']];
    const cat = counts(I, i => i.category), maxC = cat.length ? cat[0][1] : 1;
    const bars = cat.map(c => '<div class="cr-bar"><span>' + esc(c[0]) + '</span><div><i style="--w:' + Math.round(100 * c[1] / maxC) + '%;background:' + col(c[0]) + '"></i></div><em>' + c[1] + '</em></div>').join('');

    // 14 day trend
    const days = []; for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); days.push(dayKey(d)); }
    const per = days.map(k => I.filter(i => String(i.date).slice(0, 10) === k).length), mx = Math.max(1, ...per);
    const pts = per.map((v, n) => [20 + n * (300 / 13), 100 - 80 * v / mx]);
    const line = pts.map((p, n) => (n ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const trend = '<svg viewBox="0 0 340 125" style="width:100%"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4A300" stop-opacity=".35"/><stop offset="1" stop-color="#F4A300" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + line + 'L320 100L20 100Z" fill="url(#tg)"/><path d="' + line + '" fill="none" stroke="#F4A300" stroke-width="2.5" pathLength="1" style="stroke-dasharray:1;animation:crTrend 1.4s ease both"/>' +
      pts.map((p, n) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="#F4A300"><title>' + days[n] + ': ' + per[n] + '</title></circle>').join('') +
      '<text x="20" y="118" fill="#9aa3b5" font-size="9">' + days[0].slice(5) + '</text><text x="320" y="118" fill="#9aa3b5" font-size="9" text-anchor="end">' + days[13].slice(5) + '</text></svg>' +
      '<style>@keyframes crTrend{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}</style>';

    // severity donut
    const sev = ['Critical', 'Major', 'Minor'].map(s => [s, I.filter(i => i.severity === s).length]), tot = Math.max(1, I.length);
    let off = 0;
    const SC = { Critical: '#E5534B', Major: '#F4A300', Minor: '#3A86FF' };
    const donut = '<svg viewBox="0 0 42 42" style="width:130px;flex:none"><circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(236,232,223,.08)" stroke-width="6"/>' +
      sev.map(s => { const len = 100 * s[1] / tot, el = '<circle cx="21" cy="21" r="15.9" fill="none" stroke="' + SC[s[0]] + '" stroke-width="6" pathLength="100" stroke-dasharray="' + len + ' ' + (100 - len) + '" stroke-dashoffset="' + (25 - off) + '"><title>' + s[0] + ': ' + s[1] + '</title></circle>'; off += len; return el; }).join('') + '</svg>';
    const sevLeg = '<div style="display:grid;gap:6px;font-size:.85rem">' + sev.map(s => '<div><span class="cr-dot" style="display:inline-block;background:' + SC[s[0]] + ';margin-right:8px"></span>' + s[0] + ' <b>' + s[1] + '</b></div>').join('') + '</div>';

    const ins = insights().map((x, n) => '<li class="' + x[0] + '" style="animation-delay:' + n * 80 + 'ms"><span>' + x[1] + '</span><span>' + x[2] + '</span></li>').join('');
    const reps = D.reports.slice().sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))).slice(0, 8).map(r => {
      const who = r.accusedIds.map(id => accById(id)).filter(Boolean).map(a => esc(a.name) + ' (' + esc(r.roles[a.accusedId] || 'Suspect') + ')').join(', ') || 'Not identified yet';
      return '<div class="cr-item" data-ref="' + esc(r.caseRef) + '"><span class="cr-dot" style="background:' + col(r.category) + '"></span><div><b>' + esc(r.caseRef) + ' · ' + esc(r.category) + '</b> · ' + esc(r.area || 'location n/a') +
        '<small>Who: ' + who + '</small><small>Cause: ' + esc(r.cause) + ' · ' + esc(r.outcome) + ' · by ' + esc(r.officerName) + '</small></div></div>';
    }).join('');
    const live = I.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8).map(i =>
      '<div class="cr-item" data-ref="' + esc(i.caseRef) + '"><span class="cr-dot' + (ago(i.date) < 1 ? ' new' : '') + '" style="background:' + col(i.category) + ';color:' + col(i.category) + '"></span><div><b>' + esc(i.category) + '</b> · ' + esc(i.area || 'location n/a') +
      ' <span class="cr-chip">' + esc(i.status) + '</span><small>' + esc(i.caseRef) + ' · ' + esc(fmt(i.date)) + '</small></div></div>').join('');

    box.innerHTML = head +
      '<div class="cr-kpis">' + kp.map((k, n) => '<div class="cr-kpi ' + k[0] + '" style="animation-delay:' + n * 70 + 'ms"><b data-n="' + k[1] + '">0</b><span>' + k[2] + '</span></div>').join('') +
      '<div class="cr-kpi red" style="animation-delay:350ms"><b style="font-size:1.25rem">' + esc(topA ? topA[0] : 'n/a') + '</b><span>Top hotspot' + (topA ? ' (' + topA[1] + ')' : '') + '</span></div></div>' +
      '<div class="cr-grid"><div class="cr-panel"><h3>✨ Suraksha AI insights</h3><ul class="cr-ins">' + (ins || '<li>Not enough data yet.</li>') + '</ul><div class="cr-sub" style="margin-top:8px">Generated automatically from your case data. Check before acting.</div></div>' +
      '<div class="cr-panel"><h3>Crimes by type</h3>' + bars + '</div>' +
      '<div class="cr-panel"><h3>Last 14 days</h3>' + trend + '<h3 style="margin-top:14px">Severity</h3><div style="display:flex;gap:18px;align-items:center">' + donut + sevLeg + '</div></div></div>' +
      '<div class="cr-grid"><div class="cr-panel"><h3>Investigation reports (who, why, outcome)</h3><div class="cr-feed">' + (reps || emptyMsg('No investigation reports yet. They appear here when officers submit them.')) + '</div></div>' +
      '<div class="cr-panel"><h3>Live incident feed</h3><div class="cr-feed">' + live + '</div></div></div>';
    box.querySelectorAll('.cr-kpi b[data-n]').forEach(b => countUp(b, +b.dataset.n));
    box.querySelectorAll('.cr-item').forEach(e => e.addEventListener('click', () => caseModal(e.dataset.ref)));
    wireDemo();
  }
  function wireDemo() {
    const l = $('cr-demo-l'), x = $('cr-demo-x');
    if (l) l.onclick = async () => { const r = await post('/api/crime', { action: 'seedDemo' }); banner('cmsg', r.ok, r.data.message || 'Something went wrong.'); refresh(true); };
    if (x) x.onclick = async () => { if (!confirm('Remove all demo people and cases? Your real data is not touched.')) return; const r = await post('/api/crime', { action: 'clearDemo' }); banner('cmsg', r.ok, r.data.message || 'Something went wrong.'); refresh(true); };
  }

  /* ------------------------------------------------------------ 2. assign police */
  function workload() { const w = {}; D.incidents.forEach(i => { if (i.officerId && isActive(i.status)) w[i.officerId] = (w[i.officerId] || 0) + 1; }); return w; }
  async function renderAssign() {
    const I = D.incidents, w = workload(), areaN = {};
    I.forEach(i => { if (i.area) areaN[i.area] = (areaN[i.area] || 0) + 1; });
    const pend = I.filter(i => i.status === 'Pending' && i.complaintId).sort((a, b) => (SEV[a.severity] - SEV[b.severity]) || String(a.date).localeCompare(String(b.date)));
    const prog = I.filter(i => i.complaintId && /Awaiting|Under Investigation/.test(i.status));
    const maxW = Math.max(1, ...Object.values(w), 1);
    $('cr-assign').innerHTML = '<div class="cr-head"><h2>👮 Assign police</h2><div class="cr-sub">Critical cases first. "Suggest" picks the matching officer with the lightest workload.</div></div>' +
      '<div class="cr-grid"><div class="cr-panel" style="grid-column:1/-1"><h3>Waiting for an officer (' + pend.length + ')</h3><div class="cases">' +
      (pend.length ? pend.map(i => '<div class="card"><div class="top"><b>Case #' + i.complaintId + '</b><span class="meta">' + esc(i.caseRef) + '</span><span class="tag ' + esc(i.severity) + '">' + esc(i.severity) + '</span><span class="cr-chip" style="color:' + col(i.category) + '">' + esc(i.category) + '</span>' +
        (i.area ? '<span class="cr-chip">📍 ' + esc(i.area) + (areaN[i.area] > 1 ? ' · hotspot, ' + areaN[i.area] + ' cases' : '') + '</span>' : '') + '</div><p>' + esc(i.description) + '</p><div id="as' + i.complaintId + '" class="meta">Finding matching officers…</div></div>').join('') : emptyMsg('Nothing waiting. Every case has an officer.')) + '</div></div>' +
      '<div class="cr-panel"><h3>Officer workload (active cases)</h3>' + (D.officers.length ? D.officers.map(o => '<div class="cr-bar"><span title="' + esc(o.station) + '">' + esc(o.name) + '</span><div><i style="--w:' + Math.round(100 * (w[o.id] || 0) / maxW) + '%;background:var(--amber)"></i></div><em>' + (w[o.id] || 0) + '</em></div>').join('') : emptyMsg('No officers found.')) + '</div>' +
      '<div class="cr-panel"><h3>In progress (' + prog.length + ')</h3><div class="cr-feed">' + (prog.length ? prog.map(i => '<div class="cr-item" data-ref="' + esc(i.caseRef) + '"><span class="cr-dot" style="background:' + col(i.category) + '"></span><div><b>#' + i.complaintId + ' ' + esc(i.category) + '</b> <span class="cr-chip">' + esc(i.status) + '</span><small>' + esc(i.officerName || 'officer') + (i.area ? ' · ' + esc(i.area) : '') + '</small></div></div>').join('') : emptyMsg('No cases in progress.')) + '</div></div></div>';
    $('cr-assign').querySelectorAll('.cr-item').forEach(e => e.addEventListener('click', () => caseModal(e.dataset.ref)));
    pend.forEach(async i => {
      const box = $('as' + i.complaintId); if (!box) return;
      const r = await api('/api/admin?complaintId=' + i.complaintId);
      if (!r.ok || !r.data.length) { box.innerHTML = 'No officer matches this case yet (state, city or specialization). Add one in officers.json.'; return; }
      box.innerHTML = '<div class="actions" style="margin-top:0"><select id="so' + i.complaintId + '" style="flex:1;min-width:220px">' + r.data.map(o => '<option value="' + o.id + '">' + esc(o.name) + ' · ' + esc(o.station) + ' · ' + (w[o.id] || 0) + ' active</option>').join('') + '</select>' +
        '<button class="btn" id="sg' + i.complaintId + '">✨ Suggest</button><button class="btn good" id="ok' + i.complaintId + '">Assign</button></div>';
      $('sg' + i.complaintId).onclick = () => { const s = $('so' + i.complaintId); let best = null; [...s.options].forEach(o => { const n = w[+o.value] || 0; if (!best || n < best[1]) best = [o.value, n]; }); s.value = best[0]; s.style.outline = '2px solid var(--green)'; };
      $('ok' + i.complaintId).onclick = async () => { const r2 = await post('/api/admin', { complaintId: i.complaintId, officerId: $('so' + i.complaintId).value }); banner('cmsg', r2.ok, r2.data.message || 'Something went wrong.'); refresh(true); };
    });
  }

  /* ------------------------------------------------------------ 3. crime-prone areas */
  async function renderProne() {
    const box = $('cr-prone');
    if (!$('pm') || !pm) {
      box.innerHTML = '<div class="cr-head"><h2>🗺️ Crime-prone areas</h2><div class="cr-tabs"><select id="pf-t"><option value="">All crime types</option>' + Object.keys(CT).map(c => '<option>' + c + '</option>').join('') + '</select>' +
        '<select id="pf-d"><option value="30">Last 30 days</option><option value="7">Last 7 days</option><option value="90">Last 90 days</option><option value="0">All time</option></select><label style="display:flex;gap:6px;align-items:center;font-size:.82rem;color:var(--muted)"><input type="checkbox" id="pf-m" style="width:auto"> Show each incident</label></div></div>' +
        '<div class="cr-legend"><span style="--c:#3DBE7A">Low</span><span style="--c:#F4A300">Medium</span><span style="--c:#E5534B">High</span><span>Circle size = number of incidents. Positions are approximate area centres.</span></div>' +
        '<div class="cr-split"><div id="pm" class="cr-map dkmap"></div><div class="cr-panel"><h3>Ranking</h3><div class="cr-rank" id="pr"></div></div></div><div class="cr-sub" id="pn"></div>';
      $('pf-t').onchange = $('pf-d').onchange = () => drawProne(true); $('pf-m').onchange = () => drawProne(false);
      try { await loadLeaflet(); } catch (e) { $('pm').innerHTML = emptyMsg('The map could not load. Check your internet connection and refresh.'); return; }
      pm = L.map('pm').setView([12.9716, 77.5946], 11); tiles().addTo(pm); pmLayer = L.layerGroup().addTo(pm);
    }
    setTimeout(() => { if (pm) pm.invalidateSize(); drawProne(!pm._cr); if (pm) pm._cr = 1; }, 60);
  }
  function drawProne(fit) {
    if (!pm) return;
    const ty = $('pf-t').value, dy = +$('pf-d').value;
    const I = D.incidents.filter(i => (!ty || i.category === ty) && (!dy || ago(i.date) <= dy));
    const loc = I.filter(i => i.area && i.lat != null), g = {};
    loc.forEach(i => { const k = i.area; (g[k] = g[k] || { n: 0, lat: i.lat, lng: i.lng, precise: i.precise, list: [] }).n++; g[k].list.push(i); });
    const arr = Object.entries(g).sort((a, b) => b[1].n - a[1].n), mx = arr.length ? arr[0][1].n : 1;
    pmLayer.clearLayers();
    const colorOf = r => r < .34 ? '#3DBE7A' : r < .67 ? '#F4A300' : '#E5534B';
    arr.forEach((e, n) => {
      const v = e[1], c = colorOf(v.n / mx), types = counts(v.list, i => i.category).map(t => esc(t[0]) + ' ×' + t[1]).join('<br>');
      const people = new Set(); v.list.forEach(i => caseAcc(i).forEach(a => people.add(a.name)));
      const pop = '<b>' + esc(e[0]) + '</b><br>' + v.n + ' incident' + (v.n > 1 ? 's' : '') + '<br>' + types + (people.size ? '<br><i>Linked: ' + [...people].map(esc).join(', ') + '</i>' : '') + (v.precise ? '' : '<br><small>City-level position</small>');
      L.circle([v.lat, v.lng], { radius: (v.precise ? 450 + 300 * v.n : 2500 + 400 * v.n), color: c, weight: 2, fillColor: c, fillOpacity: .28 }).bindPopup(pop).addTo(pmLayer);
      if (n < 3) L.marker([v.lat, v.lng], { icon: L.divIcon({ className: '', html: '<div class="cr-pulse" style="--c:' + c + '"><i></i><b></b></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).bindPopup(pop).addTo(pmLayer);
    });
    if ($('pf-m') && $('pf-m').checked) loc.forEach(i => {
      const j = (Math.abs(hash(i.id)) % 100 - 50) * 0.00005;
      L.circleMarker([i.lat + j, i.lng - j], { radius: 6, color: '#fff', weight: 1.5, fillColor: col(i.category), fillOpacity: 1 }).bindTooltip(esc(i.category) + ' · ' + esc(i.caseRef)).on('click', () => caseModal(i.caseRef)).addTo(pmLayer);
    });
    if (fit && arr.length) pm.fitBounds(arr.map(e => [e[1].lat, e[1].lng]), { padding: [40, 40], maxZoom: 13 });
    $('pr').innerHTML = arr.length ? arr.map((e, n) => '<div class="cr-item" data-k="' + esc(e[0]) + '"><span class="cr-dot" style="background:' + colorOf(e[1].n / mx) + '"></span><div><b>' + (n + 1) + '. ' + esc(e[0]) + '</b> · ' + e[1].n + '<small>' + counts(e[1].list, i => i.category).map(t => esc(t[0]) + ' ' + t[1]).join(', ') + '</small></div></div>').join('') : emptyMsg('No located incidents for this filter.');
    $('pr').querySelectorAll('.cr-item').forEach(el => el.addEventListener('click', () => { const v = g[el.dataset.k]; if (v) pm.flyTo([v.lat, v.lng], 14, { duration: .8 }); }));
    const un = I.length - loc.length; $('pn').textContent = un > 0 ? un + ' incident' + (un > 1 ? 's are' : ' is') + ' not shown because no location could be read.' : '';
  }

  /* ------------------------------------------------------------ 4. accused links (graph / map) */
  function renderLinks() {
    const box = $('cr-links'), linked = D.accused.filter(a => accCases(a).length);
    box.innerHTML = '<div class="cr-head"><div><h2>🕸️ Accused links</h2><div class="cr-sub">Red lines join a person to the cases they are linked to. A case with two people joins them. Drag the dots.</div></div>' +
      '<div class="cr-tabs"><select id="ln-s"><option value="0">All accused</option>' + linked.map(a => '<option value="' + a.accusedId + '"' + (a.accusedId === linkSel ? ' selected' : '') + '>' + esc(a.name) + (a.alias ? ' ("' + esc(a.alias) + '")' : '') + '</option>').join('') + '</select>' +
      '<div class="cr-seg"><button data-m="graph" class="' + (linkMode === 'graph' ? 'on' : '') + '">Graph</button><button data-m="map" class="' + (linkMode === 'map' ? 'on' : '') + '">Map</button></div></div></div>' +
      '<div id="ln-cap"></div><div id="ln-body"></div>' +
      '<div class="cr-legend"><span style="--c:#E5534B">Accused / suspect</span><span style="--c:#F4A300">Case (colour = crime type)</span><span style="--c:#3A86FF">Area</span></div>';
    $('ln-s').onchange = e => { linkSel = +e.target.value; renderLinks(); };
    box.querySelectorAll('.cr-seg button').forEach(b => b.onclick = () => { linkMode = b.dataset.m; renderLinks(); });
    const a = linkSel ? accById(linkSel) : null;
    if (a) {
      const cs = accCases(a), ar = counts(cs, i => i.area).map(e => esc(e[0]) + (e[1] > 1 ? ' ×' + e[1] : '')).join(', ');
      $('ln-cap').innerHTML = '<div class="cr-cap"><b>' + esc(a.name) + '</b>' + (a.alias ? ' ("' + esc(a.alias) + '")' : '') + ' is linked to <b>' + cs.length + ' case' + (cs.length === 1 ? '' : 's') + '</b>' + (ar ? ' in ' + ar : '') + '. Types: ' + counts(cs, i => i.category).map(t => esc(t[0]) + ' ×' + t[1]).join(', ') + '. <a href="#" id="ln-open" style="color:var(--amber)">Open case file</a></div>';
      $('ln-open').onclick = ev => { ev.preventDefault(); dossier(a.accusedId); };
    }
    if (!linked.length) { $('ln-body').innerHTML = demoHint; return; }
    if (linkMode === 'graph') drawGraph(); else drawLinkMap();
  }

  function drawGraph() {
    const W = 1000, H = 620;
    let accs = D.accused.filter(a => accCases(a).length);
    if (linkSel) { const sel = accById(linkSel), refs = new Set(sel ? sel.caseRefs : []); accs = accs.filter(a => a.accusedId === linkSel || (a.caseRefs || []).some(r => refs.has(r))); }
    const nodes = [], idx = {}, edges = [];
    const add = n => { if (!(n.k in idx)) { idx[n.k] = nodes.length; nodes.push(n); } return nodes[idx[n.k]]; };
    accs.forEach((a, n) => add({ k: 'a' + a.accusedId, t: 'a', r: 27, a: a, c: ACOL[n % ACOL.length] }));
    accs.forEach(a => accCases(a).forEach(i => {
      add({ k: 'c' + i.caseRef, t: 'c', r: 12, i: i });
      edges.push({ s: 'a' + a.accusedId, d: 'c' + i.caseRef, cls: 'acc', len: 95 });
      if (i.area) { add({ k: 'p' + i.area, t: 'p', r: 13, name: i.area }); edges.push({ s: 'c' + i.caseRef, d: 'p' + i.area, cls: 'area', len: 70 }); }
    }));
    nodes.forEach((n, k) => { const ang = k * 2.4, rad = 60 + (k % 9) * 28; n.x = W / 2 + Math.cos(ang) * rad; n.y = H / 2 + Math.sin(ang) * rad; n.vx = 0; n.vy = 0; });
    for (let it = 0; it < 280; it++) {
      for (let p = 0; p < nodes.length; p++) for (let q = p + 1; q < nodes.length; q++) {
        const A = nodes[p], B = nodes[q]; let dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy + 40; const f = 5200 / d2, d = Math.sqrt(d2);
        dx /= d; dy /= d; A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f;
      }
      edges.forEach(e => { const A = nodes[idx[e.s]], B = nodes[idx[e.d]]; let dx = B.x - A.x, dy = B.y - A.y; const d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - e.len) * .02; dx /= d; dy /= d; A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f; });
      nodes.forEach(n => { n.vx += (W / 2 - n.x) * .003; n.vy += (H / 2 - n.y) * .003; n.x = Math.max(40, Math.min(W - 40, n.x + n.vx)); n.y = Math.max(40, Math.min(H - 40, n.y + n.vy)); n.vx *= .82; n.vy *= .82; });
    }
    const adj = {}; edges.forEach(e => { (adj[e.s] = adj[e.s] || new Set([e.s])).add(e.d); (adj[e.d] = adj[e.d] || new Set([e.d])).add(e.s); });
    const sel = linkSel ? 'a' + linkSel : '';
    let svg = '<svg class="cr-graph" id="gsvg" viewBox="0 0 ' + W + ' ' + H + '"><defs>' + nodes.filter(n => n.t === 'a').map(n => '<clipPath id="cp' + n.a.accusedId + '"><circle r="' + n.r + '"/></clipPath>').join('') + '</defs>' +
      '<g id="ge">' + edges.map((e, k) => '<line class="cr-e ' + e.cls + (sel && (e.s === sel) ? ' hot' : '') + '" data-e="' + k + '" x1="0" y1="0" x2="0" y2="0"/>').join('') + '</g><g id="gn">' +
      nodes.map(n => {
        if (n.t === 'a') return '<g class="cr-n" data-k="' + n.k + '"><circle class="halo" r="' + (n.r + 7) + '" fill="none" stroke="' + n.c + '" stroke-width="2"/><circle r="' + (n.r + 2) + '" fill="' + n.c + '"/>' +
          (n.a.photo ? '<image href="' + esc(n.a.photo) + '" x="' + -n.r + '" y="' + -n.r + '" width="' + 2 * n.r + '" height="' + 2 * n.r + '" clip-path="url(#cp' + n.a.accusedId + ')" preserveAspectRatio="xMidYMid slice"/>' :
            '<circle r="' + n.r + '" fill="#1b2a41"/><circle cy="-6" r="8" fill="#c9c2b3"/><path d="M-16 20c1-12 9-16 16-16s15 4 16 16z" fill="#c9c2b3"/>') +
          '<text y="' + (n.r + 15) + '" text-anchor="middle">' + esc(n.a.alias || n.a.name) + '</text></g>';
        if (n.t === 'c') return '<g class="cr-n" data-k="' + n.k + '"><rect x="-11" y="-11" width="22" height="22" rx="5" transform="rotate(45)" fill="' + col(n.i.category) + '" stroke="#0a1020" stroke-width="2"/><text y="-17" text-anchor="middle">' + esc(n.i.category) + '</text></g>';
        return '<g class="cr-n" data-k="' + n.k + '"><circle r="' + n.r + '" fill="#3A86FF" stroke="#0a1020" stroke-width="2"/><text y="4" text-anchor="middle" style="font-size:10px">📍</text><text y="' + (n.r + 13) + '" text-anchor="middle">' + esc(n.name) + '</text></g>';
      }).join('') + '</g></svg>';
    $('ln-body').innerHTML = svg;
    const el = $('gsvg'), ge = [...el.querySelectorAll('#ge line')], gn = {};
    el.querySelectorAll('.cr-n').forEach(g => gn[g.dataset.k] = g);
    const place = () => {
      nodes.forEach(n => gn[n.k].setAttribute('transform', 'translate(' + n.x.toFixed(1) + ' ' + n.y.toFixed(1) + ')'));
      ge.forEach((l, k) => { const e = edges[k], A = nodes[idx[e.s]], B = nodes[idx[e.d]]; l.setAttribute('x1', A.x); l.setAttribute('y1', A.y); l.setAttribute('x2', B.x); l.setAttribute('y2', B.y); });
    };
    place();
    let drag = null, moved = false;
    const pt = ev => { const p = el.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(el.getScreenCTM().inverse()); };
    el.addEventListener('pointerdown', ev => { const g = ev.target.closest('.cr-n'); if (!g) return; drag = nodes[idx[g.dataset.k]]; moved = false; el.setPointerCapture(ev.pointerId); });
    el.addEventListener('pointermove', ev => {
      if (!drag) return; const p = pt(ev); if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 3) moved = true; drag.x = p.x; drag.y = p.y; place();
    });
    el.addEventListener('pointerup', ev => {
      if (!drag) return; const n = drag; drag = null;
      if (!moved) { if (n.t === 'a') dossier(n.a.accusedId); else if (n.t === 'c') caseModal(n.i.caseRef); }
    });
    el.addEventListener('pointerover', ev => {
      const g = ev.target.closest('.cr-n'); if (!g || drag) return; const s = adj[g.dataset.k] || new Set([g.dataset.k]);
      el.classList.add('dim'); Object.keys(gn).forEach(k => gn[k].classList.toggle('hl', s.has(k)));
      ge.forEach((l, k) => l.classList.toggle('hot', edges[k].s === g.dataset.k || edges[k].d === g.dataset.k));
    });
    el.addEventListener('pointerleave', () => { el.classList.remove('dim'); Object.values(gn).forEach(g => g.classList.remove('hl')); ge.forEach((l, k) => l.classList.toggle('hot', !!sel && edges[k].s === sel)); });
  }

  async function drawLinkMap() {
    $('ln-body').innerHTML = '<div id="lm" class="cr-map dkmap"></div>';
    try { await loadLeaflet(); } catch (e) { $('ln-body').innerHTML = emptyMsg('The map could not load. Check your internet connection and refresh.'); return; }
    lm = L.map('lm').setView([12.9716, 77.5946], 11); tiles().addTo(lm); lmLayer = L.layerGroup().addTo(lm);
    let accs = D.accused.filter(a => accCases(a).some(i => i.area && i.lat != null));
    if (linkSel) accs = accs.filter(a => a.accusedId === linkSel);
    const all = [];
    accs.forEach((a, n) => {
      const c = ACOL[n % ACOL.length], j = (n % 5 - 2) * 0.0011;
      const cs = accCases(a).filter(i => i.area && i.lat != null).sort((x, y) => String(x.date).localeCompare(String(y.date)));
      const route = []; cs.forEach(i => { const p = [i.lat + j, i.lng + j]; if (!route.length || route[route.length - 1].k !== i.area) route.push({ k: i.area, p: p }); });
      const label = '<b>' + esc(a.name) + '</b>' + (a.alias ? ' ("' + esc(a.alias) + '")' : '') + '<br>' + cs.length + ' cases: ' + counts(cs, i => i.area).map(e => esc(e[0]) + (e[1] > 1 ? ' ×' + e[1] : '')).join(', ') + '<br><a href="#" class="cr-pop" data-id="' + a.accusedId + '" style="color:var(--amber)">Open case file</a>';
      if (route.length > 1) L.polyline(route.map(r => r.p), { color: c, weight: 4, opacity: .9, className: 'cr-ant' }).bindPopup(label).addTo(lmLayer);
      route.forEach((r, k) => { L.circleMarker(r.p, { radius: 9, color: '#fff', weight: 2, fillColor: c, fillOpacity: 1 }).bindPopup(label).bindTooltip(String(k + 1) + '. ' + r.k, { direction: 'top' }).addTo(lmLayer); all.push(r.p); });
    });
    if (all.length) lm.fitBounds(all, { padding: [50, 50], maxZoom: 13 });
    lm.on('popupopen', ev => { const a = ev.popup.getElement().querySelector('.cr-pop'); if (a) a.onclick = e => { e.preventDefault(); dossier(+a.dataset.id); }; });
    if (!accs.length) $('ln-body').insertAdjacentHTML('afterbegin', emptyMsg('No located cases for this selection.'));
    setTimeout(() => lm.invalidateSize(), 60);
  }

  /* ------------------------------------------------------------ 5. accused files */
  function renderFiles() {
    const box = $('cr-files'), q = ($('fq') || {}).value || '', fs = ($('fs') || {}).value || '', fc = ($('fc') || {}).value || '';
    if (!$('fgrid')) {
      box.innerHTML = '<div class="cr-head"><h2>🗂️ Accused files</h2><div class="cr-tabs"><input id="fq" placeholder="Search name or alias" style="min-width:170px">' +
        '<select id="fs"><option value="">Any status</option><option>Absconding</option><option>Arrested</option><option>Suspect</option><option>Convicted</option><option>Released</option></select>' +
        '<select id="fc"><option value="">Any crime</option>' + Object.keys(CT).map(c => '<option>' + c + '</option>').join('') + '</select><button class="btn primary" id="f-add">＋ Add accused</button></div></div><div class="cr-cards" id="fgrid"></div>';
      $('fq').oninput = $('fs').onchange = $('fc').onchange = renderFiles; $('f-add').onclick = () => accusedForm(0);
    }
    const list = D.accused.filter(a => (!q || (a.name + ' ' + a.alias).toLowerCase().indexOf(q.toLowerCase()) >= 0) && (!fs || a.status === fs) && (!fc || accCases(a).some(i => i.category === fc)))
      .sort((a, b) => accCases(b).length - accCases(a).length);
    $('fgrid').innerHTML = list.length ? list.map((a, n) => {
      const cs = accCases(a);
      return '<div class="cr-mug" data-id="' + a.accusedId + '" style="animation-delay:' + Math.min(n, 12) * 40 + 'ms"><div class="ph">' + avatar(a) + '</div><b>' + esc(a.name) + '</b><small>' + (a.alias ? '"' + esc(a.alias) + '" · ' : '') + cs.length + ' case' + (cs.length === 1 ? '' : 's') + '</small><br>' +
        '<span class="cr-st ' + esc(a.status) + '">' + esc(STLAB[a.status] || a.status) + '</span><div style="margin-top:6px">' + counts(cs, i => i.category).slice(0, 3).map(t => '<span class="cr-chip" style="color:' + col(t[0]) + '">' + esc(t[0]) + ' ' + t[1] + '</span>').join('') + '</div></div>';
    }).join('') : (D.accused.length ? emptyMsg('No one matches that filter.') : demoHint);
    $('fgrid').querySelectorAll('.cr-mug').forEach(e => e.addEventListener('click', () => dossier(+e.dataset.id)));
  }

  /* ------------------------------------------------------------ modals */
  function modal(html, wide) {
    const m = $('cr-modal'); m.innerHTML = '<div class="cr-box"' + (wide ? ' style="max-width:860px;background:transparent;border:none;padding:0"' : '') + '><button class="cr-x" aria-label="Close" ' + (wide ? 'style="color:#1b1710;right:10px;top:6px"' : '') + '>×</button>' + html + '</div>';
    m.classList.add('on'); m.querySelector('.cr-x').onclick = closeModal; return m;
  }
  function closeModal() { $('cr-modal').classList.remove('on'); $('cr-modal').innerHTML = ''; }

  function dossier(id) {
    const a = accById(id); if (!a) return;
    const cs = accCases(a).sort((x, y) => String(y.date).localeCompare(String(x.date)));
    const reps = D.reports, assoc = new Set();
    cs.forEach(i => caseAcc(i).forEach(o => { if (o.accusedId !== a.accusedId) assoc.add(o.name); }));
    const areas = counts(cs, i => i.area), last = cs[0];
    const m = modal('<div class="cr-doss"><div class="cr-dtop"><div class="cr-mugwrap"><div class="cr-clip"></div><div class="pic">' + (a.photo ? '' : '<span class="cr-sample">SAMPLE PHOTO</span>') + avatar(a) + '<div class="hc"></div></div>' +
      '<div class="plate">CITY POLICE · ' + String(a.accusedId).padStart(4, '0') + '</div></div><div><div class="cr-stamp ' + esc(a.status) + '">' + esc(STLAB[a.status] || a.status) + '</div>' +
      '<h2>' + esc(a.name).toUpperCase() + '</h2>' + (a.alias ? '<div>a.k.a. "' + esc(a.alias) + '"</div>' : '') +
      '<dl><dt>Age / Sex</dt><dd>' + (a.age || '?') + ' / ' + esc(a.gender) + '</dd><dt>Cases</dt><dd>' + cs.length + ' linked</dd><dt>Crime type</dt><dd>' + (counts(cs, i => i.category).map(t => esc(t[0]) + ' ×' + t[1]).join(', ') || 'None on file') + '</dd>' +
      '<dt>Seen at</dt><dd>' + (areas.map(e => esc(e[0]) + (e[1] > 1 ? ' ×' + e[1] : '')).join(', ') || 'Unknown') + '</dd>' + (last ? '<dt>Last case</dt><dd>' + esc(fmt(last.date)) + (last.area ? ', ' + esc(last.area) : '') + '</dd>' : '') +
      '<dt>Associates</dt><dd>' + ([...assoc].map(n => '<span class="cr-redact" title="Hover to reveal">' + esc(n) + '</span>').join(' ') || 'None known') + '</dd></dl>' +
      (a.description ? '<h4>DESCRIPTION / M.O.</h4><div style="font-size:.84rem;line-height:1.5">' + esc(a.description) + '</div>' : '') + '</div></div>' +
      '<h4>RAP SHEET · CASES (click a case number)</h4><div class="cr-rap">' + (cs.length ? cs.map((i, n) => {
        const r = repOf(i), role = r && r.roles ? r.roles[a.accusedId] : '';
        return '<div style="animation-delay:' + n * 120 + 'ms">▸ <a data-ref="' + esc(i.caseRef) + '">' + esc(i.caseRef) + '</a> · ' + esc(fmt(i.date)) + ' · <b>' + esc(i.category) + '</b>' + (i.area ? ' at ' + esc(i.area) : '') + (role ? ' · ' + esc(role) : '') + (r ? ' · ' + esc(r.outcome) : '') + '</div>';
      }).join('') : '<div>No cases linked yet.</div>') + '</div>' +
      ((a.history || []).length ? '<h4>PRIOR HISTORY</h4><div class="cr-rap">' + a.history.map((h, n) => '<div style="animation-delay:' + n * 120 + 'ms">▸ ' + esc(h) + '</div>').join('') + '</div>' : '') +
      '<div class="actions"><button class="btn" id="d-edit">Edit file</button><button class="btn" id="d-graph">Show on link graph</button><button class="btn" id="d-map">Show route on map</button></div>' +
      (a.demo ? '<div style="font-size:.72rem;margin-top:10px">Demo record: fictional person and cases.</div>' : '') + '</div>', true);
    m.querySelectorAll('.cr-rap a').forEach(x => x.onclick = () => caseModal(x.dataset.ref));
    $('d-edit').onclick = () => accusedForm(a.accusedId);
    $('d-graph').onclick = () => { closeModal(); linkSel = a.accusedId; linkMode = 'graph'; show('links'); };
    $('d-map').onclick = () => { closeModal(); linkSel = a.accusedId; linkMode = 'map'; show('links'); };
  }

  function caseModal(ref) {
    const i = byRef(ref); if (!i) return;
    const r = repOf(i), who = caseAcc(i);
    const m = modal('<h2>' + esc(i.caseRef) + ' <span class="cr-chip" style="color:' + col(i.category) + '">' + esc(i.category) + '</span><span class="tag ' + esc(i.severity) + '">' + esc(i.severity) + '</span></h2>' +
      '<div class="meta">' + esc(i.status) + ' · ' + esc(fmt(i.date)) + (i.area ? ' · 📍 ' + esc(i.area) : '') + (i.officerName ? ' · Officer ' + esc(i.officerName) : '') + (i.demo ? ' · demo' : '') + '</div>' +
      '<p>' + esc(i.description) + '</p>' +
      (r ? '<div class="cr-panel" style="margin:10px 0"><h3>Investigation report</h3><div style="display:grid;gap:6px;font-size:.88rem"><div><b>Cause:</b> ' + esc(r.cause) + '</div><div><b>What was found:</b> ' + esc(r.summary) + '</div>' + (r.modus ? '<div><b>Method:</b> ' + esc(r.modus) + '</div>' : '') + '<div><b>Outcome:</b> ' + esc(r.outcome) + '</div></div></div>' : '<div class="meta">No investigation report yet.</div>') +
      '<h3 style="margin:12px 0 6px">Linked people</h3>' + (who.length ? '<div class="cr-cards" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">' + who.map(a => '<div class="cr-mug" data-id="' + a.accusedId + '"><div class="ph" style="width:70px;height:70px">' + avatar(a) + '</div><b>' + esc(a.name) + '</b><small>' + esc(r && r.roles && r.roles[a.accusedId] || 'Suspect') + '</small></div>').join('') + '</div>' : '<div class="meta">No accused or suspects recorded.</div>') +
      (i.complaintId ? '<div class="actions"><button class="btn" id="cm-rep">' + (r ? 'Edit report' : 'Add report as admin') + '</button></div>' : ''));
    m.querySelectorAll('.cr-mug').forEach(e => e.onclick = () => dossier(+e.dataset.id));
    if ($('cm-rep')) $('cm-rep').onclick = () => { closeModal(); if (window.openReport) window.openReport(i.complaintId); };
  }

  function accusedForm(id) {
    const a = id ? accById(id) : { accusedId: 0, name: '', alias: '', age: '', gender: 'Unknown', status: 'Suspect', description: '', history: [], caseRefs: [], photo: '' };
    let photo = '';
    const opt = (list, v) => list.map(x => '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>').join('');
    const m = modal('<h2>' + (id ? 'Edit' : 'Add') + ' accused</h2><div class="cr-form"><div class="two"><label>Name<input id="af-n" maxlength="80" value="' + esc(a.name) + '"></label><label>Alias<input id="af-al" maxlength="60" value="' + esc(a.alias) + '"></label></div>' +
      '<div class="two"><label>Age<input id="af-ag" type="number" min="1" max="119" value="' + esc(a.age || '') + '"></label><label>Gender<select id="af-g">' + opt(['Unknown', 'Male', 'Female', 'Other'], a.gender) + '</select></label></div>' +
      '<label>Status<select id="af-s">' + opt(['Suspect', 'Arrested', 'Absconding', 'Convicted', 'Released'], a.status) + '</select></label>' +
      '<label>Description / method of operation<textarea id="af-d" maxlength="600">' + esc(a.description) + '</textarea></label>' +
      '<label>Prior history (one per line, e.g. "2019: arrested in a robbery case")<textarea id="af-h">' + esc((a.history || []).join('\n')) + '</textarea></label>' +
      '<div class="cr-pp"><div style="display:flex;gap:12px;align-items:center"><div class="ph" id="af-pv" style="width:64px;height:64px;border-radius:8px;overflow:hidden">' + avatar(a) + '</div><label style="flex:1">Photo (optional, cropped to a small square)<input id="af-f" type="file" accept="image/*"></label></div>' +
      (a.photo ? '<label style="flex-direction:row;display:flex;gap:6px;align-items:center"><input id="af-rm" type="checkbox" style="width:auto"> Remove current photo</label>' : '') + '</div>' +
      '<label>Link to cases</label><div class="cr-pick">' + (D.incidents.length ? D.incidents.slice().sort((x, y) => String(y.date).localeCompare(String(x.date))).map(i => '<label><input type="checkbox" value="' + esc(i.caseRef) + '"' + ((a.caseRefs || []).indexOf(i.caseRef) >= 0 ? ' checked' : '') + '>' + esc(i.caseRef) + ' · ' + esc(i.category) + (i.area ? ' · ' + esc(i.area) : '') + '</label>').join('') : '<div class="meta">No cases yet.</div>') + '</div>' +
      '<div class="actions"><button class="btn primary" id="af-save">Save</button><button class="btn" id="af-cancel">Cancel</button></div></div>');
    $('af-cancel').onclick = closeModal;
    $('af-f').onchange = ev => {
      const f = ev.target.files[0]; if (!f) return; const img = new Image(), u = URL.createObjectURL(f);
      img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 180; const s = Math.min(img.width, img.height); c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 180, 180);
        photo = c.toDataURL('image/jpeg', .72); $('af-pv').innerHTML = '<img class="cr-av" src="' + photo + '">'; URL.revokeObjectURL(u); };
      img.src = u;
    };
    $('af-save').onclick = async () => {
      const refs = [...m.querySelectorAll('.cr-pick input:checked')].map(x => x.value).join(',');
      const rm = $('af-rm') && $('af-rm').checked;
      const r = await post('/api/crime', { action: 'saveAccused', accusedId: a.accusedId, name: $('af-n').value, alias: $('af-al').value, age: $('af-ag').value, gender: $('af-g').value, status: $('af-s').value,
        description: $('af-d').value, history: $('af-h').value, caseRefs: refs, photo: rm ? 'remove' : photo });
      banner('cmsg', r.ok, r.data.message || 'Something went wrong.');
      if (r.ok) { closeModal(); refresh(true); }
    };
  }


  /* ------------------------------------------------------------ 0. greeting home */
  let me = { name: 'Admin' }, typed = false, typeT = null, chat = [], chatBusy = false;
  const greetWord = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

  function alerts() {
    const I = D.incidents, out = [];
    const crit = I.filter(i => i.complaintId && i.status === 'Pending' && i.severity === 'Critical');
    if (crit.length) out.push({ l: 'red', i: '🚨', t: '<b>' + plural(crit.length, 'critical case', 'critical cases') + '</b> still ' + (crit.length === 1 ? 'has' : 'have') + ' no police assigned.', tab: 'assign', b: 'Assign now' });
    const old = I.filter(i => i.complaintId && i.status === 'Pending' && i.severity !== 'Critical' && ago(i.date) > 2);
    if (old.length) out.push({ l: '', i: '⏳', t: '<b>' + plural(old.length, 'case', 'cases') + '</b> waiting more than 2 days for an officer.', tab: 'assign', b: 'Review' });
    const aw = I.filter(i => /Awaiting/.test(i.status));
    if (aw.length) out.push({ l: 'blu', i: '📨', t: plural(aw.length, 'case is', 'cases are') + ' assigned and waiting for the officer to accept.', tab: 'assign', b: 'Track' });
    const noRep = I.filter(i => i.complaintId && i.status === 'Under Investigation' && !i.hasReport && ago(i.date) > 14);
    if (noRep.length) out.push({ l: '', i: '📑', t: '<b>' + plural(noRep.length, 'investigation', 'investigations') + '</b> over 14 days old with no report yet.', tab: 'reports', b: 'Open reports' });
    const wanted = D.accused.filter(a => a.status === 'Absconding' && accCases(a).some(i => ago(i.date) <= 7));
    if (wanted.length) out.push({ l: 'red', i: '🕵️', t: '<b>' + wanted.map(a => esc(a.name)).join(', ') + '</b> (absconding) linked to a case in the last 7 days.', tab: 'links', b: 'See links' });
    const hot = counts(I.filter(i => i.precise && ago(i.date) <= 7), i => i.area)[0];
    if (hot && hot[1] >= 3) out.push({ l: '', i: '📍', t: '<b>' + esc(hot[0]) + '</b> had <b>' + hot[1] + '</b> incidents in the last 7 days.', tab: 'prone', b: 'View map' });
    return out;
  }

  function renderHome() {
    const I = D.incidents, box = $('cr-home');
    const open = I.filter(i => isActive(i.status)).length, pend = I.filter(i => i.complaintId && i.status === 'Pending').length;
    const waitRep = I.filter(i => i.officerName && i.status === 'Under Investigation' && !i.hasReport).length;
    const wk = I.filter(i => ago(i.date) <= 7).length, topA = counts(I.filter(i => i.area && i.precise), i => i.area)[0];
    const al = alerts();
    const tiles = [['👮', 'Assign police', pend ? plural(pend, 'case waiting', 'cases waiting') : 'Everything assigned', 'assign', pend], ['📑', 'Police reports', waitRep ? plural(waitRep, 'report', 'reports') + ' awaited' : 'Reports and outcomes', 'reports', waitRep],
      ['🗺️', 'Crime map', 'Hotspots and incidents', 'prone', 0], ['🤖', 'Ask Suraksha AI', 'Questions on your data', 'ask', 0], ['🕸️', 'Accused links', 'Who connects to what', 'links', 0], ['👥', 'Officers', 'Workload and results', 'officers', 0]];
    const tick = I.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 10).map(i => '<span><b style="color:' + col(i.category) + '">● ' + esc(i.category) + '</b> ' + esc(i.area || 'location n/a') + ' · ' + esc(i.status) + '</span>').join('');
    box.innerHTML = '<div class="cr-hero"><div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="cr-shield">🛡️</div><div class="txt">' +
      '<div style="font-size:.8rem;color:var(--amber);font-weight:700;letter-spacing:.12em">SURAKSHASETU · ADMIN <span class="cr-wave">👋</span></div><h1 id="hg"></h1>' +
      '<p>' + (loaded() ? 'Here is how things stand across your jurisdiction right now. ' + (al.length ? 'A few things need your attention below.' : 'Nothing urgent. Good work.') : 'Welcome. Once citizens file complaints and officers submit reports, your live picture appears here.') + '</p><div class="cr-clock" id="hc"></div></div></div>' +
      (loaded() ? '<div class="cr-kpis"><div class="cr-kpi"><b data-n="' + open + '">0</b><span>Open cases</span></div><div class="cr-kpi red"><b data-n="' + pend + '">0</b><span>Waiting for police</span></div><div class="cr-kpi blu"><b data-n="' + wk + '">0</b><span>New this week</span></div>' +
        '<div class="cr-kpi grn"><b data-n="' + D.reports.length + '">0</b><span>Investigation reports</span></div><div class="cr-kpi"><b style="font-size:1.25rem">' + esc(topA ? topA[0] : 'n/a') + '</b><span>Top hotspot</span></div></div>' : demoHint) +
      (tick ? '<div class="cr-tick"><div>' + tick + tick + '</div></div>' : '') +
      '<div class="cr-grid"><div class="cr-panel" style="grid-column:1/-1"><h3>Needs your attention</h3><div class="cr-alerts">' +
      (al.length ? al.map((a, n) => '<div class="cr-alert ' + a.l + '" style="animation-delay:' + n * 90 + 'ms"><span class="i">' + a.i + '</span><span class="t">' + a.t + '</span><button class="btn" data-go="' + a.tab + '">' + a.b + '</button></div>').join('') : '<div class="cr-allgood">✅ All clear. No urgent items right now.</div>') + '</div></div></div>' +
      '<div><h3 style="margin:0 0 10px">Quick actions</h3><div class="cr-tiles">' + tiles.map((t, n) => '<button class="cr-tile" data-go="' + t[3] + '" style="animation-delay:' + n * 70 + 'ms"><span class="e">' + t[0] + '</span><b>' + t[1] + '</b><small>' + t[2] + '</small>' + (t[4] ? '<span class="bd">' + t[4] + '</span>' : '') + '</button>').join('') + '</div></div>';
    box.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));
    box.querySelectorAll('.cr-kpi b[data-n]').forEach(b => countUp(b, +b.dataset.n));
    const full = greetWord() + ', ' + me.name + '!', h = $('hg');
    clearInterval(typeT);
    if (typed || window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) h.textContent = full;
    else { typed = true; let n = 0; typeT = setInterval(() => { n++; h.textContent = full.slice(0, n); if (n >= full.length) clearInterval(typeT); }, 55); }
  }

  /* ------------------------------------------------------------ 6. ask Suraksha AI */
  const CHIPS = ['Which cases have no police assigned?', 'Is police assigned to case 2?', 'Where is crime highest?', 'Who are the repeat offenders?', 'How many thefts this month?', 'Show the latest investigation reports', 'Officer workload', 'Give me a summary'];
  const offOf = id => D.officers.find(o => o.id === id);
  const refLink = i => '<a href="#" data-ref="' + esc(i.caseRef) + '">' + esc(i.caseRef) + '</a>';
  const accLink = a => '<a href="#" data-acc="' + a.accusedId + '">' + esc(a.name) + '</a>';
  const goBtn = (l, t) => ({ l: l, fn: () => show(t) });
  const topList = (arr, n) => '<ul>' + arr.slice(0, n).map(x => '<li>' + x + '</li>').join('') + '</ul>';

  function filt(t) {
    const cats = [...new Set(D.incidents.map(i => i.category))], areas = [...new Set(D.incidents.map(i => i.area).filter(Boolean))];
    let cat = null, area = null, days = 0;
    cats.forEach(c => { const k = c.toLowerCase(); if (t.indexOf(k) >= 0 || t.indexOf(k.replace(' person', '')) >= 0 || t.indexOf(k.replace('crime', '')) >= 0 && k.length > 6) cat = c; });
    const syn = { robber: 'Theft', snatch: 'Theft', stolen: 'Theft', steal: 'Theft', burglar: 'Theft', cyber: 'Cybercrime', hack: 'Cybercrime', scam: 'Fraud', cheat: 'Fraud', kill: 'Murder', beat: 'Assault', stalk: 'Harassment', missing: 'Missing Person' };
    if (!cat) for (const k in syn) if (t.indexOf(k) >= 0 && cats.indexOf(syn[k]) >= 0) { cat = syn[k]; break; }
    areas.forEach(a => { if (t.indexOf(a.toLowerCase()) >= 0) area = a; });
    let m;
    if (/today/.test(t)) days = 1; else if (/week|7 days/.test(t)) days = 7; else if (/month|30 days/.test(t)) days = 30; else if ((m = t.match(/last (\d+) days?/))) days = +m[1];
    const parts = [cat ? cat.toLowerCase() : '', area ? 'in ' + area : '', days ? (days === 1 ? 'today' : 'in the last ' + days + ' days') : ''].filter(Boolean);
    return { cat: cat, area: area, days: days, any: !!(cat || area || days), f: i => (!cat || i.category === cat) && (!area || i.area === area) && (!days || ago(i.date) <= days), text: parts.join(' ') };
  }

  function caseAns(i) {
    const r = repOf(i), who = caseAcc(i), o = offOf(i.officerId);
    const police = i.officerName ? '✅ <b>Yes.</b> Assigned to <b>' + esc(i.officerName) + '</b>' + (o ? ' (' + esc(o.station) + ')' : '') + (/Awaiting/.test(i.status) ? ', but the officer has not accepted yet.' : '.') :
      '❌ <b>No officer assigned yet.</b>' + (i.status === 'Pending' ? ' It is waiting in Assign Police.' : '');
    return { html: '<b>' + esc(i.caseRef) + '</b> · ' + esc(i.category) + ' (' + esc(i.severity) + ')' + (i.area ? ' · ' + esc(i.area) : '') + '<br>Filed ' + esc(fmt(i.date)) + ' · Status: <b>' + esc(i.status) + '</b><br>Police: ' + police + '<br>' +
      (r ? 'Investigation report: ✅ submitted. Cause: <b>' + esc(r.cause) + '</b>. Outcome: <b>' + esc(r.outcome) + '</b>.' : 'Investigation report: not submitted yet.') + (who.length ? '<br>Linked people: ' + who.map(accLink).join(', ') : ''),
      actions: [{ l: 'Open case', fn: () => caseModal(i.caseRef) }].concat(i.status === 'Pending' ? [goBtn('Go to Assign Police', 'assign')] : []) };
  }
  function personAns(a) {
    const cs = accCases(a).sort((x, y) => String(y.date).localeCompare(String(x.date))), ar = counts(cs, i => i.area).map(e => esc(e[0]) + (e[1] > 1 ? ' ×' + e[1] : '')).join(', ');
    return { html: '<b>' + esc(a.name) + '</b>' + (a.alias ? ' ("' + esc(a.alias) + '")' : '') + (a.age ? ', ' + a.age : '') + ' · <b>' + esc(a.status) + '</b><br>Linked to <b>' + cs.length + '</b> case' + (cs.length === 1 ? '' : 's') + (cs.length ? ': ' + counts(cs, i => i.category).map(t => esc(t[0]) + ' ×' + t[1]).join(', ') : '') + (ar ? '<br>Seen at: ' + ar : '') +
      (cs[0] ? '<br>Latest: ' + refLink(cs[0]) + ' on ' + esc(fmt(cs[0].date)) : '') + ((a.history || []).length ? '<br>History: ' + a.history.map(esc).join('; ') : ''), actions: [{ l: 'Open case file', fn: () => dossier(a.accusedId) }, { l: 'Show links', fn: () => { linkSel = a.accusedId; linkMode = 'graph'; show('links'); } }] };
  }

  function localAnswer(q) {
    const t = q.toLowerCase().trim(), I = D.incidents, F = filt(t);
    if (!I.length && !D.accused.length) return { html: 'There is no crime data yet. Use <b>Load demo data</b> on the Dashboard to try me out, or wait for citizens to file complaints.' };
    let m;
    if ((m = t.match(/\b(ss-\d{4}-\d{5}|demo-\d+)\b/))) { const i = byRef(m[1].toUpperCase()); return i ? caseAns(i) : { html: 'I could not find case <b>' + esc(m[1].toUpperCase()) + '</b>.' }; }
    if ((m = t.match(/\b(?:case|complaint|fir)\s*(?:no\.?|number|id)?\s*#?\s*(\d{1,6})\b/)) || (m = t.match(/#\s*(\d{1,6})\b/))) {
      const n = +m[1], i = I.find(x => x.complaintId === n) || byRef('DEMO-' + n);
      return i ? caseAns(i) : { html: 'I could not find a case numbered <b>' + n + '</b>.' };
    }
    const person = D.accused.find(a => { const nm = String(a.name).toLowerCase(); const first = nm.split(/\s+/)[0]; return (nm.length >= 5 && t.indexOf(nm) >= 0) || (first.length >= 3 && new RegExp('\\b' + first.replace(/[^a-z0-9]/g, '') + '\\b').test(t)) || (a.alias && a.alias.length >= 4 && t.indexOf(a.alias.toLowerCase()) >= 0); });
    if (person) return personAns(person);
    const off = D.officers.find(o => { const nm = String(o.name).toLowerCase(), first = nm.split(/\s+/)[0]; return (nm.length >= 6 && t.indexOf(nm) >= 0) || (first.length >= 4 && new RegExp('\\b' + first.replace(/[^a-z0-9]/g, '') + '\\b').test(t)); });
    if (off) {
      const mine = I.filter(i => i.officerId === off.id), act = mine.filter(i => isActive(i.status));
      return { html: '<b>' + esc(off.name) + '</b> · ' + esc(off.station) + ' (' + esc(off.city) + '), ' + esc(off.specialization) + '<br><b>' + act.length + '</b> active, <b>' + mine.filter(i => isClosed(i.status)).length + '</b> closed, <b>' + D.reports.filter(r => r.officerId === off.id).length + '</b> reports submitted.' + (act.length ? '<br>Active: ' + act.slice(0, 6).map(refLink).join(', ') : ''), actions: [goBtn('Open Officers', 'officers')] };
    }
    if (/(not|no|without|yet to|never)\s+(been\s+)?(assigned|police|officer)|unassigned|waiting for|pending|need(s)? (an )?(officer|assign)|no one (on|assigned)/.test(t)) {
      const p = I.filter(i => i.complaintId && i.status === 'Pending').sort((a, b) => (SEV[a.severity] - SEV[b.severity]));
      if (!p.length) return { html: '🎉 Every registered case has police assigned. Nothing is waiting.' };
      return { html: '<b>' + plural(p.length, 'case has', 'cases have') + ' no police assigned yet:</b>' + topList(p.map(i => refLink(i) + ' · ' + esc(i.category) + ' (' + esc(i.severity) + ')' + (i.area ? ' · ' + esc(i.area) : '') + ' · filed ' + esc(fmt(i.date))), 8), actions: [goBtn('Go to Assign Police', 'assign')] };
    }
    if (/(police|officer).*(assigned|registered|on (the|this) case|handling)|(assigned|registered).*(police|officer)|is (the )?police/.test(t)) {
      const real = I.filter(i => i.complaintId), asg = real.filter(i => i.officerName), pend = real.filter(i => i.status === 'Pending'), aw = real.filter(i => /Awaiting/.test(i.status));
      return { html: 'Police are assigned to <b>' + asg.length + ' of ' + real.length + '</b> registered cases (' + (real.length ? Math.round(100 * asg.length / real.length) : 0) + '%).<br><b>' + pend.length + '</b> ' + (pend.length === 1 ? 'is' : 'are') + ' still waiting for an officer and <b>' + aw.length + '</b> ' + (aw.length === 1 ? 'is' : 'are') + ' assigned but not yet accepted.<br>Tell me a case number (like "case 2") and I will check it.', actions: [goBtn('Go to Assign Police', 'assign')] };
    }
    if (/hotspot|crime.?prone|dangerous|unsafe|worst|most crime|busiest|highest|where.*(crime|most|happen)|which area/.test(t)) {
      const arr = counts(I.filter(i => i.area && i.precise && F.f(i)), i => i.area);
      if (!arr.length) return { html: 'I have no located incidents' + (F.text ? ' for <b>' + esc(F.text) + '</b>' : '') + ' yet.' };
      return { html: '<b>Crime-prone areas' + (F.text ? ' (' + esc(F.text) + ')' : '') + ':</b>' + topList(arr.map(a => '<b>' + esc(a[0]) + '</b> · ' + a[1] + ' incident' + (a[1] > 1 ? 's' : '') + ' (mostly ' + esc(counts(I.filter(i => i.area === a[0] && F.f(i)), i => i.category)[0][0]) + ')'), 5), actions: [goBtn('Open crime map', 'prone')] };
    }
    if (/repeat|habitual|serial|most cases|linked|offender|accused|suspect|criminal/.test(t)) {
      const arr = D.accused.map(a => [a, accCases(a)]).filter(x => x[1].length).sort((a, b) => b[1].length - a[1].length);
      if (!arr.length) return { html: 'No accused or suspects are on file yet.' };
      return { html: '<b>People linked to the most cases:</b>' + topList(arr.map(x => accLink(x[0]) + (x[0].alias ? ' ("' + esc(x[0].alias) + '")' : '') + ' · ' + plural(x[1].length, 'case', 'cases') + ' · ' + esc(x[0].status)), 5), actions: [goBtn('Open accused links', 'links')] };
    }
    if (/report|cause|reason|why|outcome|motive/.test(t)) {
      const rs = D.reports.filter(r => !F.cat || r.category === F.cat);
      if (!rs.length) return { html: 'No investigation reports' + (F.cat ? ' for ' + esc(F.cat) : '') + ' have been submitted yet.' + (I.some(i => i.officerName && !i.hasReport) ? '<br><b>' + I.filter(i => i.officerName && !i.hasReport).length + '</b> assigned cases have no report yet.' : ''), actions: [goBtn('Open reports', 'reports')] };
      const cz = counts(rs, r => r.cause), oc = counts(rs, r => r.outcome), last = rs.slice().sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))).slice(0, 3);
      return { html: '<b>' + plural(rs.length, 'report', 'reports') + '</b> submitted' + (F.cat ? ' for ' + esc(F.cat) : '') + '.<br>Top causes: ' + cz.slice(0, 3).map(c => esc(c[0]) + ' (' + c[1] + ')').join(', ') + '.<br>Outcomes: ' + oc.map(c => esc(c[0]) + ' (' + c[1] + ')').join(', ') + '.<br>Latest:' + topList(last.map(r => '<a href="#" data-ref="' + esc(r.caseRef) + '">' + esc(r.caseRef) + '</a> · ' + esc(r.cause) + ' · ' + esc(r.outcome)), 3), actions: [goBtn('Open police reports', 'reports')] };
    }
    if (/workload|busy|busiest|free|available|who has|which officer|officers/.test(t)) {
      const w = workload(), arr = D.officers.map(o => [o, w[o.id] || 0]).sort((a, b) => b[1] - a[1]);
      if (!arr.length) return { html: 'No officers found.' };
      return { html: '<b>Officer workload (active cases):</b>' + topList(arr.map(x => esc(x[0].name) + ' · ' + esc(x[0].station) + ' · <b>' + x[1] + '</b>'), 8) + 'Lightest load: <b>' + esc(arr[arr.length - 1][0].name) + '</b>.', actions: [goBtn('Open Officers', 'officers')] };
    }
    if (/critical|serious|severe|major/.test(t)) {
      const sv = /critical/.test(t) ? 'Critical' : /major/.test(t) ? 'Major' : 'Critical', arr = I.filter(i => i.severity === sv && F.f(i) && isActive(i.status));
      return { html: '<b>' + plural(arr.length, sv.toLowerCase() + ' open case', sv.toLowerCase() + ' open cases') + '</b>' + (arr.length ? topList(arr.map(i => refLink(i) + ' · ' + esc(i.category) + ' · ' + esc(i.status) + (i.officerName ? ' · ' + esc(i.officerName) : ' · no officer')), 8) : '.') };
    }
    if (/how many|count|total|number of|statistics|stats|percentage/.test(t) || F.any && /cases?|crimes?|incidents?|thefts?|frauds?|assaults?/.test(t)) {
      const arr = I.filter(F.f), op = arr.filter(i => isActive(i.status)).length;
      let more = '';
      if (!F.cat) more += '<br>By type: ' + counts(arr, i => i.category).slice(0, 5).map(c => esc(c[0]) + ' ' + c[1]).join(', ') + '.';
      if (!F.area) more += '<br>Top areas: ' + (counts(arr.filter(i => i.precise), i => i.area).slice(0, 3).map(c => esc(c[0]) + ' ' + c[1]).join(', ') || 'none located') + '.';
      return { html: 'There ' + (arr.length === 1 ? 'is <b>1</b>' : 'are <b>' + arr.length + '</b>') + ' ' + (F.cat ? esc(F.cat) + ' ' : '') + 'incident' + (arr.length === 1 ? '' : 's') + (F.text && !F.cat ? ' ' + esc(F.text) : (F.area || F.days ? ' ' + esc([F.area ? 'in ' + F.area : '', F.days ? (F.days === 1 ? 'today' : 'in the last ' + F.days + ' days') : ''].filter(Boolean).join(' ')) : '')) + '. <b>' + op + '</b> still open, <b>' + (arr.length - op) + '</b> closed.' + more, actions: [goBtn('Open crime map', 'prone')] };
    }
    if (/latest|recent|newest|new cases|just|today/.test(t)) {
      const arr = I.filter(F.f).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
      return { html: '<b>Latest incidents:</b>' + topList(arr.map(i => refLink(i) + ' · ' + esc(i.category) + (i.area ? ' · ' + esc(i.area) : '') + ' · ' + esc(fmt(i.date)) + ' · ' + esc(i.status)), 6) };
    }
    if (/summary|overview|status|brief|snapshot|dashboard|update|how are things/.test(t)) {
      const open = I.filter(i => isActive(i.status)).length, pend = I.filter(i => i.complaintId && i.status === 'Pending').length, top = counts(I.filter(i => i.precise), i => i.area)[0], cat = counts(I, i => i.category)[0];
      return { html: '<b>Snapshot:</b> ' + I.length + ' incidents, <b>' + open + '</b> open, <b>' + pend + '</b> waiting for police, ' + D.reports.length + ' reports, ' + D.accused.length + ' people on file.<br>' + (cat ? 'Most common crime: <b>' + esc(cat[0]) + '</b> (' + cat[1] + '). ' : '') + (top ? 'Busiest area: <b>' + esc(top[0]) + '</b> (' + top[1] + ').' : ''), actions: [goBtn('Open dashboard', 'dash')] };
    }
    return null;
  }

  function say(who, html, actions) {
    const log = $('ask-log'), d = document.createElement('div'); d.className = 'cr-msg ' + who; d.innerHTML = html; log.appendChild(d);
    d.querySelectorAll('a[data-ref]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); caseModal(a.dataset.ref); }));
    d.querySelectorAll('a[data-acc]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); dossier(+a.dataset.acc); }));
    if (actions && actions.length) { const b = document.createElement('div'); b.className = 'cr-acts'; actions.forEach(x => { const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = x.l; bt.addEventListener('click', x.fn); b.appendChild(bt); }); d.appendChild(b); }
    log.scrollTop = log.scrollHeight; return d;
  }
  async function askSend(q) {
    q = String(q || '').trim(); if (!q || chatBusy) return;
    chatBusy = true; say('me', esc(q)); $('ask-in').value = '';
    const typing = say('bot', '<span class="cr-dots"><i></i><i></i><i></i></span>');
    let res = localAnswer(q), src = 'Live data';
    if (!res) {
      const r = await post('/api/admin-ai', { question: q, history: JSON.stringify(chat.slice(-6)) });
      if (r.ok && r.data.engine && r.data.engine !== 'local' && r.data.reply) { res = { html: esc(r.data.reply).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') }; src = 'AI analyst'; }
      else { res = { html: 'I could not work that one out from the built-in analyst. Try asking about <b>cases</b> (e.g. "is police assigned to case 2?"), <b>areas</b>, <b>reports</b>, <b>officers</b> or <b>accused</b>.<br>For free-form questions the admin AI engine must be switched on (GROQ_API_KEY on the server).' }; src = 'Built-in'; }
    }
    typing.remove(); say('bot', res.html + '<div class="cr-src">' + src + '</div>', res.actions);
    chat.push({ r: 'u', t: q }, { r: 'a', t: String(res.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 900) });
    if (chat.length > 20) chat = chat.slice(-20);
    chatBusy = false;
  }
  function renderAsk() {
    const box = $('cr-ask'); if ($('ask-log')) return;
    box.innerHTML = '<div class="cr-head"><div><h2>🤖 Ask Suraksha AI</h2><div class="cr-sub">Ask about crimes, cases, whether police are assigned, reports, areas, accused or officers.</div></div><span class="cr-live"><i></i>Live data</span></div>' +
      '<div class="cr-chat"><div class="cr-log" id="ask-log"></div><div class="cr-chips" id="ask-chips">' + CHIPS.map(c => '<button type="button">' + esc(c) + '</button>').join('') + '</div>' +
      '<form class="cr-askf" id="ask-f" autocomplete="off"><input id="ask-in" maxlength="500" placeholder="Ask anything about the crime data…"><button class="btn primary" id="ask-go">Ask</button></form></div>';
    say('bot', '👋 Hi ' + esc(me.name) + '! I am connected to your live crime data. Try one of the questions below, or ask in your own words, for example <b>"is police registered to case 3?"</b>');
    $('ask-chips').querySelectorAll('button').forEach(b => b.addEventListener('click', () => askSend(b.textContent)));
    $('ask-f').addEventListener('submit', e => { e.preventDefault(); askSend($('ask-in').value); });
  }

  /* ------------------------------------------------------------ 7. police reports */
  const csvCell = c => { let v = String(c == null ? '' : c); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  function download(name, rows) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function renderReports() {
    const box = $('cr-reports');
    if (!$('rp-list')) {
      box.innerHTML = '<div class="cr-head"><div><h2>📑 Police reports</h2><div class="cr-sub">Reports submitted by investigating officers: who did it, why, and how it ended.</div></div><div class="cr-tabs"><input id="rp-q" placeholder="Search case, cause, officer, person" style="min-width:210px"><select id="rp-o"><option value="">Any outcome</option></select><select id="rp-c"><option value="">Any crime</option>' + Object.keys(CT).map(c => '<option>' + c + '</option>').join('') + '</select><button class="btn" id="rp-x">⬇ Export CSV</button></div></div>' +
        '<div class="cr-kpis" id="rp-stats"></div><div class="cr-panel" id="rp-wait"></div><div style="display:grid;gap:10px" id="rp-list"></div>';
      $('rp-q').oninput = $('rp-o').onchange = $('rp-c').onchange = renderReports;
      $('rp-x').onclick = () => download('police-reports.csv', [['Case', 'Crime', 'Area', 'Incident date', 'Cause', 'Outcome', 'Officer', 'People', 'Findings', 'Method']].concat(D.reports.map(r => [r.caseRef, r.category, r.area, fmt(r.date), r.cause, r.outcome, r.officerName,
        r.accusedIds.map(id => (accById(id) || {}).name).filter(Boolean).join('; '), r.summary, r.modus])));
    }
    const q = ($('rp-q').value || '').toLowerCase(), oc = $('rp-o').value, ct = $('rp-c').value;
    const sel = $('rp-o'); const outs = [...new Set(D.reports.map(r => r.outcome))];
    if (sel.options && sel.options.length - 1 !== outs.length) sel.innerHTML = '<option value="">Any outcome</option>' + outs.map(o => '<option' + (o === oc ? ' selected' : '') + '>' + esc(o) + '</option>').join('');
    const nm = r => r.accusedIds.map(id => (accById(id) || {}).name || '').join(' ');
    const list = D.reports.filter(r => (!oc || r.outcome === oc) && (!ct || r.category === ct) && (!q || [r.caseRef, r.cause, r.officerName, r.summary, r.area, nm(r)].join(' ').toLowerCase().indexOf(q) >= 0)).sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
    const solved = D.reports.filter(r => /Arrest|Charge|court/.test(r.outcome)).length, cz = counts(D.reports, r => r.cause)[0];
    $('rp-stats').innerHTML = '<div class="cr-kpi"><b>' + D.reports.length + '</b><span>Reports submitted</span></div><div class="cr-kpi grn"><b>' + solved + '</b><span>Arrest / charge-sheet / court</span></div><div class="cr-kpi blu"><b style="font-size:1.1rem">' + esc(cz ? cz[0] : 'n/a') + '</b><span>Most common cause</span></div>';
    const wait = D.incidents.filter(i => i.officerName && i.status === 'Under Investigation' && !i.hasReport).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    $('rp-wait').innerHTML = '<h3>⏳ Waiting for a report (' + wait.length + ')</h3>' + (wait.length ? '<div class="cr-feed" style="max-height:220px">' + wait.map(i => '<div class="cr-item" data-ref="' + esc(i.caseRef) + '"><span class="cr-dot" style="background:' + col(i.category) + '"></span><div><b>' + esc(i.caseRef) + ' · ' + esc(i.category) + '</b> · ' + esc(i.officerName) + '<small>Open for ' + Math.max(0, Math.round(ago(i.date))) + ' days' + (i.area ? ' · ' + esc(i.area) : '') + '</small></div></div>').join('') + '</div>' : '<div class="meta">Every assigned case has a report. 🎉</div>');
    $('rp-wait').querySelectorAll('.cr-item').forEach(e => e.addEventListener('click', () => caseModal(e.dataset.ref)));
    $('rp-list').innerHTML = list.length ? list.map((r, n) => {
      const ppl = r.accusedIds.map(id => accById(id)).filter(Boolean);
      return '<details class="cr-rep" style="animation-delay:' + Math.min(n, 10) * 50 + 'ms"><summary><b>' + esc(r.caseRef) + '</b><span class="cr-chip" style="color:' + col(r.category) + '">' + esc(r.category) + '</span><span class="cr-chip">' + esc(r.outcome) + '</span><span class="meta">' + esc(r.area || 'location n/a') + ' · ' + esc(fmt(r.date)) + ' · ' + esc(r.officerName) + '</span></summary>' +
        '<div class="bd"><div><b>Cause:</b> ' + esc(r.cause) + '</div><div><b>What was found:</b> ' + esc(r.summary) + '</div>' + (r.modus ? '<div><b>Method:</b> ' + esc(r.modus) + '</div>' : '') + '<div><b>Officer:</b> ' + esc(r.officerName) + ' · submitted ' + esc(fmt(r.submittedAt)) + '</div>' +
        '<div class="cr-people">' + (ppl.length ? ppl.map(a => '<span class="p" data-id="' + a.accusedId + '"><span class="ph">' + avatar(a) + '</span><span><b>' + esc(a.name) + '</b> <small>' + esc(r.roles && r.roles[a.accusedId] || 'Suspect') + '</small></span></span>').join('') : '<span class="meta">No accused or suspect identified yet.</span>') + '</div>' +
        '<div><button class="btn" data-ref="' + esc(r.caseRef) + '">Open case</button></div></div></details>';
    }).join('') : emptyMsg(D.reports.length ? 'No reports match that filter.' : 'No investigation reports yet. They appear here when officers submit them.');
    $('rp-list').querySelectorAll('.p').forEach(e => e.addEventListener('click', () => dossier(+e.dataset.id)));
    $('rp-list').querySelectorAll('button[data-ref]').forEach(e => e.addEventListener('click', () => caseModal(e.dataset.ref)));
  }

  /* ------------------------------------------------------------ 8. officers */
  function renderOfficers() {
    const w = workload(), box = $('cr-officers'), I = D.incidents;
    box.innerHTML = '<div class="cr-head"><div><h2>👥 Officers</h2><div class="cr-sub">Workload and results for each officer. Click a card to see their cases.</div></div></div><div class="cr-tiles" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">' +
      (D.officers.length ? D.officers.map((o, n) => {
        const mine = I.filter(i => i.officerId === o.id), ini = String(o.name).split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
        return '<div class="cr-off" data-id="' + o.id + '" style="animation-delay:' + Math.min(n, 12) * 45 + 'ms"><div class="av">' + esc(ini) + '</div><b>' + esc(o.name) + '</b><small>' + esc(o.station) + ' · ' + esc(o.city) + '</small><small>' + esc(o.specialization) + '</small>' +
          '<div class="m"><div><b>' + (w[o.id] || 0) + '</b><span>Active</span></div><div><b>' + mine.filter(i => isClosed(i.status)).length + '</b><span>Closed</span></div><div><b>' + D.reports.filter(r => r.officerId === o.id).length + '</b><span>Reports</span></div></div></div>';
      }).join('') : emptyMsg('No officers found in officers.json.')) + '</div>';
    box.querySelectorAll('.cr-off').forEach(e => e.addEventListener('click', () => {
      const o = offOf(+e.dataset.id), mine = I.filter(i => i.officerId === o.id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const m = modal('<h2>' + esc(o.name) + '</h2><div class="meta">' + esc(o.station) + ' · ' + esc(o.city) + ' · ' + esc(o.specialization) + '</div><div class="cr-feed" style="margin-top:12px;max-height:420px">' +
        (mine.length ? mine.map(i => '<div class="cr-item" data-ref="' + esc(i.caseRef) + '"><span class="cr-dot" style="background:' + col(i.category) + '"></span><div><b>' + esc(i.caseRef) + ' · ' + esc(i.category) + '</b> <span class="cr-chip">' + esc(i.status) + '</span><small>' + esc(fmt(i.date)) + (i.area ? ' · ' + esc(i.area) : '') + '</small></div></div>').join('') : emptyMsg('No cases for this officer yet.')) + '</div>');
      m.querySelectorAll('.cr-item').forEach(x => x.addEventListener('click', () => caseModal(x.dataset.ref)));
    }));
  }

  /* ------------------------------------------------------------ start */
  function init() {
    if (started) return; started = true;
    $('cnav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.t); });
    $('cr-modal').addEventListener('click', e => { if (e.target === $('cr-modal')) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    api('/api/me').then(r => { if (r.ok && r.data && r.data.name) { me = { name: String(r.data.name).split(/\s+/)[0] }; if (tab === 'home') { typed = false; renderHome(); } } });
    setInterval(() => { const c = $('hc'); if (c) c.textContent = new Date().toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }, 1000);
    refresh(true);
    timer = setInterval(() => refresh(false), 15000);
  }
  window.CR = { init: init, refresh: refresh, show: show, _t: { localAnswer: localAnswer, caseModal: caseModal, dossier: dossier, data: function () { return D; }, name: function () { return me.name; } } };
})();
