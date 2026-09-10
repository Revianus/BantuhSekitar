import { ref, get, update, onValue } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { updateProfile } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { db, auth } from './firebase-config.js';
import { requireAuth, logout } from './auth.js';

const nameInput=document.querySelector('#nameInput'),emailEl=document.querySelector('#emailEl'),statsEl=document.querySelector('#stats');
let uid=null;
requireAuth().then(async ({user,profile})=>{
  uid=user.uid;
  nameInput.value=profile?.name||'';
  if(emailEl) emailEl.textContent=user.email;
  onValue(ref(db,'reports'),snap=>{
    const all=Object.entries(snap.val()||{}).map(([id,v])=>({id,...v})).filter(r=>r.userId===uid);
    if(statsEl) statsEl.innerHTML=`<div><strong>${all.length}</strong><span>Total laporan</span></div><div><strong>${all.filter(r=>r.status==='Selesai').length}</strong><span>Selesai</span></div>`;
  });
});
document.querySelector('#saveBtn')?.addEventListener('click',async()=>{
  const name=nameInput.value.trim(); if(!name) return;
  await update(ref(db,`users/${uid}`),{name});
  try{await updateProfile(auth.currentUser,{displayName:name});}catch{}
  document.querySelector('#msg').textContent='Profil diperbarui.'; document.querySelector('#msg').className='msg ok';
});
document.querySelector('#logoutBtn')?.addEventListener('click',async()=>{await logout(); location.href='login.html';});
