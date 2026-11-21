RL.boot(() => {
  const { $, $$, esc, icon } = RL;
  RL.layout('edit', 'Edit & Upload');
  $$('.sicon').forEach((e) => (e.innerHTML = icon.search));
  $('#upIcon').innerHTML = icon.upload; $('#upIcon2').innerHTML = icon.upload;

  /* ---------------- Tabs ---------------- */
  function setTab(t) {
    $$('#tabs .tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    $$('[data-pane]').forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== t));
    history.replaceState(null, '', '#' + t);
    if (t === 'data') renderData();
    if (t === 'manage') renderManage();
  }
  $$('#tabs .tab').forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));

  /* ================= MANAGE ================= */
  let mStatus = 'all';
  function renderManage() {
    const all = RL.reactions({ include: 'all' });
    const groups = {
      all: all, active: all.filter((r) => RL.status(r.id) === 'active'), archived: all.filter((r) => RL.status(r.id) === 'archived'),
      blacklisted: all.filter((r) => RL.status(r.id) === 'blacklisted'), custom: all.filter((r) => r._custom), edited: all.filter((r) => r._builtin && RL.state.edits[r.id])
    };
    $('#statusChips').innerHTML = Object.entries(groups).map(([k, v]) => `<button class="chip ${mStatus === k ? 'active' : ''}" data-s="${k}">${k[0].toUpperCase() + k.slice(1)} <span class="count">${v.length}</span></button>`).join('');
    $$('#statusChips .chip').forEach((c) => (c.onclick = () => { mStatus = c.dataset.s; renderManage(); }));
    const nHidden = RL.reactions({ include: 'all', ignorePrefs: true }).length - all.length;
    $('#prefsNote').innerHTML = nHidden ? `${nHidden} reaction${nHidden === 1 ? ' is' : 's are'} hidden by your <a href="settings.html" style="text-decoration:underline">Profile &amp; filters</a> and not listed here.` : '';
    const q = RL.norm($('#mq').value);
    const list = groups[mStatus].filter((r) => !q || RL.norm(r.name + ' ' + r.aliases.join(' ') + ' ' + r.category).includes(q));
    $('#manageList').innerHTML = list.length ? list.map((r) => {
      const st = RL.status(r.id);
      return `<div class="row mg" style="grid-template-columns:minmax(0,2fr) minmax(0,1.4fr) auto;background:var(--panel)" data-id="${esc(r.id)}">
        <div style="min-width:0"><b style="font-weight:500">${esc(r.name)}</b>
          ${r._custom ? ' <span class="pill amber">custom</span>' : ''}${RL.state.edits[r.id] ? ' <span class="pill lav">edited</span>' : ''}
          ${st !== 'active' ? ` <span class="pill ${st === 'blacklisted' ? 'red' : 'gray'}">${st}</span>` : ''}
          <div class="small muted">${esc(r.category)} · ${esc(r.kind)}</div></div>
        <div class="eq-inline small hide-sm" data-eq="${esc(r.id)}"></div>
        <div class="chips" style="flex-wrap:nowrap">
          <button class="btn sm" data-act="archive" title="${st === 'archived' ? 'Unarchive' : 'Archive'}">${icon.archive}<span class="hide-sm">${st === 'archived' ? 'Unarchive' : 'Archive'}</span></button>
          <button class="btn sm ${st === 'blacklisted' ? '' : 'danger'}" data-act="black" title="${st === 'blacklisted' ? 'Remove from blacklist' : 'Blacklist'}">${icon.ban}<span class="hide-sm">${st === 'blacklisted' ? 'Allow' : 'Blacklist'}</span></button>
          <button class="btn sm" data-act="edit" title="Edit">${icon.edit}</button>
          ${r._custom ? `<button class="btn sm danger" data-act="del" title="Delete">${icon.trash}</button>` : RL.state.edits[r.id] ? `<button class="btn sm" data-act="revert" title="Revert to original">↺</button>` : ''}
        </div></div>`;
    }).join('') : '<p class="muted">Nothing here.</p>';
    RL.lazyEquations($('#manageList'));
    $$('#manageList [data-act]').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation();
      const id = b.closest('[data-id]').dataset.id, act = b.dataset.act;
      if (act === 'archive') { RL.toggleIn('blacklisted', id, false); RL.toggleIn('archived', id); }
      if (act === 'black') { RL.toggleIn('archived', id, false); RL.toggleIn('blacklisted', id); }
      if (act === 'edit') { loadForm(RL.byId(id)); setTab('add'); return; }
      if (act === 'del' && confirm('Delete this custom reaction?')) { RL.state.custom = RL.state.custom.filter((r) => r.id !== id); RL.save(); RL.toast('Deleted'); }
      if (act === 'revert' && confirm('Discard your edits and restore the original?')) { delete RL.state.edits[id]; RL.save(); RL.toast('Reverted'); }
      renderManage();
    }));
    $$('#manageList .row').forEach((row) => (row.onclick = () => RL.openReaction(RL.byId(row.dataset.id))));
  }
  $('#mq').addEventListener('input', RL.debounce(renderManage, 120));

  /* ================= ADD / EDIT ================= */
  const form = $('#rForm');
  form.category.innerHTML = RL.visibleCategories().map((c) => `<option>${esc(c)}</option>`).join('');
  form.kind.innerHTML = RL.visibleKinds().map((c) => `<option>${esc(c)}</option>`).join('');
  RL.prunePrefOptions(form.exam, 'exam'); RL.prunePrefOptions(form.difficulty, 'difficulty');
  let editing = null; // id being edited
  const semi = (v) => v.split(/[;\n]+/).map((x) => x.trim()).filter(Boolean);
  const lines = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);

  function readForm() {
    const v = (n) => form[n].value.trim();
    return RL.normalizeRecord({
      id: editing || RL.slug(v('name')), name: v('name'), aliases: semi(v('aliases')), category: v('category'), kind: v('kind'),
      exam: v('exam').split(','), difficulty: v('difficulty'), reactants: v('reactants'), reagents: v('reagents'), conditions: v('conditions'),
      products: v('products'), catalyst: v('catalyst'), productName: v('productName'), reagentKeywords: semi(v('reagentKeywords')),
      summary: v('summary'), mechanism: v('mechanism'), keyPoints: lines(v('keyPoints')), whenUsed: v('whenUsed'), applications: lines(v('applications')),
      examples: lines(v('examples')).map((l) => { const [eq, note] = l.split('||'); return { eq: eq.trim(), note: (note || '').trim() }; }),
      jeeTips: v('jeeTips'), tags: semi(v('tags')), reference: v('reference'), image: v('image')
    });
  }
  function loadForm(r) {
    editing = r ? r.id : null;
    form.reset();
    $('#formTitle').textContent = r ? `Edit: ${r.name}` : 'Add a new reaction';
    $('#cancelEdit').hidden = !r;
    $('#saveBtn').textContent = r ? (r._builtin ? 'Save my edits' : 'Update reaction') : 'Save reaction';
    if (r) {
      const set = (n, val) => (form[n].value = val ?? '');
      ['name', 'category', 'kind', 'difficulty', 'reactants', 'reagents', 'conditions', 'products', 'catalyst', 'productName', 'summary', 'mechanism', 'whenUsed', 'jeeTips', 'reference', 'image'].forEach((n) => set(n, r[n]));
      set('exam', (r.exam || []).length === 1 ? r.exam[0] : 'JEE Main,JEE Advanced');
      set('aliases', r.aliases.join('; ')); set('reagentKeywords', r.reagentKeywords.join('; ')); set('tags', r.tags.join('; '));
      set('keyPoints', r.keyPoints.join('\n')); set('applications', r.applications.join('\n'));
      set('examples', r.examples.map((e) => e.eq + (e.note ? ' || ' + e.note : '')).join('\n'));
    }
    preview();
  }
  function preview() {
    const r = readForm();
    $('#pvEq').innerHTML = r.reactants || r.products ? RL.equation(r) : '<span class="muted small">Equation preview appears here</span>';
    $('#pvCard').innerHTML = r.name ? RL.detailHTML(r, { full: false }) : '';
  }
  form.addEventListener('input', RL.debounce(preview, 200));
  $('#resetForm').onclick = () => loadForm(null);
  $('#cancelEdit').onclick = () => { loadForm(null); setTab('manage'); };
  $('#imgFile').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    form.image.value = await resizeImage(file, 900); preview(); RL.toast('Image attached');
  };
  function resizeImage(file, max) {
    return new Promise((res, rej) => {
      const img = new Image(); const fr = new FileReader();
      fr.onload = () => { img.src = fr.result; }; fr.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      fr.readAsDataURL(file);
    });
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    const r = readForm();
    if (!r.name || !r.reactants || !r.products) { RL.toast('Name, reactants and products are required'); return; }
    const existing = editing && RL.byId(editing);
    if (existing && existing._builtin) {
      const { _builtin, ...rest } = r; RL.state.edits[editing] = rest; RL.toast('Edits saved (original kept for revert)');
    } else if (existing && existing._custom) {
      RL.state.custom = RL.state.custom.map((x) => (x.id === editing ? r : x)); RL.toast('Reaction updated');
    } else {
      let id = r.id, i = 2; while (RL.byId(id)) id = `${r.id}-${i++}`; r.id = id;
      RL.state.custom.push(r); RL.toast('Reaction added to your bank');
    }
    RL.save(); loadForm(null); setTab('manage');
    if (RL.hiddenByPrefs(r)) RL.toast('Saved, but it is hidden by your Profile & filters');
  };

  /* ================= IMPORT ================= */
  $('#llmPrompt').value = RL.LLM_PROMPT();
  $('#copyPrompt').innerHTML = `${icon.copy} Copy prompt`;
  $('#copyPrompt').onclick = () => RL.copy($('#llmPrompt').value);
  $('#dlTemplate').onclick = () => {
    const tpl = [{ id: 'my-reaction', name: '', aliases: [], category: RL.CATEGORIES[0], kind: 'Named reaction', exam: ['JEE Main', 'JEE Advanced'], difficulty: 'medium',
      reactants: '', reagents: '', conditions: '', products: '', catalyst: '', reagentKeywords: [], productName: '', summary: '', mechanism: '', keyPoints: [],
      whenUsed: '', applications: [], examples: [{ eq: '', note: '' }], jeeTips: '', reference: '', tags: [] }];
    RL.download('reaction-template.json', JSON.stringify(tpl, null, 2));
  };
  function extractJSON(text) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    let src = fence ? fence[1] : text;
    src = src.trim();
    if (!/^[\[{]/.test(src)) { const a = src.indexOf('['), o = src.indexOf('{'); const i = a === -1 ? o : o === -1 ? a : Math.min(a, o); if (i >= 0) src = src.slice(i); }
    const v = JSON.parse(src);
    return Array.isArray(v) ? v : Array.isArray(v.reactions) ? v.reactions : [v];
  }
  const texOK = (s) => { if (!window.katex) return true; try { katex.renderToString(`\\ce{${s}}`, { throwOnError: true, strict: false }); return true; } catch { return false; } };
  let staged = [];
  function stage(text) {
    let arr;
    try { arr = extractJSON(text); }
    catch (e) { $('#impPreview').innerHTML = `<div class="card" style="background:var(--red-soft);border:0"><b>Could not parse JSON.</b><div class="small mono">${esc(e.message)}</div></div>`; return; }
    staged = arr.map((raw) => {
      const r = RL.normalizeRecord(raw); const issues = [];
      ['name', 'reactants', 'products'].forEach((k) => { if (!r[k]) issues.push(`missing ${k}`); });
      if (r.reactants && r.products && !texOK(`${r.reactants} ->[${r.reagents}] ${r.products}`)) issues.push('equation has mhchem errors');
      r.examples = (r.examples || []).filter((x) => x && x.eq).map((x) => ({ eq: String(x.eq), note: x.note || '' }));
      const bad = r.examples.filter((x) => !texOK(x.eq)).length; if (bad) issues.push(`${bad} example(s) won't render`);
      if (!r.summary) r.summary = r.name;
      const dup = RL.byId(r.id) || RL.reactions({ include: 'all', ignorePrefs: true }).find((x) => RL.norm(x.name) === RL.norm(r.name));
      const hidden = RL.hiddenByPrefs(r);
      return { r, issues, dup, hidden, include: !dup && !hidden && !issues.some((i) => i.startsWith('missing')) };
    });
    renderStage();
  }
  function renderStage() {
    const n = staged.filter((s) => s.include).length;
    $('#impPreview').innerHTML = `
      <div class="rows">${staged.map((s, i) => `
        <label class="row" style="grid-template-columns:auto 1fr;background:var(--panel);cursor:pointer">
          <input type="checkbox" data-i="${i}" ${s.include ? 'checked' : ''} style="width:18px;height:18px;accent-color:#141414">
          <div style="min-width:0"><b style="font-weight:500">${esc(s.r.name || '(no name)')}</b> <span class="small muted">· ${esc(s.r.category)}</span>
            ${s.dup ? ` <span class="pill amber">already in bank: ${esc(s.dup.name)}</span>` : ''}${s.hidden ? ' <span class="pill gray" title="Matches content you hid in Profile &amp; filters">hidden by your filters</span>' : ''}
            ${s.issues.map((x) => ` <span class="pill red">${esc(x)}</span>`).join('')}
            <div class="eq-inline small">${s.r.reactants ? RL.equation(s.r, 'none', false) : ''}</div></div>
        </label>`).join('')}</div>
      <div class="chips" style="margin-top:14px"><button class="btn dark" id="doImport" ${n ? '' : 'disabled'}>Import ${n} reaction${n === 1 ? '' : 's'}</button></div>`;
    $$('#impPreview input[type=checkbox]').forEach((c) => (c.onchange = () => { staged[+c.dataset.i].include = c.checked; renderStage(); }));
    const btn = $('#doImport'); if (btn) btn.onclick = () => {
      let added = 0;
      staged.filter((s) => s.include).forEach(({ r }) => {
        let id = r.id, k = 2; while (RL.byId(id)) id = `${r.id}-${k++}`; r.id = id;
        const { _builtin, _custom, ...rest } = r; RL.state.custom.push(rest); added++;
      });
      RL.save(); staged = []; $('#impText').value = ''; $('#impPreview').innerHTML = '';
      RL.toast(`Imported ${added} reaction${added === 1 ? '' : 's'}`); mStatus = 'custom'; setTab('manage');
    };
  }
  $('#parseBtn').onclick = () => stage($('#impText').value);
  $('#impFile').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const t = await f.text(); $('#impText').value = t; stage(t); e.target.value = ''; };

  /* ================= SAVED DATA ================= */
  function renderData() {
    const s = RL.state;
    $('#storeKind').textContent = `Storage: ${RL.storage.kind}`;
    const kb = (RL.storage.bytes() / 1024).toFixed(1);
    const tiles = [['Reaction attempts', s.attempts.length], ['GOC attempts', (s.goc || []).length], ['Custom reactions', s.custom.length], ['Edited reactions', Object.keys(s.edits).length],
      ['Archived', s.archived.length], ['Blacklisted', s.blacklisted.length], ['Size', kb + ' KB']];
    $('#dataStats').innerHTML = tiles.map(([l, v]) => `<div class="card" style="background:var(--panel);border:0"><div class="small muted">${l}</div><div style="font-size:26px;font-weight:700">${v}</div></div>`).join('');
  }
  $('#expAll').innerHTML = `${icon.download} Export all`;
  const stamp = () => new Date().toISOString().slice(0, 10);
  $('#expAll').onclick = () => RL.download(`reactionlab-backup-${stamp()}.json`, RL.exportState());
  $('#expCustom').onclick = () => {
    if (!RL.state.custom.length) return RL.toast('No custom reactions yet');
    RL.download(`reactionlab-custom-${stamp()}.json`, JSON.stringify(RL.state.custom, null, 2));
  };
  const importFile = (mode) => async (e) => {
    const f = e.target.files[0]; if (!f) return; e.target.value = '';
    try {
      const txt = await f.text();
      if (mode === 'replace' && !confirm('Replace ALL current saved data with this file?')) return;
      RL.importState(txt, mode); RL.toast(mode === 'replace' ? 'Data replaced from backup' : 'Backup merged'); renderData();
    } catch (err) { RL.toast('Import failed: ' + err.message); }
  };
  $('#impMerge').onchange = importFile('merge');
  $('#impReplace').onchange = importFile('replace');
  $('#clrAttempts').onclick = () => { if (confirm('Delete all practice history (reactions + GOC)?')) { RL.state.attempts = []; RL.state.goc = []; RL.save(); renderData(); RL.toast('History cleared'); } };
  $('#clrLists').onclick = () => { if (confirm('Un-archive and un-blacklist everything?')) { RL.state.archived = []; RL.state.blacklisted = []; RL.save(); renderData(); RL.toast('Lists reset'); } };
  $('#clrAll').onclick = () => {
    if (!confirm('Delete ALL your ReactionLab data (history, custom reactions, edits, lists) from your account and this browser? This cannot be undone.')) return;
    if (prompt('Type DELETE to confirm') !== 'DELETE') return RL.toast('Cancelled');
    RL.cloud.reset().then(() => { RL.toast('All your data was deleted'); setTimeout(() => location.reload(), 600); })
      .catch(() => RL.toast('Could not reach the cloud. Check your connection and try again.'));
  };

  /* ---------------- init ---------------- */
  loadForm(null);
  const h = location.hash.slice(1);
  setTab(['manage', 'add', 'import', 'data'].includes(h) ? h : 'manage');
});
