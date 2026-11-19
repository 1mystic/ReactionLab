/* Firebase bootstrap: modular web SDK from the official CDN (no build step).
   The web config is not committed: it is generated into firebase-config.js (git-ignored) at deploy time.
   Access control is enforced by Firestore security rules (firestore.rules) and the API key's referrer restriction. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut as fbSignOut }
  from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
/* Generated from the git-ignored .env by tools/write-firebase-config.mjs (never committed) */
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ref = (path) => doc(db, ...path.split('/'));
const plain = (u) => (u ? { uid: u.uid, displayName: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' } : null);

/* Small, mockable surface: the rest of the app only ever talks to `fb`. */
export const fb = {
  /** cb(user | null) fires once the persisted sign-in state is known, then on every change */
  onUser: (cb) => onAuthStateChanged(auth, (u) => cb(plain(u))),
  async signInGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { return plain((await signInWithPopup(auth, provider)).user); }
    catch (e) {
      // popups can be blocked (some in-app browsers): fall back to a full-page redirect
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) { await signInWithRedirect(auth, provider); return null; }
      throw e;
    }
  },
  signOut: () => fbSignOut(auth),
  async getDoc(path) { const s = await getDoc(ref(path)); return s.exists() ? s.data() : null; },
  setDoc: (path, data, opts) => setDoc(ref(path), data, opts || {})
};
