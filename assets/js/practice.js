RL.boot(() => {
  const { $, $$, esc, icon } = RL;
  const params = new URLSearchParams(location.search);
  let mode = ['mcq', 'chain'].includes(params.get('mode')) ? params.get('mode') : 'free';
  RL.layout(mode === 'mcq' ? 'mcq' : 'practice', mode === 'mcq' ? 'MCQ Quiz' : 'Practice');

  const qc = params.get('category');
  const filters = { category: qc && RL.visibleCategories().includes(qc) ? [qc] : [], exam: 'all', difficulty: 'all' };
  RL.prunePrefOptions($('#fExam'), 'exam'); RL.prunePrefOptions($('#fDiff'), 'difficulty');
  /* multi-select chapter chips (empty selection = all chapters) */
  const renderCats = () => {
    $('#fCategory').innerHTML = `<button type="button" class="chip ${filters.category.length ? '' : 'active'}" data-c="">All chapters</button>` +
      RL.visibleCategories().map((c) => `<button type="button" class="chip ${filters.category.includes(c) ? 'active' : ''}" data-c="${esc(c)}"><span class="cat-dot" style="background:${RL.CAT_COLORS[c] || '#ccc'}"></span>${esc(c)}</button>`).join('');
  };
  $('#fCategory').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const c = b.dataset.c;
    if (!c) filters.category = [];
    else filters.category = filters.category.includes(c) ? filters.category.filter((x) => x !== c) : [...filters.category, c];
    renderCats(); updatePoolInfo(); if (mode === 'free') next(); if (mode === 'chain') newChain();
  });
  // empty chapter selection means all chapters; send 'all' so the filter never depends on array support
  const pool = () => RL.filterPool(RL.reactions({ include: 'active' }), { ...filters, category: filters.category.length ? filters.category : 'all' });
  const updatePoolInfo = () => {
    if (mode === 'chain') { const c = chainPool().length; $('#poolInfo').textContent = `${c} chain${c === 1 ? '' : 's'} in pool`; return; }
    const n = pool().length;
    $('#poolInfo').innerHTML = n ? `${n} reactions in pool` : (RL.prefsActive() ? 'No reactions match. Some content is hidden in <a href="settings.html" style="text-decoration:underline">Profile &amp; filters</a>' : 'No reactions match these filters');
  };
  [['#fExam', 'exam'], ['#fDiff', 'difficulty']].forEach(([s, k]) =>
    $(s).addEventListener('change', (e) => { filters[k] = e.target.value; updatePoolInfo(); if (mode === 'free') next(); if (mode === 'chain') newChain(); }));
  renderCats(); updatePoolInfo();

  /* ---------------- Mode switching ---------------- */
  function setMode(m) {
    mode = m;
    $$('#modeTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === m));
    $('#freeMode').classList.toggle('hidden', m !== 'free');
    $('#mcqMode').classList.toggle('hidden', m !== 'mcq');
    $('#chainMode').classList.toggle('hidden', m !== 'chain');
    if (m === 'chain' && !chain) newChain();
    if (m === 'free' && !cur) show(choose());
    $$('.nav-link').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === (m === 'mcq' ? 'practice.html?mode=mcq' : 'practice.html')));
    const u = new URL(location); m !== 'free' ? u.searchParams.set('mode', m) : u.searchParams.delete('mode'); if (m !== 'free') u.searchParams.delete('id'); history.replaceState(null, '', u);
    updatePoolInfo();
  }
  $$('#modeTabs .tab').forEach((t) => (t.onclick = () => setMode(t.dataset.mode)));

  /* ================= FREE-TEXT ================= */
  $('#nextBtn').innerHTML = icon.shuffle;
  $('#checkBtn').innerHTML = `${icon.check} Check answer`;
  $('#revealBtn').innerHTML = `${icon.eye} Reveal answer`;
  /* question style: 'full' = name + hidden reagent, 'product' = reactant + reagent given, predict the product */
  let ask = localStorage.getItem('rl.ask') === 'product' ? 'product' : 'full';
  $$('#askTabs .tab').forEach((t) => (t.onclick = () => {
    ask = t.dataset.ask; localStorage.setItem('rl.ask', ask); if (cur) show(choose());
  }));
  let cur = null, mask = 'reagents', hints = 0, checked = false, revealed = false, sessionN = 0, sessionSum = 0;
  const recentIds = [];

  function choose() {
    const p = pool(); if (!p.length) return null;
    // prefer not-recently-seen; mildly favour weak/unseen reactions
    const stats = new Map(); RL.state.attempts.forEach((a) => { const v = stats.get(a.id) || [0, 0]; v[0] += a.score; v[1]++; stats.set(a.id, v); });
    const cand = p.filter((r) => !recentIds.includes(r.id)); const list = cand.length ? cand : p;
    const weights = list.map((r) => { const s = stats.get(r.id); return s ? 1 + (100 - s[0] / s[1]) / 50 : 2.2; });
    let x = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) { x -= weights[i]; if (x <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function show(r) {
    cur = r; hints = 0; checked = false; revealed = false;
    if (!r) { $('#qEq').innerHTML = '<span class="muted">No reactions match these filters.</span>'; $('#answerBox').innerHTML = ''; return; }
    recentIds.push(r.id); if (recentIds.length > Math.min(30, Math.floor(pool().length / 2))) recentIds.shift();
    const prod = ask === 'product';
    $$('#askTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.ask === ask));
    $('#fName').classList.toggle('hidden', prod); $('#fReagent').classList.toggle('hidden', prod);
    $('label[for=aOther]').innerHTML = prod ? 'Major product <span class="muted">(name or formula)</span>' : 'Product &amp; other important info <span class="muted">(optional)</span>';
    $('#aOther').placeholder = prod ? 'e.g. benzoic acid, or C6H5COOH' : 'e.g. β-hydroxy aldehyde; needs α-hydrogen…';
    mask = prod ? 'products' : r.reagents ? 'reagents' : 'none';
    if (prod) $('#qPrompt').innerHTML = 'The <b>reactant and reagent</b> are given. Write the <b>major product</b>.';
    else $('#qPrompt').innerHTML = mask === 'reagents'
      ? 'Identify this reaction, the <b>hidden reagent / catalyst</b>, and anything else you know.'
      : 'Identify this reaction / test and its key reagents & observations.';
    $('#qEq').innerHTML = RL.equation(r, mask);
    RL.fitAll();
    $('#hintBox').innerHTML = '';
    $('#hintBtn').innerHTML = `${icon.bulb} Hint`; $('#hintBtn').disabled = false;
    $('#scoreBox').innerHTML = '';
    ['#aName', '#aReagent', '#aOther'].forEach((s) => ($(s).value = ''));
    $('#revealBtn').disabled = false;
    $('#answerBox').innerHTML = `
      <div class="note-card lav" style="min-height:260px;justify-content:center;align-items:center;text-align:center">
        <div style="width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,.2);display:grid;place-items:center">${icon.eye}</div>
        <h3>Answer hidden</h3><p style="margin:0;opacity:.85;max-width:320px">Give it your best shot, check your score, then reveal the full answer cards.</p>
      </div>`;
    const u = new URL(location); u.searchParams.set('id', r.id); history.replaceState(null, '', u);
    // never pop the on-screen keyboard on touch / small screens; keep autofocus for desktop typing
    if (!matchMedia('(pointer: coarse), (max-width: 760px)').matches) (prod ? $('#aOther') : $('#aName')).focus({ preventScroll: true });
  }
  const next = () => show(choose());

  $('#nextBtn').onclick = next;
  $('#hintBtn').onclick = () => {
    if (!cur) return; hints++;
    const h = [];
    if (hints >= 1) h.push(`<span class="pill" style="background:${RL.CAT_COLORS[cur.category]}55;color:var(--ink)">${esc(cur.category)}</span> <span class="pill gray">${esc(cur.kind)}</span>`);
    if (ask === 'product') {
      if (hints >= 2) h.push(`Reaction: <b>${esc(cur.name)}</b>`);
      if (hints >= 3) { const pn = cur.productName || ''; h.push(pn ? `Product name starts with <b>“${esc(pn.slice(0, 3))}…”</b>` : 'Product has ' + cur.products.split(' + ').length + ' species'); }
    } else if (hints >= 2) h.push(`Name starts with <b>“${esc(cur.name.slice(0, 3))}…”</b> (${cur.name.split(/\s+/).length} word${cur.name.split(/\s+/).length > 1 ? 's' : ''})`);
    if (ask !== 'product' && hints >= 3) h.push(`Reagent: ${cur.reagents ? RL.ce(cur.reagents) : '-'}`);
    $('#hintBox').innerHTML = h.map((x) => `<div style="margin:6px 0">${x}</div>`).join('') + `<div class="muted small">Each hint costs 10 points.</div>`;
    if (hints >= 3) $('#hintBtn').disabled = true;
    $('#hintBtn').innerHTML = `${icon.bulb} Hint ${Math.min(hints + 1, 3)}/3`;
  };

  function renderScore(res, total) {
    const [label, color] = RL.verdict(total);
    const ringColor = color === 'green' ? '#5fbf59' : color === 'amber' ? '#e8b33c' : '#e5776a';
    const kw = (r) => [...r.matched.map((k) => `<span class="pill green">✓ ${esc(k)}</span>`), ...r.missed.slice(0, 6).map((k) => `<span class="pill gray">${esc(k)}</span>`)].join(' ');
    const bar = (lbl, v, cls = '') => `<div><div style="display:flex;justify-content:space-between" class="small"><span>${lbl}</span><b>${Math.round(v * 100)}%</b></div><div class="bar thin ${cls}" style="margin-top:4px"><span style="width:${Math.round(v * 100)}%"></span></div></div>`;
    $('#scoreBox').innerHTML = `
      <div class="card" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;background:var(--panel);border:0">
        <div class="score-ring" style="--ring:${ringColor}" id="ring"><div><div><b>${total}</b><div class="small muted">/ 100</div></div></div></div>
        <div style="flex:1;min-width:220px;display:grid;gap:10px">
          <h3>${label}${hints ? ` <span class="small muted">(−${hints * 10} hints)</span>` : ''}</h3>
          ${bar('Name match (50%)', res.name)}${bar('Reagent / catalyst (35%)', res.reagent.score, 'lav')}${bar('Product & info (15%)', res.other.score)}
        </div>
      </div>
      <div class="small" style="margin-top:12px;display:grid;gap:8px">
        ${res.reagent.matched.length + res.reagent.missed.length ? `<div><span class="muted">Reagent keywords:</span> ${kw(res.reagent)}</div>` : ''}
        ${res.other.matched.length + res.other.missed.length ? `<div><span class="muted">Product keywords:</span> ${kw(res.other)}</div>` : ''}
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $('#ring').style.setProperty('--p', total)));
  }

  $('#answerForm').onsubmit = (e) => {
    e.preventDefault(); if (!cur) return;
    const ans = { name: $('#aName').value, reagent: $('#aReagent').value, other: $('#aOther').value };
    if (ask === 'product') {
      if (!ans.other.trim()) { RL.toast('Type the product first'); return; }
      const pr = RL.scoreProduct(cur, ans.other); const pt = Math.max(0, pr.total - hints * 10);
      const [lbl, col] = RL.verdict(pt);
      $('#scoreBox').innerHTML = `<div class="card" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;background:var(--panel);border:0">
        <div class="score-ring" style="--ring:${col === 'green' ? '#5fbf59' : col === 'amber' ? '#e8b33c' : '#e5776a'}" id="ring"><div><div><b>${pt}</b><div class="small muted">/ 100</div></div></div></div>
        <div style="flex:1;min-width:220px;display:grid;gap:8px"><h3>${lbl}${hints ? ` <span class="small muted">(−${hints * 10} hints)</span>` : ''}</h3>
        <div class="small">${[...pr.product.matched.map((k) => `<span class="pill green">✓ ${esc(k)}</span>`), ...pr.product.missed.slice(0, 5).map((k) => `<span class="pill gray">${esc(k)}</span>`)].join(' ')}</div>
        <div class="small muted">Expected: ${RL.ce(cur.products)}</div></div></div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => $('#ring').style.setProperty('--p', pt)));
      if (!checked && !revealed) { RL.logAttempt(cur.id, pt, 'product'); sessionN++; sessionSum += pt; updateSession(); }
      checked = true; RL.fitAll(); return;
    }
    if (!ans.name.trim() && !ans.reagent.trim() && !ans.other.trim()) { RL.toast('Type something first 🙂'); return; }
    const res = RL.scoreAttempt(cur, ans);
    const total = Math.max(0, res.total - hints * 10);
    renderScore(res, total);
    if (!checked && !revealed) { RL.logAttempt(cur.id, total, 'free'); sessionN++; sessionSum += total; updateSession(); }
    checked = true;
  };
  const updateSession = () => ($('#sessionInfo').textContent = sessionN ? `Session: ${sessionN} done · avg ${Math.round(sessionSum / sessionN)}%` : '');
  function reveal() {
    if (!cur) return;
    if (!checked && !revealed) { RL.logAttempt(cur.id, 0, 'free'); sessionN++; updateSession(); }
    revealed = true;
    $('#answerBox').innerHTML = RL.detailHTML(cur);
    RL.fitAll();
    $('#revealBtn').disabled = true;
    $('#answerPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#revealBtn').onclick = reveal;

  RL.listen(document, 'keydown', (e) => {
    if (mode !== 'free') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { $('#answerForm').requestSubmit(); return; }
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { if (e.key === 'Escape') document.activeElement.blur(); return; }
    if (e.key === 'n' || e.key === 'N') next();
    if (e.key === 'r' || e.key === 'R') reveal();
    if (e.key === 'h' || e.key === 'H') $('#hintBtn').click();
  });

  /* ================= MCQ ================= */
  $('#startQuiz').innerHTML = `${icon.shuffle} Generate quiz`;
  let qN = 10;
  $$('#qCount .chip').forEach((c) => (c.onclick = () => { $$('#qCount .chip').forEach((x) => x.classList.remove('active')); c.classList.add('active'); qN = +c.dataset.n; }));
  $$('#qTypes .chip').forEach((c) => (c.onclick = () => { c.classList.toggle('active'); if (!$$('#qTypes .chip.active').length) c.classList.add('active'); }));

  let quiz = [], qi = 0, answers = [];
  $('#startQuiz').onclick = () => {
    const p = pool(); if (p.length < 4) { RL.toast('Need at least 4 reactions in the pool'); return; }
    const types = $$('#qTypes .chip.active').map((c) => c.dataset.t);
    const fullPool = RL.reactions({ include: 'active' });
    quiz = RL.shuffle(p).slice(0, qN).map((r) => {
      const t = types.filter((x) => x !== 'reagent' || r.reagents);
      return RL.makeMCQ(r, fullPool, RL.pick(t.length ? t : ['name']));
    });
    qi = 0; answers = [];
    $('#mcqSetup').classList.add('hidden'); $('#mcqRun').classList.remove('hidden');
    renderQ();
  };
  function progress() {
    return `<div class="quiz-progress" style="margin-bottom:22px">${quiz.map((_, i) => `<span class="${i < answers.length ? (answers[i] === quiz[i].answer ? 'ok' : 'bad') : i === qi ? 'cur' : ''}"></span>`).join('')}</div>`;
  }
  function renderQ() {
    const q = quiz[qi];
    $('#mcqRun').innerHTML = `
      ${progress()}
      <div class="panel-head"><h2>Question ${qi + 1} <span class="muted" style="font-size:18px">/ ${quiz.length}</span></h2>
        <span class="pill gray">${{ name: 'Name it', nameFromReagent: 'Which reaction', reagent: 'Reagent', product: 'Product' }[q.type]}</span>
        <button class="btn sm" id="quitQuiz">End quiz</button></div>
      <p style="font-size:17px;margin-top:-6px">${q.stem}</p>
      <div class="equation-box eq-fit" style="margin-bottom:18px">${q.prompt}</div>
      <div class="options">${q.options.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${'ABCD'[i]}</span><span>${o.html}</span></button>`).join('')}</div>
      <div id="qFeedback" style="margin-top:16px"></div>`;
    $$('.option').forEach((b) => (b.onclick = () => answer(+b.dataset.i)));
    RL.fitAll();
    $('#quitQuiz').onclick = finish;
  }
  function answer(i) {
    const q = quiz[qi]; if (answers.length > qi) return;
    answers.push(i);
    const ok = i === q.answer;
    RL.logAttempt(q.id, ok ? 100 : 0, 'mcq');
    $$('.option').forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('correct'); else if (j === i) b.classList.add('wrong'); });
    const r = RL.byId(q.id);
    $('#qFeedback').innerHTML = `
      <div class="card" style="background:${ok ? 'var(--green-soft)' : 'var(--red-soft)'};border:0">
        <h3>${ok ? '✓ Correct' : '✗ Not quite'} - ${esc(r.name)}</h3>
        <div class="eq-inline">${RL.equation(r)}</div>
        <div class="small" style="margin-top:6px">${RL.rich(r.summary)}</div>
      </div>
      <div class="chips" style="margin-top:14px"><button class="btn dark" id="nextQ">${qi + 1 < quiz.length ? 'Next question' : 'See results'} ${icon.arrow}</button>
      <button class="btn" id="moreQ">${icon.eye} Full card</button><span class="small muted" style="align-self:center"><kbd>Enter</kbd> next</span></div>`;
    $('#nextQ').onclick = () => { qi++; qi < quiz.length ? renderQ() : finish(); };
    $('#moreQ').onclick = () => RL.openReaction(r);
    $('#nextQ').focus();
  }
  function finish() {
    const done = answers.length, correct = answers.filter((a, i) => a === quiz[i].answer).length;
    const pct = done ? Math.round((100 * correct) / done) : 0;
    const [label, color] = RL.verdict(pct);
    $('#mcqRun').innerHTML = `
      ${progress()}
      <div style="display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin-bottom:24px">
        <div class="score-ring" id="ring" style="--ring:${color === 'green' ? '#5fbf59' : color === 'amber' ? '#e8b33c' : '#e5776a'}"><div><div><b>${correct}/${done}</b><div class="small muted">${pct}%</div></div></div></div>
        <div><h2>${label}</h2><p class="muted" style="margin:6px 0 16px">You answered ${done} of ${quiz.length} questions.</p>
          <div class="chips"><button class="btn dark" id="again">${icon.shuffle} New quiz</button><button class="btn" id="retry">Retry same questions</button></div></div>
      </div>
      <h3 style="margin-bottom:12px">Review</h3>
      <div class="rows">${quiz.slice(0, done).map((q, i) => { const r = RL.byId(q.id); const ok = answers[i] === q.answer;
        return `<div class="row rv" style="grid-template-columns:40px 1.4fr 2fr;background:var(--panel);cursor:pointer" data-id="${esc(q.id)}">
          <span class="pill ${ok ? 'green' : 'red'}">${ok ? '✓' : '✗'}</span><b style="font-weight:500">${esc(r.name)}</b><div class="eq-inline small">${RL.equation(r, 'none', false)}</div></div>`; }).join('')}</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $('#ring').style.setProperty('--p', pct)));
    $('#again').onclick = () => { $('#mcqRun').classList.add('hidden'); $('#mcqSetup').classList.remove('hidden'); };
    $('#retry').onclick = () => { qi = 0; answers = []; quiz = quiz.map((q) => RL.makeMCQ(RL.byId(q.id), RL.reactions({ include: 'active' }), q.type)); renderQ(); };
    $$('#mcqRun .row').forEach((row) => (row.onclick = () => RL.openReaction(RL.byId(row.dataset.id))));
  }
  RL.listen(document, 'keydown', (e) => {
    if (mode !== 'mcq' || $('#mcqRun').classList.contains('hidden') || $('.modal-backdrop')) return;
    const k = e.key.toUpperCase();
    if ('ABCD1234'.includes(k) && k.length === 1) { const i = 'ABCD'.includes(k) ? 'ABCD'.indexOf(k) : +k - 1; const b = $$('.option')[i]; if (b && !b.disabled) b.click(); }
  });

  /* ================= REACTION CHAINS (multi-step) ================= */
  function chainPool() { return (window.CHAINS || []).filter((c) => !RL.chainHiddenByPrefs(c)
    && (!filters.category.length || c.chapters.some((x) => filters.category.includes(x)))
    && (filters.exam === 'all' || (c.exam && c.exam.length ? c.exam : RL.EXAMS).includes(filters.exam))
    && (filters.difficulty === 'all' || c.difficulty === filters.difficulty)); }
  let chain = null, ci = 0, cAns = [], cOpts = [], cPicked = null;
  const cRecent = [];
  const node = (formula, cls = '') => `<span class="chain-node ${cls}">${formula === null ? '?' : RL.ce(formula)}</span>`;
  const arrow = (s) => `<span class="chain-arrow">${RL.ce(`->[${s.reagent}]${s.conditions ? `[${s.conditions}]` : ''}`)}</span>`;
  function chainTrail() {
    // revealed part of the chain: start -> B -> C -> ? (current step)
    let h = node(chain.start, 'start');
    for (let i = 0; i <= Math.min(ci, chain.steps.length - 1); i++) {
      const s = chain.steps[i], done = i < ci || (i === ci && cPicked !== null);
      h += arrow(s) + node(done ? s.product : null, done ? (cAns[i] ? 'ok' : 'bad') : 'cur');
    }
    return `<div class="chain-trail">${h}</div>`;
  }
  function newChain() {
    const p = chainPool();
    if (!p.length) {
      $('#chainPanel').innerHTML = `<div class="panel-head"><h2>Reaction chains</h2></div><p class="muted">No chains match these filters${RL.prefsActive() ? ' (some content is hidden in <a href="settings.html" style="text-decoration:underline">Profile &amp; filters</a>)' : ''}.</p>`;
      return;
    }
    const fresh = p.filter((c) => !cRecent.includes(c.id));
    chain = RL.pick(fresh.length ? fresh : p);
    cRecent.push(chain.id); if (cRecent.length > Math.max(0, Math.min(20, p.length - 1))) cRecent.shift();
    ci = 0; cAns = []; cPicked = null;
    cOpts = chain.steps.map((s) => RL.shuffle([s.product, ...s.distractors]));
    renderChain();
  }
  function renderChain() {
    const s = chain.steps[ci], n = chain.steps.length, sub = ci === 0 ? chain.start : chain.steps[ci - 1].product;
    const answered = cPicked !== null, ok = answered && cOpts[ci][cPicked] === s.product;
    const subName = ci === 0 ? chain.startName : chain.steps[ci - 1].productName;
    $('#chainPanel').innerHTML = `
      <div class="quiz-progress" style="margin-bottom:var(--s-5)">${chain.steps.map((_, i) => `<span class="${i < cAns.length ? (cAns[i] ? 'ok' : 'bad') : i === ci ? 'cur' : ''}"></span>`).join('')}</div>
      <div class="panel-head">
        <h2>Step ${ci + 1} <span class="muted" style="font-size:18px">/ ${n}</span></h2>
        <span class="pill gray">${esc(chain.difficulty)}</span>
        <button class="icon-btn dark" id="chainNew" title="New chain (N)">${icon.shuffle}</button>
      </div>
      <div class="chips" style="margin:calc(-1 * var(--s-3)) 0 var(--s-4)">${chain.chapters.map((c) => `<span class="pill" style="background:${RL.CAT_COLORS[c]}33;color:var(--ink)">${esc(c)}</span>`).join('')}</div>
      ${chainTrail()}
      <p class="chain-q">${ci === 0 ? `Start with <b>${esc(subName)}</b>.` : `Take the product of step ${ci} (${esc(subName)}).`} Treat it with the reagent shown. <b>What is obtained?</b></p>
      <div class="equation-box eq-fit">${RL.ce(`${sub} ->[${s.reagent}]${s.conditions ? `[${s.conditions}]` : ''} $\\text{ ? }$`, true)}</div>
      <div class="options" style="margin-top:var(--s-4)">${cOpts[ci].map((o, i) => {
        const cls = !answered ? '' : o === s.product ? 'correct' : i === cPicked ? 'wrong' : '';
        return `<button class="option ${cls}" data-i="${i}" ${answered ? 'disabled' : ''}><span class="letter">${'ABCD'[i]}</span><span>${RL.ceWrap(o)}</span></button>`;
      }).join('')}</div>
      ${answered ? `
        <div class="note-card ${ok ? 'green' : 'amber'}" style="min-height:0;margin-top:var(--s-4)">
          <h3>${ok ? '✓ Correct' : '✗ Not quite'}: ${esc(s.productName)}</h3>
          <div><b>${esc(s.reaction)}.</b> ${RL.rich(s.explanation)}</div>
          <div class="chips" style="margin-top:var(--s-2)"><button class="btn dark" id="chainNext">${ci + 1 < n ? `Next step ${icon.arrow}` : 'See result'}</button></div>
        </div>` : '<p class="small muted" style="margin-top:var(--s-3)"><kbd>1</kbd>-<kbd>4</kbd> answer · <kbd>N</kbd> new chain</p>'}`;
    $$('#chainPanel .option').forEach((b) => (b.onclick = () => { cPicked = +b.dataset.i; cAns[ci] = cOpts[ci][cPicked] === s.product; renderChain(); }));
    $('#chainNew').onclick = newChain;
    const nx = $('#chainNext'); if (nx) { nx.onclick = () => { if (ci + 1 < n) { ci++; cPicked = null; renderChain(); } else chainResult(); }; nx.focus({ preventScroll: true }); }
    RL.fitAll($('#chainPanel'));
  }
  function chainResult() {
    const right = cAns.filter(Boolean).length, n = chain.steps.length, pct = Math.round((100 * right) / n);
    RL.logAttempt(chain.id, pct, 'chain');
    const [label, color] = RL.verdict(pct);
    let prev = chain.start;
    const lines = chain.steps.map((s, i) => { const line = `<div class="row" style="grid-template-columns:28px 1fr;background:var(--panel)"><span class="pill ${cAns[i] ? 'green' : 'red'}">${i + 1}</span><div class="eq-inline">${RL.ce(`${prev} ->[${s.reagent}]${s.conditions ? `[${s.conditions}]` : ''} ${s.product}`)}<div class="small muted">${esc(s.reaction)}</div></div></div>`; prev = s.product; return line; }).join('');
    $('#chainPanel').innerHTML = `
      <div class="panel-head"><h2>${esc(chain.title)}</h2><span class="pill ${color}">${label}</span></div>
      <div class="card" style="display:flex;gap:var(--s-5);align-items:center;flex-wrap:wrap;background:var(--panel);border:0;margin-bottom:var(--s-4)">
        <div class="score-ring" style="--ring:${color === 'green' ? '#5fbf59' : color === 'amber' ? '#e8b33c' : '#e5776a'}" id="cRing"><div><div><b>${right}/${n}</b><div class="small muted">steps</div></div></div></div>
        <div style="flex:1;min-width:200px"><h3>${pct}% of the chain correct</h3><p class="muted" style="margin:var(--s-2) 0 0">Every step is listed below with its reaction.</p></div>
      </div>
      <div class="rows">${lines}</div>
      <div class="chips" style="margin-top:var(--s-4)"><button class="btn start" id="chainAgain">${icon.shuffle} New chain</button><button class="btn" id="chainRetry">Retry this chain</button></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $('#cRing').style.setProperty('--p', pct)));
    $('#chainAgain').onclick = newChain;
    $('#chainRetry').onclick = () => { ci = 0; cAns = []; cPicked = null; cOpts = chain.steps.map((s) => RL.shuffle([s.product, ...s.distractors])); renderChain(); };
    RL.fitAll($('#chainPanel'));
  }
  RL.listen(document, 'keydown', (e) => {
    if (mode !== 'chain' || $('.modal-backdrop') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const k = e.key.toUpperCase();
    if (k === 'N' && !e.ctrlKey && !e.metaKey) { newChain(); return; }
    if ('ABCD1234'.includes(k) && k.length === 1) { const i = 'ABCD'.includes(k) ? 'ABCD'.indexOf(k) : +k - 1; const b = $$('#chainPanel .option')[i]; if (b && !b.disabled) b.click(); }
  });

  /* ---------------- init ---------------- */
  setMode(mode);
  const startId = params.get('id');
  const start = startId && RL.byId(startId);
  if (mode === 'free') show(start || choose());
});
