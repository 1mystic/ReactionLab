document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon } = RL;
  const params = new URLSearchParams(location.search);
  let mode = params.get('mode') === 'mcq' ? 'mcq' : 'free';
  RL.layout(mode === 'mcq' ? 'mcq' : 'practice', mode === 'mcq' ? 'MCQ Quiz' : 'Practice');

  const filters = { category: params.get('category') || 'all', exam: 'all', difficulty: 'all' };
  $('#fCategory').innerHTML = RL.optionList(RL.CATEGORIES, filters.category, 'All chapters');
  const pool = () => RL.filterPool(RL.reactions({ include: 'active' }), filters);
  const updatePoolInfo = () => ($('#poolInfo').textContent = `${pool().length} reactions in pool`);
  [['#fCategory', 'category'], ['#fExam', 'exam'], ['#fDiff', 'difficulty']].forEach(([s, k]) =>
    $(s).addEventListener('change', (e) => { filters[k] = e.target.value; updatePoolInfo(); if (mode === 'free') next(); }));
  updatePoolInfo();

  /* ---------------- Mode switching ---------------- */
  function setMode(m) {
    mode = m;
    $$('#modeTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === m));
    $('#freeMode').classList.toggle('hidden', m !== 'free');
    $('#mcqMode').classList.toggle('hidden', m !== 'mcq');
    $$('.nav-link').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === (m === 'mcq' ? 'practice.html?mode=mcq' : 'practice.html')));
    const u = new URL(location); m === 'mcq' ? u.searchParams.set('mode', 'mcq') : u.searchParams.delete('mode'); history.replaceState(null, '', u);
  }
  $$('#modeTabs .tab').forEach((t) => (t.onclick = () => setMode(t.dataset.mode)));

  /* ================= FREE-TEXT ================= */
  $('#nextBtn').innerHTML = icon.shuffle;
  $('#checkBtn').innerHTML = `${icon.check} Check answer`;
  $('#revealBtn').innerHTML = `${icon.eye} Reveal answer`;
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
    mask = r.reagents ? 'reagents' : 'none';
    $('#qPrompt').innerHTML = mask === 'reagents'
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
    $('#aName').focus({ preventScroll: true });
  }
  const next = () => show(choose());

  $('#nextBtn').onclick = next;
  $('#hintBtn').onclick = () => {
    if (!cur) return; hints++;
    const h = [];
    if (hints >= 1) h.push(`<span class="pill" style="background:${RL.CAT_COLORS[cur.category]}55;color:#222">${esc(cur.category)}</span> <span class="pill gray">${esc(cur.kind)}</span>`);
    if (hints >= 2) h.push(`Name starts with <b>“${esc(cur.name.slice(0, 3))}…”</b> (${cur.name.split(/\s+/).length} word${cur.name.split(/\s+/).length > 1 ? 's' : ''})`);
    if (hints >= 3) h.push(`Reagent: ${cur.reagents ? RL.ce(cur.reagents) : '-'}`);
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

  document.addEventListener('keydown', (e) => {
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
  document.addEventListener('keydown', (e) => {
    if (mode !== 'mcq' || $('#mcqRun').classList.contains('hidden') || $('.modal-backdrop')) return;
    const k = e.key.toUpperCase();
    if ('ABCD1234'.includes(k) && k.length === 1) { const i = 'ABCD'.includes(k) ? 'ABCD'.indexOf(k) : +k - 1; const b = $$('.option')[i]; if (b && !b.disabled) b.click(); }
  });

  /* ---------------- init ---------------- */
  setMode(mode);
  const startId = params.get('id');
  const start = startId && RL.byId(startId);
  show(start || choose());
});
