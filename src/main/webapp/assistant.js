/* Suraksha Assistant: a small jumping robot on the citizen, police and admin pages.
   Chat powered by Groq through /api/assistant (key stays on the server). It can open sections and fill forms
   for review; it never submits, files or assigns anything. Everything is added by this one file:
   <script src="assistant.js"></script> before </body>. */
(function () {
  'use strict';
  if (window.__saLoaded) return; window.__saLoaded = true;
  const B = (typeof BASE === 'string') ? BASE : '/SurakshaSetu';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let role = '', myName = '', engine = 'local', busy = false, isOpen = false, hist = [], tipTimer = null, tipCount = 0;

  /* ------------------------------------------------------------ styles */
  const css = `
.sa-fab,.sa-fab *{box-sizing:border-box}
.sa-fab{position:fixed;right:22px;bottom:104px;z-index:9999;width:60px;height:72px;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sa-fab:focus-visible{outline:3px solid #F4A300;outline-offset:4px;border-radius:14px}
.sa-bot{position:absolute;left:0;top:0;width:60px;height:68px;transform-origin:50% 100%;animation:saJump 2.8s ease-in-out infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}
.sa-fab:hover .sa-bot{animation-duration:1.2s}
.sa-shadow{position:absolute;left:12px;bottom:0;width:36px;height:7px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(2px);animation:saShadow 2.8s ease-in-out infinite}
@keyframes saJump{0%,58%,100%{transform:translateY(0) scale(1,1)}6%{transform:translateY(0) scale(1.1,.88)}22%{transform:translateY(-30px) scale(.94,1.08)}38%{transform:translateY(0) scale(1.08,.9)}46%{transform:translateY(-9px) scale(1,1)}54%{transform:translateY(0) scale(1.03,.97)}}
@keyframes saShadow{0%,58%,100%{transform:scale(1);opacity:.6}22%{transform:scale(.55);opacity:.25}38%{transform:scale(1.1);opacity:.7}46%{transform:scale(.85);opacity:.4}}
.sa-eye{transform-box:fill-box;transform-origin:center;animation:saBlink 4.2s infinite}
@keyframes saBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.sa-ant{animation:saAnt 1.4s ease-in-out infinite}
@keyframes saAnt{50%{opacity:.35}}
.sa-arm{transform-box:fill-box;transform-origin:50% 10%;animation:saWave 2.8s ease-in-out infinite}
@keyframes saWave{0%,20%,60%,100%{transform:rotate(0)}30%{transform:rotate(-38deg)}40%{transform:rotate(8deg)}50%{transform:rotate(-30deg)}}
.sa-tip{position:fixed;right:92px;bottom:132px;z-index:9999;max-width:230px;background:#fff;color:#14203a;border-radius:16px 16px 4px 16px;padding:10px 14px;font:600 .86rem/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.4);opacity:0;transform:translateY(8px) scale(.9);transform-origin:100% 100%;pointer-events:none;transition:opacity .3s,transform .3s}
.sa-tip.on{opacity:1;transform:none;pointer-events:auto;cursor:pointer}
.sa-tip small{display:block;font-weight:500;color:#5b6784;margin-top:2px}
.sa-tip i{position:absolute;right:-6px;bottom:8px;width:12px;height:12px;background:#fff;transform:rotate(45deg);border-radius:2px}
.sa-tip button{position:absolute;right:6px;top:2px;border:0;background:none;color:#8b95ad;font-size:1rem;cursor:pointer;line-height:1}
.sa-hide{display:none!important}
.sa-panel{position:fixed;right:18px;bottom:92px;z-index:9998;width:min(390px,calc(100vw - 20px));height:min(580px,calc(100vh - 120px));display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:#0e1730;color:#ECE8DF;border:1px solid rgba(120,150,255,.3);box-shadow:0 24px 60px rgba(0,0,0,.6);font:.9rem/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;opacity:0;transform:translateY(24px) scale(.94);transform-origin:100% 100%;pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.2,.9,.3,1.2)}
.sa-panel.on{opacity:1;transform:none;pointer-events:auto}
.sa-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(120deg,#1b2a55,#2a1d47);border-bottom:1px solid rgba(120,150,255,.25)}
.sa-hd b{display:block;font-size:.95rem}.sa-hd small{color:#9aa8cf;font-size:.72rem}
.sa-hbot{width:38px;height:42px;flex:none}
.sa-badge{margin-left:auto;font-size:.66rem;font-weight:800;letter-spacing:.06em;padding:3px 9px;border-radius:99px;border:1px solid}
.sa-badge.ai{color:#8fe3b3;border-color:#8fe3b3}.sa-badge.basic{color:#F4A300;border-color:#F4A300}
.sa-x{border:0;background:none;color:#9aa8cf;font-size:1.5rem;line-height:1;cursor:pointer;padding:0 2px}
.sa-x:hover{color:#fff}
.sa-log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
.sa-m{max-width:88%;padding:9px 13px;border-radius:14px;word-wrap:break-word;animation:saPop .28s ease both}
.sa-m.bot{align-self:flex-start;background:#1a2547;border:1px solid rgba(120,150,255,.22);border-top-left-radius:4px}
.sa-m.me{align-self:flex-end;background:rgba(244,163,0,.16);border:1px solid rgba(244,163,0,.4);border-top-right-radius:4px}
@keyframes saPop{from{opacity:0;transform:translateY(8px) scale(.97)}}
.sa-acts{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
.sa-acts button{border:1px solid #F4A300;background:rgba(244,163,0,.12);color:#F4A300;border-radius:99px;padding:5px 12px;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer;transition:all .15s}
.sa-acts button:hover{background:#F4A300;color:#111}
.sa-dots i{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:#F4A300;animation:saDot 1s infinite}
.sa-dots i:nth-child(2){animation-delay:.15s}.sa-dots i:nth-child(3){animation-delay:.3s}
@keyframes saDot{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}
.sa-chips{display:flex;gap:7px;flex-wrap:wrap;padding:0 14px 8px}
.sa-chips button{border:1px solid rgba(120,150,255,.3);background:rgba(120,150,255,.07);color:#cfd8f5;border-radius:99px;padding:5px 11px;font:inherit;font-size:.76rem;cursor:pointer;transition:all .15s}
.sa-chips button:hover{border-color:#F4A300;color:#F4A300;transform:translateY(-2px)}
.sa-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(120,150,255,.2);background:#0b1228}
.sa-form input{flex:1;min-width:0;border-radius:99px;border:1px solid rgba(120,150,255,.3);background:#111b38;color:#ECE8DF;padding:10px 16px;font:inherit}
.sa-form input:focus{outline:2px solid #F4A300;border-color:transparent}
.sa-send{border:0;border-radius:50%;width:40px;height:40px;background:#F4A300;color:#111;font-size:1rem;font-weight:800;cursor:pointer;flex:none;transition:transform .15s}
.sa-send:hover{transform:scale(1.08)}.sa-send:disabled{opacity:.5;cursor:default}
.sa-foot{padding:0 14px 8px;font-size:.66rem;color:#7f8bb0;text-align:center;background:#0b1228}
@media (max-width:520px){.sa-panel{right:10px;bottom:84px}.sa-tip{right:84px}}
@media (prefers-reduced-motion:reduce){.sa-bot,.sa-shadow,.sa-eye,.sa-ant,.sa-arm{animation:none}.sa-panel,.sa-tip{transition:opacity .2s}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ------------------------------------------------------------ the robot (inline SVG) */
  const robot = (anim) => `<svg viewBox="0 0 64 72" width="100%" height="100%" aria-hidden="true">
<defs><linearGradient id="saH${anim ? 'a' : 'b'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F7FF"/><stop offset="1" stop-color="#B9C8FF"/></linearGradient></defs>
<line x1="32" y1="6" x2="32" y2="15" stroke="#8fa0d6" stroke-width="2.5" stroke-linecap="round"/><circle class="${anim ? 'sa-ant' : ''}" cx="32" cy="5" r="3.6" fill="#F4A300"/>
<rect x="7" y="25" width="5" height="12" rx="2.5" fill="#8fa0d6"/><rect x="52" y="25" width="5" height="12" rx="2.5" fill="#8fa0d6"/>
<rect x="11" y="14" width="42" height="32" rx="12" fill="url(#saH${anim ? 'a' : 'b'})" stroke="#7d90d4" stroke-width="1.5"/>
<rect x="16" y="20" width="32" height="20" rx="9" fill="#17264d"/>
<ellipse class="${anim ? 'sa-eye' : ''}" cx="26" cy="29" rx="3.6" ry="4" fill="#5CE1E6"/><ellipse class="${anim ? 'sa-eye' : ''}" cx="38" cy="29" rx="3.6" ry="4" fill="#5CE1E6"/>
<path d="M27 35.5q5 4 10 0" fill="none" stroke="#5CE1E6" stroke-width="2" stroke-linecap="round"/>
<rect x="20" y="47" width="24" height="15" rx="7" fill="#C9D6FF" stroke="#7d90d4" stroke-width="1.5"/><circle cx="32" cy="54.5" r="3" fill="#F4A300"/>
<rect class="${anim ? 'sa-arm' : ''}" x="12" y="48" width="6" height="13" rx="3" fill="#9fb0e8"/><rect x="46" y="48" width="6" height="13" rx="3" fill="#9fb0e8"/>
<ellipse cx="25" cy="66.5" rx="6" ry="3" fill="#8fa0d6"/><ellipse cx="39" cy="66.5" rx="6" ry="3" fill="#8fa0d6"/></svg>`;

  /* ------------------------------------------------------------ page helpers */
  const navEl = () => document.getElementById('cnav') || document.getElementById('nav') || document.querySelector('nav.navtabs');
  function tabs() {
    const n = navEl(); if (!n) return [];
    return [...n.querySelectorAll('button[data-t]')].map(b => ({ id: b.dataset.t, label: b.textContent.replace(/[^\p{L}\p{N}&' \-\/]/gu, ' ').replace(/\s+/g, ' ').trim() || b.dataset.t, el: b }));
  }
  const current = () => { const n = navEl(), on = n && n.querySelector('button[data-t].on'); return on ? on.dataset.t : ''; };
  const openTab = id => { const t = tabs().find(x => x.id === id); if (t) t.el.click(); return !!t; };
  const first = () => String(myName || '').trim().split(/\s+/)[0] || '';
  const ROLE = { user: ['Citizen assistant', 'track your cases, explain your rights, open any section and help you file a case'], officer: ['Police assistant', 'plan your day from your cases, summarise a case and draft an investigation report for you to review'], admin: ['Admin assistant', 'answer questions about cases, police assignment, reports and hotspots, and open any section'] };
  const CHIPS = { user: ['Show my case status', 'How do I file a case?', 'My rights if arrested', 'Open e-FIR'], officer: ['Summarise my active cases', 'What should I do first today?', 'Help me write a report', 'Open appointments'], admin: ["Summarise today's crime picture", 'Which cases need police?', 'Where is crime highest?', 'Open Assign Police'] };

  async function call(path, obj) {
    try {
      const r = await fetch(B + path, obj ? { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(obj) } : { credentials: 'same-origin' });
      let d = null; try { d = await r.json(); } catch (e) {}
      return { ok: r.ok, status: r.status, data: d || {} };
    } catch (e) { return { ok: false, status: 0, data: {} }; }
  }

  /* ------------------------------------------------------------ build the UI */
  let fab, tip, panel, log, input, sendBtn;
  function build() {
    fab = document.createElement('button'); fab.className = 'sa-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Open Suraksha assistant');
    fab.innerHTML = '<span class="sa-shadow"></span><span class="sa-bot">' + robot(true) + '</span>';
    tip = document.createElement('div'); tip.className = 'sa-tip'; tip.innerHTML = '<button type="button" aria-label="Dismiss">×</button>Hey, I\'m here to assist you! 👋<small>Tap me to chat</small><i></i>';
    panel = document.createElement('div'); panel.className = 'sa-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Suraksha assistant');
    panel.innerHTML = '<div class="sa-hd"><span class="sa-hbot">' + robot(false) + '</span><div><b>Suraksha Assistant</b><small>' + esc(ROLE[role][0]) + '</small></div><span class="sa-badge" id="sa-badge"></span><button class="sa-x" type="button" aria-label="Close">×</button></div>' +
      '<div class="sa-log" id="sa-log" aria-live="polite"></div><div class="sa-chips" id="sa-chips"></div>' +
      '<form class="sa-form" id="sa-form" autocomplete="off"><input id="sa-in" maxlength="1000" placeholder="Ask me anything…" aria-label="Your message"><button class="sa-send" id="sa-send" aria-label="Send">➤</button></form>' +
      '<div class="sa-foot">AI can make mistakes. In an emergency call 112.</div>';
    document.body.appendChild(tip); document.body.appendChild(panel); document.body.appendChild(fab);
    log = panel.querySelector('#sa-log'); input = panel.querySelector('#sa-in'); sendBtn = panel.querySelector('#sa-send');
    const chips = panel.querySelector('#sa-chips');
    CHIPS[role].forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', () => send(c)); chips.appendChild(b); });
    fab.addEventListener('click', () => toggle(true));
    tip.addEventListener('click', e => { if (e.target.tagName === 'BUTTON') { hideTip(true); } else toggle(true); });
    panel.querySelector('.sa-x').addEventListener('click', () => toggle(false));
    panel.querySelector('#sa-form').addEventListener('submit', e => { e.preventDefault(); send(input.value); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) toggle(false); });
    setBadge();
  }
  function setBadge() { const b = document.getElementById('sa-badge'); if (b) { b.className = 'sa-badge ' + (engine === 'groq' ? 'ai' : 'basic'); b.textContent = engine === 'groq' ? 'AI' : 'BASIC'; b.title = engine === 'groq' ? 'Answers from the Groq AI' : 'Basic mode: the AI engine is not switched on'; } }

  const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^\s*[-•]\s+/gm, '• ').replace(/\n/g, '<br>');
  function say(who, html, actions) {
    const d = document.createElement('div'); d.className = 'sa-m ' + who; d.innerHTML = html;
    if (actions && actions.length) { const a = document.createElement('div'); a.className = 'sa-acts'; actions.forEach(x => { const b = document.createElement('button'); b.type = 'button'; b.textContent = x.l; b.addEventListener('click', x.fn); a.appendChild(b); }); d.appendChild(a); }
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function save() { hist = hist.slice(-20); store.set('sa_h_' + role, JSON.stringify(hist)); }

  /* ------------------------------------------------------------ open / close / greeting bubble */
  function toggle(open) {
    isOpen = open; panel.classList.toggle('on', open); fab.classList.toggle('sa-hide', open); hideTip(false);
    if (open) {
      if (!log.children.length) {
        say('bot', 'Hi' + (first() ? ' ' + esc(first()) : '') + '! 👋 I am your Suraksha assistant. I can ' + esc(ROLE[role][1]) + '.');
        hist.slice(-10).forEach(h => say(h.r === 'u' ? 'me' : 'bot', fmt(h.t)));
      }
      setTimeout(() => { input.focus(); log.scrollTop = log.scrollHeight; }, 200);
    }
  }
  function showTip() { if (isOpen || store.get('sa_tip_off') === '1' || tipCount >= 3) return; tipCount++; tip.classList.add('on'); clearTimeout(tipTimer); tipTimer = setTimeout(() => hideTip(false), 7500); }
  function hideTip(forever) { tip.classList.remove('on'); clearTimeout(tipTimer); if (forever) store.set('sa_tip_off', '1'); }

  /* ------------------------------------------------------------ actions (open a section / fill a form for review) */
  const setVal = (id, v) => { const e = document.getElementById(id); if (e && v != null && v !== '') { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
  async function runAction(a) {
    if (!a) return;
    if (a.do === 'open_tab') { if (!openTab(a.tab)) say('bot', 'I could not find that section on this page.'); return; }
    if (a.do === 'prefill_case' && role === 'user') {
      openTab('file'); await wait(250);
      if (typeof window.pick === 'function') { try { window.pick(a.type); } catch (e) {} }
      await wait(150); setVal('description', a.description); setVal('location', a.location); setVal('city', a.city); setVal('state', a.state);
      say('bot', 'The form is ready. Please check every detail, add anything missing, and submit it yourself. If you are in danger right now, call 112 first.');
      return;
    }
    if (a.do === 'draft_report' && role === 'officer' && typeof window.openReport === 'function') {
      await window.openReport(a.complaintId); await wait(150);
      setVal('or-c', a.cause); setVal('or-s', a.summary); setVal('or-m', a.modus);
      const o = document.getElementById('or-o'); if (o && a.outcome) { const ok = [...o.options].some(x => x.value === a.outcome || x.text === a.outcome); if (ok) o.value = a.outcome; }
      toggle(false);
    }
  }
  function actionButton(a) {
    if (!a) return [];
    if (a.do === 'open_tab') { const t = tabs().find(x => x.id === a.tab); return [{ l: 'Open ' + (t ? t.label : a.tab), fn: () => { runAction(a); } }]; }
    if (a.do === 'prefill_case') return [{ l: 'Open the form', fn: () => { runAction(a); } }];
    if (a.do === 'draft_report') return [{ l: 'Open the report form', fn: () => { runAction(a); } }];
    return [];
  }

  /* ------------------------------------------------------------ basic mode (no AI engine): open sections by name */
  function localReply(q) {
    const t = q.toLowerCase(), ts = tabs(); let best = null, bs = 0;
    ts.forEach(x => { let s = 0; const l = x.label.toLowerCase(); if (t.indexOf(l) >= 0) s += 5; l.split(/\s+/).forEach(w => { if (w.length >= 4 && t.indexOf(w) >= 0) s += 2; }); if (t.indexOf(x.id.toLowerCase()) >= 0 && x.id.length >= 3) s += 2; if (s > bs) { bs = s; best = x; } });
    const danger = /in danger|following me|attack|help me now|bleeding|kidnap|suicid|kill myself|want to die/.test(t) ? '<br><br><b>If you or someone near you is in danger, call 112 right now.</b>' : '';
    if (best && bs >= 2) return { html: 'I can take you to <b>' + esc(best.label) + '</b>.' + danger, actions: [{ l: 'Open ' + best.label, fn: () => { openTab(best.id); } }] };
    return { html: 'I am in basic mode right now because the AI engine is not switched on, so I can only open sections for you. Type a section name or tap one below.' + danger, actions: ts.slice(0, 4).map(x => ({ l: x.label, fn: () => { openTab(x.id); } })) };
  }

  /* ------------------------------------------------------------ sending */
  async function send(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = '';
    say('me', esc(text)); const typing = say('bot', '<span class="sa-dots"><i></i><i></i><i></i></span>');
    const r = await call('/api/assistant', { message: text, history: JSON.stringify(hist.slice(-8)), tabs: tabs().map(x => x.id + ':' + x.label).join('|'), current: current() });
    typing.remove();
    let html, actions = [], plain;
    if (r.ok && r.data.engine === 'groq' && r.data.reply) {
      engine = 'groq'; html = fmt(r.data.reply); plain = r.data.reply; actions = actionButton(r.data.action);
    } else if (r.status === 429) {
      html = esc((r.data && r.data.message) || 'Please wait a few minutes and try again.'); plain = html;
    } else {
      engine = 'local'; const l = localReply(text); html = l.html; plain = l.html.replace(/<[^>]+>/g, ' '); actions = l.actions;
    }
    setBadge(); say('bot', html, actions);
    hist.push({ r: 'u', t: text }, { r: 'a', t: String(plain).replace(/\s+/g, ' ').slice(0, 900) }); save();
    busy = false; sendBtn.disabled = false; input.focus();
  }

  /* ------------------------------------------------------------ start */
  async function init() {
    const me = await call('/api/assistant');
    if (!me.ok || !ROLE[me.data.role]) return;
    role = me.data.role; myName = me.data.name || ''; engine = me.data.engine === 'groq' ? 'groq' : 'local';
    try { hist = JSON.parse(store.get('sa_h_' + role) || '[]'); if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; }
    build();
    // stay out of the way of the animated welcome screens on the admin and police pages
    setInterval(() => { const w = !!document.querySelector('.hub-welcome'); fab.classList.toggle('sa-hide', w || isOpen); if (w) tip.classList.remove('on'); }, 500);
    setTimeout(showTip, 1800);
    setInterval(() => { if (!isOpen && !document.querySelector('.hub-welcome')) showTip(); }, 70000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
