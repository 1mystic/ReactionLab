RL.boot(() => {
  const { $, $$, esc, icon } = RL;
  RL.layout('goc', 'GOC Concept Lab');
  const ALL_TOPICS = ['Carbocation stability', 'Carbanion stability', 'Free radical stability', 'Alkene stability', 'Resonance & hyperconjugation',
    'Inductive effect', 'Aromaticity', 'Acidity', 'Basicity', 'Substituent effects (o/m/p)', 'Tautomerism & enol content',
    'Physical properties (bp, dipole, bond length)', 'Nucleophilicity', 'Leaving group ability', 'Electrophilicity & carbonyl reactivity',
    'SN1/SN2/E1/E2 reactivity', 'Electrophilic aromatic substitution', 'Rearrangements & migratory aptitude'];
  // profile filters: hidden topics / exams / difficulties never appear
  const TOPICS = ALL_TOPICS.filter((t) => !RL.prefs().gocTopics.includes(t));
  const GEN_TOPICS = RL.GOC_GEN_TOPICS.filter((t) => TOPICS.includes(t));
  const curated = (window.GOC_QUESTIONS || []).filter((q) => !RL.state.blacklisted.includes(q.id) && !RL.gocHiddenByPrefs(q));
  RL.prunePrefOptions($('#fDiff'), 'difficulty');
  const params = new URLSearchParams(location.search);
  const f = { topic: TOPICS.includes(params.get('topic')) ? params.get('topic') : 'all', type: 'all', difficulty: 'all', source: 'both' };
  const counts = {}; curated.forEach((q) => (counts[q.topic] = (counts[q.topic] || 0) + 1));
  $('#fTopic').innerHTML = `<option value="all">All topics (${curated.length} curated + generated)</option>` +
    TOPICS.map((t) => `<option value="${esc(t)}" ${t === f.topic ? 'selected' : ''}>${esc(t)} (${counts[t] || 0}${GEN_TOPICS.includes(t) ? ' + ∞' : ''})</option>`).join('');
  $('#nextBtn').innerHTML = icon.shuffle;

  // trusted (generated) text may contain <b>; curated text is escaped
  const R = (q, t) => (q.generated ? RL.richTrusted(t) : RL.rich(t));

  /* ---------------- picking ---------------- */
  const recent = [];
  function pick() {
    const pool = curated.filter((q) => (f.topic === 'all' || q.topic === f.topic) && (f.type === 'all' || q.type === f.type) && (f.difficulty === 'all' || q.difficulty === f.difficulty));
    const genOK = f.source !== 'curated' && GEN_TOPICS.length > 0 && (f.topic === 'all' || GEN_TOPICS.includes(f.topic)) && (f.type === 'all' || ['order', 'compare', 'effect'].includes(f.type));
    const useGen = genOK && (f.source === 'generated' || !pool.length || Math.random() < 0.3);
    if (useGen) {
      for (let i = 0; i < 30; i++) {
        const g = RL.generateGOC(f.topic === 'all' ? null : f.topic);
        if (g && !RL.gocHiddenByPrefs(g) && (f.type === 'all' || g.type === f.type) && (f.difficulty === 'all' || g.difficulty === f.difficulty) && !recent.includes(g.id)) return g;
      }
    }
    if (f.source === 'generated' && !genOK) return null;
    const fresh = pool.filter((q) => !recent.includes(q.id));
    return fresh.length ? RL.pick(fresh) : pool.length ? RL.pick(pool) : null;
  }

  /* ---------------- session ---------------- */
  const sess = { right: 0, wrong: 0, score: 0, n: 0, streak: 0 };
  function updateSession() {
    const pct = sess.n ? Math.round((100 * sess.score) / sess.n) : 0;
    $('#sPct').textContent = sess.n ? pct + '%' : '-';
    $('#sCount').textContent = `${sess.n} answered`;
    $('#sRight').textContent = sess.right; $('#sWrong').textContent = sess.wrong; $('#sStreak').textContent = sess.streak;
    $('#sRing').style.setProperty('--p', pct);
    $('#sRing').style.setProperty('--ring', pct >= 65 ? '#5fbf59' : pct >= 40 ? '#e8b33c' : '#e5776a');
    renderTopicStats();
  }
  function renderTopicStats() {
    const m = {}; (RL.state.goc || []).forEach((a) => { const v = (m[a.topic] = m[a.topic] || [0, 0]); v[0] += a.score; v[1]++; });
    const rows = Object.entries(m).filter(([t]) => TOPICS.includes(t)).map(([t, [s, c]]) => [t, Math.round((100 * s) / c), c]).sort((a, b) => a[1] - b[1]);
    $('#topicStats').innerHTML = rows.length ? rows.slice(0, 8).map(([t, p, c]) => `
      <button class="row" style="grid-template-columns:1fr 70px 40px;background:var(--panel);min-height:52px;text-align:left;border:0;cursor:pointer;font:inherit" data-t="${esc(t)}" title="Practise this topic">
        <span class="small" style="font-weight:500">${esc(t)}</span><span class="bar thin"><span style="width:${p}%"></span></span><span class="small muted" style="text-align:right">${p}%</span></button>`).join('')
      : '<p class="small muted" style="margin:0">Answer a few questions to see which topics need work.</p>';
    $$('#topicStats [data-t]').forEach((b) => (b.onclick = () => { f.topic = b.dataset.t; $('#fTopic').value = f.topic; next(); }));
  }
  function record(q, score) {
    RL.state.goc.push({ id: q.id, topic: q.topic, score, ts: Date.now() });
    if (RL.state.goc.length > 3000) RL.state.goc = RL.state.goc.slice(-3000);
    RL.save();
    sess.n++; sess.score += score;
    if (score >= 1) { sess.right++; sess.streak++; } else { sess.wrong++; sess.streak = 0; }
    updateSession();
    if (quiz) { quiz.scores.push(score); renderQuizBar(); }
  }

  /* ---------------- quiz mode ---------------- */
  let quiz = null;
  function renderQuizBar() {
    if (!quiz) { $('#quizBar').innerHTML = ''; return; }
    $('#quizBar').innerHTML = `<div class="quiz-progress" style="margin-bottom:18px">${Array.from({ length: quiz.n }, (_, i) =>
      `<span class="${i < quiz.scores.length ? (quiz.scores[i] >= 1 ? 'ok' : 'bad') : i === quiz.scores.length ? 'cur' : ''}"></span>`).join('')}</div>`;
  }
  function setMode(m) {
    $$('#modeTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === m));
    quiz = m === 'quiz' ? { n: 10, scores: [], start: Date.now() } : null;
    renderQuizBar(); next();
  }
  $$('#modeTabs .tab').forEach((t) => (t.onclick = () => setMode(t.dataset.mode)));
  function finishQuiz() {
    const total = quiz.scores.reduce((a, b) => a + b, 0), pct = Math.round((100 * total) / quiz.n);
    const secs = Math.round((Date.now() - quiz.start) / 1000);
    const [label] = RL.verdict(pct);
    $('#qMeta').innerHTML = '<span class="pill lav">Quiz complete</span>';
    $('#qTitle').textContent = label;
    $('#qBody').innerHTML = `
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
        <div class="score-ring" id="qRing" style="--ring:${pct >= 65 ? '#5fbf59' : pct >= 40 ? '#e8b33c' : '#e5776a'}"><div><div><b>${pct}%</b><div class="small muted">${total.toFixed(1).replace('.0', '')}/${quiz.n}</div></div></div></div>
        <div><p class="muted" style="margin:0 0 14px">Finished in ${Math.floor(secs / 60)}m ${secs % 60}s · ${Math.round(secs / quiz.n)}s per question</p>
        <div class="chips"><button class="btn dark" id="again">${icon.shuffle} New quiz</button><button class="btn" id="toPractice">Back to practice</button></div></div>
      </div>`;
    $('#qFeedback').innerHTML = '';
    requestAnimationFrame(() => requestAnimationFrame(() => $('#qRing').style.setProperty('--p', pct)));
    $('#again').onclick = () => setMode('quiz');
    $('#toPractice').onclick = () => setMode('practice');
  }

  /* ---------------- rendering a question ---------------- */
  let cur = null, answered = false, order = [], shuffled = [];
  const TYPE_LABEL = { order: 'Arrange in order', compare: 'Compare', effect: 'Effect of substituent', mcq: 'Single correct' };
  function next() {
    if (quiz && quiz.scores.length >= quiz.n) return finishQuiz();
    const q = pick();
    $('#qFeedback').innerHTML = '';
    if (!q) {
      cur = null; $('#qMeta').innerHTML = ''; $('#qTitle').textContent = 'No questions match';
      $('#qBody').innerHTML = '<p class="muted">Try another topic, type or source.</p>'; return;
    }
    cur = q; answered = false; order = [];
    recent.push(q.id); if (recent.length > 40) recent.shift();
    $('#qMeta').innerHTML = `<span class="pill" style="background:var(--lav-soft)">${esc(q.topic)}</span><span class="pill gray">${TYPE_LABEL[q.type]}</span>
      <span class="pill ${q.difficulty === 'hard' ? 'red' : q.difficulty === 'easy' ? 'green' : 'amber'}">${esc(q.difficulty)}</span>${q.generated ? '<span class="pill green">generated · pKa data</span>' : ''}`;
    $('#qTitle').textContent = quiz ? `Question ${quiz.scores.length + 1} of ${quiz.n}` : TYPE_LABEL[q.type];
    if (q.type === 'order') {
      shuffled = RL.shuffle(q.items.map((t, i) => ({ t, i })));
      if (shuffled.every((x, k) => x.i === k)) shuffled.reverse();
      renderOrder();
    } else {
      $('#qBody').innerHTML = `<p class="goc-q">${R(q, q.question)}</p>
        <div class="options">${q.options.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${i + 1}</span><span>${R(q, o)}</span></button>`).join('')}</div>`;
      $$('#qBody .option').forEach((b) => (b.onclick = () => answerOption(+b.dataset.i)));
    }
  }
  function renderOrder() {
    const q = cur;
    const placed = new Set(order);
    $('#qBody').innerHTML = `
      <p class="goc-q">${R(q, q.question)} in <b>${R(q, q.criterion)}</b>:</p>
      <div class="small muted" style="margin-bottom:8px">Tap items in order (first = highest)</div>
      <div class="order-pool">${shuffled.map((x, k) => `<button class="order-item ${placed.has(k) ? 'used' : ''}" data-k="${k}" ${placed.has(k) || answered ? 'disabled' : ''}>
        <span class="tag">${String.fromCharCode(65 + k)}</span><span>${R(q, x.t)}</span></button>`).join('')}</div>
      <div class="order-answer ${order.length ? '' : 'empty'}">${order.length ? order.map((k, n) => `${n ? '<span class="gt">&gt;</span>' : ''}<button class="order-pick" data-n="${n}" ${answered ? 'disabled' : ''} title="Remove">
        <span class="tag">${String.fromCharCode(65 + k)}</span><span>${R(q, shuffled[k].t)}</span></button>`).join('') : '<span class="muted small">Your order appears here</span>'}</div>
      <div class="chips" style="margin-top:14px">
        <button class="btn dark" id="checkOrder" ${order.length === shuffled.length && !answered ? '' : 'disabled'}>${icon.check} Check order</button>
        <button class="btn" id="undoOrder" ${order.length && !answered ? '' : 'disabled'}>Undo</button>
        <button class="btn" id="clearOrder" ${order.length && !answered ? '' : 'disabled'}>Clear</button>
      </div>`;
    $$('#qBody .order-item').forEach((b) => (b.onclick = () => { order.push(+b.dataset.k); if (order.length === shuffled.length - 1) order.push(shuffled.findIndex((_, k) => !order.includes(k))); renderOrder(); }));
    $$('#qBody .order-pick').forEach((b) => (b.onclick = () => { order = order.slice(0, +b.dataset.n); renderOrder(); }));
    $('#checkOrder').onclick = checkOrder;
    $('#undoOrder').onclick = () => { order.pop(); renderOrder(); };
    $('#clearOrder').onclick = () => { order = []; renderOrder(); };
  }
  function checkOrder() {
    if (answered || order.length !== shuffled.length) return;
    answered = true;
    const seq = order.map((k) => shuffled[k].i); // original indices; correct = ascending
    let good = 0, tot = 0;
    for (let a = 0; a < seq.length; a++) for (let b = a + 1; b < seq.length; b++) { tot++; if (seq[a] < seq[b]) good++; }
    const exact = seq.every((v, i) => v === i);
    const score = exact ? 1 : Math.round((good / tot) * 0.7 * 100) / 100; // partial credit capped at 70%
    renderOrder();
    $$('#qBody .order-pick').forEach((b, n) => b.classList.add(seq[n] === n ? 'right' : 'wrong'));
    feedback(exact, score, `<div class="small muted" style="margin-bottom:4px">Correct order (${R(cur, cur.criterion)})</div>
      <div class="order-answer solved">${cur.items.map((t, i) => `${i ? '<span class="gt">&gt;</span>' : ''}<span class="order-pick right">${R(cur, t)}</span>`).join('')}</div>
      ${!exact ? `<div class="small" style="margin-top:6px">${good}/${tot} pairs in the right order → ${Math.round(score * 100)}% credit</div>` : ''}`);
    record(cur, score);
  }
  function answerOption(i) {
    if (answered) return; answered = true;
    const ok = i === cur.answer;
    $$('#qBody .option').forEach((b, j) => { b.disabled = true; if (j === cur.answer) b.classList.add('correct'); else if (j === i) b.classList.add('wrong'); });
    feedback(ok, ok ? 1 : 0, '');
    record(cur, ok ? 1 : 0);
  }
  function feedback(ok, score, extra) {
    const q = cur;
    $('#qFeedback').innerHTML = `
      <div class="card reveal-anim" style="background:${ok ? 'var(--green-soft)' : score > 0 ? '#fff6dc' : 'var(--red-soft)'};border:0">
        <h3 style="margin-bottom:8px">${ok ? '✓ Correct' : score > 0 ? '◐ Partly right' : '✗ Not quite'}</h3>
        ${extra}
        <div style="margin-top:10px">${R(q, q.explanation)}</div>
        ${q.trap ? `<div class="small" style="margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(251,226,164,.7)"><b>Trap:</b> ${R(q, q.trap)}</div>` : ''}
        ${(q.concepts || []).length ? `<div class="chips" style="margin-top:12px">${q.concepts.map((c) => `<span class="pill gray">${esc(c)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="chips" style="margin-top:14px"><button class="btn dark" id="nextQ">${quiz && quiz.scores.length >= quiz.n ? 'See results' : 'Next question'} ${icon.arrow}</button>
      <span class="small muted" style="align-self:center"><kbd>N</kbd> / <kbd>Enter</kbd></span></div>`;
    $('#nextQ').onclick = next; $('#nextQ').focus({ preventScroll: true });
    if (window.innerWidth < 1100) $('#qFeedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- controls ---------------- */
  [['#fTopic', 'topic'], ['#fType', 'type'], ['#fDiff', 'difficulty'], ['#fSource', 'source']].forEach(([s, k]) => $(s).addEventListener('change', (e) => { f[k] = e.target.value; if (quiz) setMode('quiz'); else next(); }));
  $('#nextBtn').onclick = next;
  $('#resetSession').onclick = () => { Object.assign(sess, { right: 0, wrong: 0, score: 0, n: 0, streak: 0 }); updateSession(); };
  document.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || !cur) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); next(); return; }
    if (e.key === 'Enter' && cur.type === 'order' && !answered) { e.preventDefault(); checkOrder(); return; }
    if (e.key === 'Backspace' && cur.type === 'order' && !answered && order.length) { e.preventDefault(); order.pop(); renderOrder(); return; }
    if (/^[1-6]$/.test(e.key) && !answered) {
      const k = +e.key - 1;
      if (cur.type === 'order') { if (k < shuffled.length && !order.includes(k)) { const b = $(`#qBody .order-item[data-k="${k}"]`); b && b.click(); } }
      else { const b = $$('#qBody .option')[k]; b && b.click(); }
    }
  });
  updateSession();
  next();
});
