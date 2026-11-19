document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon } = RL;
  RL.layout('bank', 'Reaction Bank');
  const params = new URLSearchParams(location.search);
  const f = { category: params.get('category') || 'all', kind: 'all', exam: 'all', difficulty: 'all', sort: 'cat', q: params.get('q') || '', view: localStorage.getItem('rl.view') || 'grid', archived: false };

  $('#sIcon').innerHTML = icon.search;
  const [g, l, s] = $$('#viewTabs .tab'); g.innerHTML = icon.layout; l.innerHTML = icon.list; s.innerHTML = icon.book;
  $$('#viewTabs .tab').forEach((t) => { t.querySelector('svg').style.cssText = 'width:18px;height:18px;vertical-align:middle'; });
  $('#practiceFiltered').innerHTML = `${icon.flask} Practise these`;
  $('#fKind').innerHTML = RL.optionList(RL.KINDS, 'all', 'All types');
  $('#q').value = f.q;

  let data = [], fuse = null;
  function load() {
    data = RL.reactions({ include: 'visible' });
    fuse = window.Fuse ? new Fuse(data, {
      keys: [{ name: 'name', weight: 3 }, { name: 'aliases', weight: 2 }, { name: 'reagents', weight: 1.5 }, { name: 'reagentKeywords', weight: 1.5 },
        { name: 'productName', weight: 1.2 }, { name: 'products', weight: 1 }, { name: 'reactants', weight: 1 }, { name: 'tags', weight: 1 }, { name: 'summary', weight: 0.6 }, { name: 'category', weight: 0.5 }],
      threshold: 0.38, ignoreLocation: true, includeScore: true
    }) : null;
  }
  load();

  const avgMap = () => { const m = new Map(); RL.state.attempts.forEach((a) => { const v = m.get(a.id) || [0, 0]; v[0] += a.score; v[1]++; m.set(a.id, v); }); return m; };

  function filtered() {
    let list = f.q.trim()
      ? (fuse ? fuse.search(f.q.trim()).map((x) => x.item) : data.filter((r) => JSON.stringify(r).toLowerCase().includes(f.q.toLowerCase())))
      : data.slice();
    list = RL.filterPool(list, f);
    if (!f.archived) list = list.filter((r) => RL.status(r.id) !== 'archived');
    if (!f.q.trim()) {
      const am = avgMap();
      const sorters = {
        cat: (a, b) => RL.CATEGORIES.indexOf(a.category) - RL.CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name),
        az: (a, b) => a.name.localeCompare(b.name),
        weak: (a, b) => { const x = am.get(a.id), y = am.get(b.id); return (x ? x[0] / x[1] : 101) - (y ? y[0] / y[1] : 101); },
        new: (a, b) => (b._custom ? 1 : 0) - (a._custom ? 1 : 0) || a.name.localeCompare(b.name)
      };
      list.sort(sorters[f.sort]);
    }
    return list;
  }

  function renderChips() {
    const base = RL.filterPool(data, { ...f, category: 'all' }).filter((r) => f.archived || RL.status(r.id) !== 'archived');
    const counts = {}; base.forEach((r) => (counts[r.category] = (counts[r.category] || 0) + 1));
    $('#catChips').innerHTML = `<button class="chip ${f.category === 'all' ? 'active' : ''}" data-c="all">All <span class="count">${base.length}</span></button>` +
      RL.CATEGORIES.filter((c) => counts[c]).map((c) => `<button class="chip ${f.category === c ? 'active' : ''}" data-c="${esc(c)}"><span class="cat-dot" style="background:${RL.CAT_COLORS[c]}"></span>${esc(c)} <span class="count">${counts[c]}</span></button>`).join('');
    $$('#catChips .chip').forEach((c) => (c.onclick = () => { f.category = c.dataset.c; render(); }));
  }

  const card = (r) => `
    <article class="r-card ${RL.status(r.id) === 'archived' ? 'archived' : ''}" data-id="${esc(r.id)}" tabindex="0">
      <div class="head"><h4>${esc(r.name)}</h4><span class="cat-dot" style="background:${RL.CAT_COLORS[r.category]};margin-top:5px" title="${esc(r.category)}"></span></div>
      <div class="eq-mini">${RL.equation(r, 'none', false)}</div>
      <div class="small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${RL.rich(r.summary)}</div>
      <div class="meta">
        <span class="pill gray">${esc(r.kind)}</span>
        ${(r.exam || []).length === 1 ? `<span class="pill ${r.exam[0].includes('Adv') ? 'lav' : 'green'}">${r.exam[0].includes('Adv') ? 'Adv only' : 'Main only'}</span>` : ''}
        ${r._custom ? '<span class="pill amber">custom</span>' : ''}${RL.status(r.id) === 'archived' ? '<span class="pill gray">archived</span>' : ''}
      </div>
    </article>`;

  function render() {
    renderChips();
    const list = filtered();
    $('#countLbl').textContent = `· ${list.length}`;
    $$('#viewTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.v === f.view));
    if (!list.length) { $('#results').innerHTML = '<div class="card" style="text-align:center;padding:50px"><h3>No reactions found</h3><p class="muted">Try a different search or clear filters.</p></div>'; return; }
    if (f.view === 'grid') $('#results').innerHTML = `<div class="bank-grid">${list.map(card).join('')}</div>`;
    else if (f.view === 'stack') {
      const groups = RL.CATEGORIES.map((c) => [c, list.filter((r) => r.category === c)]).filter(([, a]) => a.length);
      $('#results').innerHTML = groups.map(([c, a]) => `
        <details open class="panel soft" style="margin-bottom:14px;padding:20px">
          <summary style="cursor:pointer;display:flex;align-items:center;gap:10px;list-style:none"><span class="cat-dot" style="background:${RL.CAT_COLORS[c]};width:14px;height:14px"></span><h3>${esc(c)}</h3><span class="pill gray">${a.length}</span></summary>
          <div class="bank-grid" style="margin-top:16px">${a.map(card).join('')}</div>
        </details>`).join('');
    } else {
      $('#results').innerHTML = `<div class="rows bank-list">
        <div class="rows-head"><span>Reaction</span><span class="hide-sm">Reagent</span><span class="hide-sm">Chapter</span><span class="hide-sm">Type</span><span>Exam</span></div>
        ${list.map((r) => `<div class="row ${RL.status(r.id) === 'archived' ? 'archived' : ''}" style="background:var(--panel)" data-id="${esc(r.id)}" tabindex="0">
          <b style="font-weight:500">${esc(r.name)}</b><span class="hide-sm eq-inline small">${r.reagents ? RL.ce(r.reagents) : '-'}</span>
          <span class="hide-sm small"><span class="cat-dot" style="background:${RL.CAT_COLORS[r.category]}"></span> ${esc(r.category)}</span>
          <span class="hide-sm small muted">${esc(r.kind)}</span>
          <span>${(r.exam || []).map((e) => `<span class="pill ${e.includes('Adv') ? 'lav' : 'green'}">${e.includes('Adv') ? 'Adv' : 'Main'}</span>`).join(' ')}</span></div>`).join('')}</div>`;
    }
    $$('#results [data-id]').forEach((el) => {
      const open = () => RL.openReaction(RL.byId(el.dataset.id));
      el.onclick = open; el.onkeydown = (e) => { if (e.key === 'Enter') open(); };
    });
    const u = new URL(location); f.q ? u.searchParams.set('q', f.q) : u.searchParams.delete('q');
    f.category !== 'all' ? u.searchParams.set('category', f.category) : u.searchParams.delete('category'); history.replaceState(null, '', u);
  }

  $('#q').addEventListener('input', RL.debounce((e) => { f.q = e.target.value; render(); }, 120));
  [['#fKind', 'kind'], ['#fExam', 'exam'], ['#fDiff', 'difficulty'], ['#fSort', 'sort']].forEach(([sel, k]) => $(sel).addEventListener('change', (e) => { f[k] = e.target.value; render(); }));
  $('#showArchived').onchange = (e) => { f.archived = e.target.checked; render(); };
  $$('#viewTabs .tab').forEach((t) => (t.onclick = () => { f.view = t.dataset.v; localStorage.setItem('rl.view', f.view); render(); }));
  $('#practiceFiltered').onclick = () => { location.href = `practice.html${f.category !== 'all' ? '?category=' + encodeURIComponent(f.category) : ''}`; };
  document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); } });
  render();
});
