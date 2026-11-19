/* Cloud sync: Google sign-in gate + Firestore storage for the signed-in user's data.
   Layout in Firestore (all private to the user, see firestore.rules):
     users/{uid}                 account info + settings  (name, prefs, archived, blacklisted)
     users/{uid}/data/progress   attempts, goc            (practice history)
     users/{uid}/data/content    custom, edits            (own reactions and edits)
   A per-account localStorage copy keeps the app instant and usable offline; writes are debounced. */
import { fb } from './firebase.js';

const RL = window.RL;
const LEGACY_KEY = 'reactionlab.v1';
const SPLIT = {
  profile: ['name', 'prefs', 'archived', 'blacklisted'],
  progress: ['attempts', 'goc'],
  content: ['custom', 'edits']
};
const MAX_DOC = 900 * 1024; // Firestore hard limit is 1 MiB per document
let uid = null, timer = null, flushing = null, synced = {};
const path = (part) => (part === 'profile' ? `users/${uid}` : `users/${uid}/data/${part}`);
const dirtyKey = () => `rl.dirty.${uid}`;
const pick = (state, keys) => Object.fromEntries(keys.map((k) => [k, state[k] ?? null]));
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const hasData = (s) => s && ['attempts', 'goc', 'custom', 'archived', 'blacklisted'].some((k) => Array.isArray(s[k]) && s[k].length) || (s && s.edits && Object.keys(s.edits).length);

async function flush() {
  if (!uid) return;
  if (flushing) { await flushing; }
  const jobs = [];
  for (const [part, keys] of Object.entries(SPLIT)) {
    const data = pick(RL.state, keys), json = JSON.stringify(data);
    if (json === synced[part]) continue;
    if (json.length > MAX_DOC) { RL.toast('Too much data to sync (large images?). Kept on this device only.'); continue; }
    jobs.push(fb.setDoc(path(part), { ...data, updatedAt: Date.now() }, part === 'profile' ? { merge: true } : undefined)
      .then(() => { synced[part] = json; }));
  }
  if (!jobs.length) { localStorage.removeItem(dirtyKey()); RL.cloud.setStatus('synced'); return; }
  RL.cloud.setStatus('syncing');
  flushing = Promise.all(jobs)
    .then(() => { localStorage.removeItem(dirtyKey()); RL.cloud.setStatus('synced'); })
    .catch((e) => { console.warn('[cloud] sync failed', e); RL.cloud.setStatus(navigator.onLine ? 'error' : 'offline'); })
    .finally(() => { flushing = null; });
  return flushing;
}
const schedule = (ms = 2500) => { clearTimeout(timer); timer = setTimeout(flush, ms); };

async function start(user) {
  uid = user.uid;
  RL.cloud.user = user;
  RL.storage.useKey(`reactionlab.v1.u.${uid}`);
  const cache = RL.storage.load();
  let remote = null;
  try {
    const [profile, progress, content] = await withTimeout(Promise.all(['profile', 'progress', 'content'].map((p) => fb.getDoc(path(p)))), 10000);
    remote = { profile, progress, content };
  } catch (e) { console.warn('[cloud] offline, using this device\'s copy', e); }

  let state, push = false;
  if (!remote) { state = cache; RL.cloud.setStatus('offline'); }
  else if (!remote.profile && !remote.progress && !remote.content) {
    // brand-new account: bring along progress made before sign-in on this browser (once)
    let legacy = null; try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch { legacy = null; }
    state = hasData(cache) ? cache : hasData(legacy) ? legacy : cache;
    if (state === legacy && legacy) { localStorage.setItem(LEGACY_KEY + '.backup', JSON.stringify(legacy)); localStorage.removeItem(LEGACY_KEY); setTimeout(() => RL.toast('Your earlier progress on this device is now saved to your account'), 1200); }
    push = true;
  } else {
    const fromCloud = Object.assign({}, remote.profile, remote.progress, remote.content);
    ['updatedAt', 'account', 'createdAt'].forEach((k) => delete fromCloud[k]);
    // unsynced local changes (e.g. made offline) win over the cloud copy
    if (localStorage.getItem(dirtyKey()) && Object.keys(cache).length) { state = cache; push = true; }
    else {
      state = fromCloud;
      Object.entries(SPLIT).forEach(([part, keys]) => { if (remote[part]) synced[part] = JSON.stringify(pick(Object.assign(RL.blankState(), state), keys)); });
    }
  }
  RL.replaceState(state);
  if (!RL.state.name && user.displayName) { RL.state.name = user.displayName.split(' ')[0]; push = true; }
  localStorage.setItem(RL.storage.key(), JSON.stringify(RL.state));

  // account info: refreshed once per session
  if (remote) {
    fb.setDoc(path('profile'), {
      account: { displayName: user.displayName, email: user.email, photoURL: user.photoURL, lastLoginAt: Date.now() },
      ...(remote.profile ? {} : { createdAt: Date.now() })
    }, { merge: true }).catch((e) => console.warn('[cloud] profile update failed', e));
    if (push) { localStorage.setItem(dirtyKey(), '1'); flush(); } else RL.cloud.setStatus('synced');
  }
  RL._cloudDone();
}

/* hooks used by core.js and the pages */
RL.cloud.onSave = () => { if (!uid) return; localStorage.setItem(dirtyKey(), '1'); RL.cloud.setStatus('syncing'); schedule(); };
RL.cloud.flush = flush;
RL.cloud.signOut = async () => {
  clearTimeout(timer); await flush().catch(() => {});
  await fb.signOut(); location.replace('index.html');
};
RL.cloud.reset = async () => {
  if (!uid) throw new Error('not signed in');
  RL.replaceState(Object.assign(RL.blankState(), { name: RL.state.name, prefs: RL.state.prefs }));
  localStorage.setItem(RL.storage.key(), JSON.stringify(RL.state));
  synced = {}; await flush();
  if (RL.cloud.status !== 'synced') throw new Error('sync failed');
};
addEventListener('online', () => { if (uid && localStorage.getItem(dirtyKey())) flush(); });
addEventListener('pagehide', () => { if (uid && localStorage.getItem(dirtyKey())) flush(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && uid && localStorage.getItem(dirtyKey())) flush(); });

let started = false;
fb.onUser((user) => {
  if (!user) { location.replace('index.html'); return; } // signed out (or signed out in another tab)
  if (started) return;
  started = true;
  start(user).catch((e) => { console.error('[cloud] start failed', e); RL._cloudDone(); });
});
