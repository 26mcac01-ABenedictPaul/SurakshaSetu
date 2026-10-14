/* Investigation report form. Officers use it on a case they are investigating; the admin can use it too.
   The saved report feeds the admin crime dashboard (who, cause, outcome, accused details). Needs app.js (api, post, esc, banner). */
(function () {
  'use strict';
  const CAUSES = ['Financial gain', 'Personal enmity', 'Revenge', 'Dispute over money', 'Domestic dispute', 'Opportunity / carelessness', 'Organised gang', 'Substance abuse', 'Obsession', 'Cheating for profit', 'Unknown so far'];
  const OUTCOMES = ['Arrest made', 'Charge-sheet filed', 'Referred to court', 'Closed - insufficient evidence', 'Under further enquiry'];
  let areas = null;
  const $ = id => document.getElementById(id);

  function el() {
    let m = $('or-modal');
    if (!m) { m = document.createElement('div'); m.id = 'or-modal'; m.className = 'cr-modal'; document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) close(); }); }
    return m;
  }
  function close() { const m = $('or-modal'); if (m) { m.classList.remove('on'); m.innerHTML = ''; } }
  const sel = (list, v) => list.map(x => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('');

  function row() {
    const d = document.createElement('div'); d.className = 'cr-prow';
    d.innerHTML = '<button type="button" class="cr-x" style="font-size:1.1rem;top:4px;right:8px" aria-label="Remove">×</button>' +
      '<div class="two" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Name<input class="p-n" maxlength="80" placeholder="Full name"></label><label>Alias / nickname<input class="p-al" maxlength="60"></label></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px"><label>Age<input class="p-ag" type="number" min="1" max="119"></label><label>Gender<select class="p-g">' + sel(['Unknown', 'Male', 'Female', 'Other']) + '</select></label>' +
      '<label>Role in this case<select class="p-r">' + sel(['Suspect', 'Accused']) + '</select></label><label>Current status<select class="p-s">' + sel(['Suspect', 'Arrested', 'Absconding', 'Convicted', 'Released']) + '</select></label></div>' +
      '<label>Description (build, marks, vehicle, how they operate)<textarea class="p-d" maxlength="500" style="min-height:56px"></textarea></label>';
    d.querySelector('.cr-x').onclick = () => d.remove();
    return d;
  }

  async function openReport(id) {
    if (areas === null) { const r = await api('/api/crime?view=areas'); areas = r.ok ? r.data.map(x => x.name) : []; }
    const m = el();
    m.innerHTML = '<div class="cr-box"><button class="cr-x" aria-label="Close">×</button><h2>Investigation report · Case #' + esc(id) + '</h2>' +
      '<p class="hint" style="margin:0 0 10px">This is saved to the admin crime analytics. It is not shown to the citizen. Add everyone you know of, even if only a suspect.</p>' +
      '<div class="cr-form"><label>Cause of the crime<input id="or-c" list="or-causes" maxlength="160" placeholder="Choose or type"><datalist id="or-causes">' + CAUSES.map(c => '<option value="' + esc(c) + '">').join('') + '</datalist></label>' +
      '<label>What the investigation found<textarea id="or-s" maxlength="2000" placeholder="Facts found, evidence, witnesses, what happened"></textarea></label>' +
      '<label>Method used by the offender (optional)<input id="or-m" maxlength="300" placeholder="e.g. two-wheeler snatch and run"></label>' +
      '<div class="two"><label>Where it happened (area)<select id="or-a"><option value="">Not sure / use city centre</option>' + sel(areas) + '</select></label><label>Outcome<select id="or-o">' + sel(OUTCOMES) + '</select></label></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><b>Accused and suspects</b><button type="button" class="btn" id="or-add">＋ Add person</button></div><div id="or-p" style="display:grid;gap:10px"></div>' +
      '<div class="hint">Choosing "Under further enquiry" saves an interim report and keeps the case open. Any other outcome closes the case.</div>' +
      '<div class="actions"><button class="btn primary" id="or-go">Submit report</button><button class="btn" id="or-no">Cancel</button></div></div></div>';
    m.classList.add('on');
    m.querySelector('.cr-x').onclick = close; $('or-no').onclick = close;
    $('or-add').onclick = () => $('or-p').appendChild(row());
    $('or-go').onclick = async () => {
      const people = [...m.querySelectorAll('.cr-prow')].map(d => ({ name: d.querySelector('.p-n').value, alias: d.querySelector('.p-al').value, age: d.querySelector('.p-ag').value, gender: d.querySelector('.p-g').value,
        role: d.querySelector('.p-r').value, status: d.querySelector('.p-s').value, description: d.querySelector('.p-d').value })).filter(p => p.name.trim());
      $('or-go').disabled = true;
      const r = await post('/api/crime', { action: 'report', complaintId: id, cause: $('or-c').value, summary: $('or-s').value, modus: $('or-m').value, area: $('or-a').value, outcome: $('or-o').value, accused: JSON.stringify(people) });
      $('or-go').disabled = false;
      const b = $('cmsg') || $('msg'); if (b) banner(b.id, r.ok, r.data.message || 'Something went wrong.');
      if (!r.ok) { alert(r.data.message || 'Could not save the report.'); return; }
      close();
      if (typeof window.load === 'function') window.load();
      if (window.CR) window.CR.refresh(true);
    };
  }
  window.openReport = openReport;
})();
