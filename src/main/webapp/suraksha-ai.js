/* Suraksha AI: friendly multilingual assistant (type, speak, listen).
   Smart mode  : /api/ai (AiServlet) answers in the citizen's language. Needs GROQ_API_KEY (free tier) or ANTHROPIC_API_KEY on the server.
   Basic mode  : no key / server error. A built-in English helper answers from the Know-Your-Law knowledge base,
                 key Articles of the Constitution, latest news, and walks through filing a case.
   Loaded after portal-header.js (needs window.SS). Uses the page's api(), post(), esc(), show(), pick(). */
(function () {
  const pane = document.getElementById('t-ai'), SS = window.SS;
  if (!pane || !SS) return;
  const $ = id => document.getElementById(id);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  let hist = [], busy = false, rec = null, viaMic = false, warnedVoice = false;
  let draft = { active: false, type: '', text: '' };
  let news = { at: 0, items: [] };

  /* ------------------------------------------------------------ page */
  pane.innerHTML =
    '<div class="ai-wrap">' +
    '<div class="ai-hero"><div class="ai-orb" aria-hidden="true"></div><div><h2 class="aiglow big" style="margin:0">Suraksha AI</h2><div class="tg" id="ai-tag"></div></div><span class="ai-badge" id="ai-mode">…</span></div>' +
    '<div class="panel ai-chat">' +
    '<div class="ai-msgs" id="ai-msgs" aria-live="polite"></div>' +
    '<div class="ai-chips" id="ai-chips"></div>' +
    '<form class="ai-form" id="ai-form" autocomplete="off">' +
    '<button type="button" class="ai-mic" id="ai-mic" aria-label="Speak">\uD83C\uDF99\uFE0F</button>' +
    '<input id="ai-in" maxlength="1000" aria-label="Your message"><button class="btn primary" id="ai-send" type="submit"></button></form>' +
    '<div class="ai-foot"><label class="ai-talk"><input type="checkbox" id="ai-talk"> \uD83D\uDD0A <span id="ai-talkl"></span></label><span class="hint" id="ai-disc" style="margin:0"></span></div>' +
    '</div></div>';

  const msgs = $('ai-msgs'), input = $('ai-in'), talk = $('ai-talk');
  talk.checked = store.get('ss_talk') === '1';
  talk.addEventListener('change', () => { store.set('ss_talk', talk.checked ? '1' : '0'); if (!talk.checked && window.speechSynthesis) speechSynthesis.cancel(); });

  const firstName = () => { const n = (SS.me && SS.me.name || '').trim().split(/\s+/)[0] || ''; return n ? n[0].toUpperCase() + n.slice(1) : ''; };
  const scroll = () => { msgs.scrollTop = msgs.scrollHeight; };

  function addMsg(who, text) {
    const d = document.createElement('div'); d.className = 'ai-b ' + who; d.textContent = text; msgs.appendChild(d); scroll(); return d;
  }
  function addSos(html) {
    const d = document.createElement('div'); d.className = 'ai-b sos'; d.innerHTML = html; msgs.appendChild(d); scroll();
  }
  function addBot(text, action, chips) {
    const d = addMsg('bot', text);
    const acts = [];
    if (action && action.do === 'prefill_case') acts.push(['go', SS.t('open'), () => runAction(action)]);
    else if (action && action.do === 'open_tab') acts.push(['go', SS.nav(action.tab), () => runAction(action)]);
    (chips || []).forEach(c => acts.push(['', c, () => send(c)]));
    if (acts.length) {
      const box = document.createElement('div'); box.className = 'ai-act';
      acts.forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.textContent = a[1]; if (a[0]) b.className = a[0]; b.addEventListener('click', a[2]); box.appendChild(b); });
      d.appendChild(box); scroll();
    }
  }
  function addTyping() {
    const d = document.createElement('div'); d.className = 'ai-b bot ai-typing'; d.innerHTML = '<i></i><i></i><i></i>'; d.setAttribute('aria-label', SS.t('thinking')); msgs.appendChild(d); scroll(); return d;
  }

  /* ------------------------------------------------------------ labels follow the chosen language */
  function labels() {
    $('ai-tag').textContent = SS.t('tagline'); input.placeholder = SS.t('ph'); $('ai-send').textContent = SS.t('send');
    $('ai-talkl').textContent = SS.t('talkOn'); $('ai-disc').textContent = SS.t('disc');
    $('ai-chips').innerHTML = '';
    SS.t('chips').forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', () => send(c)); $('ai-chips').appendChild(b); });
  }
  function greet() {
    if (hist.length) return;
    msgs.innerHTML = '';
    addMsg('bot', SS.t('hello').replace(/\s*\{name\}/, firstName() ? ' ' + firstName() : ''));
  }
  document.addEventListener('sslang', () => { labels(); greet(); });
  document.addEventListener('ssready', () => greet());
  labels(); greet();

  function setMode(m) {
    const b = $('ai-mode'); b.className = 'ai-badge ' + m; b.textContent = SS.t(m);
    b.title = m === 'smart' ? 'Answers in your language' : 'Built-in helper (English). Ask the administrator to enable the AI engine for all languages.';
  }
  api('/api/ai').then(r => { if (r.ok) setMode(r.data.engine === 'local' ? 'basic' : 'smart'); });

  /* ------------------------------------------------------------ news (also given to the AI as context) */
  async function ensureNews() {
    if (Date.now() - news.at < 10 * 60 * 1000 && news.items.length) return;
    const r = await api('/api/news');
    if (r.ok && r.data && Array.isArray(r.data.items)) news = { at: Date.now(), items: r.data.items.slice(0, 8) };
  }
  const newsText = () => news.items.slice(0, 6).map(i => '- ' + String(i.title || '').slice(0, 200) + (i.source ? ' (' + i.source + ')' : '')).join('\n');
  ensureNews();

  /* ------------------------------------------------------------ safety checks that run for every message */
  const URGENT = /(in danger|following me|being followed|attacked|attacking|being hit|beating me|bleeding|kidnap|help me now|breaking into|has a gun|has a knife|\u092c\u091a\u093e\u0913|\u0916\u0924\u0930\u0947 \u092e\u0947\u0902)/i;
  const SELFHARM = /(suicid|kill myself|want to die|end my life|hurt myself|\u0906\u0924\u094d\u092e\u0939\u0924\u094d\u092f\u093e)/i;
  const SOS = 'If you or someone near you is in danger, call <a href="tel:112">112</a> right now. Women helpline <a href="tel:1091">1091</a> \u00b7 Child helpline <a href="tel:1098">1098</a> \u00b7 Cyber fraud <a href="tel:1930">1930</a>.';
  const CARE = 'You are not alone, and reaching out is a strong thing to do. You can talk to Tele-MANAS on <a href="tel:14416">14416</a> (free, 24x7, many languages), or call <a href="tel:112">112</a> if you are in immediate danger.';

  /* ------------------------------------------------------------ basic (built-in) helper */
  const ART = {
    '14': 'Article 14: Equality before law. Everyone in India, citizen or not, gets equal protection of the laws. The State cannot treat people unequally without a fair reason.',
    '15': 'Article 15: No discrimination by the State on grounds of religion, race, caste, sex or place of birth. Special provisions for women, children and disadvantaged groups are allowed.',
    '19': 'Article 19: Six freedoms for citizens: speech and expression, assembling peacefully without arms, forming associations, moving freely across India, living in any part of India, and practising any profession or business. The State can place reasonable restrictions, for example for public order or security.',
    '20': 'Article 20: Protection in criminal cases. You cannot be punished under a law made after the act (no retrospective punishment), tried twice for the same offence, or forced to be a witness against yourself.',
    '21': 'Article 21: Protection of life and personal liberty. No one can be deprived of life or liberty except by a procedure established by law. Courts have read this broadly to include privacy, dignity, a fair and speedy trial, livelihood and a clean environment.',
    '21a': 'Article 21A: Free and compulsory education for children aged 6 to 14.',
    '22': 'Article 22: Rights on arrest and detention. You must be told the grounds of arrest, can consult a lawyer of your choice, and must be produced before a magistrate within 24 hours (not counting travel time).',
    '23': 'Article 23: Bans human trafficking and forced labour.',
    '24': 'Article 24: No child below 14 can be employed in a factory, mine or other hazardous work.',
    '25': 'Article 25: Freedom of conscience and the right to freely profess, practise and propagate religion, subject to public order, morality and health.',
    '32': 'Article 32: Right to Constitutional Remedies. If a Fundamental Right is violated, you can go directly to the Supreme Court. High Courts can be approached under Article 226.',
    '51a': 'Article 51A lists 11 Fundamental Duties of citizens, such as respecting the Constitution, the National Flag and Anthem, protecting public property, safeguarding the environment, and developing scientific temper and humanism.',
    preamble: 'The Preamble declares India a sovereign, socialist, secular, democratic republic. It promises all citizens justice, liberty, equality and fraternity, assuring the dignity of the individual and the unity and integrity of the nation.',
    fr: 'Fundamental Rights (Part III) are six groups: Right to Equality (Articles 14 to 18), Right to Freedom (19 to 22), Right against Exploitation (23 and 24), Right to Freedom of Religion (25 to 28), Cultural and Educational Rights (29 and 30), and Right to Constitutional Remedies (32). Ask me about any Article number.',
    dpsp: 'Directive Principles (Part IV, Articles 36 to 51) are guidelines for governments, such as fair wages, education and health. Courts cannot enforce them directly, but laws are made with them in mind.'
  };
  const TYPEKW = [['Theft', /stol|theft|robb|snatch|pickpocket|burglar/], ['Cybercrime', /hack|phish|cyber|online abuse|sextort|fake profile/],
    ['Fraud', /fraud|scam|cheat|upi|loan app|credit card|debit card|money (was )?(lost|deducted)|\botp\b/], ['Assault', /assault|beat|beaten|hit me|attack|slapped|violence/],
    ['Missing Person', /missing|can.?t find|cannot find|kidnap|abduct/], ['Harassment', /harass|stalk|threat|eve.?teas|bully|blackmail/], ['Murder', /murder|killed|dead body/]];
  const detectType = q => { const m = TYPEKW.find(x => x[1].test(q)); return m ? m[0] : ''; };
  const STOP = new Set(['what', 'is', 'how', 'to', 'do', 'i', 'a', 'the', 'of', 'my', 'me', 'can', 'in', 'and', 'or', 'it', 'for', 'on', 'are', 'does', 'if', 'about']);

  function kbAnswer(q) {
    const t = ' ' + q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
    let best = null, bs = 0;
    [typeof LAW !== 'undefined' && LAW, typeof ROAD !== 'undefined' && ROAD, typeof WOMEN !== 'undefined' && WOMEN, typeof RAG !== 'undefined' && RAG].filter(Boolean).forEach(kb => {
      (kb.kb || []).forEach(e => {
        let s = 0;
        e.k.split(' ').forEach(w => { if (!w || STOP.has(w)) return; if (w.length <= 3 ? t.includes(' ' + w + ' ') : t.includes(w.slice(0, Math.max(4, w.length - 2)))) s += w.length > 3 ? 2 : 1; });
        if (s > bs) { bs = s; best = e; }
      });
    });
    return bs >= 2 ? String(best.a).replace(/<[^>]+>/g, '') : null;
  }

  function localReply(raw) {
    const chipEn = ['latest police news', 'my rights if arrested', 'explain article 21', 'help me file a case'];
    const ci = SS.t('chips').indexOf(raw);
    const q = (ci >= 0 ? chipEn[ci] : raw).toLowerCase().trim();
    const R = (text, action, chips) => ({ text, action, chips });

    if (/^(hi|hello|hey|namaste|namaskara|vanakkam|hola)\b/.test(q)) return R('Hello' + (firstName() ? ' ' + firstName() : '') + '! How can I help you today? You can ask about laws, your rights, the Constitution, the latest police news, or say you want to file a case.');
    if (/^(thanks|thank you|thx)\b/.test(q)) return R('You are welcome. I am here whenever you need me.');

    if (draft.active && /\b(cancel|never mind|stop|forget it)\b/.test(q)) { draft = { active: false, type: '', text: '' }; return R('No problem, I have cancelled that. What else can I help with?'); }

    const am = q.match(/(?:article|art\.?|\u0905\u0928\u0941\u091a\u094d\u091b\u0947\u0926|\u0915\u0932\u092e)\s*(\d{1,3})([a-z])?(?![a-z0-9])/);
    if (am) { const k = (am[1] + (am[2] || '')).toLowerCase(); if (ART[k]) return R(ART[k]); return R('I have short notes on Articles 14, 15, 19, 20, 21, 21A, 22, 23, 24, 25, 32 and 51A, plus the Preamble. Which one would you like?', null, ['Article 14', 'Article 19', 'Article 21', 'Article 22']); }
    if (/preamble/.test(q)) return R(ART.preamble);
    if (/fundamental rights?/.test(q)) return R(ART.fr);
    if (/fundamental dut/.test(q)) return R(ART['51a']);
    if (/directive principle/.test(q)) return R(ART.dpsp);
    if (/constitution/.test(q)) return R('The Constitution of India is the supreme law of the country. It sets up the government, protects your Fundamental Rights, and lists your Fundamental Duties. Ask me about the Preamble, Fundamental Rights, Directive Principles, or any Article such as 14, 19, 21 or 22.', null, ['Preamble', 'Fundamental rights', 'Article 21']);

    if (/\b(news|headlines?)\b/.test(q) || /^latest\b/.test(q)) {
      if (!news.items.length) return R('I could not fetch the news right now. The Home tab also shows the latest police and government news.', { do: 'open_tab', tab: 'home' });
      return R('Here are the latest headlines:\n' + news.items.slice(0, 5).map(i => '- ' + i.title + (i.source ? ' (' + i.source + ')' : '')).join('\n'), { do: 'open_tab', tab: 'home' });
    }
    if (/\b(arrest|arrested|detain|detained|custody)\b/.test(q)) return R('If you are arrested you have the right to be told why, to inform a family member or friend, to consult a lawyer, and to be produced before a magistrate within 24 hours. If you cannot afford a lawyer you can get free legal aid; call NALSA on 15100. Stay calm, do not sign anything you have not read, and ask for a copy of the arrest memo.');

    const isQ = /^(how|what|why|when|where|can|could|does|do|is|are|explain|tell me)\b/.test(q);
    const fileIntent = /help me file|\b(file|lodge|register|raise|make|want|need)\b.{0,18}\b(a |an |my )?(case|complaint|fir)\b|\bcomplain\b/.test(q);
    const narrated = /\b(stolen|stole|hacked|cheated|robbed|snatched|attacked|beaten|threatened|harassed|kidnapped|scammed|blackmailed)\b/.test(q);
    if (((fileIntent || draft.active) && !isQ) || narrated) {
      const t = detectType(q); if (t) draft.type = t;
      const bare = t && raw.trim().toLowerCase() === t.toLowerCase();
      const onlyIntent = /^(help me file|i want to file)/.test(q) && !t;
      if (!bare && !onlyIntent) draft.text += (draft.text ? ' ' : '') + raw;
      draft.active = true;
      if (!draft.type) return R('I can help you file a case. What kind of case is it?', null, TYPEKW.map(x => x[0]));
      if (draft.text.replace(/\s+/g, ' ').length < 30) return R('I am sorry this happened. Please tell me briefly what happened, when, and where.');
      const p = SS.profile || {}, a = { do: 'prefill_case', type: draft.type, description: draft.text, location: '', city: p.city || '', state: p.state || '' };
      draft = { active: false, type: '', text: '' };
      return R('Thank you for telling me. I have prepared the form for you. Tap the button, check every detail, add anything missing, and submit it yourself. If you are in danger right now, call 112 first.', a);
    }

    const nav = [[/appointment|book .*(police|station)|meet .*(officer|police)/, 'appt', 'You can book a visit to a police station in Appointments.'], [/nearest|near me|police station|\bps\b|map/, 'map', 'You can find the nearest police stations on the map.'],
      [/garbage|pothole|streetlight|street light|drain|civic/, 'civic', 'Civic problems like garbage, potholes and broken streetlights can be raised in Civic issues.'], [/accident|fire|smoke|fight|quarrel|suspicious/, 'concern', 'For something happening right now, send a quick alert with photos or a video from Report a concern. If anyone is hurt, call 112 first.'],
      [/community|volunteer|survey|clean.?up/, 'community', 'Community has surveys and citizen initiatives you can join.'], [/my cases|case status|track/, 'cases', 'Your cases and their status are in My cases.'], [/e-?fir/, 'efir', 'You can submit an e-FIR from the e-FIR tab.']];
    for (const n of nav) if (n[0].test(q)) return R(n[2], { do: 'open_tab', tab: n[1] });

    const kb = kbAnswer(q);
    if (kb) return R(kb);
    return R('I am the built-in helper right now, so I can answer in English about: laws and your rights, the Constitution (try "Article 21"), the latest police news, and filing a case. Try one of those, or use the tabs above.\nFor friendly conversation in all languages, the administrator needs to switch on the AI engine.', null, SS.t('chips'));
  }

  /* ------------------------------------------------------------ actions (buttons under a reply) */
  function runAction(a) {
    if (a.do === 'open_tab') { window.show(a.tab); return; }
    if (a.do === 'prefill_case') {
      window.show('file');
      if (typeof pick === 'function') pick(a.type);
      const set = (id, v) => { const e = $(id); if (e && v) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('description', a.description); set('location', a.location); set('city', a.city); set('state', a.state);
    }
  }

  /* ------------------------------------------------------------ sending */
  async function send(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    busy = true; $('ai-send').disabled = true;
    addMsg('me', text); hist.push({ r: 'u', t: text }); input.value = '';
    if (SELFHARM.test(text)) addSos(CARE); else if (URGENT.test(text)) addSos(SOS);
    const typing = addTyping();
    await ensureNews();
    const r = await post('/api/ai', { message: text, lang: SS.lang(), history: JSON.stringify(hist.slice(-12)), news: newsText(), name: firstName(), city: (SS.profile && SS.profile.city) || '' });
    typing.remove();
    let res;
    if (r.ok && r.data.engine && r.data.engine !== 'local' && r.data.reply) { setMode('smart'); res = { text: r.data.reply, action: r.data.action }; }
    else if (r.status === 429) res = { text: r.data.message };
    else { setMode('basic'); res = localReply(text); }
    addBot(res.text, res.action, res.chips);
    hist.push({ r: 'a', t: res.text });
    if (hist.length > 40) hist = hist.slice(-40);
    if (talk.checked || viaMic) speak(res.text);
    viaMic = false; busy = false; $('ai-send').disabled = false;
  }
  $('ai-form').addEventListener('submit', e => { e.preventDefault(); send(input.value); });

  /* ------------------------------------------------------------ talk (text to speech) */
  function voiceFor(loc) {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [], norm = v => v.lang.replace('_', '-').toLowerCase();
    return vs.find(v => norm(v) === loc.toLowerCase()) || vs.find(v => norm(v).slice(0, 2) === loc.slice(0, 2).toLowerCase()) || null;
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const clean = String(text).replace(/https?:\/\/\S+/g, '').replace(/^\s*[-\u2022]\s*/gm, '').replace(/\s+/g, ' ').trim(); if (!clean) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean), loc = SS.speechLang(), v = voiceFor(loc);
    u.lang = loc; if (v) u.voice = v; else if (!warnedVoice && loc.slice(0, 2) !== 'en') { warnedVoice = true; addMsg('bot', SS.t('noVoice')); }
    speechSynthesis.speak(u);
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

  /* ------------------------------------------------------------ listen (speech to text) */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  $('ai-mic').addEventListener('click', () => {
    if (!SR) { addMsg('bot', SS.t('noMic')); return; }
    if (rec) { rec.stop(); return; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    const r = rec = new SR(); r.lang = SS.speechLang(); r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    let finalText = '';
    r.onresult = e => { let t = ''; for (let i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) finalText = t; } input.value = t; };
    r.onerror = () => { $('ai-mic').classList.remove('on'); input.placeholder = SS.t('ph'); };
    r.onend = () => { $('ai-mic').classList.remove('on'); input.placeholder = SS.t('ph'); rec = null; const t = (finalText || input.value).trim(); if (t) { viaMic = true; send(t); } };
    try { r.start(); $('ai-mic').classList.add('on'); input.placeholder = SS.t('listening'); } catch (e) { rec = null; }
  });

  /* ------------------------------------------------------------ tab hook */
  const prevShow = window.show;
  window.show = function (t) {
    prevShow(t);
    if (t === 'ai') { labels(); greet(); scroll(); if (!('ontouchstart' in window)) setTimeout(() => input.focus(), 60); }
    else if (window.speechSynthesis) speechSynthesis.cancel();
  };
  if (location.hash.slice(1) === 'ai') window.show('ai');
})();
