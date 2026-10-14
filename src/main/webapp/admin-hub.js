/* Admin hub layer on top of admin-crime.js: sidebar, animated welcome, floating Ask-AI dock, BI Studio.
   Needs app.js (api, post, esc) and window.CR._t (localAnswer, caseModal, dossier, data, name). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), T = () => window.CR._t;
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const hello = () => { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  /* ---------- sidebar: group the existing tabs like a dashboard menu ---------- */
  document.body.classList.add('hub');
  const nav = $('cnav'), by = {};
  nav.querySelectorAll('button').forEach(b => by[b.dataset.t] = b);
  nav.innerHTML = '';
  [['Dashboard', ['home', 'dash', 'bi', 'ask']], ['Operations', ['assign', 'reports', 'cases']], ['Intelligence', ['prone', 'links', 'files']], ['People', ['officers']]].forEach(g => {
    const c = document.createElement('div'); c.className = 'hub-cap'; c.textContent = g[0]; nav.appendChild(c);
    g[1].forEach(t => by[t] && nav.appendChild(by[t]));
  });
  const hd = document.querySelector('header');
  const setHH = () => document.documentElement.style.setProperty('--hh', hd.offsetHeight + 'px');
  setHH(); addEventListener('resize', setHH);
  const mb = document.createElement('button'); mb.id = 'hubMenu'; mb.type = 'button'; mb.setAttribute('aria-label', 'Menu'); mb.textContent = '\u2630';
  hd.insertBefore(mb, hd.firstChild);
  mb.addEventListener('click', () => document.body.classList.toggle('navopen'));
  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; document.body.classList.remove('navopen'); if (b.dataset.t === 'bi') renderBI(); });

  /* ---------- floating Ask-AI dock ---------- */
  const dock = document.createElement('aside'); dock.className = 'hub-dock off'; dock.setAttribute('aria-label', 'Ask AI');
  dock.innerHTML = '<div class="hd-head"><span class="orb"></span><b>Ask AI</b><span class="sp"></span><button type="button" id="hd-min" aria-label="Minimise">\u2014</button><button type="button" id="hd-x" aria-label="Close">\u2715</button></div>' +
    '<div class="hd-log" id="hd-log" aria-live="polite"></div><div class="hd-chips" id="hd-chips"></div>' +
    '<form class="hd-form" id="hd-f" autocomplete="off"><input id="hd-in" maxlength="500" placeholder="Ask about cases, areas, officers\u2026"><button class="btn primary" type="submit">Ask</button></form>';
  const fab = document.createElement('button'); fab.className = 'hub-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Open Ask AI'); fab.innerHTML = '\uD83E\uDD16<span class="ping"></span>'; fab.style.display = 'none';
  document.body.appendChild(dock); document.body.appendChild(fab);
  const log = $('hd-log'), inp = $('hd-in'); let dh = [], busy = false;
  const openDock = () => { dock.classList.remove('off', 'min'); fab.style.display = 'none'; setTimeout(() => inp.focus(), 350); };
  const closeDock = () => { dock.classList.add('off'); fab.style.display = ''; };
  fab.addEventListener('click', openDock); $('hd-x').addEventListener('click', closeDock);
  $('hd-min').addEventListener('click', () => dock.classList.toggle('min'));

  function say(who, html, actions) {
    const d = document.createElement('div'); d.className = 'hd-m ' + who; d.innerHTML = html + (who === 'bot' ? '<div class="hd-gen">AI GENERATED</div>' : '');
    d.querySelectorAll('a[data-ref]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); T().caseModal(a.dataset.ref); }));
    d.querySelectorAll('a[data-acc]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); T().dossier(+a.dataset.acc); }));
    if (actions && actions.length) { const b = document.createElement('div'); b.className = 'hd-acts'; actions.forEach(x => { const t = document.createElement('button'); t.className = 'btn'; t.textContent = x.l; t.addEventListener('click', x.fn); b.appendChild(t); }); d.appendChild(b); }
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  async function ask(q) {
    q = String(q || '').trim(); if (!q || busy) return; busy = true; say('me', esc(q)); inp.value = ''; openDock();
    const typing = say('bot', '<span class="cr-dots"><i></i><i></i><i></i></span>');
    let res = T().localAnswer(q);
    if (!res) {
      const r = await post('/api/admin-ai', { question: q, history: JSON.stringify(dh.slice(-6)) });
      res = r.ok && r.data.engine && r.data.engine !== 'local' && r.data.reply
        ? { html: esc(r.data.reply).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') }
        : { html: 'I could not work that one out from the built-in analyst. Try asking about <b>cases</b>, <b>areas</b>, <b>reports</b>, <b>officers</b> or <b>accused</b>. For free-form questions, ask the administrator to switch on the AI engine.' };
    }
    typing.remove(); say('bot', res.html, res.actions);
    dh.push({ r: 'u', t: q }, { r: 'a', t: String(res.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 900) }); if (dh.length > 20) dh = dh.slice(-20);
    busy = false;
  }
  $('hd-f').addEventListener('submit', e => { e.preventDefault(); ask(inp.value); });
  ['Which cases have no police assigned?', 'Where is crime highest?', 'Who are the repeat offenders?', 'How many thefts this month?'].forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', () => ask(c)); $('hd-chips').appendChild(b);
  });
  function warmMessage() {
    const I = T().data().incidents, R = T().data().reports, n = esc(T().name());
    const pend = I.filter(i => i.complaintId && i.status === 'Pending').length, overdue = I.filter(i => i.officerName && i.status === 'Under Investigation' && !i.hasReport).length;
    const lines = [pend ? '<li><b>' + plural(pend, 'case is', 'cases are') + '</b> waiting for police assignment</li>' : '', overdue ? '<li><b>' + plural(overdue, 'case is', 'cases are') + '</b> waiting for an investigation report</li>' : ''].join('');
    return '\uD83D\uDC4B ' + hello() + ', <b>' + n + '</b>! I\u2019m Suraksha AI, your analyst.' + (lines ? ' Right now:<ul>' + lines + '</ul>' : ' Everything looks calm right now. Nice work.') + 'Ask me anything about your data, or tap a suggestion below.';
  }

  /* ---------- animated welcome ---------- */
  function finishWelcome(w) {
    w.classList.add('out'); document.body.classList.remove('hub-pre'); document.body.classList.add('hub-in');
    setTimeout(() => w.remove(), 900);
    setTimeout(() => { say('bot', warmMessage()); openDock(); }, reduce ? 0 : 700);
  }
  function welcome() {
    if (ss.get('ss_admin_welcomed')) { say('bot', warmMessage()); fab.style.display = ''; return; }
    ss.set('ss_admin_welcomed', '1');
    document.body.classList.add('hub-pre');
    const D = T().data(), I = D.incidents, open = I.filter(i => /Pending|Awaiting|Under Investigation/.test(i.status || '')).length, pend = I.filter(i => i.complaintId && i.status === 'Pending').length;
    const w = document.createElement('div'); w.className = 'hub-welcome';
    w.innerHTML = '<div class="hw-rings"><i></i><i></i><i></i></div><div class="hw-in"><div class="hw-shield">\uD83D\uDEE1\uFE0F</div><div class="hw-hi">SURAKSHASETU \u00B7 ADMIN</div>' +
      '<h1>' + hello() + ', ' + esc(T().name()) + '!</h1><p class="hw-sub">' + (pend ? plural(pend, 'case is', 'cases are') + ' waiting for you. Let\u2019s get them moving.' : 'Welcome back. Everything is ready. Let\u2019s keep people safe today.') + '</p>' +
      '<div class="hw-stats"><div><b data-n="' + I.length + '">0</b><span>Total cases</span></div><div><b data-n="' + open + '">0</b><span>Open</span></div><div><b data-n="' + pend + '">0</b><span>Need police</span></div></div>' +
      '<button class="btn primary hw-go" type="button">Enter dashboard \u2192</button></div>';
    document.body.appendChild(w);
    w.querySelectorAll('b[data-n]').forEach(b => { const to = +b.dataset.n, t0 = performance.now(); (function f(t) { const p = Math.min(1, (t - t0) / 1100); b.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0); });
    let done = false; const go = () => { if (!done) { done = true; finishWelcome(w); } };
    w.querySelector('.hw-go').addEventListener('click', go); w.addEventListener('click', e => { if (e.target === w) go(); }); setTimeout(go, 5200);
  }
  api('/api/me').then(r => {
    if (!r.ok) return; let n = 0;
    const t = setInterval(() => { n++; if (T().name() !== 'Admin' || n > 14) { clearInterval(t); welcome(); } }, 100);
  });

  /* ---------- BI Studio: Power BI style, click a chart to filter all the others ---------- */
  const CT = { Theft: '#F4A300', Cybercrime: '#3A86FF', Fraud: '#b583ff', Assault: '#E5534B', Harassment: '#ff7eb6', Murder: '#c0392b', 'Missing Person': '#3DBE7A' };
  const ST = s => /Closed/.test(s) ? '#3DBE7A' : /Investigation/.test(s) ? '#8b5cf6' : /Awaiting/.test(s) ? '#3A86FF' : /Pending/.test(s) ? '#F4A300' : '#8892a6';
  const active = s => /Pending|Awaiting|Under Investigation/.test(s || '');
  const dt = i => new Date(String(i || '').slice(0, 19)), F = { cat: null, status: null, area: null, range: 30 };
  const inRange = i => { if (!F.range) return true; const d = dt(i.date); return !isNaN(d) && (Date.now() - d) / 864e5 <= F.range; };
  const sub = skip => T().data().incidents.filter(i => inRange(i) && (skip === 'cat' || !F.cat || i.category === F.cat) && (skip === 'status' || !F.status || i.status === F.status) && (skip === 'area' || !F.area || i.area === F.area));
  const tally = (a, f) => { const m = {}; a.forEach(x => { const k = f(x); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
  const bars = (rows, key, color, sel) => { const mx = Math.max(1, ...rows.map(r => r[1])); return rows.map(r => '<div class="bi-row' + (sel && sel !== r[0] ? ' dim' : '') + '"' + (key ? ' data-f="' + key + ':' + esc(r[0]) + '"' : '') + '><span>' + esc(r[0]) + '</span><div class="bi-bar"><i style="--w:' + (r[1] * 100 / mx) + '%;background:' + color(r[0]) + '"></i></div><b>' + r[1] + '</b></div>').join('') || '<div class="empty">No data for this view</div>'; };
  const dayCounts = (L, n) => { const c = new Array(n).fill(0); L.forEach(i => { const d = dt(i.date); if (isNaN(d)) return; const k = n - 1 - Math.floor((Date.now() - d) / 864e5); if (k >= 0 && k < n) c[k]++; }); return c; };
  const spark = (c, col) => { const mx = Math.max(1, ...c), p = c.map((v, k) => (k * 100 / Math.max(1, c.length - 1)).toFixed(1) + ',' + (28 - v * 26 / mx).toFixed(1)).join(' '); return '<svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline class="bi-line" pathLength="1" points="' + p + '" fill="none" stroke="' + col + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'; };

  function donut() {
    const rows = tally(sub('cat'), i => i.category), tot = rows.reduce((s, r) => s + r[1], 0), R = 62, C = 2 * Math.PI * R; let off = 0;
    const segs = rows.map(r => { const len = C * r[1] / Math.max(tot, 1), s = '<circle class="seg' + (F.cat && F.cat !== r[0] ? ' dim' : '') + '" data-f="cat:' + esc(r[0]) + '" cx="80" cy="80" r="' + R + '" fill="none" stroke="' + (CT[r[0]] || '#8892a6') + '" stroke-width="22" stroke-dasharray="0 ' + C + '" stroke-dashoffset="' + -off + '" data-len="' + len + '" data-c="' + C + '" transform="rotate(-90 80 80)"><title>' + esc(r[0]) + ': ' + r[1] + '</title></circle>'; off += len; return s; }).join('');
    const leg = rows.map(r => '<div class="bi-row' + (F.cat && F.cat !== r[0] ? ' dim' : '') + '" data-f="cat:' + esc(r[0]) + '" style="grid-template-columns:1fr 30px"><span><i class="dot" style="background:' + (CT[r[0]] || '#8892a6') + '"></i>' + esc(r[0]) + '</span><b>' + r[1] + '</b></div>').join('');
    return '<div class="bi-donut"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="' + R + '" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="22"/>' + segs + '<text x="80" y="78" text-anchor="middle" fill="#fff" font-size="26" font-weight="800">' + tot + '</text><text x="80" y="96" text-anchor="middle" fill="#8892a6" font-size="10">incidents</text></svg><div class="bi-leg">' + (leg || '<div class="empty">No data for this view</div>') + '</div></div>';
  }
  function trend() {
    const n = Math.min(F.range || 60, 90), c = dayCounts(sub(null), n), mx = Math.max(1, ...c), W = 600, H = 170;
    const x = k => (k * W / Math.max(1, n - 1)).toFixed(1), y = v => (H - 14 - v * (H - 34) / mx).toFixed(1), pts = c.map((v, k) => x(k) + ',' + y(v)).join(' ');
    return '<svg class="bi-trend" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".5"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon points="0,' + H + ' ' + pts + ' ' + W + ',' + H + '" fill="url(#bg)"/><polyline class="bi-line" pathLength="1" points="' + pts + '" fill="none" stroke="#a78bfa" stroke-width="3" vector-effect="non-scaling-stroke"/>' +
      c.map((v, k) => v ? '<circle cx="' + x(k) + '" cy="' + y(v) + '" r="3.5" fill="#fff"><title>' + v + ' incident' + (v > 1 ? 's' : '') + ', ' + (n - 1 - k) + ' day(s) ago</title></circle>' : '').join('') + '</svg>';
  }
  function weekdays() {
    const c = [0, 0, 0, 0, 0, 0, 0]; sub(null).forEach(i => { const d = dt(i.date); if (!isNaN(d)) c[d.getDay()]++; }); const mx = Math.max(1, ...c);
    return '<div class="bi-cols">' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((n, k) => '<div><b style="color:#fff">' + c[k] + '</b><i style="--h:' + (c[k] * 100 / mx) + '%"></i>' + n + '</div>').join('') + '</div>';
  }
  function renderBI(force) {
    const box = $('cr-bi'); if (!box) return; const L = sub(null), n = L.length, closed = L.filter(i => /Closed/.test(i.status || '')).length;
    const kp = [['Incidents', n, '#3A86FF', dayCounts(L, 14)], ['Open cases', L.filter(i => active(i.status)).length, '#F4A300', dayCounts(L.filter(i => active(i.status)), 14)], ['Closure rate', n ? Math.round(closed * 100 / n) : 0, '#3DBE7A', dayCounts(L.filter(i => /Closed/.test(i.status || '')), 14), '%'],
      ['Need police', L.filter(i => i.status === 'Pending').length, '#E5534B', dayCounts(L.filter(i => i.status === 'Pending'), 14)], ['Reports filed', L.filter(i => i.hasReport).length, '#8b5cf6', dayCounts(L.filter(i => i.hasReport), 14)]];
    const chips = [['cat', F.cat], ['status', F.status], ['area', F.area]].filter(x => x[1]).map(x => '<span class="bi-chip" data-f="' + x[0] + ':' + esc(x[1]) + '">' + esc(x[1]) + ' \u2715</span>').join('');
    box.innerHTML = '<div class="bi-top"><div><h2>\uD83D\uDCC8 BI Studio</h2><div class="bi-sub">Click any chart to filter every other chart, like Power BI.</div></div><div style="display:flex;gap:10px;flex-wrap:wrap"><div class="bi-seg">' +
      [[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All']].map(r => '<button type="button" data-r="' + r[0] + '" class="' + (F.range === r[0] ? 'on' : '') + '">' + r[1] + '</button>').join('') + '</div><button class="btn" type="button" id="bi-ai">\u2728 Ask AI about this view</button></div></div>' +
      '<div class="bi-chips">' + chips + '</div><div class="bi-kpis">' + kp.map(k => '<div class="bi-kpi" style="--c:' + k[2] + '"><span>' + k[0] + '</span><b data-n="' + k[1] + '">0</b>' + spark(k[3], k[2]) + '</div>').join('') + '</div>' +
      '<div class="bi-grid"><div class="bi-card s4"><h3>Crime by type <small>click to filter</small></h3>' + donut() + '</div><div class="bi-card s8"><h3>Incidents over time <small>' + (F.range ? 'last ' + F.range + ' days' : 'last 60 days') + '</small></h3>' + trend() + '</div>' +
      '<div class="bi-card s4"><h3>Case status</h3>' + bars(tally(sub('status'), i => i.status), 'status', ST, F.status) + '</div><div class="bi-card s4"><h3>Hotspot areas</h3>' + bars(tally(sub('area'), i => i.area).slice(0, 6), 'area', () => 'linear-gradient(90deg,#3A86FF,#8b5cf6)', F.area) + '</div>' +
      '<div class="bi-card s4"><h3>Officer workload <small>active cases</small></h3>' + bars(tally(sub(null).filter(i => i.officerName && active(i.status)), i => i.officerName).slice(0, 6), null, () => 'linear-gradient(90deg,#3DBE7A,#35e0c2)') + '</div>' +
      '<div class="bi-card s12"><h3>Busiest weekdays</h3>' + weekdays() + '</div></div>';
    box.querySelectorAll('.bi-kpi b[data-n]').forEach((b, k) => { const to = kp[k][1], suf = kp[k][4] || '', t0 = performance.now(); (function f(t) { const p = reduce ? 1 : Math.min(1, (t - t0) / 900); b.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(f); })(t0); });
    requestAnimationFrame(() => box.querySelectorAll('.seg').forEach(c => { c.style.strokeDasharray = c.dataset.len + ' ' + c.dataset.c; }));
  }
  $('cr-bi').addEventListener('click', e => {
    const f = e.target.closest('[data-f]'), r = e.target.closest('[data-r]');
    if (f) { const s = f.dataset.f, i = s.indexOf(':'), k = s.slice(0, i), v = s.slice(i + 1); F[k] = F[k] === v ? null : v; renderBI(); }
    else if (r) { F.range = +r.dataset.r; renderBI(); }
    else if (e.target.id === 'bi-ai') { inp.value = 'Give me insights on ' + (F.range ? 'the last ' + F.range + ' days' : 'all time') + (F.cat ? ', ' + F.cat : '') + (F.area ? ', ' + F.area : ''); openDock(); inp.focus(); }
  });
  let lastSig = ''; setInterval(() => {
    if (!$('t-bi').classList.contains('on')) return;
    const s = T().data().incidents.map(i => i.id + i.status + i.officerId).join(); if (s !== lastSig) { lastSig = s; renderBI(); }
  }, 4000);
})();
