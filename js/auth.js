import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { auth, db } from './firebase-config.js';

export async function register(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await set(ref(db, `users/${cred.user.uid}`), { name: name.trim(), email: email.trim().toLowerCase(), role: 'user', createdAt: Date.now() });
  return cred.user;
}
export function login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
export function logout() { return signOut(auth); }
export function requireAuth(redirectTo = 'login.html') {
  return new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      if (!user) { location.href = redirectTo; return; }
      const snap = await get(ref(db, `users/${user.uid}`));
      resolve({ user, profile: snap.val() });
    });
  });
}
export function watchAuth(callback) { return onAuthStateChanged(auth, callback); }
export async function getProfile(uid) { const snap = await get(ref(db, `users/${uid}`)); return snap.val(); }
