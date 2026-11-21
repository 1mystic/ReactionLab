/* Cloud sync: Google sign-in gate + Firestore storage for the signed-in user's data.

   Firestore layout (all private to the user, see firestore.rules):
     users/{uid}                 account info + settings  (name, prefs, archived, blacklisted)
     users/{uid}/data/progress   attempts, goc            (practice history)
     users/{uid}/data/content    custom, edits            (own reactions and edits)

   Startup is instant: if this browser already has the signed-in user's data (a local copy, kept per account in
   localStorage), the page renders from it immediately and everything below happens in the background.
   Only the very first visit on a device waits for the cloud.

   Sync never overwrites blindly. For each document we remember what the cloud held when we last synced (the
   "baseline") and do a three-way merge of  baseline / this device / cloud:
     - only this device changed   -> push it
     - only the cloud changed     -> take it (this is how another device's progress arrives)
     - both changed               -> history is merged (union), everything else keeps this device's version
   A cloud document that does not exist yet is never treated as "empty": local data is pushed instead. */
import { fb } from './firebase.js';

const RL = window.RL;
const LEGACY_KEY = 'reactionlab.v1';
const LAST_USER = 'rl.lastUser';
const PULL_EVERY = 60 * 1000;
const MAX_DOC = 900 * 1024; // Firestore hard limit is 1 MiB per document
const SPLIT = {
  profile: ['name', 'prefs', 'archived', 'blacklisted'],
  progress: ['attempts', 'goc'],
  content: ['custom', 'edits']
};
const PARTS = Object.keys(SPLIT);

let uid = null, timer = null, flushing = null, base = {}, pulling = null, warned = false, lastReconcile = 0;
const RECONCILE_BEFORE_WRITE = 10 * 1000; // a push is preceded by a fresh merge if the last one is older than this
const path = (part) => (part === 'profile' ? `users/${uid}` : `users/${uid}/data/${part}`);
const cacheKey = (id) => `reactionlab.v1.u.${id}`;
const dirtyKey = () => `rl.dirty.${uid}`;
const baseKey = () => `rl.base.${uid}`;
const pullKey = () => `rl.pull.${uid}`;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };

/* ---------- canonical form of a document ---------- */
const sortDeep = (v) => Array.isArray(v) ? v.map(sortDeep)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortDeep(v[k])])) : v;
const stable = (v) => JSON.stringify(sortDeep(v));
/** the synced fields of one document, with defaults for anything missing (a doc written by an older version, or none) */
function partOf(obj, part) {
  const d = {};
  const blank = RL.blankState(); const o = obj || {};
  SPLIT[part].forEach((k) => { d[k] = o[k] !== undefined && o[k] !== null ? o[k] : blank[k]; });
  if (part === 'profile') d.prefs = Object.assign(RL.blankPrefs(), d.prefs && typeof d.prefs === 'object' ? d.prefs : {});
  return d;
}
const hasData = (s) => !!s && (['attempts', 'goc', 'custom', 'archived', 'blacklisted'].some((k) => Array.isArray(s[k]) && s[k].length) || (s.edits && Object.keys(s.edits).length > 0));

function unionLog(a, b, max) {
  const seen = new Set(), out = [];
  for (const x of [...(a || []), ...(b || [])]) { const k = `${x.id}|${x.ts}`; if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out.sort((p, q) => (p.ts || 0) - (q.ts || 0)).slice(-max);
}
const unionProgress = (L, R) => ({ attempts: unionLog(L.attempts, R.attempts, 2000), goc: unionLog(L.goc, R.goc, 3000) });

/* ---------- writing ---------- */
const loadBase = () => readJSON(baseKey()) || {};
const saveBase = () => { try { localStorage.setItem(baseKey(), JSON.stringify(base)); } catch (e) { /* storage full: next sync just re-checks */ } };
const markDirty = () => localStorage.setItem(dirtyKey(), '1');
const inSync = () => PARTS.every((p) => stable(partOf(RL.state, p)) === base[p]);

async function flush() {
  if (!uid) return;
  if (flushing) await flushing.catch(() => {});
  if (!PARTS.some((p) => stable(partOf(RL.state, p)) !== base[p])) { localStorage.removeItem(dirtyKey()); RL.cloud.setStatus('synced'); return; }
  // Never push over data we have not merged with: another device may have written since we last looked.
  // If the cloud cannot be reached, nothing is written; the change stays marked as unsynced and goes out later.
  if (Date.now() - lastReconcile > RECONCILE_BEFORE_WRITE) {
    try { const remote = await fetchRemote(); localStorage.setItem(pullKey(), String(Date.now())); reconcile(remote); lastReconcile = Date.now(); }
    catch (e) { console.warn('[cloud] not writing: could not verify the cloud copy', e); RL.cloud.setStatus(navigator.onLine ? 'error' : 'offline'); return; }
  }
  const jobs = [], sent = {};
  for (const part of PARTS) {
    const data = partOf(RL.state, part), s = stable(data);
    if (s === base[part]) continue;
    if (s.length > MAX_DOC) { if (!warned) { warned = true; RL.toast('Too much data to sync (large images?). Kept on this device only.'); } continue; }
    sent[part] = s;
    jobs.push(fb.setDoc(path(part), { ...data, updatedAt: Date.now() }, part === 'profile' ? { merge: true } : undefined));
  }
  if (!jobs.length) { if (inSync()) localStorage.removeItem(dirtyKey()); RL.cloud.setStatus('synced'); return; }
  RL.cloud.setStatus('syncing');
  flushing = Promise.all(jobs)
    .then(() => { Object.assign(base, sent); saveBase(); if (inSync()) localStorage.removeItem(dirtyKey()); RL.cloud.setStatus('synced'); })
    .catch((e) => { console.warn('[cloud] sync failed', e); RL.cloud.setStatus(navigator.onLine ? 'error' : 'offline'); })
    .finally(() => { flushing = null; });
  return flushing;
}
const schedule = (ms = 2500) => { clearTimeout(timer); timer = setTimeout(flush, ms); };

/* ---------- reading + merging ---------- */
async function fetchRemote() {
  const docs = await withTimeout(Promise.all(PARTS.map((p) => fb.getDoc(path(p)))), 10000);
  return Object.fromEntries(PARTS.map((p, i) => [p, docs[i]]));
}

/** three-way merge of every document; applies the result to RL.state and returns true if a push is needed */
function reconcile(remote) {
  const dirty = !!localStorage.getItem(dirtyKey());
  const merged = {}; let needPush = false;
  for (const part of PARTS) {
    const L = partOf(RL.state, part), Lj = stable(L), B = base[part];
    const exists = remote[part] !== null && remote[part] !== undefined;
    const R = partOf(remote[part], part), Rj = stable(R);
    let pick;
    if (!exists) pick = L;                                   // never treat "no document yet" as "empty": keep and push ours
    else if (B === undefined) pick = dirty ? L : R;          // no sync history on this device: unsynced local edits win, otherwise the cloud copy
    else if (Rj === B) pick = L;                             // cloud unchanged since our last sync: ours (maybe edited) stands
    else if (Lj === B) pick = R;                             // only the cloud changed (another device): take it
    else pick = part === 'progress' ? unionProgress(L, R) : L; // both changed: never drop history
    merged[part] = pick;
    base[part] = exists ? Rj : undefined;                    // what the cloud holds right now
    if (!exists || stable(pick) !== Rj) needPush = true;
    if (base[part] === undefined) delete base[part];
  }
  lastReconcile = Date.now();
  const next = Object.assign({}, ...PARTS.map((p) => merged[p]));
  if (stable(partOf(next, 'profile')) !== stable(partOf(RL.state, 'profile')) || stable(partOf(next, 'progress')) !== stable(partOf(RL.state, 'progress')) || stable(partOf(next, 'content')) !== stable(partOf(RL.state, 'content'))) {
    RL.replaceState(next);
    try { localStorage.setItem(RL.storage.key(), JSON.stringify(RL.state)); } catch (e) { /* ignore */ }
    window.dispatchEvent(new Event('rl:state-updated'));
  }
  saveBase();
  return needPush;
}

/** background refresh: fetch the cloud copy, merge, push what only we have */
function pull(force) {
  if (!uid) return Promise.resolve();
  if (pulling) return pulling;
  if (!force && Date.now() - (+localStorage.getItem(pullKey()) || 0) < PULL_EVERY) { if (localStorage.getItem(dirtyKey())) return flush(); RL.cloud.setStatus(inSync() ? 'synced' : 'idle'); return Promise.resolve(); }
  pulling = (async () => {
    let remote;
    try { remote = await fetchRemote(); }
    catch (e) { console.warn('[cloud] could not reach the cloud', e); RL.cloud.setStatus(navigator.onLine ? 'error' : 'offline'); return; }
    localStorage.setItem(pullKey(), String(Date.now()));
    if (reconcile(remote)) { markDirty(); await flush(); } else { localStorage.removeItem(dirtyKey()); RL.cloud.setStatus('synced'); }
  })().finally(() => { pulling = null; });
  return pulling;
}

/* ---------- startup ---------- */
const publicUser = (u) => ({ uid: u.uid, displayName: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' });

/** instant path: this browser already knows who is signed in and holds their data */
function fastStart() {
  const last = readJSON(LAST_USER);
  if (!last || !last.uid) return false;
  const cache = readJSON(cacheKey(last.uid));
  if (!cache || typeof cache !== 'object' || !Object.keys(cache).length) return false;
  uid = last.uid; RL.cloud.user = last;
  RL.storage.useKey(cacheKey(uid)); base = loadBase();
  RL.replaceState(cache);
  RL.cloud.setStatus('idle');
  RL._cloudDone();
  return true;
}

/** first visit on this device (or no local copy): wait for the cloud once */
async function slowStart(user) {
  uid = user.uid; RL.cloud.user = user;
  RL.storage.useKey(cacheKey(uid)); base = loadBase();
  RL.replaceState(readJSON(cacheKey(uid)) || {});
  let remote = null;
  try { remote = await fetchRemote(); } catch (e) { console.warn('[cloud] offline, using this device\'s copy', e); RL.cloud.setStatus(navigator.onLine ? 'error' : 'offline'); }

  let push = false;
  if (remote && !remote.profile && !remote.progress && !remote.content) {
    // brand-new account: bring along progress made on this browser before signing in (once)
    const legacy = readJSON(LEGACY_KEY);
    if (!hasData(RL.state) && hasData(legacy)) {
      localStorage.setItem(LEGACY_KEY + '.backup', JSON.stringify(legacy)); localStorage.removeItem(LEGACY_KEY);
      RL.replaceState(legacy); setTimeout(() => RL.toast('Your earlier progress on this device is now saved to your account'), 1200);
    }
    push = true; lastReconcile = Date.now();
  } else if (remote) { localStorage.setItem(pullKey(), String(Date.now())); push = reconcile(remote); }

  if (!RL.state.name && user.displayName) { RL.state.name = user.displayName.split(' ')[0]; push = true; }
  try { localStorage.setItem(RL.storage.key(), JSON.stringify(RL.state)); } catch (e) { /* ignore */ }
  localStorage.setItem(LAST_USER, JSON.stringify(user));
  RL._cloudDone();
  if (remote) {
    touchAccount(user, !remote.profile);
    if (push) { markDirty(); flush(); } else RL.cloud.setStatus('synced');
  }
}

/** account details, refreshed once per browser session (one small write) */
function touchAccount(user, isNew) {
  if (sessionStorage.getItem('rl.acct') === uid) return;
  sessionStorage.setItem('rl.acct', uid);
  fb.setDoc(path('profile'), {
    account: { displayName: user.displayName, email: user.email, photoURL: user.photoURL, lastLoginAt: Date.now() },
    ...(isNew ? { createdAt: Date.now() } : {})
  }, { merge: true }).catch((e) => console.warn('[cloud] profile update failed', e));
}

/* ---------- hooks used by core.js and the pages ---------- */
RL.cloud.onSave = () => { if (!uid) return; markDirty(); RL.cloud.setStatus('syncing'); schedule(); };
RL.cloud.flush = flush;
RL.cloud.signOut = async () => {
  clearTimeout(timer); await flush().catch(() => {});
  localStorage.removeItem(LAST_USER);
  await fb.signOut(); location.replace('index.html');
};
RL.cloud.reset = async () => {
  if (!uid) throw new Error('not signed in');
  RL.replaceState(Object.assign(RL.blankState(), { name: RL.state.name, prefs: RL.state.prefs }));
  localStorage.setItem(RL.storage.key(), JSON.stringify(RL.state));
  lastReconcile = Date.now(); // deliberate wipe: do not merge the old cloud history back in
  await flush();
  if (!inSync()) throw new Error('sync failed');
};
const maybePull = () => { if (uid && document.visibilityState !== 'hidden') pull(false); };
addEventListener('online', () => { if (uid) pull(true); });
addEventListener('pagehide', () => { if (uid && localStorage.getItem(dirtyKey())) flush(); });
document.addEventListener('visibilitychange', () => {
  if (!uid) return;
  if (document.visibilityState === 'hidden') { if (localStorage.getItem(dirtyKey())) flush(); } else maybePull();
});

let started = false;
const fast = fastStart();
fb.onUser((user) => {
  if (!user) { localStorage.removeItem(LAST_USER); location.replace('index.html'); return; } // signed out (also in another tab)
  if (started) return;
  started = true;
  const info = publicUser(user);
  if (fast) {
    if (info.uid !== uid) { localStorage.setItem(LAST_USER, JSON.stringify(info)); location.reload(); return; } // a different account signed in
    RL.cloud.user = info; localStorage.setItem(LAST_USER, JSON.stringify(info));
    touchAccount(info, false);
    pull(false).catch((e) => console.warn('[cloud] background sync failed', e));
    return;
  }
  slowStart(info).catch((e) => { console.error('[cloud] start failed', e); RL._cloudDone(); });
});
