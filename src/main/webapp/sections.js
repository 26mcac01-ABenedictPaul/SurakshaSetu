/* Safety Academy: Know Your Law, Road Safety Academy, Women's Safety & Support, Anti-Ragging & Campus Safety.
   Needs: user.jsp globals ($, IC, icon, esc, post, show, banner) and sections-data.js. */
(function () {
  'use strict';
  const timers = [];
  const clearTimers = () => { while (timers.length) clearInterval(timers.pop()); };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  /* ---------- reusable renderers ---------- */
  const cards = list => '<div class="ks-grid">' + list.map((c, i) =>
    '<div class="ks-card" style="--i:' + i + '" tabindex="0" role="button"><div class="ic">' + icon(c.ic) + '</div><b>' + esc(c.t) + '</b><p>' + esc(c.s) +
    '</p><ul class="full">' + c.full.map(x => '<li>' + x + '</li>').join('') + '</ul><span class="more">Read more →</span></div>').join('') + '</div>';

  const accordion = list => '<div class="ks-search"><input type="search" id="ks-faqq" placeholder="Search questions…" aria-label="Search questions"></div><div class="ks-acc" id="ks-faq">' +
    list.map(f => '<div class="ks-q"><button type="button"><span>' + esc(f[0]) + '</span><i>+</i></button><div class="a">' + esc(f[1]) + '</div></div>').join('') + '</div>';

  const myths = list => '<p class="sub">Tap a card to flip it and see the truth.</p><div class="ks-grid">' + list.map((m, i) =>
    '<div class="ks-myth" style="--i:' + i + '" tabindex="0" role="button"><div class="in"><div class="f"><em>MYTH</em><p>' + esc(m[0]) + '</p><small>Tap to reveal ↻</small></div><div class="b"><em>FACT</em><p>' + esc(m[1]) + '</p></div></div></div>').join('') + '</div>';

  const videos = list => '<div class="ks-grid">' + list.map((v, i) =>
    '<div class="ks-vid" style="--i:' + i + '"><button type="button" class="scr" data-vid="' + esc(v[0]) + '" style="background-image:url(https://i.ytimg.com/vi/' + esc(v[0]) + '/hqdefault.jpg)" aria-label="Play ' + esc(v[1]) + '"><span class="pl"></span></button>' +
    '<div class="cap"><b>' + esc(v[1]) + '</b><a href="https://www.youtube.com/watch?v=' + esc(v[0]) + '" target="_blank" rel="noopener">Open on YouTube ↗</a></div></div>').join('') +
    '</div><p class="ks-note">Videos are from public YouTube channels. If one does not play here, use “Open on YouTube”. SurakshaSetu does not own these videos.</p>';

  const links = list => '<div class="ks-grid">' + list.map((l, i) =>
    '<a class="ks-link" style="--i:' + i + '" href="' + esc(l[1]) + '" target="_blank" rel="noopener"><div class="ic">' + icon(l[2]) + '</div><div><b>' + esc(l[0]) + '</b><span>' + esc(l[3]) + '</span></div><i class="arrow">→</i></a>').join('') + '</div>';

  const helplines = list => '<div class="ks-grid">' + list.map((h, i) =>
    '<a class="ks-hl" style="--i:' + i + '" href="' + esc(h[2]) + '"><div class="no">' + esc(h[0]) + '</div><div><b>' + esc(h[1]) + '</b></div><span class="call">CALL</span></a>').join('') + '</div>';

  const steps = list => '<div class="ks-steps">' + list.map((s, i) =>
    '<div class="ks-step" style="--i:' + i + '"><div class="n">' + (i + 1) + '</div><div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div></div>').join('') + '</div>';

  const posters = list => '<div class="ks-posters" id="ks-posters">' + list.map((p, i) =>
    '<div class="ks-poster' + (i ? '' : ' on') + '" style="background:linear-gradient(135deg,' + p.c[0] + ',' + p.c[1] + ')"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>' +
    '<div class="pic">' + icon(p.ic) + '</div><span class="kick">' + esc(p.k) + '</span><h3>' + esc(p.h) + '</h3><p>' + esc(p.p) + '</p><span class="tagc">' + esc(p.t) + '</span></div>').join('') +
    '<div class="ks-pdots">' + list.map((p, i) => '<i class="' + (i ? '' : 'on') + '" data-p="' + i + '"></i>').join('') + '</div></div>' +
    '<p class="ks-note">Campaign posters, tap the dots to browse. Screenshot and share them in your college or community groups.</p>';

  function initPosters(root) {
    const box = root.querySelector('#ks-posters'); if (!box) return;
    const ps = [...box.querySelectorAll('.ks-poster')], ds = [...box.querySelectorAll('.ks-pdots i')]; let n = 0;
    const go = i => { n = (i + ps.length) % ps.length; ps.forEach((p, k) => p.classList.toggle('on', k === n)); ds.forEach((d, k) => d.classList.toggle('on', k === n)); };
    ds.forEach((d, k) => d.addEventListener('click', () => { go(k); }));
    timers.push(setInterval(() => go(n + 1), 5200));
  }

  const signsGallery = () => '<p class="sub">Tap a sign to flip it. Circles tell you what to do or not do, triangles warn you, rectangles inform you.</p><div class="ks-signs">' + SIGNS.map((s, i) =>
    '<div class="ks-sg" style="--i:' + i + '" tabindex="0" role="button"><div class="in"><div class="f">' + signSVG(s[0]) + '<small>' + esc(s[3]) + '</small></div><div class="b"><b>' + esc(s[1]) + '</b><span>' + esc(s[2]) + '</span></div></div></div>').join('') + '</div>';

  /* ---------- chat bot (answers from the local knowledge base) ---------- */
  const STOP = new Set(['what', 'is', 'how', 'to', 'do', 'i', 'a', 'the', 'of', 'my', 'me', 'can', 'in', 'and', 'or', 'it', 'for', 'on', 'are', 'does', 'if', 'about']);
  function botAnswer(q, kb) {
    const t = ' ' + q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' '; let best = null, bs = 0;
    for (const e of kb) {
      let s = 0;
      for (const w of e.k.split(' ')) {
        if (!w || STOP.has(w)) continue;
        if (w.length <= 3 ? t.includes(' ' + w + ' ') : t.includes(w.slice(0, Math.max(4, w.length - 2)))) s += w.length > 3 ? 2 : 1;
      }
      if (s > bs) { bs = s; best = e; }
    }
    return bs > 0 ? best.a : null;
  }
  const URGENT = /(in danger|following me|being followed|attacked|attacking|being hit|beating me|bleeding|kidnap|help me now)/i;
  const SELFHARM = /(suicid|kill myself|want to die|end my life|hurt myself)/i;
  const chatLog = {};
  function chatHTML(sec, d) {
    return '<div class="ks-chat" data-chat="' + sec + '"><div class="hd"><div class="av2">' + icon('chat') + '</div><div><b>Ask SurakshaSetu</b><span>Instant answers • general information, not legal advice</span></div></div>' +
      '<div class="ks-msgs" id="ks-msgs"></div><div><div class="ks-chips">' + d.chips.map(c => '<button type="button" data-chip="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<form id="ks-form" autocomplete="off"><input id="ks-in" maxlength="300" placeholder="Type your question…" aria-label="Your question"><button class="btn primary" type="submit">Send</button></form></div></div>';
  }
  function initChat(root, sec, d) {
    const box = root.querySelector('#ks-msgs'), inp = root.querySelector('#ks-in');
    const log = chatLog[sec] = chatLog[sec] || [{ who: 'bot', t: d.hello }];
    const bub = (who, t) => { const b = document.createElement('div'); b.className = 'ks-bub ' + who; b.textContent = t; box.appendChild(b); box.scrollTop = box.scrollHeight; return b; };
    log.forEach(m => bub(m.who, m.t));
    function ask(q) {
      q = q.trim(); if (!q) return;
      log.push({ who: 'me', t: q }); bub('me', q);
      const ty = document.createElement('div'); ty.className = 'ks-bub bot ks-typing'; ty.innerHTML = '<i></i><i></i><i></i>'; box.appendChild(ty); box.scrollTop = box.scrollHeight;
      setTimeout(() => {
        ty.remove(); let a;
        if (SELFHARM.test(q)) a = 'I’m really sorry you’re feeling this way. You deserve support right now. Please call Tele-MANAS (14416), free and 24×7, or 112 if you are in immediate danger. If you can, tell someone near you so you are not alone.';
        else {
          a = botAnswer(q, d.kb) || 'I don’t have a ready answer for that yet. Try one of the suggestions below, or rephrase. For personal legal advice, free help is available from NALSA (15100).';
          if (URGENT.test(q)) a = 'If you are in immediate danger, call 112 now.\n\n' + a;
        }
        log.push({ who: 'bot', t: a }); bub('bot', a);
      }, 550 + Math.random() * 350);
    }
    root.querySelector('#ks-form').addEventListener('submit', e => { e.preventDefault(); const v = inp.value; inp.value = ''; ask(v); });
    root.addEventListener('click', e => { const c = e.target.closest('[data-chip]'); if (c) ask(c.dataset.chip); });
  }

  /* ---------- quiz engine ---------- */
  function confetti(cv) {
    const x = cv.getContext('2d'); cv.width = cv.clientWidth; cv.height = cv.clientHeight;
    const cols = ['#35e0c2', '#6c8cff', '#ffb347', '#ff7aa8', '#9b7bff'];
    const P = Array.from({ length: 90 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, s: 4 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6 }));
    let f = 0; (function tick() { x.clearRect(0, 0, cv.width, cv.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .15; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 160) requestAnimationFrame(tick); else x.clearRect(0, 0, cv.width, cv.height); })();
  }
  function startQuiz(el, qs, onRestart) {
    let i = 0, score = 0, done = false;
    function render() {
      if (i >= qs.length) return result();
      const q = qs[i]; done = false;
      el.innerHTML = '<div class="ks-qmeta"><span>Question <b>' + (i + 1) + '</b> of ' + qs.length + '</span><span>Score <b>' + score + '</b></span></div><div class="ks-qbar"><i style="width:' + (i / qs.length * 100) + '%"></i></div>' +
        '<div class="ks-qstage">' + (q.svg ? '<div class="ks-sign">' + q.svg + '</div>' : '') + '<div class="ks-qq">' + esc(q.q) + '</div><div class="ks-opts">' +
        q.o.map((o, k) => '<button type="button" data-o="' + k + '">' + esc(o) + '</button>').join('') + '</div><div id="ks-fb"></div></div>';
    }
    function result() {
      const pct = Math.round(score / qs.length * 100);
      const msg = pct >= 90 ? 'Champion! You really know this.' : pct >= 70 ? 'Great job! Almost perfect.' : pct >= 50 ? 'Good start. Review and try again.' : 'Keep learning. Every question teaches something.';
      el.innerHTML = '<canvas class="conf"></canvas><div class="ks-result"><div class="ks-score" style="--p:0"><span>' + pct + '%</span></div><h3>' + msg + '</h3><p class="sub">You got ' + score + ' of ' + qs.length + ' correct.</p><button type="button" class="btn primary" id="ks-again">Play again</button></div>';
      const sc = el.querySelector('.ks-score'); let p = 0; const tm = setInterval(() => { p = Math.min(pct, p + 3); sc.style.setProperty('--p', p); if (p >= pct) clearInterval(tm); }, 18);
      if (pct >= 70) confetti(el.querySelector('canvas'));
    }
    el.onclick = e => {
      if (e.target.closest('#ks-again')) { onRestart(); return; }
      if (e.target.closest('#ks-next')) { i++; render(); return; }
      const b = e.target.closest('[data-o]'); if (!b || done) return; done = true;
      const q = qs[i], pick = +b.dataset.o, ok = pick === q.a; if (ok) score++;
      el.querySelectorAll('[data-o]').forEach(x => { x.disabled = true; if (+x.dataset.o === q.a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      el.querySelector('.ks-qbar i').style.width = ((i + 1) / qs.length * 100) + '%';
      el.querySelector('#ks-fb').innerHTML = '<div class="ks-exp ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Correct! ' : 'Not quite. ') + '</b>' + esc(q.e) + '</div><div style="margin-top:12px"><button type="button" class="btn primary" id="ks-next">' + (i + 1 >= qs.length ? 'See result' : 'Next →') + '</button></div>';
    };
    render();
  }
  const quizShell = '<div class="ks-quiz" id="ks-quiz"></div>';

  function roadQuestions() {
    const sg = shuffle(SIGNS).slice(0, 6).map(s => {
      const wrong = shuffle(SIGNS.filter(x => x[0] !== s[0])).slice(0, 3).map(x => x[1]);
      const o = shuffle([s[1]].concat(wrong));
      return { q: 'What does this sign mean?', svg: signSVG(s[0]), o, a: o.indexOf(s[1]), e: s[1] + ' (' + s[3].toLowerCase() + '): ' + s[2] };
    });
    const ex = shuffle(ROAD_QUIZ_EXTRA).slice(0, 4);
    return shuffle(sg.concat(ex));
  }

  /* ---------- section definitions ---------- */
  const yn = (arr, labels) => arr.map(x => ({ q: x.q, o: labels, a: x.a, e: x.e }));
  const SECS = {
    law: {
      title: 'Know Your <em>Law</em>', tag: 'Your rights, FIRs, complaints and cybercrime reporting, explained in plain language. Ask questions, watch short videos and bust common myths.', ic: 'scale',
      cta: [['Ask the law guide', 'chat'], ['Civil vs criminal', 'civil']],
      tabs: [
        ['learn', 'Explainers', 'book', () => ({ html: cards(LAW.learn) })],
        ['civil', 'Civil vs Criminal', 'users', () => ({
          html: '<div class="ks-cmp"><div class="civ"><h4>⚖️ Civil dispute</h4><ul>' + LAW.civil.civil.map(x => '<li>' + x + '</li>').join('') + '</ul></div><div class="cri"><h4>🚨 Criminal matter</h4><ul>' + LAW.civil.crim.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>' +
            '<div class="ks-note">' + esc(LAW.civil.note) + '</div><h3>Quick game: civil or criminal?</h3>' + quizShell,
          init: r => { const run = () => startQuiz(r.querySelector('#ks-quiz'), shuffle(yn(LAW.civil.game, ['Civil', 'Criminal'])), run); run(); }
        })],
        ['chat', 'Chat', 'chat', () => ({ html: chatHTML('law', LAW), init: r => initChat(r, 'law', LAW) })],
        ['videos', 'Videos', 'play', () => ({ html: videos(LAW.videos) })],
        ['faq', 'FAQs', 'help', () => ({ html: accordion(LAW.faq), init: initFaq })],
        ['myth', 'Myth vs Fact', 'bulb', () => ({ html: myths(LAW.myths) })],
        ['links', 'Official links', 'link', () => ({ html: '<p class="sub">Official government sources for the actual text of the law and for free legal help.</p>' + links(LAW.links) })]
      ]
    },
    road: {
      title: 'Road Safety <em>Academy</em>', tag: 'Traffic rules, helmets, seat belts, road signs and what to do in an emergency. Learn it, quiz yourself, and share it.', ic: 'road',
      cta: [['Take the sign quiz', 'quiz'], ['Browse road signs', 'signs']],
      tabs: [
        ['learn', 'Learn', 'book', () => ({ html: cards(ROAD.learn) })],
        ['signs', 'Road signs', 'road', () => ({ html: signsGallery() })],
        ['quiz', 'Sign quiz', 'star', () => ({ html: '<p class="sub">10 quick questions: road signs and everyday rules. New questions every round.</p>' + quizShell, init: r => { const run = () => startQuiz(r.querySelector('#ks-quiz'), roadQuestions(), run); run(); } })],
        ['videos', 'Videos', 'play', () => ({ html: videos(ROAD.videos) })],
        ['chat', 'Chat', 'chat', () => ({ html: chatHTML('road', ROAD), init: r => initChat(r, 'road', ROAD) })],
        ['posters', 'Campaigns', 'mega', () => ({ html: posters(POSTERS.road), init: initPosters })]
      ]
    },
    women: {
      title: 'Women’s Safety <em>&amp; Support</em>', tag: 'Safety guides, harassment-reporting help, digital safety tips and verified support services. Private, practical and judgement-free.', ic: 'shield',
      cta: [['Helplines', 'help'], ['Spot the signs', 'signs']],
      tabs: [
        ['learn', 'Safety guides', 'book', () => ({ html: cards(WOMEN.learn) })],
        ['signs', 'Spot the signs', 'eye', () => ({ html: spotHTML(), init: initSpot })],
        ['evidence', 'Evidence & help', 'clip', () => ({ html: '<p class="sub">If you decide to report, evidence makes your case stronger. These steps help.</p>' + steps(WOMEN.evidence) +
            '<div class="ks-note">You do not need to decide today. You can collect evidence now and report later. A woman officer can record your statement, and you can ask for help at any time through <b>181</b> or <b>112</b>.</div><h3>Need to file now?</h3><div class="ks-cta"><button class="btn primary" data-go="file">File a case</button> <button class="btn" data-go="efir">Register an e-FIR</button> <button class="btn" data-go="chat">Chat with police</button></div>' })],
        ['help', 'Helplines', 'phone', () => ({ html: '<p class="sub">Tap a number to call from your phone. All are free unless your operator says otherwise.</p>' + helplines(WOMEN.helplines) + '<h3>Support services &amp; portals</h3>' + links(WOMEN.links) })],
        ['work', 'Workshops', 'users', () => ({ html: '<p class="sub">Self-defence is about awareness first. Here is how to find genuine, safe training near you.</p><div class="ks-grid">' + WOMEN.workshops.map((w, i) =>
          '<div class="ks-card" style="--i:' + i + ';cursor:default"><div class="ic">' + icon(i === 0 ? 'badge' : i === 1 ? 'school' : i === 2 ? 'map' : 'check') + '</div><b>' + esc(w[0]) + '</b><p>' + esc(w[1]) + '</p>' + (w[2] ? '<p style="margin-top:10px"><button class="btn primary" data-go="' + w[2] + '">Book an appointment</button></p>' : '') + '</div>').join('') + '</div><div class="ks-note">We do not list specific dates or paid programmes here. Always confirm details with the organiser and prefer police, college or government-supported programmes.</div>' })],
        ['videos', 'Videos', 'play', () => ({ html: videos(WOMEN.videos) })],
        ['chat', 'Chat', 'chat', () => ({ html: chatHTML('women', WOMEN), init: r => initChat(r, 'women', WOMEN) })]
      ]
    },
    rag: {
      title: 'Anti-Ragging <em>&amp; Campus Safety</em>', tag: 'Understand ragging, bullying and harassment, know your rights, and report safely, anonymously if you want.', ic: 'school',
      cta: [['Report ragging', 'report'], ['What counts as ragging?', 'learn']],
      tabs: [
        ['learn', 'Know the rules', 'book', () => ({ html: cards(RAG.learn) })],
        ['report', 'Report / Track', 'flag', () => ({ html: reportHTML(), init: initReport })],
        ['chat', 'Chat', 'chat', () => ({ html: chatHTML('rag', RAG), init: r => initChat(r, 'rag', RAG) })],
        ['channels', 'Complaint channels', 'link', () => ({ html: '<p class="sub">Use whichever channel feels safest. You can use more than one.</p><div class="ks-grid">' + RAG.channels.map((c, i) => {
            const url = c[3]; const inner = '<div class="ic">' + icon(c[2]) + '</div><div><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></div>';
            return url.startsWith('http') || url.startsWith('tel:') ? '<a class="ks-link" style="--i:' + i + '" href="' + esc(url) + '"' + (url.startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '>' + inner + '<i class="arrow">→</i></a>'
              : '<div class="ks-link" style="--i:' + i + ';cursor:default" ' + (url === 'Report tab' ? 'data-tab="report"' : '') + '>' + inner + (url === 'Report tab' ? '<button class="btn primary" data-tab="report">Open</button>' : '') + '</div>'; }).join('') + '</div>' })],
        ['quiz', 'Quiz', 'star', () => ({ html: '<p class="sub">Is it ragging or not? Test yourself, and share it with your friends.</p>' + quizShell, init: r => { const run = () => startQuiz(r.querySelector('#ks-quiz'), shuffle(yn(RAG.quiz, ['Yes, it is ragging', 'No, it is fine'])), run); run(); } })],
        ['posters', 'Posters', 'mega', () => ({ html: posters(POSTERS.rag), init: initPosters })],
        ['videos', 'Videos', 'play', () => ({ html: videos(RAG.videos) })]
      ]
    }
  };

  function initFaq(r) {
    const q = r.querySelector('#ks-faqq'); if (!q) return;
    q.addEventListener('input', () => { const t = q.value.toLowerCase(); r.querySelectorAll('.ks-q').forEach(x => { x.style.display = x.textContent.toLowerCase().includes(t) ? '' : 'none'; }); });
  }

  /* spot the signs */
  function spotHTML() {
    return '<p class="sub">Tick anything that has happened to you or someone you know. This is private, nothing is stored or sent.</p><div class="ks-sign-list" id="ks-spot">' +
      WOMEN.signs.items.map((s, i) => '<button type="button" class="ks-chk" data-i="' + i + '"><span class="bx">✓</span><span><b>' + esc(s[0]) + '</b><span>' + (s[1] === 'stalking' ? 'Stalking' : s[1] === 'harassment' ? 'Harassment' : 'Coercive behaviour') + '</span></span></button>').join('') +
      '</div><div class="ks-verdict" id="ks-ver"><b id="ks-vt">Tick the boxes above</b><div class="ks-meter"><i id="ks-vm"></i></div><span class="sub" id="ks-vd">These are warning signs, not a diagnosis. Only you know what feels safe.</span></div>';
  }
  function initSpot(r) {
    const list = r.querySelector('#ks-spot'), n = WOMEN.signs.items.length;
    list.addEventListener('click', e => {
      const b = e.target.closest('.ks-chk'); if (!b) return; b.classList.toggle('on');
      const c = list.querySelectorAll('.ks-chk.on').length, v = r.querySelector('#ks-ver');
      r.querySelector('#ks-vm').style.width = (c / n * 100) + '%';
      r.querySelector('#ks-vt').textContent = c === 0 ? 'Nothing selected' : c < 3 ? 'Some concerning behaviour' : 'A pattern of concern';
      r.querySelector('#ks-vd').textContent = c === 0 ? WOMEN.signs.low : c < 3 ? WOMEN.signs.mid : WOMEN.signs.high;
      v.classList.toggle('warn', c > 0);
    });
  }

  /* ragging report + tracking */
  const RTYPES = ['Verbal abuse or humiliation', 'Physical harm or forced exercise', 'Forced to do tasks or hand over money', 'Sexual or gender-based harassment', 'Cyber-bullying or online ragging', 'Threats or intimidation', 'Social exclusion or forced isolation', 'Other'];
  const RSTAT = ['Received', 'Under review', 'Forwarded to the college Anti-Ragging Committee', 'Action taken', 'Closed'];
  function reportHTML() {
    const saved = store.get('ss_rag_codes') || [];
    return '<div class="ks-note">⚠️ <b>In danger or hurt right now?</b> Call <a href="tel:112" style="color:var(--ac)">112</a> or the anti-ragging helpline <a href="tel:18001805522" style="color:var(--ac)">1800-180-5522</a> first. This form is for reporting, not emergencies.</div>' +
      '<div class="panel ks-form" id="ks-rform"><h3>Report an incident</h3><p class="sub">Tell us what happened in your own words. Share only what you are comfortable with.</p>' +
      '<label class="ks-switch on" id="ks-anon"><input type="checkbox" id="rg-anon" checked><div><b>Report anonymously</b><span>Your account is not linked to the report and no contact details are stored. You get a tracking code to follow progress.</span></div></label>' +
      '<label for="rg-college">College / university *</label><input id="rg-college" maxlength="150" placeholder="e.g. ABC Institute of Technology">' +
      '<div class="row"><div><label for="rg-city">City</label><input id="rg-city" maxlength="80"></div><div><label for="rg-state">State</label><input id="rg-state" maxlength="80"></div></div>' +
      '<label for="rg-type">What kind of incident? *</label><select id="rg-type"><option value="">Choose…</option>' + RTYPES.map(t => '<option>' + esc(t) + '</option>').join('') + '</select>' +
      '<label for="rg-when">Where and when did it happen?</label><input id="rg-when" maxlength="200" placeholder="e.g. Hostel block B, 10 Oct at night">' +
      '<label for="rg-desc">What happened? *</label><textarea id="rg-desc" maxlength="3000" placeholder="Describe the incident (at least 20 characters)"></textarea>' +
      '<label for="rg-who">Who was involved? (optional)</label><input id="rg-who" maxlength="300" placeholder="Names, year/course, or description. Leave blank if unsure">' +
      '<div id="rg-contactbox" style="display:none"><label for="rg-contact">How can we reach you? (optional)</label><input id="rg-contact" maxlength="120" placeholder="Phone or email"></div>' +
      '<label class="check" style="display:flex;gap:10px;align-items:center;margin-top:12px"><input type="checkbox" id="rg-urgent" style="width:auto"> <span>This is urgent, someone may be in danger</span></label>' +
      '<div class="banner" id="rg-msg"></div><div style="margin-top:14px"><button class="btn primary" id="rg-send" type="button">Submit report</button></div></div>' +
      '<div class="panel" id="ks-trk"><h3>Track a report</h3><p class="sub">Enter your tracking code (it starts with AR-).</p><div class="ks-search" style="margin-top:10px"><input id="rg-code" maxlength="20" placeholder="AR-XXXXXXXX" style="text-transform:uppercase"><button class="btn primary" id="rg-check" type="button">Check status</button></div>' +
      (saved.length ? '<div class="ks-chips" style="padding:12px 0 0">' + saved.map(c => '<button type="button" data-code="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' : '') + '<div id="rg-status"></div></div>';
  }
  function initReport(r) {
    const $r = id => r.querySelector('#' + id);
    const anon = $r('rg-anon'), tgl = () => { $r('ks-anon').classList.toggle('on', anon.checked); $r('rg-contactbox').style.display = anon.checked ? 'none' : ''; };
    anon.addEventListener('change', tgl); tgl();
    $r('rg-send').addEventListener('click', async () => {
      const btn = $r('rg-send'), v = id => $r(id).value.trim();
      if (v('rg-college').length < 3) return banner('rg-msg', false, 'Please enter your college or university.');
      if (!v('rg-type')) return banner('rg-msg', false, 'Please choose what kind of incident it was.');
      if (v('rg-desc').length < 20) return banner('rg-msg', false, 'Please describe what happened (at least 20 characters).');
      btn.disabled = true; btn.textContent = 'Submitting…';
      const res = await post('/api/ragging', { college: v('rg-college'), city: v('rg-city'), state: v('rg-state'), type: v('rg-type'), happenedAt: v('rg-when'), description: v('rg-desc'), accused: v('rg-who'), contact: v('rg-contact'), anonymous: anon.checked ? 'yes' : 'no', urgent: $r('rg-urgent').checked ? 'yes' : 'no' });
      btn.disabled = false; btn.textContent = 'Submit report';
      if (!res.ok) return banner('rg-msg', false, res.data.message || 'Could not submit. Please try again.');
      const code = res.data.code, list = store.get('ss_rag_codes') || []; list.unshift(code); store.set('ss_rag_codes', list.slice(0, 10));
      $r('ks-rform').innerHTML = '<div class="ks-result"><div style="font-size:3rem">✅</div><h3>Your report has been received</h3><p class="sub">Save this tracking code. ' + (res.data.anonymous ? 'It is the <b>only</b> way to follow an anonymous report.' : 'You can also find it here later.') + '</p><div class="ks-code">' + esc(code) + '</div>' +
        '<button class="btn" type="button" id="rg-copy">Copy code</button><p class="sub">The admin team will review it and forward it to the right authority. If you are in danger, call 112.</p></div>';
      $r('rg-copy').addEventListener('click', () => { try { navigator.clipboard.writeText(code); toast('Code copied'); } catch (e) { toast('Select and copy the code'); } });
      $r('rg-code').value = code;
    });
    async function check(code) {
      const out = $r('rg-status'); code = (code || '').trim().toUpperCase(); if (!code) { out.innerHTML = ''; return; }
      out.innerHTML = '<p class="sub" style="margin-top:12px">Checking…</p>';
      let d = null, ok = false;
      try { const x = await fetch(BASE + '/api/ragging?code=' + encodeURIComponent(code), { credentials: 'same-origin' }); ok = x.ok; d = await x.json(); } catch (e) { d = { message: 'Cannot reach the server.' }; }
      if (!ok) { out.innerHTML = '<div class="banner bad" style="display:block">' + esc((d && d.message) || 'Not found.') + '</div>'; return; }
      const idx = Math.max(0, RSTAT.indexOf(d.status));
      out.innerHTML = '<div style="margin-top:14px"><b>' + esc(d.code) + '</b> • ' + esc(d.type) + ' • ' + esc(d.college) + '<div class="ks-track">' + RSTAT.map((s, i) => '<div class="st ' + (i <= idx ? 'done' : '') + '">' + esc(s.replace('Forwarded to the college Anti-Ragging Committee', 'Forwarded to Committee')) + '</div>').join('') + '</div><p class="sub" style="margin-top:8px">Last update: ' + esc(when(d.updatedAt)) + '</p></div>';
    }
    $r('rg-check').addEventListener('click', () => check($r('rg-code').value));
    r.addEventListener('click', e => { const c = e.target.closest('[data-code]'); if (c) { $r('rg-code').value = c.dataset.code; check(c.dataset.code); } });
  }

  /* ---------- mounting + events ---------- */
  const current = {};
  function mount(sec) {
    const d = SECS[sec], pane = document.getElementById('t-' + sec); if (!pane) return;
    if (!pane.dataset.ready) {
      pane.dataset.ready = '1';
      pane.innerHTML = '<div class="ks" data-sec="' + sec + '"><div class="ks-hero"><span class="ks-ring"></span><span class="ks-ring r2"></span><div class="ks-big">' + icon(d.ic) + '</div><h1>' + d.title + '</h1><p>' + esc(d.tag) + '</p>' +
        '<div class="ks-cta">' + d.cta.map((c, i) => '<button class="btn ' + (i ? '' : 'primary') + '" data-tab="' + c[1] + '">' + esc(c[0]) + '</button>').join('') + '</div><div class="ks-sos" style="margin-top:14px">' +
        SOS[sec].map(s => '<a href="' + s[2] + '">' + icon('phone') + '<span>' + esc(s[0]) + ' · ' + esc(s[1]) + '</span></a>').join('') + '</div></div>' +
        '<div class="ks-tabs" role="tablist">' + d.tabs.map(t => '<button type="button" role="tab" data-tab="' + t[0] + '">' + icon(t[2]) + esc(t[1]) + '</button>').join('') + '</div><div class="ks-body"></div></div>';
      pane.addEventListener('click', e => onClick(e, sec, pane));
      pane.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.ks-card,.ks-myth,.ks-sg')) { e.preventDefault(); e.target.click(); } });
    }
    setTab(sec, current[sec] || d.tabs[0][0]);
  }
  function setTab(sec, key) {
    clearTimers();
    const d = SECS[sec], pane = document.getElementById('t-' + sec), t = d.tabs.find(x => x[0] === key) || d.tabs[0];
    current[sec] = t[0];
    pane.querySelectorAll('.ks-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t[0]));
    const old = pane.querySelector('.ks-body'), body = document.createElement('div'), out = t[3]();
    body.className = 'ks-body'; body.innerHTML = out.html; old.replaceWith(body); // fresh element each time: restarts the animation and drops old listeners
    if (out.init) out.init(body);
    const act = pane.querySelector('.ks-tabs button.on'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function onClick(e, sec, pane) {
    const tb = e.target.closest('[data-tab]'); if (tb && pane.contains(tb)) { setTab(sec, tb.dataset.tab); if (tb.closest('.ks-hero')) pane.querySelector('.ks-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const card = e.target.closest('.ks-card'); if (card && !e.target.closest('a,button') && card.querySelector('.full')) { const was = card.classList.contains('open'); pane.querySelectorAll('.ks-card.open').forEach(c => { c.classList.remove('open'); const m = c.querySelector('.more'); if (m) m.textContent = 'Read more →'; }); if (!was) { card.classList.add('open'); card.querySelector('.more').textContent = 'Show less ↑'; card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
    const q = e.target.closest('.ks-q > button'); if (q) { q.parentNode.classList.toggle('open'); return; }
    const m = e.target.closest('.ks-myth'); if (m) { m.classList.toggle('flip'); return; }
    const sg = e.target.closest('.ks-sg'); if (sg) { sg.classList.toggle('flip'); return; }
    const v = e.target.closest('.scr[data-vid]'); if (v) { const f = document.createElement('iframe'); f.src = 'https://www.youtube-nocookie.com/embed/' + v.dataset.vid + '?autoplay=1&rel=0'; f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen = true; f.title = 'Video'; v.replaceWith(f); }
  }

  /* override show() so the four new tabs render when opened */
  const baseShow = window.show;
  window.show = function (t) { clearTimers(); baseShow(t); if (SECS[t]) mount(t); };

  /* home strip with the four new sections */
  const home = document.querySelector('#t-home .hello');
  if (home) {
    const items = [['law', 'Know Your Law', 'FIRs, rights, complaints and cybercrime in plain words.', 'scale', '#6c8cff'], ['road', 'Road Safety Academy', 'Signs, quizzes and rules that save lives.', 'road', '#ffb347'],
      ['women', 'Women’s Safety & Support', 'Guides, evidence tips and verified helplines.', 'shield', '#ff7aa8'], ['rag', 'Anti-Ragging & Campus Safety', 'Know your rights and report safely, even anonymously.', 'school', '#35e0c2']];
    const w = document.createElement('div');
    w.innerHTML = '<h2 style="margin:6px 0 12px">Safety Academy</h2><div class="ks-home">' + items.map(i => '<button type="button" class="ks-hc" data-go="' + i[0] + '" style="--c1:' + i[4] + '">' + icon(i[3]) + '<b>' + i[1] + '</b><span>' + i[2] + '</span></button>').join('') + '</div>';
    home.after(w);
  }
  const start = location.hash.slice(1); if (SECS[start]) window.show(start);
})();
