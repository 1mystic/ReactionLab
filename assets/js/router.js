/* Light client-side router.
   Every page stays a normal, complete HTML document (deep links, refresh and "no JavaScript" still work).
   When a link points to another app page, this script fetches that page, keeps the sidebar mounted and swaps
   only <main>, with a short fade/rise, instead of reloading the whole document.

   Safety nets: any problem (network error, unknown page, a newer deploy than this tab, a script that fails
   to load) falls back to a normal full-page navigation. */
(function () {
  'use strict';
  const RL = window.RL;
  if (!RL || !window.fetch || !window.DOMParser || !history.pushState) return;

  const PAGES = new Set(['dashboard.html', 'practice.html', 'bank.html', 'goc.html', 'edit.html', 'settings.html']);
  // matched by full path: data/goc.js (question data) must not be mistaken for assets/js/goc.js (the page script)
  const PAGE_SCRIPTS = new Set(['home.js', 'practice.js', 'goc.js', 'bank.js', 'edit.js', 'settings.js'].map((f) => '/assets/js/' + f));
  const SHELL_SCRIPTS = new Set(['core.js', 'cloud.js', 'router.js', 'firebase.js'].map((f) => '/assets/js/' + f));
  const meta = (d) => (d.querySelector('meta[name="rl-build"]') || {}).content || '';
  const BUILD = meta(document);
  const file = (u) => u.pathname.split('/').pop() || '';
  const keyOf = (u) => u.pathname + u.search;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const docs = new Map();           // url key -> { t, p } (prefetched / recently fetched pages)
  let token = 0;                    // identifies the latest navigation; older ones abandon themselves
  let barTimer = null;

  try { history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }

  /* ---------- thin progress bar for slow loads ---------- */
  const bar = document.createElement('div'); bar.id = 'rl-bar'; document.body.appendChild(bar);
  const showBar = () => { clearTimeout(barTimer); barTimer = setTimeout(() => bar.classList.add('on'), 160); };
  const hideBar = () => { clearTimeout(barTimer); bar.classList.remove('on'); };

  const hard = (url) => { hideBar(); location.assign(url.href); };

  /* ---------- fetching ---------- */
  function load(url) {
    const k = keyOf(url), hit = docs.get(k);
    if (hit && Date.now() - hit.t < 30000) return hit.p;
    const p = fetch(url.href, { credentials: 'same-origin', cache: 'no-cache' }).then(async (r) => {
      if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') || '')) throw new Error('bad response ' + r.status);
      return new DOMParser().parseFromString(await r.text(), 'text/html');
    });
    docs.set(k, { t: Date.now(), p });
    p.catch(() => docs.delete(k));
    return p;
  }

  /* ---------- assets the destination needs that this tab does not have yet ---------- */
  const path = (src) => new URL(src, location.href).pathname;
  function inject(tag) {
    return new Promise((res, rej) => { tag.onload = res; tag.onerror = () => rej(new Error('asset failed')); document.head.appendChild(tag); });
  }
  async function ensureAssets(doc) {
    const haveCss = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => path(l.href)));
    for (const l of doc.querySelectorAll('link[rel="stylesheet"]')) {
      if (haveCss.has(path(l.getAttribute('href')))) continue;
      const n = document.createElement('link'); n.rel = 'stylesheet'; n.href = l.getAttribute('href'); await inject(n);
    }
    const have = new Set([...document.querySelectorAll('script[src]')].map((s) => path(s.src)));
    for (const s of doc.querySelectorAll('script[src]')) {
      const src = s.getAttribute('src'), p = path(src);
      if (SHELL_SCRIPTS.has(p) || PAGE_SCRIPTS.has(p) || have.has(p)) continue;
      const n = document.createElement('script'); n.src = src; n.async = false; await inject(n); have.add(path(src));
    }
  }
  function runPageScript(doc) {
    document.querySelectorAll('script[data-rl-page]').forEach((s) => s.remove());
    const s = [...doc.querySelectorAll('script[src]')].find((x) => PAGE_SCRIPTS.has(path(x.getAttribute('src'))));
    if (!s) return Promise.resolve();
    return new Promise((res) => {
      const n = document.createElement('script'); n.src = s.getAttribute('src'); n.dataset.rlPage = '1';
      n.onload = n.onerror = () => res(); document.body.appendChild(n);
    });
  }

  /* ---------- the navigation ---------- */
  async function go(url, { push = true, y = 0 } = {}) {
    const my = ++token;
    const main = document.querySelector('main.main');
    if (!main) return hard(url);
    if (push) { try { history.replaceState(Object.assign({}, history.state, { y: window.scrollY }), ''); } catch (e) { /* ignore */ } }
    showBar();
    // instant feedback: light up the destination in the sidebar before the page itself has arrived
    const want = file(url) + url.search;
    const hit = [...document.querySelectorAll('aside.sidebar a.nav-link[href]')].filter((a) => a.getAttribute('href') === want);
    if (hit.length === 1) document.querySelectorAll('aside.sidebar a.nav-link').forEach((a) => a.classList.toggle('active', a === hit[0]));
    main.classList.add('leaving');                                   // fade the old page out while the new one loads
    const fade = new Promise((r) => setTimeout(r, reduced() ? 0 : 140));
    let doc;
    try { [doc] = await Promise.all([load(url), fade]); } catch (e) { return hard(url); }
    if (my !== token) return;                                        // a newer click took over
    const nb = meta(doc);
    if (BUILD && nb && nb !== BUILD) return hard(url);               // a deploy landed since this tab loaded: take a normal load so every asset is fresh
    const next = doc.querySelector('main.main');
    if (!next) return hard(url);
    try { await ensureAssets(doc); } catch (e) { return hard(url); }
    if (my !== token) return;

    RL.pageCleanup();                                                // drop the old page's global listeners and modals
    document.title = doc.title;
    if (push) history.pushState({ rl: 1 }, '', url.href);
    main.innerHTML = next.innerHTML;                                 // still invisible (.leaving): no flash of empty content
    await runPageScript(doc);
    await RL.cloudReady;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (my !== token) return;
    window.scrollTo(0, y);
    main.classList.remove('leaving');                                // entrance animations start now
    main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true });
    hideBar();
  }

  /* ---------- which clicks are ours ---------- */
  function appUrl(a) {
    if (!a || !a.href || a.target && a.target !== '_self' || a.hasAttribute('download') || a.rel.includes('external')) return null;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !PAGES.has(file(u))) return null;
    return u;
  }
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const u = appUrl(e.target.closest && e.target.closest('a[href]'));
    if (!u) return;
    if (keyOf(u) === keyOf(location) && u.hash) return;              // same page, only the #anchor changes: let the browser handle it
    e.preventDefault();
    go(u);
  });
  const warm = (e) => { const u = appUrl(e.target.closest && e.target.closest('a[href]')); if (u) load(u).catch(() => {}); };
  document.addEventListener('pointerover', warm, { passive: true });  // fetch on hover/touch so the click is instant
  document.addEventListener('touchstart', warm, { passive: true });
  document.addEventListener('focusin', warm);

  window.addEventListener('popstate', (e) => {
    const u = new URL(location.href);
    if (!PAGES.has(file(u))) { location.reload(); return; }
    go(u, { push: false, y: (e.state && e.state.y) || 0 });
  });
  history.replaceState(Object.assign({ rl: 1 }, history.state), '');
})();
