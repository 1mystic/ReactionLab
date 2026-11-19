/* Profile & content filters: permanently hide exams, chapters, types, difficulties, tags and GOC topics site-wide */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon } = RL;
  const PAGE = ['settings', 'Profile & filters'];
  RL.layout(...PAGE);
  $('#tIcon').innerHTML = icon.search;

  const GOC_TOPICS = ['Carbocation stability', 'Carbanion stability', 'Free radical stability', 'Alkene stability', 'Resonance & hyperconjugation',
    'Inductive effect', 'Aromaticity', 'Acidity', 'Basicity', 'Substituent effects (o/m/p)', 'Tautomerism & enol content',
    'Physical properties (bp, dipole, bond length)', 'Nucleophilicity', 'Leaving group ability', 'Electrophilicity & carbonyl reactivity',
    'SN1/SN2/E1/E2 reactivity', 'Electrophilic aromatic substitution', 'Rearrangements & migratory aptitude'];
  const everything = () => RL.reactions({ include: 'visible', ignorePrefs: true });
  const gocAll = () => (window.GOC_QUESTIONS || []).filter((q) => !RL.state.blacklisted.includes(q.id));

  const countBy = (list, fn) => { const m = new Map(); list.forEach((x) => [].concat(fn(x) || []).forEach((k) => m.set(k, (m.get(k) || 0) + 1))); return m; };
  const tagKey = (t) => String(t).toLowerCase();

  /* chip = "on" (dark) when shown; tapping toggles membership in the hidden list */
  function chipRow(el, key, values, counts, opts = {}) {
    const P = RL.prefs();
    el.innerHTML = values.map((v) => {
      const off = P[key].includes(v);
      const dot = opts.dots ? `<span class="cat-dot" style="background:${RL.CAT_COLORS[v] || '#ccc'}"></span>` : '';
      return `<button type="button" class="chip set-chip ${off ? 'off' : 'active'}" data-v="${esc(v)}" aria-pressed="${!off}" title="${off ? 'Hidden. Tap to show' : 'Shown. Tap to hide'}">
        ${dot}<span>${esc(opts.label ? opts.label(v) : v)}</span><span class="count">${counts.get(v) || 0}</span></button>`;
    }).join('');
    el.onclick = (e) => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      const v = b.dataset.v, cur = RL.prefs()[key];
      if (!cur.includes(v) && opts.keepOne && values.filter((x) => !cur.includes(x)).length <= 1) { RL.toast(`Keep at least one ${opts.keepOne} switched on`); return; }
      update(key, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    };
  }

  function update(key, list) {
    RL.state.prefs = { ...RL.prefs(), [key]: list };
    RL.save(); RL.layout(...PAGE); render();
  }

  function renderTags() {
    const all = everything(), P = RL.prefs();
    const counts = new Map(); const label = new Map();
    all.forEach((r) => (r.tags || []).forEach((t) => { const k = tagKey(t); counts.set(k, (counts.get(k) || 0) + 1); if (!label.has(k)) label.set(k, t); }));
    const hidden = P.tags.map(tagKey);
    $('#sTagsHidden').innerHTML = hidden.length ? hidden.map((k) => `<button type="button" class="chip set-chip off" data-t="${esc(k)}" title="Tap to show again">
      <span>${esc(label.get(k) || k)}</span><span class="count">${counts.get(k) || 0}</span>${icon.x}</button>`).join('')
      : '<span class="small muted">None. Every tag is shown.</span>';
    const q = $('#tagQ').value.trim().toLowerCase();
    const pool = [...counts.keys()].filter((k) => !hidden.includes(k) && (!q || k.includes(q))).sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
    const shown = q ? pool.slice(0, 80) : pool.slice(0, 40);
    $('#sTags').innerHTML = shown.map((k) => `<button type="button" class="chip set-chip active" data-t="${esc(k)}" title="Tap to hide reactions with this tag">
      <span>${esc(label.get(k))}</span><span class="count">${counts.get(k)}</span></button>`).join('') +
      (pool.length > shown.length ? `<span class="small muted" style="align-self:center">+${pool.length - shown.length} more, search to find them</span>` : '') +
      (!pool.length ? '<span class="small muted">No matching tags.</span>' : '');
  }
  const toggleTag = (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    const k = b.dataset.t, cur = RL.prefs().tags.map(tagKey);
    update('tags', cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]);
  };
  $('#sTagsHidden').onclick = toggleTag; $('#sTags').onclick = toggleTag;
  $('#tagQ').addEventListener('input', RL.debounce(renderTags, 120));

  function render() {
    const all = everything(), goc = gocAll();
    chipRow($('#sExams'), 'exams', RL.EXAMS, countBy(all, (r) => (r.exam && r.exam.length ? r.exam : RL.EXAMS)), { keepOne: 'exam' });
    chipRow($('#sCats'), 'categories', RL.CATEGORIES, countBy(all, (r) => r.category), { dots: true, keepOne: 'chapter' });
    chipRow($('#sKinds'), 'kinds', RL.KINDS, countBy(all, (r) => r.kind), { keepOne: 'reaction type' });
    chipRow($('#sDiff'), 'difficulties', RL.DIFFICULTIES, countBy(all, (r) => r.difficulty), { keepOne: 'difficulty', label: (v) => v[0].toUpperCase() + v.slice(1) });
    chipRow($('#sGoc'), 'gocTopics', GOC_TOPICS, countBy(goc, (q) => q.topic), { keepOne: 'GOC topic' });
    renderTags();

    const vis = RL.reactions({ include: 'visible' }).length;
    const gVis = goc.filter((q) => !RL.gocHiddenByPrefs(q)).length;
    const pct = all.length ? Math.round((100 * vis) / all.length) : 0;
    $('#summary').innerHTML = `
      <div class="score-ring" style="--p:${pct};--ring:${pct > 60 ? '#5fbf59' : pct > 25 ? '#e8b33c' : '#e5776a'}"><div><div><b>${vis}</b><div class="small muted">of ${all.length}</div></div></div></div>
      <div><div style="font-weight:600">Reactions visible</div>
        <div class="small muted">${gVis} of ${goc.length} curated GOC questions</div>
        <div class="small muted">${RL.prefsActive() ? 'Profile filters are on' : 'No filters, showing everything'}</div></div>`;
    $('#resetAll').disabled = !RL.prefsActive();
    const bl = RL.state.blacklisted.length, ar = RL.state.archived.length;
    $('#blInfo').textContent = `${bl} blacklisted (hidden everywhere) and ${ar} archived (hidden from practice) single reactions. Use Edit & Upload to hide or restore individual problems.`;
  }

  const nameIn = $('#pName');
  nameIn.value = RL.state.name || '';
  nameIn.addEventListener('change', () => { RL.state.name = nameIn.value.trim(); RL.save(); RL.layout(...PAGE); RL.toast('Name saved'); });
  $('#resetAll').onclick = () => {
    if (!confirm('Show everything again? This clears all profile filters.')) return;
    RL.state.prefs = RL.blankPrefs(); RL.save(); RL.layout(...PAGE); render(); RL.toast('All content is visible again');
  };
  render();
});
