/* Landing page: Google sign-in, then straight into the app */
import { fb } from './firebase.js';

const btn = document.getElementById('googleBtn');
const lbl = document.getElementById('googleLbl');
const msg = document.getElementById('authMsg');
const go = () => location.replace('dashboard.html');
const MESSAGES = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in yet.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled for this project yet.'
};

let ready = false;
fb.onUser((user) => {
  if (user) { lbl.textContent = 'Opening ReactionLab…'; go(); return; }
  if (!ready) { ready = true; btn.disabled = false; lbl.textContent = 'Continue with Google'; }
});

btn.addEventListener('click', async () => {
  btn.disabled = true; lbl.textContent = 'Signing in…'; msg.classList.remove('err');
  try { const u = await fb.signInGoogle(); if (u) go(); }
  catch (e) {
    console.warn('[auth]', e);
    msg.textContent = MESSAGES[e && e.code] || 'Could not sign in. Please try again.'; msg.classList.add('err');
    btn.disabled = false; lbl.textContent = 'Continue with Google';
  }
});
