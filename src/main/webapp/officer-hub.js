/* Officer hub layer on top of officer.html: sidebar, animated welcome, overview dashboard, live-location map,
   e-FIR / civic / anti-ragging lists and a floating Ask-AI panel scoped to the officer's own queue.
   Needs app.js (api, post, esc) and the page's own show(). Load AFTER the inline script of officer.html. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const hello = () => { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const f = x => String(x == null ? '' : x).replace(/\s+/g, ' ').trim();
  const dt = s => new Date(String(s || '').slice(0, 19));
  const ago = s => { const d = dt(s); if (isNaN(d)) return ''; const m = Math.round((Date.now() - d) / 6e4); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const CITY = { ahmedabad: [23.0225, 72.5714], bangalore: [12.9716, 77.5946], bhubaneswar: [20.2961, 85.8245], chandigarh: [30.7333, 76.7794], chennai: [13.0827, 80.2707], coimbatore: [11.0168, 76.9558], guwahati: [26.1445, 91.7362], hyderabad: [17.385, 78.4867], jaipur: [26.9124, 75.7873], kochi: [9.9312, 76.2673], kolkata: [22.5726, 88.3639], lucknow: [26.8467, 80.9462], ludhiana: [30.901, 75.8573], mumbai: [19.076, 72.8777], mysore: [12.2958, 76.6394], 'new delhi': [28.6139, 77.209], noida: [28.5355, 77.391], pune: [18.5204, 73.8567], surat: [21.1702, 72.8311], thiruvananthapuram: [8.5241, 76.9366], vijayawada: [16.5062, 80.648], visakhapatnam: [17.6868, 83.2185] };

  /* ---------- data ---------- */
  const OH = { me: '', hub: null, cases: [], concerns: [], appts: [], civic: [], rag: [], efirs: [], pos: null, src: '', sig: '', cur: 'cases' };
  const off = () => (OH.hub && OH.hub.officer) || { name: OH.me, city: '' };
  const first = () => (off().name || OH.me || 'Officer').split(/\s+/)[0];
  const ini = n => (n || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  function D() {
    const cs = OH.cases, cn = OH.concerns.filter(c => c.status === 'Reported'), cv = OH.civic.filter(r => !/Resolved|Closed|Completed/i.test(r.status || '')), rg = OH.rag.filter(r => !/Closed|Action taken/i.test(r.status || ''));
    return { aw: cs.filter(c => /Awaiting/.test(c.status || '')), ac: cs.filter(c => c.status === 'Under Investigation'), cn: cn, dg: cn.filter(c => c.danger), cv: cv, cvu: cv.filter(r => r.urgent), rg: rg, rgu: rg.filter(r => r.urgent), ap: OH.appts.filter(a => a.status === 'Pending'), ef: OH.efirs };
  }
  async function pull() {
    const r = await Promise.all([api('/api/complaints'), api('/api/concern'), api('/api/officer-hub'), api('/api/appointments')]);
    if (r[0].ok) OH.cases = r[0].data; if (r[1].ok) OH.concerns = r[1].data; if (r[3].ok) OH.appts = r[3].data;
    if (r[2].ok) { OH.hub = r[2].data; OH.civic = r[2].data.civic || []; OH.rag = r[2].data.ragging || []; OH.efirs = r[2].data.efirs || []; }
    const s = JSON.stringify([OH.cases.map(x => x.id + x.status), OH.concerns.map(x => x.id + x.status), OH.civic.length, OH.rag.length, OH.efirs.length, OH.appts.length]);
    const ch = s !== OH.sig; OH.sig = s; return ch;
  }

  /* ---------- sidebar + panes ---------- */
  document.body.classList.add('hub');
  const nav = $('nav'), main = document.querySelector('main'), by = {};
  nav.querySelectorAll('button').forEach(b => by[b.dataset.t] = b);
  const mk = (t, label) => { const b = document.createElement('button'); b.dataset.t = t; b.textContent = label; by[t] = b; };
  mk('home', '\uD83C\uDFE0 Overview'); mk('map', '\uD83D\uDCCD My Location'); mk('ai', '\uD83E\uDD16 Ask AI'); mk('efir', '\uD83D\uDCC4 e-FIRs'); mk('civic', '\uD83C\uDFD9\uFE0F Civic Issues'); mk('rag', '\uD83C\uDF93 Anti-Ragging');
  [['cases', '\uD83D\uDCCB '], ['appt', '\uD83D\uDCC5 '], ['concerns', '\uD83D\uDEA8 '], ['chat', '\uD83D\uDCAC ']].forEach(x => by[x[0]].insertBefore(document.createTextNode(x[1]), by[x[0]].firstChild));
  nav.innerHTML = '';
  [['Dashboard', ['home', 'map', 'ai']], ['Cases', ['cases', 'efir', 'appt']], ['Reports', ['concerns', 'civic', 'rag']], ['Connect', ['chat']]].forEach(g => {
    const c = document.createElement('div'); c.className = 'hub-cap'; c.textContent = g[0]; nav.appendChild(c); g[1].forEach(t => nav.appendChild(by[t]));
  });
  ['home', 'map', 'efir', 'civic', 'rag'].forEach(t => { const s = document.createElement('section'); s.className = 'tabpane'; s.id = 't-' + t; s.innerHTML = '<div id="oh-' + t + '" style="display:grid;gap:16px"></div>'; main.appendChild(s); });
  const hd = document.querySelector('header'), setHH = () => document.documentElement.style.setProperty('--hh', hd.offsetHeight + 'px');
  setHH(); addEventListener('resize', setHH);
  const mb = document.createElement('button'); mb.id = 'hubMenu'; mb.type = 'button'; mb.setAttribute('aria-label', 'Menu'); mb.textContent = '\u2630'; hd.insertBefore(mb, hd.firstChild);
  mb.addEventListener('click', () => document.body.classList.toggle('navopen'));
  const prevShow = window.show;
  window.show = function (t) {
    document.body.classList.remove('navopen');
    if (t === 'ai') { openDock(); return; }
    prevShow(t); OH.cur = t; renderTab(t);
  };
  function renderTab(t) { ({ home: renderHome, map: renderMap, efir: renderEfir, civic: renderCivic, rag: renderRag }[t] || (() => {}))(); }
  document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g && !g.closest('#nav')) window.show(g.dataset.go); });

  /* ---------- overview ---------- */
  const kpi = (ic, l, n, sub, go, hot) => '<div class="bi-kpi' + (hot ? ' hot' : '') + '" data-go="' + go + '"><span>' + ic + ' ' + l + '</span><b data-n="' + n + '">0</b><small>' + sub + '</small></div>';
  const countUp = (el, to) => { const t0 = performance.now(); (function s(t) { const p = reduce ? 1 : Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(t0); };
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function months(cat) {
    const now = new Date(), out = [];
    for (let k = 11; k >= 0; k--) { const d = new Date(now.getFullYear(), now.getMonth() - k, 1); out.push({ y: d.getFullYear(), m: d.getMonth(), n: 0 }); }
    OH.cases.forEach(c => { if (cat && c.category !== cat) return; const d = dt(c.dateFiled); if (isNaN(d)) return; const o = out.find(x => x.y === d.getFullYear() && x.m === d.getMonth()); if (o) o.n++; });
    const mx = Math.max(1, ...out.map(o => o.n));
    return '<div class="oh-months">' + out.map(o => '<div title="' + o.n + ' case(s)"><b style="color:#fff;font-size:.7rem">' + (o.n || '') + '</b><i style="--h:' + (o.n * 100 / mx) + '%"></i>' + MN[o.m] + '</div>').join('') + '</div>';
  }
  function rank() {
    const m = {}, add = (k, s) => { if (k) { const key = k + '|' + s; m[key] = (m[key] || 0) + 1; } };
    OH.cases.forEach(c => add(c.category, 'case')); OH.concerns.forEach(c => add(c.type, 'concern')); OH.civic.forEach(r => add(r.group || r.issue, 'civic')); OH.rag.forEach(r => add(r.type, 'ragging'));
    const rows = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 7), mx = Math.max(1, ...rows.map(r => r[1]));
    return rows.length ? '<div class="oh-rank">' + rows.map(r => { const k = r[0].split('|'), p = Math.round(r[1] * 100 / mx), col = p >= 85 ? '#E5534B' : p >= 60 ? '#F4A300' : p >= 40 ? '#e9d36a' : '#3DBE7A'; return '<div class="bi-row"><span>' + esc(k[0]) + '<small>' + k[1] + '</small></span><div class="bi-bar"><i style="--w:' + p + '%;background:' + col + '"></i></div><b>' + r[1] + '</b></div>'; }).join('') + '</div>' : '<div class="empty">Nothing reported yet.</div>';
  }
  function hours() {
    const S = [['3:00-10:00', '#f4a261'], ['10:00-12:00', '#e9c46a'], ['12:00-14:00', '#f2e27a'], ['14:00-18:00', '#9bb0ff'], ['18:00-20:00', '#8b5cf6'], ['20:00-3:00', '#5a4fe0']];
    const slot = h => h >= 20 || h < 3 ? 5 : h >= 18 ? 4 : h >= 14 ? 3 : h >= 12 ? 2 : h >= 10 ? 1 : 0, m = S.map(() => ({}));
    const put = (h, l) => { if (!isNaN(h) && l) { const o = m[slot(h)]; o[l] = (o[l] || 0) + 1; } };
    OH.cases.forEach(c => { const t = /^(\d{1,2}):/.exec((c.details && c.details.incidentTime) || ''); put(t ? +t[1] : dt(c.dateFiled).getHours(), c.category); });
    OH.concerns.forEach(c => put(dt(c.occurredAt || c.createdAt).getHours(), c.type));
    const tot = m.map(o => Object.values(o).reduce((a, b) => a + b, 0)), mx = Math.max(1, ...tot);
    return '<div class="oh-bubbles">' + S.map((s, k) => { const top = Object.entries(m[k]).sort((a, b) => b[1] - a[1]).slice(0, 3), z = 44 + tot[k] * 38 / mx; return '<div style="animation-delay:' + k * 80 + 'ms"><div class="t">' + s[0] + '</div><div class="oh-bub" style="width:' + z + 'px;height:' + z + 'px;background:radial-gradient(circle at 35% 30%,#fff,' + s[1] + ')">' + (tot[k] || '\u2014') + '</div><ul>' + (top.map(x => '<li>' + esc(x[0]) + '</li>').join('') || '<li style="color:var(--muted)">No data</li>') + '</ul></div>'; }).join('') + '</div>';
  }
  function alerts() {
    const d = D(), a = [];
    d.dg.forEach(c => a.push({ p: 100, l: 'red', i: '\uD83D\uDEA8', t: 'Danger: ' + esc(c.type) + ' reported', s: esc(c.location || '') + ' \u00B7 ' + ago(c.createdAt), go: 'concerns' }));
    d.aw.filter(c => c.severity === 'Critical').forEach(c => a.push({ p: 90, l: 'red', i: '\u26A0\uFE0F', t: 'Critical case #' + c.id + ' awaiting your response', s: esc(c.category) + ' \u00B7 ' + ago(c.dateFiled), go: 'cases' }));
    d.rgu.forEach(r => a.push({ p: 80, l: 'red', i: '\uD83C\uDF93', t: 'Urgent ragging report ' + esc(r.code), s: esc(r.college || '') + ' \u00B7 ' + ago(r.filedAt), go: 'rag' }));
    d.cvu.forEach(r => a.push({ p: 70, l: 'amb', i: '\uD83C\uDFD9\uFE0F', t: 'Urgent civic issue: ' + esc(r.issue || r.group), s: esc(r.location || '') + ' \u00B7 ' + ago(r.filedAt), go: 'civic' }));
    d.aw.filter(c => c.severity !== 'Critical').forEach(c => a.push({ p: 60, l: 'amb', i: '\uD83D\uDCCB', t: 'New case #' + c.id + ' awaiting response', s: esc(c.category) + ' \u00B7 ' + ago(c.dateFiled), go: 'cases' }));
    d.cn.filter(c => !c.danger).forEach(c => a.push({ p: 50, l: '', i: '\uD83D\uDCE3', t: 'Concern: ' + esc(c.type), s: esc(c.location || '') + ' \u00B7 ' + ago(c.createdAt), go: 'concerns' }));
    d.ap.forEach(x => a.push({ p: 40, l: '', i: '\uD83D\uDCC5', t: 'Appointment request from ' + esc(x.userName), s: esc(x.date) + ' ' + esc(x.time), go: 'appt' }));
    return a.sort((x, y) => y.p - x.p);
  }
  const locChip = () => OH.src === 'gps' ? '<span class="oh-chip live">\uD83D\uDCCD Live location on</span>' : '<span class="oh-chip">\uD83D\uDCCD Station city only</span>';
  function renderHome() {
    const o = off(), d = D(), cats = Array.from(new Set(OH.cases.map(c => c.category).filter(Boolean))), al = alerts();
    $('oh-home').innerHTML = '<div class="oh-hero"><div class="av">' + esc(ini(o.name)) + '</div><div><h1>' + hello() + ', ' + esc(first()) + '!</h1><p>' + esc([o.badge, o.station, o.city, o.specialization && o.specialization + ' desk'].filter(Boolean).join(' \u00B7 ')) + '</p></div><span id="oh-chipbox" style="margin-left:auto">' + locChip() + '</span></div>' +
      '<div class="bi-kpis">' + kpi('\uD83D\uDCCB', 'Pending cases', d.aw.length + d.ac.length, d.aw.length + ' awaiting your response', 'cases', d.aw.length) + kpi('\uD83D\uDCC4', 'e-FIRs', d.ef.length, 'on your cases', 'efir') + kpi('\uD83D\uDEA8', 'Concerns', d.cn.length, d.dg.length + ' flagged danger', 'concerns', d.dg.length) +
      kpi('\uD83C\uDFD9\uFE0F', 'Civic issues', d.cv.length, d.cvu.length + ' urgent', 'civic') + kpi('\uD83C\uDF93', 'Anti-ragging', d.rg.length, d.rgu.length + ' urgent', 'rag', d.rgu.length) + kpi('\uD83D\uDCC5', 'Appointments', d.ap.length, 'waiting for reply', 'appt') + '</div>' +
      '<div class="bi-grid"><div class="bi-card s7"><h3>Case trends <select class="oh-sel" id="oh-cat"><option value="">All types</option>' + cats.map(c => '<option>' + esc(c) + '</option>').join('') + '</select></h3><div id="oh-trend">' + months('') + '</div></div>' +
      '<div class="bi-card s5"><h3>What is being reported <small>' + esc(o.city || 'your area') + '</small></h3>' + rank() + '</div>' +
      '<div class="bi-card s7"><h3>Busiest hours in your area <small>from reported times</small></h3>' + hours() + '</div>' +
      '<div class="bi-card s5"><h3>Priority alerts</h3><div class="oh-alerts">' + (al.slice(0, 7).map((a, n) => '<div class="oh-alert ' + a.l + '" style="animation-delay:' + n * 70 + 'ms"><span class="i">' + a.i + '</span><span class="t">' + a.t + '<small>' + a.s + '</small></span><button class="btn" data-go="' + a.go + '">Open</button></div>').join('') || '<div class="empty">All clear for now.</div>') + '</div></div></div>';
    $('oh-home').querySelectorAll('.bi-kpi b[data-n]').forEach(b => countUp(b, +b.dataset.n));
    $('oh-cat').addEventListener('change', e => { $('oh-trend').innerHTML = months(e.target.value); });
  }

  /* ---------- my location map ---------- */
  let leafP = null, map = null, layer = null, watch = null, fitted = false, marks = [];
  function loadLeaflet() {
    if (window.L) return Promise.resolve(); if (leafP) return leafP;
    leafP = new Promise((res, rej) => {
      const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'; document.head.appendChild(c);
      const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = res; s.onerror = () => { leafP = null; rej(new Error('map')); }; document.head.appendChild(s);
    }); return leafP;
  }
  const hav = (a1, o1, a2, o2) => { const r = x => x * Math.PI / 180, dl = r(a2 - a1), dn = r(o2 - o1), x = Math.sin(dl / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  function startLocation(again) {
    if (watch !== null && !again) return;
    const city = () => { if (!OH.pos) { const c = CITY[(off().city || '').toLowerCase()]; if (c) { OH.pos = [c[0], c[1], 0]; OH.src = 'city'; } } onPos(); };
    if (!navigator.geolocation) { city(); return; }
    watch = navigator.geolocation.watchPosition(p => { OH.pos = [p.coords.latitude, p.coords.longitude, p.coords.accuracy]; OH.src = 'gps'; onPos(); }, city, { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 });
  }
  function onPos() { const c = $('oh-chipbox'); if (c) c.innerHTML = locChip(); if (map) drawMap(); }
  async function renderMap() {
    const box = $('oh-map');
    if (!$('oh-mapbox')) {
      box.innerHTML = '<div class="bi-top"><div><h2>\uD83D\uDCCD My Location</h2><div class="bi-sub" id="oh-mapsub"></div></div><button class="btn" id="oh-loc" type="button">Locate me</button></div><div class="oh-map"><div id="oh-mapbox"></div><div class="oh-near" id="oh-near"></div></div>';
      $('oh-loc').addEventListener('click', () => { if (watch !== null && navigator.geolocation) navigator.geolocation.clearWatch(watch); watch = null; fitted = false; startLocation(true); });
    }
    startLocation();
    try { await loadLeaflet(); } catch (e) { $('oh-mapbox').innerHTML = '<div class="empty" style="padding:20px">The map could not load. Check your internet connection.</div>'; return; }
    if (!map) { map = L.map('oh-mapbox').setView(OH.pos ? [OH.pos[0], OH.pos[1]] : [22.5, 79], OH.pos ? 13 : 5); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map); layer = L.layerGroup().addTo(map); }
    setTimeout(() => map.invalidateSize(), 60); drawMap();
  }
  function drawMap() {
    if (!map || !$('oh-mapbox')) return; layer.clearLayers(); marks = [];
    const pin = c => L.divIcon({ className: '', html: '<div class="oh-pin" style="background:' + c + ';color:' + c + '"></div>', iconSize: [16, 16] });
    const items = []; let none = 0;
    OH.concerns.forEach(c => { if (c.lat == null || c.lng == null) { none++; return; } items.push({ lat: +c.lat, lng: +c.lng, col: c.danger ? '#E5534B' : '#F4A300', t: '\uD83D\uDEA8 ' + c.type + (c.danger ? ' (danger)' : ''), s: c.location, st: c.status, go: 'concerns' }); });
    OH.civic.forEach(r => { if (r.lat == null || r.lng == null) { none++; return; } items.push({ lat: +r.lat, lng: +r.lng, col: r.urgent ? '#E5534B' : '#3A86FF', t: '\uD83C\uDFD9\uFE0F ' + (r.issue || r.group), s: r.location, st: r.status, go: 'civic' }); });
    if (OH.pos) {
      L.marker([OH.pos[0], OH.pos[1]], { icon: L.divIcon({ className: '', html: '<div class="oh-me"></div>', iconSize: [20, 20] }) }).bindPopup('You are here').addTo(layer);
      if (OH.src === 'gps' && OH.pos[2] > 0) L.circle([OH.pos[0], OH.pos[1]], { radius: OH.pos[2], color: '#35e0c2', weight: 1, fillOpacity: .08 }).addTo(layer);
      items.forEach(i => { i.km = hav(OH.pos[0], OH.pos[1], i.lat, i.lng); }); items.sort((a, b) => a.km - b.km);
    }
    items.forEach((i, k) => { const m = L.marker([i.lat, i.lng], { icon: pin(i.col) }).bindPopup('<b>' + esc(i.t) + '</b><br>' + esc(i.s || '') + '<br>' + esc(i.st || '') + (i.km != null ? '<br>' + i.km.toFixed(1) + ' km from you' : '')).addTo(layer); marks[k] = m; });
    $('oh-mapsub').textContent = (OH.src === 'gps' ? 'Live GPS position. It stays in your browser.' : 'Showing your station city. Allow location access for your live position.') + (none ? ' ' + plural(none, 'report has', 'reports have') + ' no map position.' : '');
    $('oh-near').innerHTML = items.length ? items.map((i, k) => '<button type="button" data-k="' + k + '"><b>' + esc(i.t) + '</b><small>' + esc(i.s || '') + (i.km != null ? ' \u00B7 ' + i.km.toFixed(1) + ' km' : '') + '</small></button>').join('') : '<div class="empty">No reports with a map position in your area yet.</div>';
    $('oh-near').onclick = e => { const b = e.target.closest('button[data-k]'); if (b) { const i = items[+b.dataset.k]; map.setView([i.lat, i.lng], 16); marks[+b.dataset.k].openPopup(); } };
    if (!fitted && OH.pos) { fitted = true; const pts = [[OH.pos[0], OH.pos[1]]].concat(items.slice(0, 5).map(i => [i.lat, i.lng])); if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 }); else map.setView(pts[0], 14); }
  }

  /* ---------- e-FIR, civic and anti-ragging lists ---------- */
  const sevTag = s => '<span class="tag ' + esc(s) + '">' + esc(s) + '</span>';
  function renderEfir() {
    $('oh-efir').innerHTML = '<div><h2>\uD83D\uDCC4 e-FIRs on your cases</h2><p class="hint">Detailed complaints filed as e-FIR for cases assigned to you.</p></div><div class="oh-list">' + (OH.efirs.length ? OH.efirs.slice().reverse().map(e =>
      '<div class="card"><div class="top"><b>' + esc(e.firNumber) + '</b>' + (e.severity ? sevTag(e.severity) : '') + '<span class="tag s-pending">' + esc(e.category) + '</span></div><div class="meta">Case #' + esc(e.complaintId) + ' \u00B7 ' + esc(((e.incidentDate || '') + ' ' + (e.incidentTime || '')).trim()) + ' \u00B7 ' + esc(e.place || '') + '</div><p>' + esc(e.description) + '</p>' +
      (e.accused ? '<div class="meta">Accused: ' + esc(e.accused) + '</div>' : '') + (e.witnesses ? '<div class="meta">Witnesses: ' + esc(e.witnesses) + '</div>' : '') + '<div class="actions"><button class="btn" data-go="cases">Open my cases</button></div></div>').join('') : '<div class="empty">No e-FIRs on your cases yet.</div>') + '</div>';
  }
  function renderCivic() {
    $('oh-civic').innerHTML = '<div><h2>\uD83C\uDFD9\uFE0F Civic issues in ' + esc(off().city || 'your city') + '</h2><p class="hint">Municipal problems reported by citizens (garbage, roads, streetlights, water). The responsible authority is shown on each report.</p></div><div class="oh-list">' + (OH.civic.length ? OH.civic.slice().reverse().map(r =>
      '<div class="card"><div class="top"><b>' + esc(r.reference) + '</b>' + (r.urgent ? '<span class="tag Critical">Urgent</span>' : '') + '<span class="tag s-awaiting">' + esc(r.status) + '</span></div><div class="meta">' + esc(r.group || '') + ' \u00B7 ' + esc(r.issue || '') + ' \u00B7 ' + esc(r.location || '') + ' \u00B7 ' + esc(ago(r.filedAt)) + '</div><p>' + esc(r.description) + '</p><div class="meta">Authority: ' + esc(r.authority || '') + '</div>' +
      (r.lat != null ? '<div class="actions"><button class="btn" data-go="map">See on map</button></div>' : '') + '</div>').join('') : '<div class="empty">No civic reports in your city.</div>') + '</div>';
  }
  function renderRag() {
    $('oh-rag').innerHTML = '<div><h2>\uD83C\uDF93 Anti-ragging reports in ' + esc(off().city || 'your city') + '</h2><p class="hint">Read-only for police. Status updates are handled by the admin and the college Anti-Ragging Committee. Contact details are not shown.</p></div><div class="oh-list">' + (OH.rag.length ? OH.rag.slice().reverse().map(r =>
      '<div class="card"><div class="top"><b>' + esc(r.code) + '</b>' + (r.urgent ? '<span class="tag Critical">Urgent</span>' : '') + '<span class="tag s-pending">' + (r.anonymous ? 'Anonymous' : 'Named') + '</span><span class="tag s-awaiting">' + esc(r.status) + '</span></div><div class="meta">' + esc(r.type || '') + ' \u00B7 ' + esc(r.college || '') + ' \u00B7 ' + esc(ago(r.filedAt)) + '</div><p>' + esc(r.description) + '</p>' + (r.happenedAt ? '<div class="meta">Where/when: ' + esc(r.happenedAt) + '</div>' : '') + '</div>').join('') : '<div class="empty">No anti-ragging reports from your city.</div>') + '</div>';
  }

  /* ---------- Ask-AI dock ---------- */
  const dock = document.createElement('aside'); dock.className = 'hub-dock off'; dock.setAttribute('aria-label', 'Ask AI');
  dock.innerHTML = '<div class="hd-head"><span class="orb"></span><b>Ask AI</b><span class="sp"></span><button type="button" id="hd-min" aria-label="Minimise">\u2014</button><button type="button" id="hd-x" aria-label="Close">\u2715</button></div><div class="hd-log" id="hd-log" aria-live="polite"></div><div class="hd-chips" id="hd-chips"></div>' +
    '<form class="hd-form" id="hd-f" autocomplete="off"><input id="hd-in" maxlength="500" placeholder="Ask about your cases, alerts, area\u2026"><button class="btn primary" type="submit">Ask</button></form>';
  const fab = document.createElement('button'); fab.className = 'hub-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Open Ask AI'); fab.innerHTML = '\uD83E\uDD16<span class="ping"></span>'; fab.style.display = 'none';
  document.body.appendChild(dock); document.body.appendChild(fab);
  const log = $('hd-log'), inp = $('hd-in'); let dh = [], busy = false;
  function openDock() { dock.classList.remove('off', 'min'); fab.style.display = 'none'; setTimeout(() => inp.focus(), 350); }
  const closeDock = () => { dock.classList.add('off'); fab.style.display = ''; };
  fab.addEventListener('click', openDock); $('hd-x').addEventListener('click', closeDock); $('hd-min').addEventListener('click', () => dock.classList.toggle('min'));
  function say(who, html, actions) {
    const d = document.createElement('div'); d.className = 'hd-m ' + who; d.innerHTML = html + (who === 'bot' ? '<div class="hd-gen">AI GENERATED</div>' : '');
    if (actions && actions.length) { const b = document.createElement('div'); b.className = 'hd-acts'; actions.forEach(x => { const t = document.createElement('button'); t.className = 'btn'; t.textContent = x.l; t.addEventListener('click', x.fn); b.appendChild(t); }); d.appendChild(b); }
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  const li = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  const cl = c => '#' + c.id + ' ' + esc(c.category) + ' (' + esc(c.severity) + ', ' + esc(c.status) + ')';
  function localAnswer(q) {
    const t = q.toLowerCase(), d = D(), go = (l, g) => ({ l: l, fn: () => window.show(g) }), o = off();
    if (/^(hi|hello|hey)\b/.test(t)) return { html: 'Hello ' + esc(first()) + '! Ask me about your pending cases, danger alerts, civic issues, ragging reports, e-FIRs or appointments.' };
    const cm = t.match(/(?:case|#)\s*#?(\d+)/);
    if (cm) { const c = OH.cases.find(x => x.id === +cm[1]); return { html: c ? 'Case ' + cl(c) + '. Filed ' + esc(ago(c.dateFiled)) + (c.details && c.details.location ? ' at ' + esc(c.details.location) : '') + '.' : 'Case #' + cm[1] + ' is not assigned to you.', actions: [go('Open my cases', 'cases')] }; }
    if (/(first|priority|prioriti|urgent|important|today|plan)/.test(t)) { const a = alerts().slice(0, 5); return { html: a.length ? 'Here is what needs you first:' + li(a.map(x => x.i + ' ' + x.t + ' <small>(' + x.s + ')</small>')) : 'Nothing urgent right now. Good work.', actions: [go('Open overview', 'home')] }; }
    if (/(danger|concern|alert|incident)/.test(t)) return { html: d.cn.length ? plural(d.cn.length, 'new concern', 'new concerns') + ' in your city, ' + d.dg.length + ' flagged danger:' + li(d.cn.slice(0, 5).map(c => (c.danger ? '\uD83D\uDEA8 ' : '') + esc(c.type) + ' at ' + esc(c.location || 'unknown') + ' <small>(' + ago(c.createdAt) + ')</small>')) : 'No new concerns in your city.', actions: [go('Open concerns', 'concerns'), go('See on map', 'map')] };
    if (/(civic|municipal|garbage|pothole|drain|streetlight|water)/.test(t)) return { html: d.cv.length ? plural(d.cv.length, 'open civic issue', 'open civic issues') + ', ' + d.cvu.length + ' urgent:' + li(d.cv.slice(0, 5).map(r => esc(r.issue || r.group) + ' at ' + esc(r.location || 'unknown') + ' \u2192 ' + esc(r.authority || ''))) : 'No open civic issues in your city.', actions: [go('Open civic issues', 'civic')] };
    if (/(\brag|ragging|college|campus)/.test(t)) return { html: d.rg.length ? plural(d.rg.length, 'open anti-ragging report', 'open anti-ragging reports') + ', ' + d.rgu.length + ' urgent:' + li(d.rg.slice(0, 5).map(r => esc(r.code) + ' \u00B7 ' + esc(r.type) + ' \u00B7 ' + esc(r.college))) : 'No open anti-ragging reports in your city.', actions: [go('Open anti-ragging', 'rag')] };
    if (/e-?fir|\bfir\b/.test(t)) return { html: d.ef.length ? plural(d.ef.length, 'e-FIR', 'e-FIRs') + ' on your cases:' + li(d.ef.slice(0, 5).map(e => esc(e.firNumber) + ' \u00B7 ' + esc(e.category) + ' \u00B7 case #' + esc(e.complaintId))) : 'No e-FIRs on your cases yet.', actions: [go('Open e-FIRs', 'efir')] };
    if (/appointment|meeting/.test(t)) return { html: d.ap.length ? plural(d.ap.length, 'appointment request is', 'appointment requests are') + ' waiting for your reply.' : 'No appointment requests are waiting.', actions: [go('Open appointments', 'appt')] };
    if (/(pending|my cases|assigned|queue|awaiting)/.test(t)) return { html: d.aw.length + d.ac.length ? d.aw.length + ' awaiting your response, ' + d.ac.length + ' under investigation:' + li(d.aw.concat(d.ac).slice(0, 6).map(cl)) : 'You have no pending cases.', actions: [go('Open my cases', 'cases')] };
    if (/(nearest|near me|where am i|location)/.test(t)) { const p = OH.pos; if (!p) return { html: 'I do not have your location yet. Open My Location and allow access.', actions: [go('Open map', 'map')] }; const all = OH.concerns.concat(OH.civic).filter(x => x.lat != null).map(x => ({ x: x, km: hav(p[0], p[1], +x.lat, +x.lng) })).sort((a, b) => a.km - b.km).slice(0, 3); return { html: all.length ? 'Nearest reports to you:' + li(all.map(a => esc(a.x.type || a.x.issue || a.x.group) + ' at ' + esc(a.x.location || '') + ' \u00B7 ' + a.km.toFixed(1) + ' km')) : 'No reports with a map position yet.', actions: [go('Open map', 'map')] }; }
    if (/(who am i|my station|badge|profile)/.test(t)) return { html: esc(o.name) + ', badge ' + esc(o.badge) + ', ' + esc(o.station) + ', ' + esc(o.city) + ', ' + esc(o.specialization) + ' desk.' };
    return null;
  }
  function ctx() {
    const o = off(), d = D(), L = [];
    L.push('Officer: ' + f(o.name) + ', badge ' + f(o.badge) + ', ' + f(o.station) + ', ' + f(o.city) + ', ' + f(o.specialization) + ' desk.');
    L.push('Counts: awaiting response ' + d.aw.length + '; under investigation ' + d.ac.length + '; e-FIRs ' + d.ef.length + '; new concerns ' + d.cn.length + ' (danger ' + d.dg.length + '); open civic ' + d.cv.length + '; open ragging ' + d.rg.length + '; pending appointments ' + d.ap.length + '.');
    L.push('CASES id|ref|category|severity|status|filed:'); OH.cases.slice(0, 40).forEach(c => L.push([c.id, c.referenceNo, c.category, c.severity, c.status, String(c.dateFiled || '').slice(0, 10)].map(f).join('|')));
    L.push('CONCERNS ref|type|priority|danger|status|when|place:'); OH.concerns.slice(0, 25).forEach(c => L.push([c.reference, c.type, c.priority, c.danger ? 'DANGER' : '', c.status, String(c.createdAt || '').slice(0, 16), String(c.location || '').slice(0, 50)].map(f).join('|')));
    L.push('CIVIC ref|group|issue|urgent|status|filed:'); OH.civic.slice(0, 25).forEach(r => L.push([r.reference, r.group, r.issue, r.urgent ? 'URGENT' : '', r.status, String(r.filedAt || '').slice(0, 10)].map(f).join('|')));
    L.push('RAGGING code|type|college|urgent|status|filed:'); OH.rag.slice(0, 25).forEach(r => L.push([r.code, r.type, r.college, r.urgent ? 'URGENT' : '', r.status, String(r.filedAt || '').slice(0, 10)].map(f).join('|')));
    L.push('EFIRS fir|case|category|severity|date:'); OH.efirs.slice(0, 25).forEach(e => L.push([e.firNumber, e.complaintId, e.category, e.severity, e.incidentDate].map(f).join('|')));
    return L.join('\n');
  }
  async function ask(q) {
    q = String(q || '').trim(); if (!q || busy) return; busy = true; say('me', esc(q)); inp.value = ''; openDock();
    const typing = say('bot', '<span class="cr-dots"><i></i><i></i><i></i></span>'); let res = localAnswer(q);
    if (!res) {
      const r = await post('/api/officer-ai', { question: q, context: ctx(), history: JSON.stringify(dh.slice(-6)) });
      res = r.ok && r.data.engine && r.data.engine !== 'local' && r.data.reply ? { html: esc(r.data.reply).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') } : { html: 'I can answer from your queue: try <b>pending cases</b>, <b>danger alerts</b>, <b>civic issues</b>, <b>ragging</b>, <b>e-FIRs</b>, <b>appointments</b> or <b>nearest report</b>. For free-form questions, ask the administrator to switch on the AI engine.' };
    }
    typing.remove(); say('bot', res.html, res.actions);
    dh.push({ r: 'u', t: q }, { r: 'a', t: String(res.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 900) }); if (dh.length > 20) dh = dh.slice(-20); busy = false;
  }
  $('hd-f').addEventListener('submit', e => { e.preventDefault(); ask(inp.value); });
  ['What should I do first?', 'Show my pending cases', 'Any danger alerts?', 'Civic issues in my city'].forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', () => ask(c)); $('hd-chips').appendChild(b); });
  function warmMessage() {
    const d = D(), n = esc(first()), l = [d.aw.length ? '<li><b>' + plural(d.aw.length, 'case is', 'cases are') + '</b> awaiting your response</li>' : '', d.dg.length ? '<li><b>' + plural(d.dg.length, 'danger alert', 'danger alerts') + '</b> in your city</li>' : '', d.rgu.length + d.cvu.length ? '<li><b>' + plural(d.rgu.length + d.cvu.length, 'urgent report', 'urgent reports') + '</b> (civic or ragging)</li>' : '', d.ap.length ? '<li><b>' + plural(d.ap.length, 'appointment request', 'appointment requests') + '</b> to answer</li>' : ''].join('');
    return '\uD83D\uDC4B ' + hello() + ', <b>' + n + '</b>! I\u2019m Suraksha AI, your duty assistant.' + (l ? ' Right now:<ul>' + l + '</ul>' : ' All clear for now. Stay safe out there.') + 'Ask me anything about your queue, or tap a suggestion.';
  }

  /* ---------- animated welcome ---------- */
  function finishWelcome(w) {
    w.classList.add('out'); document.body.classList.remove('hub-pre'); document.body.classList.add('hub-in'); setTimeout(() => w.remove(), 900);
    window.show('home'); startLocation();
    setTimeout(() => { say('bot', warmMessage()); openDock(); }, reduce ? 0 : 700);
  }
  function welcome() {
    if (ss.get('ss_officer_welcomed')) { window.show('home'); startLocation(); say('bot', warmMessage()); fab.style.display = ''; return; }
    ss.set('ss_officer_welcomed', '1'); document.body.classList.add('hub-pre');
    const d = D(), o = off(), urgent = d.dg.length + d.rgu.length + d.cvu.length;
    const w = document.createElement('div'); w.className = 'hub-welcome';
    w.innerHTML = '<div class="hw-rings"><i></i><i></i><i></i></div><div class="hw-in"><div class="hw-shield">\uD83D\uDC6E</div><div class="hw-hi">' + esc(((o.station || 'SURAKSHASETU') + ' \u00B7 ' + (o.badge || 'OFFICER')).toUpperCase()) + '</div><h1>' + hello() + ', ' + esc(first()) + '!</h1>' +
      '<p class="hw-sub">' + (d.aw.length ? plural(d.aw.length, 'case is', 'cases are') + ' waiting for you. Thank you for keeping people safe.' : 'Welcome back. Thank you for keeping people safe today.') + '</p>' +
      '<div class="hw-stats"><div><b data-n="' + (d.aw.length + d.ac.length) + '">0</b><span>Pending cases</span></div><div><b data-n="' + urgent + '">0</b><span>Urgent alerts</span></div><div><b data-n="' + d.ap.length + '">0</b><span>Appointments</span></div></div><button class="btn primary hw-go" type="button">Start my shift \u2192</button></div>';
    document.body.appendChild(w); w.querySelectorAll('b[data-n]').forEach(b => countUp(b, +b.dataset.n));
    let done = false; const go = () => { if (!done) { done = true; finishWelcome(w); } };
    w.querySelector('.hw-go').addEventListener('click', go); w.addEventListener('click', e => { if (e.target === w) go(); }); setTimeout(go, 5200);
  }

  /* ---------- start ---------- */
  api('/api/me').then(async r => {
    if (!r.ok) return; OH.me = String(r.data.name || '');
    await pull(); welcome();
    setInterval(async () => { if (await pull() && /^(home|map|efir|civic|rag)$/.test(OH.cur)) renderTab(OH.cur); }, 20000);
  });
})();
