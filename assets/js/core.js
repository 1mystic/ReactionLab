/* ReactionLab core - shared by every page. No build step; works from file:// or any static host. */
(function () {
  'use strict';
  const RL = (window.RL = {});

  /* ================= Constants ================= */
  RL.CATEGORIES = ['Hydrocarbons', 'Aromatic Compounds', 'Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers',
    'Aldehydes & Ketones', 'Carboxylic Acids & Derivatives', 'Amines & Diazonium Salts', 'Biomolecules & Polymers', 'Qualitative Tests'];
  RL.KINDS = ['Named reaction', 'Rearrangement', 'Oxidation', 'Reduction', 'Distinguishing test', 'Industrial process', 'General reaction'];
  RL.CAT_COLORS = {
    'Hydrocarbons': '#a6f0a0', 'Aromatic Compounds': '#7fd3f7', 'Haloalkanes & Haloarenes': '#fbc7a4',
    'Alcohols, Phenols & Ethers': '#f7a6c9', 'Aldehydes & Ketones': '#a997f7', 'Carboxylic Acids & Derivatives': '#fbe2a4',
    'Amines & Diazonium Salts': '#9be3d0', 'Biomolecules & Polymers': '#d4c2a8', 'Qualitative Tests': '#c9cbc6'
  };

  /* ================= Icons (inline SVG, lucide-style) ================= */
  const p = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  RL.icon = {
    home: p('<rect x="3" y="3" width="7" height="7" rx="3.5"/><rect x="14" y="3" width="7" height="7" rx="3.5"/><rect x="3" y="14" width="7" height="7" rx="3.5"/><rect x="14" y="14" width="7" height="7" rx="3.5"/>'),
    flask: p('<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>'),
    grid: p('<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/><path d="M8 8h8v8H8z"/>'),
    edit: p('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    quiz: p('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H17M14.5 15.5H17"/>'),
    search: p('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    plus: p('<path d="M12 5v14M5 12h14"/>'),
    dots: p('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
    shuffle: p('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
    eye: p('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    check: p('<path d="M20 6 9 17l-5-5"/>'),
    bulb: p('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"/>'),
    archive: p('<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>'),
    ban: p('<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>'),
    upload: p('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
    download: p('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
    copy: p('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    trash: p('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
    x: p('<path d="M18 6 6 18M6 6l12 12"/>'),
    list: p('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    layout: p('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    arrow: p('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    book: p('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
    atom: p('<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>'),
    gear: p('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
    chev: p('<path d="m6 9 6 6 6-6"/>'),
    link: p('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    logo: '<svg viewBox="0 0 32 32" fill="currentColor"><path d="M12 3h8v2h-1.5v7.2l7.8 12.6A3.4 3.4 0 0 1 23.4 30H8.6a3.4 3.4 0 0 1-2.9-5.2l7.8-12.6V5H12zm-1.7 17h11.4l-3.7-6h-4z"/></svg>'
  };

  /* ================= Utilities ================= */
  RL.$ = (s, el = document) => el.querySelector(s);
  RL.$$ = (s, el = document) => [...el.querySelectorAll(s)];
  RL.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  RL.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  RL.pick = (a) => a[Math.floor(Math.random() * a.length)];
  RL.slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  RL.debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  RL.toast = (msg) => {
    let w = RL.$('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; w.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };
  RL.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    RL.toast('Copied to clipboard');
  };
  RL.download = (name, text, type = 'application/json') => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* ================= Store (localStorage) ================= */
  /* Storage adapter - every read/write of user data goes through RL.storage.
     Today: browser localStorage. Later: swap in a Firebase (Auth + Firestore) adapter
     exposing the same load()/save()/clear() interface; nothing else needs to change. */
  const KEY = 'reactionlab.v1';
  RL.STORAGE_KEYS = [KEY, 'rl.view'];
  RL.storage = {
    kind: 'localStorage',
    load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
    save(state) { localStorage.setItem(KEY, JSON.stringify(state)); },
    clear() { RL.STORAGE_KEYS.forEach((k) => localStorage.removeItem(k)); },
    bytes() { return new Blob([localStorage.getItem(KEY) || '']).size; }
  };
  const blankPrefs = () => ({ exams: [], categories: [], kinds: [], difficulties: [], tags: [], gocTopics: [] });
  const blank = () => ({ archived: [], blacklisted: [], custom: [], edits: {}, attempts: [], goc: [], name: '', prefs: blankPrefs() });
  RL.blankPrefs = blankPrefs;
  RL.blankState = blank;
  RL.state = Object.assign(blank(), RL.storage.load());
  if (!Array.isArray(RL.state.goc)) RL.state.goc = [];
  /* ---- Profile filters: content the user has permanently hidden site-wide ---- */
  RL.EXAMS = ['JEE Main', 'JEE Advanced'];
  RL.DIFFICULTIES = ['easy', 'medium', 'hard'];
  RL.prefs = () => {
    const p = RL.state.prefs && typeof RL.state.prefs === 'object' ? RL.state.prefs : {};
    const out = blankPrefs(); Object.keys(out).forEach((k) => { if (Array.isArray(p[k])) out[k] = p[k].filter((x) => typeof x === 'string'); });
    return (RL.state.prefs = out);
  };
  RL.prefs();
  const lc = (a) => new Set(a.map((x) => String(x).toLowerCase()));
  /** true when every exam the item belongs to has been hidden */
  const examHidden = (exam, P) => { const e = Array.isArray(exam) && exam.length ? exam : RL.EXAMS; return P.exams.length > 0 && e.every((x) => P.exams.includes(x)); };
  RL.hiddenByPrefs = (r, P = RL.prefs()) => {
    if (!r) return true;
    if (P.categories.includes(r.category) || P.kinds.includes(r.kind) || P.difficulties.includes(r.difficulty) || examHidden(r.exam, P)) return true;
    if (P.tags.length) { const ht = lc(P.tags); if ((r.tags || []).some((t) => ht.has(String(t).toLowerCase()))) return true; }
    return false;
  };
  RL.gocHiddenByPrefs = (q, P = RL.prefs()) => !q || P.gocTopics.includes(q.topic) || P.difficulties.includes(q.difficulty) || examHidden(q.exam, P);
  RL.visibleCategories = () => RL.CATEGORIES.filter((c) => !RL.prefs().categories.includes(c));
  RL.visibleKinds = () => RL.KINDS.filter((c) => !RL.prefs().kinds.includes(c));
  RL.visibleExams = () => RL.EXAMS.filter((c) => !RL.prefs().exams.includes(c));
  RL.prefsActive = () => Object.values(RL.prefs()).some((a) => a.length > 0);
  /** Remove <option>s of a filter <select> that point at hidden values ('exam' | 'difficulty' | 'kind' | 'category') */
  RL.prunePrefOptions = (sel, kind) => {
    if (!sel) return; const P = RL.prefs();
    const hidden = { exam: P.exams, difficulty: P.difficulties, kind: P.kinds, category: P.categories }[kind] || [];
    [...sel.options].forEach((o) => {
      const vals = String(o.value).split(',').map((x) => x.trim()).filter(Boolean);
      if (o.value !== 'all' && vals.length && vals.every((v) => hidden.includes(v))) o.remove();
    });
    if (kind === 'exam' && P.exams.length) { const all = [...sel.options].find((o) => o.value === 'all'); if (all) all.textContent = 'All my exams'; }
  };
  RL._ver = 0; // bumped on every save; invalidates the reactions cache
  RL.save = () => { RL._ver++; try { RL.storage.save(RL.state); } catch (e) { RL.toast('Storage full - export your data & remove large images'); } };
  RL.exportState = () => JSON.stringify({ app: 'ReactionLab', version: 1, exportedAt: new Date().toISOString(), data: RL.state }, null, 2);
  /** mode: 'replace' | 'merge' */
  RL.importState = (json, mode = 'merge') => {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    const d = obj && obj.data ? obj.data : obj;
    if (!d || typeof d !== 'object' || !['archived', 'blacklisted', 'custom', 'edits', 'attempts', 'goc'].some((k) => k in d)) throw new Error('Not a ReactionLab backup file');
    if (mode === 'replace') RL.state = Object.assign(blank(), d);
    else {
      const s = RL.state, u = (a, b) => [...new Set([...(a || []), ...(b || [])])];
      s.archived = u(s.archived, d.archived); s.blacklisted = u(s.blacklisted, d.blacklisted);
      const cm = new Map(s.custom.map((r) => [r.id, r])); (d.custom || []).forEach((r) => cm.set(r.id, r)); s.custom = [...cm.values()];
      s.edits = Object.assign({}, s.edits, d.edits || {});
      const seen = new Set(s.attempts.map((a) => a.id + a.ts)); (d.attempts || []).forEach((a) => { if (!seen.has(a.id + a.ts)) s.attempts.push(a); });
      s.attempts.sort((a, b) => a.ts - b.ts); if (!s.name && d.name) s.name = d.name;
      if (d.prefs && !RL.prefsActive()) s.prefs = d.prefs;
      s.goc = s.goc || []; const gs = new Set(s.goc.map((a) => a.id + a.ts)); (d.goc || []).forEach((a) => { if (!gs.has(a.id + a.ts)) s.goc.push(a); });
    }
    RL.save();
  };
  RL.toggleIn = (listName, id, on) => {
    const s = new Set(RL.state[listName]); (on ?? !s.has(id)) ? s.add(id) : s.delete(id); RL.state[listName] = [...s]; RL.save();
  };
  RL.status = (id) => RL.state.blacklisted.includes(id) ? 'blacklisted' : RL.state.archived.includes(id) ? 'archived' : 'active';

  /* ================= Data access ================= */
  RL.normalizeRecord = (r) => {
    const out = Object.assign({
      aliases: [], exam: ['JEE Main', 'JEE Advanced'], difficulty: 'medium', reagents: '', conditions: '', catalyst: '',
      reagentKeywords: [], productName: '', mechanism: '', keyPoints: [], whenUsed: '', applications: [], examples: [],
      jeeTips: '', reference: '', tags: [], image: ''
    }, r);
    if (!out.id) out.id = RL.slug(out.name || 'reaction-' + Date.now());
    ['aliases', 'exam', 'reagentKeywords', 'keyPoints', 'applications', 'tags'].forEach((k) => {
      if (typeof out[k] === 'string') out[k] = out[k].split(/[\n;|]+/).map((x) => x.trim()).filter(Boolean);
    });
    if (!RL.CATEGORIES.includes(out.category)) out.category = RL.guessCategory(out.category);
    if (!RL.KINDS.includes(out.kind)) out.kind = 'Named reaction';
    return out;
  };
  RL.guessCategory = (c) => {
    const s = String(c || '').toLowerCase();
    const map = [['arom', 'Aromatic Compounds'], ['benz', 'Aromatic Compounds'], ['halo', 'Haloalkanes & Haloarenes'], ['alcohol', 'Alcohols, Phenols & Ethers'],
      ['phenol', 'Alcohols, Phenols & Ethers'], ['ether', 'Alcohols, Phenols & Ethers'], ['aldehyde', 'Aldehydes & Ketones'], ['ketone', 'Aldehydes & Ketones'],
      ['carbonyl', 'Aldehydes & Ketones'], ['acid', 'Carboxylic Acids & Derivatives'], ['ester', 'Carboxylic Acids & Derivatives'], ['amine', 'Amines & Diazonium Salts'],
      ['diazo', 'Amines & Diazonium Salts'], ['polymer', 'Biomolecules & Polymers'], ['bio', 'Biomolecules & Polymers'], ['test', 'Qualitative Tests'], ['alk', 'Hydrocarbons']];
    return (map.find(([k]) => s.includes(k)) || [, 'Hydrocarbons'])[1];
  };
  /** All reactions = built-in (with user edits applied) + custom. opts.include: 'active' | 'visible' | 'all' */
  /* normalised built-in + custom list, rebuilt only when state changes (RL.save) */
  let _base = null, _baseVer = -1, _byId = null;
  const baseList = () => {
    if (_base && _baseVer === RL._ver && RL.state === _baseState) return _base;
    const builtIn = (window.REACTIONS || []).map((r) => RL.normalizeRecord(Object.assign({}, r, RL.state.edits[r.id] || {}, { _builtin: true })));
    const custom = RL.state.custom.map((r) => RL.normalizeRecord(Object.assign({}, r, { _custom: true })));
    _base = builtIn.concat(custom); _baseVer = RL._ver; _baseState = RL.state; _byId = new Map(_base.map((r) => [r.id, r]));
    return _base;
  };
  let _baseState = null;
  RL.reactions = (opts = {}) => {
    const include = opts.include || 'visible';
    let all = baseList().slice();
    if (!opts.ignorePrefs) { const P = RL.prefs(); all = all.filter((r) => !RL.hiddenByPrefs(r, P)); }
    if (include === 'all') return all;
    if (include === 'active') return all.filter((r) => RL.status(r.id) === 'active');
    return all.filter((r) => RL.status(r.id) !== 'blacklisted');
  };
  /** Lookup by id ignores profile filters (ids must stay unique); use RL.isShown to respect them */
  RL.byId = (id) => { baseList(); return _byId.get(id); };
  RL.isShown = (id) => { const r = RL.byId(id); return !!r && RL.status(id) !== 'blacklisted' && !RL.hiddenByPrefs(r); };

  /* ================= Chemistry rendering (KaTeX + mhchem) ================= */
  RL.tex = (src, display = false) => {
    if (!window.katex) return `<code>${RL.esc(src)}</code>`;
    try { return katex.renderToString(src, { throwOnError: true, displayMode: display, strict: false }); }
    catch (e) { return `<code title="${RL.esc(e.message)}">${RL.esc(src)}</code>`; }
  };
  RL.ce = (src, display = false) => RL.tex(`\\ce{${src}}`, display);
  /** Render mhchem as several wrappable chunks, split at top-level " + ", ";" and ", " (for options / cards on small screens) */
  RL.ceWrap = (src) => {
    const parts = []; let depth = 0, cur = '';
    const str = String(src || '');
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if ('{(['.includes(ch)) depth++; else if ('})]'.includes(ch)) depth = Math.max(0, depth - 1);
      if (depth === 0) {
        if (str.startsWith(' + ', i)) { parts.push(cur + ' +'); cur = ''; i += 2; continue; }
        if (ch === ';' || (ch === ',' && str[i + 1] === ' ')) { parts.push(cur + ch); cur = ''; continue; }
      }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    return parts.map((x) => x.trim()).filter(Boolean).map((x) => `<span class="ce-chunk">${RL.ce(x.replace(/^\+\s*/, ''))}</span>`).join(' ');
  };
  /** Build equation. mask: 'none' | 'reagents' | 'products' | 'reactants' */
  RL.equation = (r, mask = 'none', display = true) => {
    const Q = '\\text{ ? }';
    const react = mask === 'reactants' ? `$${Q}$` : r.reactants;
    const prod = mask === 'products' ? `$${Q}$` : r.products;
    let reag = r.reagents || '', cond = r.conditions || '';
    if (mask === 'reagents') { reag = `$\\colorbox{#a997f7}{\\color{white}\\textsf{ ? }}$`; cond = ''; }
    const arrow = reag || cond ? `->[${reag}]${cond ? `[${cond}]` : ''}` : '->';
    return RL.ce(`${react} ${arrow} ${prod}`, display);
  };
  /** Render inline $...$ chemistry inside plain text */
  const ELEMENTS = new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Cr Mn Fe Co Ni Cu Zn Br Ag Sn I Ba Pt Au Hg Pb Os Se Pd Ce Ti Li Cs Rb Sr Mo W Ru Rh Ir Bi Sb As Ge Ga Cd'.split(' '));
  const NOT_FORMULA = /^(SN\d|E\d|E1cB|SNAr|SNi|C\d|B\d|N\d)$/;
  /** Subscript digits in formula-like tokens of plain text (ZnCl2 → ZnCl₂, CH3CH2OH, Hg2+) */
  RL.chemify = (escaped) => escaped.replace(/\b((?:\(?[A-Z][a-z]?\d*\)?\d*)+)(\d?[+-](?=[\s,.;)]|$))?/g, (m, f, charge) => {
    if (!/\d/.test(f) || NOT_FORMULA.test(f)) return m;
    const syms = f.match(/[A-Z][a-z]?/g) || [];
    if (!syms.every((x) => ELEMENTS.has(x))) return m;
    if (charge && syms.length === 1 && /\d$/.test(f) && !/\d/.test(charge[0])) { const d = f.match(/\d+$/)[0]; f = f.slice(0, -d.length); charge = d + charge; }
    return f.replace(/(\d+)/g, '<sub>$1</sub>') + (charge ? `<sup>${charge}</sup>` : '');
  });
  /** Same as rich() but for trusted, app-generated text that may contain <b>/<i> markup */
  RL.richTrusted = (text) => String(text || '').split(/(\$[^$]+\$)/g).map((part) => (/^\$[^$]+\$$/.test(part) ? RL.tex(part.slice(1, -1)) : RL.chemify(part))).join('');
  RL.rich = (text) => {
    if (!text) return '';
    return String(text).split(/(\$[^$]+\$)/g).map((part) => (/^\$[^$]+\$$/.test(part) ? RL.tex(part.slice(1, -1)) : RL.chemify(RL.esc(part)))).join('');
  };

  /* ================= Similarity scoring ================= */
  const STOP = new Set(['reaction', 'reactions', 'rxn', 'the', 'of', 'a', 'an', 'test', 'method', 'process', 'synthesis', 'named', 'name', 'and', 'with', 'by', 'in', 'is', 'to', 'for', 'using', 'used']);
  RL.norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`]s\b/g, '').replace(/[–—‐]/g, '-').replace(/[^a-z0-9+\-\s./]/g, ' ').replace(/\s+/g, ' ').trim();
  RL.tokens = (s, keepStop = false) => RL.norm(s).split(/[\s\-/,.]+/).filter((t) => t && (keepStop || !STOP.has(t)));
  const bigrams = (s) => { const b = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); b.set(g, (b.get(g) || 0) + 1); } return b; };
  RL.dice = (a, b) => {
    a = a.replace(/\s+/g, ''); b = b.replace(/\s+/g, '');
    if (!a || !b) return 0; if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
    const A = bigrams(a), B = bigrams(b); let inter = 0;
    for (const [g, n] of A) inter += Math.min(n, B.get(g) || 0);
    return (2 * inter) / (a.length + b.length - 2);
  };
  /** fraction of target tokens fuzzily present in answer tokens */
  const tokenRecall = (targetToks, ansToks, thr = 0.72) => {
    if (!targetToks.length) return 0;
    let hit = 0;
    for (const t of targetToks) {
      let best = 0; for (const a of ansToks) { best = Math.max(best, a === t ? 1 : RL.dice(a, t)); if (best === 1) break; }
      if (best >= thr) hit += best;
    }
    return hit / targetToks.length;
  };
  RL.nameScore = (answer, r) => {
    const ans = RL.tokens(answer); if (!ans.length) return 0;
    const names = [r.name, ...(r.aliases || [])];
    let best = 0;
    for (const n of names) {
      const nt = RL.tokens(n); if (!nt.length) continue;
      const whole = RL.dice(ans.join(''), nt.join(''));
      const recall = tokenRecall(nt, ans);
      const precision = tokenRecall(ans, nt);
      best = Math.max(best, whole, 0.65 * recall + 0.35 * precision);
    }
    // weak coincidental overlaps (e.g. "aldol" vs "alcohol") shouldn't earn credit
    return best < 0.45 ? 0 : Math.min(1, (best - 0.45) / 0.45 * 0.55 + 0.45 + (best >= 0.9 ? 0.1 : 0));
  };
  const chemToks = (s) => String(s || '').replace(/\$|\\ce\{|\\text\{|\}|\{/g, ' ').toLowerCase()
    .split(/[\s,;+()\[\]/]+|->|→/).map((t) => t.replace(/^[.\-]+|[.\-]+$/g, '')).filter((t) => t.length > 1 && !STOP.has(t));
  RL.keywordScore = (answer, keywords, need = 3) => {
    const ans = [...new Set([...RL.tokens(answer, true), ...chemToks(answer), RL.norm(answer).replace(/\s+/g, '')])];
    const kws = [...new Set(keywords.map((k) => RL.norm(k)).filter(Boolean))];
    if (!kws.length || !ans.length) return { score: 0, matched: [], missed: kws };
    const matched = [], missed = [];
    const flat = RL.norm(answer).replace(/[\s\-]/g, '');
    for (const k of kws) {
      const kt = k.split(/\s+/).filter((t) => !STOP.has(t));
      const kFlat = k.replace(/[\s\-]/g, '');
      const ok = (kFlat.length > 2 && flat.includes(kFlat)) || tokenRecall(kt.length ? kt : [k], ans, 0.78) >= 0.75;
      (ok ? matched : missed).push(k);
    }
    return { score: Math.min(1, matched.length / Math.min(need, kws.length)), matched, missed };
  };
  /** Full scoring of a free-text attempt */
  RL.scoreAttempt = (r, { name = '', reagent = '', other = '' }) => {
    const nameS = RL.nameScore(name, r);
    const reagentKws = [...(r.reagentKeywords || []), ...chemToks(r.reagents).filter((t) => t.length > 2)];
    const reagentRes = RL.keywordScore(reagent + ' ' + other, reagentKws, 2);
    const otherKws = [...RL.tokens(r.productName).filter((t) => t.length > 2 && !/^\d+$/.test(t) && !['on', 'heating', 'heat', 'via', 'then', 'from'].includes(t)), ...chemToks(r.products).filter((t) => t.length > 2 && !t.includes('\\'))];
    const otherRes = RL.keywordScore(other + ' ' + reagent, otherKws, 2);
    // If the user typed the name in the wrong box, still give name credit
    const nameAny = Math.max(nameS, 0.9 * RL.nameScore(reagent + ' ' + other, r));
    const total = Math.round(100 * (0.5 * nameAny + 0.35 * reagentRes.score + 0.15 * otherRes.score));
    return { total, name: nameAny, reagent: reagentRes, other: otherRes };
  };
  RL.verdict = (t) => t >= 85 ? ['Excellent!', 'green'] : t >= 65 ? ['Good - almost there', 'green'] : t >= 40 ? ['Partially correct', 'amber'] : ['Needs revision', 'red'];

  /* ================= Attempts / stats ================= */
  RL.logAttempt = (id, score, mode = 'free') => {
    RL.state.attempts.push({ id, score, mode, ts: Date.now() });
    if (RL.state.attempts.length > 2000) RL.state.attempts = RL.state.attempts.slice(-2000);
    RL.save();
  };
  RL.stats = () => {
    const a = RL.state.attempts; const seen = new Set(a.map((x) => x.id));
    const avg = a.length ? Math.round(a.reduce((s, x) => s + x.score, 0) / a.length) : 0;
    const day = 864e5; const days = new Set(a.map((x) => Math.floor(x.ts / day)));
    let streak = 0; let d = Math.floor(Date.now() / day); while (days.has(d)) { streak++; d--; }
    return { attempts: a.length, seen: seen.size, avg, streak };
  };
  /** weakest reactions by average score (min 1 attempt) */
  RL.weakest = (n = 5) => {
    const m = new Map(); for (const x of RL.state.attempts) { const v = m.get(x.id) || [0, 0]; v[0] += x.score; v[1]++; m.set(x.id, v); }
    return [...m].map(([id, [s, c]]) => ({ id, avg: Math.round(s / c), count: c })).filter((x) => RL.isShown(x.id)).sort((a, b) => a.avg - b.avg).slice(0, n);
  };

  /* ================= MCQ generator ================= */
  const uniqueBy = (arr, key) => { const s = new Set(); return arr.filter((x) => { const k = key(x); if (!k || s.has(k)) return false; s.add(k); return true; }); };
  function distractors(r, pool, key, n = 3, similar = false) {
    const target = RL.norm(key(r));
    let cands = uniqueBy(RL.shuffle(pool.filter((x) => x.id !== r.id)), (x) => RL.norm(key(x))).filter((x) => RL.norm(key(x)) && RL.norm(key(x)) !== target);
    if (similar) {
      // look-alike options: rank by string similarity (+ same chapter bonus) and sample from the closest few
      const t = String(key(r)).toLowerCase();
      cands = cands.map((x) => ({ x, s: RL.dice(String(key(x)).toLowerCase(), t) + (x.category === r.category ? 0.15 : 0) })).sort((a, b) => b.s - a.s).slice(0, n + 4).map((o) => o.x);
      return RL.shuffle(cands).slice(0, n);
    }
    return [...cands.filter((x) => x.category === r.category), ...cands.filter((x) => x.category !== r.category)].slice(0, n);
  }
  RL.makeMCQ = (r, pool, type) => {
    const types = ['name', 'reagent', 'product', 'nameFromReagent'];
    if (!r.reagents) types.splice(types.indexOf('reagent'), 1);
    type = type || RL.pick(types);
    let stem, prompt, key, renderOpt, mask = 'none';
    if (type === 'name') { stem = 'Identify the named reaction / test:'; prompt = RL.equation(r, 'none'); key = (x) => x.name; renderOpt = (x) => RL.esc(x.name); }
    else if (type === 'nameFromReagent') { stem = 'Which reaction converts the reactant to the product shown?'; prompt = RL.equation(r, 'reagents'); key = (x) => x.name; renderOpt = (x) => RL.esc(x.name); mask = 'reagents'; }
    else if (type === 'reagent') { stem = `Which reagent / condition is used in the <b>${RL.esc(r.name)}</b>?`; prompt = RL.equation(r, 'reagents'); key = (x) => x.reagents; renderOpt = (x) => RL.ceWrap(x.reagents + (x.conditions ? `; ${x.conditions}` : '')); mask = 'reagents'; }
    else { stem = `Predict the product (<b>${RL.esc(r.name)}</b>):`; prompt = RL.equation(r, 'products'); key = (x) => x.products; renderOpt = (x) => RL.ceWrap(x.products); mask = 'products'; }
    const opts = RL.shuffle([r, ...distractors(r, pool, key, 3, type === 'product' || type === 'reagent')]);
    return { id: r.id, type, stem, prompt, mask, options: opts.map((x) => ({ id: x.id, html: renderOpt(x) })), answer: opts.findIndex((x) => x.id === r.id) };
  };
  RL.makeQuiz = (pool, n = 10) => RL.shuffle(pool).slice(0, n).map((r) => RL.makeMCQ(r, pool));

  /* ================= Reaction detail (reveal cards) ================= */
  RL.list = (items) => items && items.length ? `<ul class="clean">${items.map((i) => `<li>${RL.rich(i)}</li>`).join('')}</ul>` : '<span class="muted">-</span>';
  RL.metaPills = (r) => `
    <span class="pill" style="background:${RL.CAT_COLORS[r.category]}33;color:#222">${RL.esc(r.category)}</span>
    <span class="pill gray">${RL.esc(r.kind)}</span>
    ${(r.exam || []).map((e) => `<span class="pill ${e.includes('Adv') ? 'lav' : 'green'}">${RL.esc(e)}</span>`).join('')}
    <span class="pill ${r.difficulty === 'hard' ? 'red' : r.difficulty === 'easy' ? 'green' : 'amber'}">${RL.esc(r.difficulty)}</span>`;
  RL.detailHTML = (r, { full = true } = {}) => `
    <div class="reveal-grid">
      <div class="note-card green reveal-anim">
        <span class="small" style="opacity:.7">Reaction name</span>
        <h3 style="font-size:24px">${RL.esc(r.name)}</h3>
        ${r.aliases.length ? `<div class="small">Also: ${r.aliases.map(RL.esc).join(', ')}</div>` : ''}
        <div class="foot">${RL.rich(r.summary)}</div>
      </div>
      <div class="note-card lav reveal-anim">
        <span class="small" style="opacity:.8">Reagents · Catalyst · Conditions</span>
        <div class="wrap-chem" style="font-size:1.15em">${r.reagents ? RL.ceWrap(r.reagents) : '-'}</div>
        ${r.conditions ? `<div class="wrap-chem small" style="margin-top:-6px;opacity:.9">${RL.ceWrap(r.conditions)}</div>` : ''}
        ${r.catalyst ? `<div class="small"><b>Catalyst:</b> ${RL.rich(r.catalyst)}</div>` : ''}
        ${r.productName ? `<div class="foot"><b>Product:</b> ${RL.rich(r.productName)}</div>` : ''}
      </div>
      <div class="card span2 reveal-anim"><div class="small muted" style="margin-bottom:6px">Full equation</div><div class="eq-inline eq-fit">${RL.equation(r)}</div>
        ${r.image ? `<img src="${RL.esc(r.image)}" alt="" style="max-width:100%;border-radius:14px;margin-top:10px">` : ''}</div>
      ${full ? `
      <div class="card reveal-anim"><h3 style="margin-bottom:8px">Mechanism</h3><div>${RL.rich(r.mechanism) || '<span class="muted">-</span>'}</div></div>
      <div class="card reveal-anim"><h3 style="margin-bottom:8px">Key points</h3>${RL.list(r.keyPoints)}</div>
      <div class="card reveal-anim"><h3 style="margin-bottom:8px">When & where used</h3><div>${RL.rich(r.whenUsed) || '-'}</div></div>
      <div class="card reveal-anim"><h3 style="margin-bottom:8px">Applications</h3>${RL.list(r.applications)}</div>
      <div class="card span2 reveal-anim"><h3 style="margin-bottom:8px">Examples</h3>
        ${r.examples.length ? r.examples.map((e) => `<div class="eq-inline">${RL.ce(e.eq)}</div>${e.note ? `<div class="small muted" style="margin-bottom:8px">${RL.rich(e.note)}</div>` : ''}`).join('') : '<span class="muted">-</span>'}</div>
      ${r.jeeTips ? `<div class="note-card amber span2 reveal-anim" style="min-height:0"><h3>JEE tip</h3><div>${RL.rich(r.jeeTips)}</div></div>` : ''}
      <div class="span2 chips reveal-anim" style="align-items:center">${RL.metaPills(r)}
        ${(r.tags || []).map((t) => `<span class="pill gray">#${RL.esc(t)}</span>`).join('')}
        ${r.reference ? `<a class="btn sm" style="margin-left:auto" href="${RL.esc(r.reference)}" target="_blank" rel="noopener">${RL.icon.link} Reference</a>` : ''}</div>` : ''}
    </div>`;

  RL.modal = (html, { onClose } = {}) => {
    const bd = document.createElement('div'); bd.className = 'modal-backdrop';
    bd.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => { bd.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', esc); document.body.appendChild(bd); RL.fitAll(bd);
    return { el: bd, close };
  };
  RL.openReaction = (r) => RL.modal(`
    <div class="panel-head"><div style="margin-right:auto"><div class="small muted">${RL.esc(r.category)}</div><h2>${RL.esc(r.name)}</h2></div>
      <a class="btn sm" href="practice.html?id=${encodeURIComponent(r.id)}">${RL.icon.flask} Practice this</a>
      <button class="icon-btn" data-close aria-label="Close">${RL.icon.x}</button></div>
    ${RL.detailHTML(r)}`);

  /* ================= Fit long equations: shrink (down to 60%) before resorting to scroll ================= */
  RL.fit = (el) => {
    const k = el.querySelector('.katex-display > .katex, .katex'); if (!k) return;
    k.style.fontSize = '';
    const cs = getComputedStyle(el);
    const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
    const w = k.scrollWidth;
    if (avail > 0 && w > avail) k.style.fontSize = Math.max(0.6, avail / w) * 100 + '%';
  };
  RL.fitAll = (root = document) => requestAnimationFrame(() => root.querySelectorAll('.eq-fit').forEach(RL.fit));
  window.addEventListener('resize', RL.debounce(() => RL.fitAll(), 150));

  /* ================= Layout ================= */
  RL.layout = (active, title) => {
    const counts = { bank: RL.reactions({ include: 'visible' }).length, custom: RL.state.custom.length };
    const nav = [
      ['index.html', 'home', 'Dashboard', 'home'], ['practice.html', 'flask', 'Practice', 'practice'],
      ['practice.html?mode=mcq', 'quiz', 'MCQ Quiz', 'mcq'], ['goc.html', 'atom', 'GOC Concepts', 'goc'], ['bank.html', 'grid', 'Reaction Bank', 'bank', counts.bank],
      ['edit.html', 'edit', 'Edit & Upload', 'edit', counts.custom || null]
    ];
    let aside = RL.$('aside.sidebar'); const fresh = !aside;
    if (fresh) { aside = document.createElement('aside'); aside.className = 'sidebar'; }
    aside.innerHTML = `
      <a class="brand" href="index.html"><div class="brand-logo">${RL.icon.logo}</div><span>ReactionLab</span></a>
      ${nav.map(([href, ic, label, key, badge]) => `<a class="nav-link ${key === active ? 'active' : ''}" href="${href}">${RL.icon[ic]}<span>${label}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</a>`).join('')}
      <div class="nav-spacer"></div>
      <a class="nav-link ${active === 'settings' ? 'active' : ''}" href="settings.html">${RL.icon.gear}<span>Profile &amp; filters</span>${RL.prefsActive() ? '<span class="badge" title="Profile filters active">on</span>' : ''}</a>
      <a class="nav-link nav-secondary" href="https://www.organic-chemistry.org/namedreactions/" target="_blank" rel="noopener">${RL.icon.book}<span>Reference site</span></a>`;
    if (fresh) RL.$('.app').prepend(aside);
    setTimeout(() => { RL.enhanceSelects(); RL.fitAll(); requestAnimationFrame(() => document.documentElement.classList.remove('loading')); }, 0);
    const top = RL.$('#topbar');
    if (top) {
      const nm = RL.state.name || 'Student';
      top.className = 'topbar';
      top.innerHTML = `
        <a class="icon-btn dark" href="bank.html" title="Search the bank">${RL.icon.search}</a>
        <a class="icon-btn lav" href="practice.html" title="Random reaction">${RL.icon.shuffle}</a>
        <div class="title">${title || ''}</div>
        <a class="profile-pill" title="Profile &amp; content filters" href="settings.html" id="profile">
          <div class="avatar">${RL.esc((nm[0] || 'S').toUpperCase())}</div>
          <div class="meta"><div>${RL.esc(nm)}</div><small>${RL.esc(RL.visibleExams().join(' · ').replace('JEE Main · JEE Advanced', 'JEE Main · Advanced') || 'No exam selected')}</small></div>
        </a>`;
    }
  };

  /* ================= Custom select (theme-aligned dropdowns) ================= */
  const valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  RL.enhanceSelect = (sel) => {
    if (sel._cs) return sel._cs.refresh();
    const wrap = document.createElement('div'); wrap.className = 'cselect';
    if (sel.style.flex || sel.id === 'fCategory' || sel.id === 'fTopic') wrap.classList.add('grow');
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'cselect-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div'); menu.className = 'cselect-menu'; menu.setAttribute('role', 'listbox');
    wrap.append(btn, menu); sel.tabIndex = -1;
    let hl = -1;
    const opts = () => [...sel.options];
    const refresh = () => {
      const o = sel.options[sel.selectedIndex];
      btn.innerHTML = `<span class="lbl">${RL.esc(o ? o.textContent : '')}</span>${RL.icon.chev}`;
      menu.innerHTML = opts().map((op, i) => `<button type="button" role="option" class="cselect-opt ${i === sel.selectedIndex ? 'sel' : ''}" data-i="${i}" aria-selected="${i === sel.selectedIndex}">
        <span class="tick">${RL.icon.check}</span><span>${RL.esc(op.textContent)}</span></button>`).join('');
    };
    const close = () => { wrap.classList.remove('open', 'up', 'right'); btn.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      document.querySelectorAll('.cselect.open').forEach((w) => w !== wrap && w.classList.remove('open'));
      refresh(); wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      const r = btn.getBoundingClientRect();
      if (innerHeight - r.bottom < 260 && r.top > innerHeight - r.bottom) wrap.classList.add('up');
      if (r.left + menu.offsetWidth > innerWidth - 12) wrap.classList.add('right');
      hl = sel.selectedIndex; mark(); const cur = menu.children[hl]; cur && cur.scrollIntoView({ block: 'nearest' });
    };
    const choose = (i) => {
      if (i !== sel.selectedIndex) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true })); }
      refresh(); close(); btn.focus();
    };
    const mark = () => [...menu.children].forEach((c, i) => c.classList.toggle('hl', i === hl));
    btn.onclick = () => (wrap.classList.contains('open') ? close() : open());
    menu.onclick = (e) => { const b = e.target.closest('.cselect-opt'); if (b) choose(+b.dataset.i); };
    btn.onkeydown = (e) => {
      const n = sel.options.length; const isOpen = wrap.classList.contains('open');
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault(); if (!isOpen) return open();
        hl = (hl + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; mark(); menu.children[hl].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen && hl >= 0 ? choose(hl) : open(); }
      else if (e.key === 'Escape' || e.key === 'Tab') close();
      else if (e.key.length === 1 && isOpen) { const k = opts().findIndex((o) => o.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase())); if (k >= 0) { hl = k; mark(); menu.children[k].scrollIntoView({ block: 'nearest' }); } }
    };
    document.addEventListener('click', (e) => { if (!e.composedPath().includes(wrap)) close(); });
    // keep label in sync with programmatic changes
    Object.defineProperty(sel, 'value', { configurable: true, get() { return valueDesc.get.call(this); }, set(v) { valueDesc.set.call(this, v); refresh(); } });
    sel.addEventListener('change', refresh);
    new MutationObserver(refresh).observe(sel, { childList: true, subtree: true });
    if (sel.form) sel.form.addEventListener('reset', () => setTimeout(refresh));
    sel._cs = { refresh, open, close };
    refresh();
  };
  RL.enhanceSelects = (root = document) => root.querySelectorAll('select.select').forEach(RL.enhanceSelect);

  /* ================= Shared filter helpers ================= */
  RL.filterPool = (pool, f = {}) => pool.filter((r) =>
    (!f.category || f.category === 'all' || (Array.isArray(f.category) ? !f.category.length || f.category.includes(r.category) : r.category === f.category)) &&
    (!f.exam || f.exam === 'all' || (r.exam || []).includes(f.exam)) &&
    (!f.difficulty || f.difficulty === 'all' || r.difficulty === f.difficulty) &&
    (!f.kind || f.kind === 'all' || r.kind === f.kind));
  RL.optionList = (arr, sel, allLabel) => `<option value="all">${allLabel}</option>` + arr.map((x) => `<option ${x === sel ? 'selected' : ''}>${RL.esc(x)}</option>`).join('');

  /* ================= LLM import prompt ================= */
  RL.LLM_PROMPT = () => `You are a chemistry data formatter. I will give you organic reactions as an image, PDF page, handwritten notes, or text.
Convert EVERY reaction you see into a JSON array that follows the schema below EXACTLY. Output ONLY the JSON array in a single \`\`\`json code block - no commentary.

SCHEMA (one object per reaction):
{
  "id": "kebab-case-unique-id",
  "name": "Canonical reaction name",
  "aliases": ["other names / spellings"],
  "category": one of ${JSON.stringify(RL.CATEGORIES)},
  "kind": one of ${JSON.stringify(RL.KINDS)},
  "exam": ["JEE Main", "JEE Advanced"]   // subset,
  "difficulty": "easy" | "medium" | "hard",
  "reactants": "mhchem string, left of arrow, e.g. 2 CH3CHO",
  "reagents": "mhchem string written ABOVE the arrow, e.g. dil. NaOH",
  "conditions": "mhchem/text BELOW the arrow (temperature, solvent) or empty string",
  "products": "mhchem string, right of arrow, include by-products with +",
  "catalyst": "plain text or empty",
  "reagentKeywords": ["short tokens a student would write for the reagent/catalyst/conditions"],
  "productName": "name of main product",
  "summary": "one sentence: what the reaction does",
  "mechanism": "2-4 sentence mechanism",
  "keyPoints": ["important exam facts"],
  "whenUsed": "when / where it is used",
  "applications": ["uses"],
  "examples": [{ "eq": "full mhchem equation e.g. CH3COCH3 ->[NH2NH2, KOH][glycol, \\\\Delta] CH3CH2CH3", "note": "short note" }],
  "jeeTips": "common JEE traps",
  "reference": "",
  "tags": ["keywords"]
}

FORMAT RULES
- Chemistry uses mhchem syntax WITHOUT the surrounding \\\\ce{}: arrows "->[above][below]", charges "N2+ Cl-", double bond "=", triple bond "#", benzene as C6H5- or Ph-.
- Multi-word text inside an equation goes in \\\\text{...}. Heat is \\\\Delta.
- In free-text fields you may embed formulas as $\\\\ce{...}$.
- This is JSON: every backslash must be doubled (\\\\ce, \\\\Delta, \\\\text).
- If a drawn structure has no simple formula, use a condensed formula or a short name in \\\\text{...}.
- Do not invent facts you are unsure about; leave a field as "" or [] instead.

Here is my material:
[PASTE / ATTACH YOUR IMAGE OR TEXT HERE]`;
})();
