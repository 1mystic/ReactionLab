RL.boot(() => {
  const { $, esc, icon } = RL;
  RL.layout('home', 'Dashboard');
  const pool = RL.reactions({ include: 'active' });
  const all = RL.reactions({ include: 'visible' });
  $("#heroCount").textContent = `${all.length} reactions · ${RL.visibleCategories().length} chapters · GOC lab`;
  // reflect profile filters in static copy
  const ex = RL.visibleExams();
  if ($('#heroPill')) $('#heroPill').textContent = `${(ex.length ? ex : RL.EXAMS).join(' · ')} · Organic`;
  if ($('#bankCount')) $('#bankCount').textContent = `${all.length} reactions`;
  $('#rotdBtn').innerHTML = icon.shuffle;

  // floating equations in hero
  const sample = RL.shuffle(pool.filter((r) => r.reagents && (r.reactants + r.products + r.reagents).length < 52)).slice(0, 2);
  $('#heroEqs').innerHTML = sample.map((r) => `<div class="eq-float"><div class="small" style="opacity:.7;margin-bottom:6px">${esc(r.name)}</div><div class="eq-fit">${RL.equation(r, 'none', false)}</div></div>`).join('');

  // stats
  const s = RL.stats();
  const tiles = [
    ['Reactions in bank', all.length, 'green'], ['Reactions practised', s.seen, 'white'],
    ['Average score', s.attempts ? s.avg + '%' : '-', 'lav'], ['Day streak', s.streak + (s.streak === 1 ? ' day' : ' days'), 'white']
  ];
  $('#stats').innerHTML = tiles.map(([l, v, c]) => `<div class="note-card ${c}" style="min-height:0;padding:22px"><div class="stat"><span class="small" style="opacity:.75">${l}</span><b>${v}</b></div></div>`).join('');

  // reaction of the day - deterministic by date
  const day = Math.floor(Date.now() / 864e5);
  const r = pool.length ? pool[(day * 7919) % pool.length] : null;
  $('#rotd').innerHTML = r ? `
    <div class="chips" style="margin-bottom:14px">${RL.metaPills(r)}</div>
    <h3 style="font-size:24px;margin-bottom:8px">${esc(r.name)}</h3>
    <p class="muted" style="margin:0 0 16px">${RL.rich(r.summary)}</p>
    <div class="equation-box eq-fit" style="min-height:120px">${RL.equation(r)}</div>
    <div class="chips" style="margin-top:16px"><button class="btn dark" id="rotdOpen">${icon.eye} Full card</button><a class="btn" href="practice.html?id=${encodeURIComponent(r.id)}">${icon.flask} Practise it</a></div>`
    : '<p class="muted">No reactions loaded.</p>';
  if (r) $('#rotdOpen').onclick = () => RL.openReaction(r);
  RL.fitAll();

  // chapters
  const counts = {}; all.forEach((x) => (counts[x.category] = (counts[x.category] || 0) + 1));
  const seen = new Set(RL.state.attempts.map((a) => a.id));
  $('#chapters').innerHTML = RL.CATEGORIES.filter((c) => counts[c]).map((c) => {
    const done = all.filter((x) => x.category === c && seen.has(x.id)).length;
    const pct = Math.round((100 * done) / counts[c]);
    return `<a class="row ch" style="grid-template-columns:auto 1fr 120px 60px;background:var(--panel)" href="practice.html?category=${encodeURIComponent(c)}">
      <span class="cat-dot" style="background:${RL.CAT_COLORS[c]};width:14px;height:14px"></span>
      <span style="font-weight:500">${esc(c)}</span>
      <span class="bar thin"><span style="width:${pct}%"></span></span>
      <span class="small muted" style="text-align:right">${done}/${counts[c]}</span></a>`;
  }).join('');

  const weak = RL.weakest(3);
  if (weak.length) $('#weakFoot').innerHTML = 'Focus: ' + weak.map((w) => esc(RL.byId(w.id).name)).join(' · ');

  // recent attempts
  const recent = RL.state.attempts.filter((a) => RL.isShown(a.id)).slice(-6).reverse();
  if (!recent.length) $('#recent').innerHTML = '<p class="muted" style="margin:0">No attempts yet - <a href="practice.html" style="text-decoration:underline">start your first drill</a>.</p>';
  else $('#recent').innerHTML = `<div class="rows-head" style="grid-template-columns:2fr 1.5fr 1fr 1fr"><span>Reaction</span><span class="hide-sm">Chapter</span><span>Mode</span><span>Score</span></div>` +
    recent.map((a) => { const x = RL.byId(a.id); if (!x) return ''; const [, c] = RL.verdict(a.score);
      return `<div class="row rc" style="grid-template-columns:2fr 1.5fr 1fr 1fr;background:var(--panel)"><b style="font-weight:500">${esc(x.name)}</b><span class="muted hide-sm">${esc(x.category)}</span><span class="pill gray hide-sm" style="justify-self:start">${a.mode === 'mcq' ? 'MCQ' : 'Free text'}</span><span class="pill ${c}" style="justify-self:start">${a.score}%</span></div>`; }).join('');
});
