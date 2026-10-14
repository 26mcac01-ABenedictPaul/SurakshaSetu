/* Citizen page: "Report a concern" and "Community" tabs.
   Loaded after sections.js, so it chains onto the show() that sections.js already wraps.
   Talks to /api/concern and /api/community (ConcernServlet / CommunityServlet). */
(function () {
  const g = id => document.getElementById(id);
  const cnPane = g('t-concern'), cmPane = g('t-community');
  if (!cnPane || !cmPane) return;

  const CTYPES = ['Accident', 'Fight', 'Quarrel / argument', 'Fire or smoke', 'Suspicious activity', 'Other'];
  const ITYPES = ['Clean-up drive', 'Awareness campaign', 'Neighbourhood watch', 'Blood donation / health camp',
    'Cultural parade', 'Peaceful rally / march', 'Candlelight vigil', 'Other community event'];
  const PERMIT = ['Cultural parade', 'Peaceful rally / march', 'Candlelight vigil'];
  const options = list => list.map(t => '<option>' + esc(t) + '</option>').join('');
  const localISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  const nowLocal = () => localISO(new Date()).slice(0, 16);
  const maxDate = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return localISO(d).slice(0, 10); };
  const prettyDate = (d, t) => { const x = new Date(d + 'T00:00'); return (isNaN(x) ? esc(d) : x.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) + (t ? ' &middot; ' + esc(t) : ''); };

  /* ================= REPORT A CONCERN ================= */
  cnPane.innerHTML =
    '<div class="panel"><h2>Report a concern</h2>' +
    '<p class="hint" style="margin:-4px 0 8px">A quick alert for something happening right now: an accident, a fight, a fire, anything suspicious. Add photos, a short video or a voice note so the police can see what you see. <b>For an emergency, dial 112 first.</b></p>' +
    '<div class="grid2">' +
    '<div><label for="cn-type">What is happening?</label><select id="cn-type"><option value="">Choose…</option>' + options(CTYPES) + '</select></div>' +
    '<div><label for="cn-when">When did it happen?</label><input id="cn-when" type="datetime-local"></div>' +
    '<div><label for="cn-loc">Where?</label><input id="cn-loc" placeholder="Street / landmark, city" maxlength="300"></div>' +
    '<div><label>&nbsp;</label><button class="btn" id="cn-gps" type="button">\uD83D\uDCCD Use my current location</button></div>' +
    '</div>' +
    '<label for="cn-desc">What can you see? <span class="hint" style="display:inline">(optional if you attach a photo, video or voice note)</span></label>' +
    '<textarea id="cn-desc" maxlength="2000" placeholder="Describe what is happening, how many people are involved, anything that helps the police reach and help quickly."></textarea>' +
    '<label for="cn-files">Photos, short videos or voice notes (up to 5)</label>' +
    '<input id="cn-files" type="file" multiple accept="image/*,video/*,audio/*">' +
    '<div class="hint" id="cn-flist">Photos up to 5 MB, voice notes up to 10 MB, videos up to 25 MB.</div>' +
    '<label class="check"><input type="checkbox" id="cn-danger"><span><b>Someone is in immediate danger.</b> This marks the report as Critical for the police.</span></label>' +
    '<div style="margin-top:14px"><button class="btn primary" id="cn-send" type="button">Send alert</button></div>' +
    '<div class="banner" id="cn-msg"></div></div>' +
    '<div><h2>My reports</h2><div class="cases" id="cn-mine"><div class="empty">Loading…</div></div></div>';

  let lat = null, lng = null;
  g('cn-when').max = nowLocal();

  g('cn-files').addEventListener('change', e => {
    const fs = [...e.target.files];
    g('cn-flist').textContent = fs.length ? fs.length + ' file' + (fs.length > 1 ? 's' : '') + ' selected: ' + fs.map(f => f.name + ' (' + fsize(f.size) + ')').join(', ')
      : 'Photos up to 5 MB, voice notes up to 10 MB, videos up to 25 MB.';
  });

  g('cn-gps').addEventListener('click', () => {
    if (!navigator.geolocation) { banner('cn-msg', false, 'Location is not available in this browser. Please type the place.'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      lat = p.coords.latitude; lng = p.coords.longitude;
      if (!g('cn-loc').value.trim()) g('cn-loc').value = 'Near ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
      banner('cn-msg', true, 'Your location was captured and will be sent with the report.');
    }, () => banner('cn-msg', false, 'Could not get your location. Please type the place instead.'), { enableHighAccuracy: true, timeout: 10000 });
  });

  g('cn-send').addEventListener('click', async () => {
    const files = [...g('cn-files').files];
    if (!g('cn-type').value) { banner('cn-msg', false, 'Please choose what kind of incident it is.'); return; }
    if (g('cn-loc').value.trim().length < 3) { banner('cn-msg', false, 'Please tell us where it is happening.'); return; }
    if (files.length > 5) { banner('cn-msg', false, 'You can attach at most 5 files.'); return; }
    if (g('cn-desc').value.trim().length < 10 && !files.length) { banner('cn-msg', false, 'Add a photo, video or voice note, or describe what is happening (at least 10 characters).'); return; }
    const fd = new FormData();
    fd.append('type', g('cn-type').value);
    fd.append('description', g('cn-desc').value);
    fd.append('location', g('cn-loc').value);
    fd.append('occurredAt', g('cn-when').value);
    if (g('cn-danger').checked) fd.append('danger', 'yes');
    if (lat !== null) { fd.append('lat', lat); fd.append('lng', lng); }
    files.forEach(f => fd.append('media', f));
    const btn = g('cn-send'); btn.disabled = true; btn.textContent = 'Sending…';
    const r = await api('/api/concern', { method: 'POST', body: fd });
    btn.disabled = false; btn.textContent = 'Send alert';
    if (!r.ok) { banner('cn-msg', false, r.data.message || 'Something went wrong.'); return; }
    const rej = (r.data.rejected || []).map(x => x.name + ': ' + x.reason).join('  ');
    banner('cn-msg', true, 'Reported. Reference ' + (r.data.reference || '') + ' (' + (r.data.priority || '') + ').' + (rej ? ' Not attached: ' + rej : ''));
    g('cn-type').value = ''; g('cn-desc').value = ''; g('cn-loc').value = ''; g('cn-when').value = '';
    g('cn-files').value = ''; g('cn-danger').checked = false; lat = lng = null;
    g('cn-flist').textContent = 'Photos up to 5 MB, voice notes up to 10 MB, videos up to 25 MB.';
    loadMine();
  });

  async function loadMine() {
    g('cn-when').max = nowLocal();
    const r = await api('/api/concern'); if (!r.ok) return;
    g('cn-mine').innerHTML = r.data.length ? r.data.map(c => concernCard(c)).join('') : '<div class="empty">You have not reported any concerns yet.</div>';
  }

  /* ================= COMMUNITY ================= */
  cmPane.innerHTML =
    '<div id="cm-surveys"><div class="empty">Loading…</div></div>' +
    '<div><h2>Community initiatives</h2><p class="hint" style="margin:-4px 0 10px">Clean-up drives, awareness campaigns, neighbourhood watch and more, started by citizens. Join one or start your own.</p>' +
    '<div class="cases" id="cm-list"><div class="empty">Loading…</div></div></div>' +
    '<details class="panel cm-new"><summary>Start an initiative</summary>' +
    '<div class="grid2">' +
    '<div><label for="cm-title">Title</label><input id="cm-title" maxlength="100" placeholder="e.g. Lake clean-up this Sunday"></div>' +
    '<div><label for="cm-type">Type</label><select id="cm-type"><option value="">Choose…</option>' + options(ITYPES) + '</select></div>' +
    '<div><label for="cm-date">Date</label><input id="cm-date" type="date"></div>' +
    '<div><label for="cm-time">Time (optional)</label><input id="cm-time" type="time"></div>' +
    '<div><label for="cm-place">Place</label><input id="cm-place" maxlength="200" placeholder="Area / landmark"></div>' +
    '<div><label for="cm-city">City</label><input id="cm-city" maxlength="80" placeholder="City"></div>' +
    '</div>' +
    '<label for="cm-desc">Describe it</label><textarea id="cm-desc" maxlength="1500" placeholder="What is it, who should come, what to bring. At least 20 characters."></textarea>' +
    '<label class="check" id="cm-permwrap" style="display:none"><input type="checkbox" id="cm-permit"><span>I understand that a public gathering like this may need police permission, and I will check with my local station.</span></label>' +
    '<div style="margin-top:14px"><button class="btn primary" id="cm-create" type="button">Publish initiative</button></div></details>' +
    '<div class="banner" id="cm-msg"></div>';

  g('cm-date').min = nowLocal().slice(0, 10); g('cm-date').max = maxDate();
  g('cm-type').addEventListener('change', e => { g('cm-permwrap').style.display = PERMIT.indexOf(e.target.value) >= 0 ? 'flex' : 'none'; });

  g('cm-create').addEventListener('click', async () => {
    const r = await post('/api/community', {
      action: 'create', title: g('cm-title').value, type: g('cm-type').value, description: g('cm-desc').value,
      date: g('cm-date').value, time: g('cm-time').value, place: g('cm-place').value, city: g('cm-city').value,
      permit: g('cm-permit').checked ? 'yes' : 'no'
    });
    banner('cm-msg', r.ok, r.data.message || (r.ok ? 'Done.' : 'Something went wrong.'));
    if (r.ok) {
      ['cm-title', 'cm-desc', 'cm-date', 'cm-time', 'cm-place', 'cm-city'].forEach(i => g(i).value = '');
      g('cm-type').value = ''; g('cm-permit').checked = false; g('cm-permwrap').style.display = 'none';
      g('cm-create').closest('details').open = false;
      loadCommunity();
    }
  });

  const initCard = i => {
    const open = i.status === 'Open';
    const btn = !open ? '' : i.mine ? '<button class="btn" data-act="cancel" data-id="' + i.id + '">Cancel initiative</button>'
      : i.joined ? '<button class="btn" data-act="leave" data-id="' + i.id + '">Leave</button>'
        : '<button class="btn good" data-act="join" data-id="' + i.id + '">Join</button>';
    return '<div class="card"><div class="top"><b>' + esc(i.title) + '</b><span class="tag">' + esc(i.type) + '</span>' +
      (open ? '' : '<span class="chip Declined">' + esc(i.status) + '</span>') + (i.mine ? '<span class="chip Accepted">You organise</span>' : '') + '</div>' +
      '<div class="meta">\uD83D\uDCC5 ' + prettyDate(i.date, i.time) + ' &middot; \uD83D\uDCCD ' + esc(i.place) + ', ' + esc(i.city) + ' &middot; by <b>' + esc(i.organizer) + '</b></div>' +
      '<p>' + esc(i.description) + '</p>' +
      '<div class="meta">\uD83D\uDC65 ' + i.participants + ' joined</div>' + (btn ? '<div style="margin-top:10px">' + btn + '</div>' : '') + '</div>';
  };

  const surveyCard = s => {
    const done = s.myVote >= 0 || !s.open;
    const rows = s.options.map((o, k) => {
      if (!done) return '<button class="btn svopt" data-act="vote" data-sid="' + s.id + '" data-opt="' + k + '">' + esc(o.text) + '</button>';
      const pct = s.total ? Math.round(o.votes * 100 / s.total) : 0;
      return '<div class="svrow' + (k === s.myVote ? ' mine' : '') + '"><span>' + esc(o.text) + (k === s.myVote ? ' (your answer)' : '') + '</span><div class="svbar"><i style="width:' + pct + '%"></i></div><b>' + pct + '%</b></div>';
    }).join('');
    return '<div class="card"><div class="top"><b>' + esc(s.question) + '</b>' + (s.open ? '' : '<span class="chip Declined">Closed</span>') + '</div>' +
      '<div class="svwrap">' + rows + '</div><div class="meta" style="margin-top:8px">' + s.total + ' response' + (s.total === 1 ? '' : 's') + '</div></div>';
  };

  async function loadCommunity() {
    const r = await api('/api/community'); if (!r.ok) return;
    const sv = r.data.surveys || [], it = r.data.initiatives || [];
    g('cm-surveys').innerHTML = sv.length ? '<h2>Community surveys</h2><div class="cases">' + sv.map(surveyCard).join('') + '</div>' : '';
    g('cm-list').innerHTML = it.length ? it.map(initCard).join('') : '<div class="empty">No upcoming initiatives yet. Be the first to start one.</div>';
  }

  cmPane.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act; b.disabled = true;
    const body = act === 'vote' ? { action: 'vote', surveyId: b.dataset.sid, option: b.dataset.opt } : { action: act, initiativeId: b.dataset.id };
    const r = await post('/api/community', body);
    banner('cm-msg', r.ok, r.data.message || (r.ok ? 'Done.' : 'Something went wrong.'));
    loadCommunity();
  });

  /* ---- hook into tab switching (chains onto the show() sections.js wrapped) ---- */
  const prevShow = window.show;
  window.show = function (t) {
    prevShow(t);
    if (t === 'concern') loadMine();
    if (t === 'community') loadCommunity();
  };
  const start = location.hash.slice(1);
  if (start === 'concern' || start === 'community') window.show(start);
})();
