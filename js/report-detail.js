import { ref, onValue, push, set, get, update } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { db, auth } from './firebase-config.js';
import { watchAuth } from './auth.js';

const params = new URLSearchParams(location.search);
const id = params.get('id');
const detailEl = document.querySelector('#detail'), mapEl = document.querySelector('#map'), commentsEl = document.querySelector('#comments'), commentForm = document.querySelector('#commentForm');
let currentUser = null, reportData = null, map, marker;
watchAuth(u => currentUser = u);

if (!id) detailEl.innerHTML = '<p class="muted">ID laporan tidak ditemukan.</p>';
else {
  onValue(ref(db, `reports/${id}`), snap => {
    const r = snap.val();
    if (!r) { detailEl.innerHTML = '<p class="muted">Data laporan tidak ditemukan.</p>'; return; }
    reportData = { id, ...r };
    detailEl.innerHTML = `<img src="${escapeAttr(r.photoUrl||'https://via.placeholder.com/800x400?text=No+Image')}" style="width:100%;max-height:360px;object-fit:cover;border-radius:14px"><h1>${escapeHtml(r.title)}</h1><p><span class="badge ${escapeAttr(r.status)}">${escapeHtml(r.status)}</span> ${escapeHtml(r.category)} · ${new Date(r.createdAt).toLocaleString('id-ID')}</p><p>${escapeHtml(r.description)}</p><p class="muted">${escapeHtml(r.address||'')} (${r.latitude}, ${r.longitude})</p><div style="margin-top:12px"><strong>Pelapor:</strong> ${escapeHtml(r.userName||'-')}</div>`;
    if (!map) { map = L.map('map').setView([r.latitude||-6.2, r.longitude||106.83], 15); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map); }
    if (marker) map.removeLayer(marker);
    if (r.latitude && r.longitude) { marker = L.marker([r.latitude, r.longitude]).addTo(map); map.setView([r.latitude, r.longitude], 15); }
    renderTimeline(r);
  });
  onValue(ref(db, `comments/${id}`), snap => {
    const list = Object.entries(snap.val()||{}).map(([cid,v])=>({id:cid,...v})).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    commentsEl.innerHTML = list.map(c=>`<div class="card" style="padding:12px"><strong>${escapeHtml(c.userName)}</strong> <span class="muted">${new Date(c.createdAt).toLocaleString('id-ID')}</span><p style="margin:6px 0 0">${escapeHtml(c.comment)}</p></div>`).join('') || '<p class="muted">Belum ada komentar.</p>';
  });
}

if (commentForm) commentForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentUser) { location.href = 'login.html'; return; }
  const input = document.querySelector('#commentInput');
  const text = input.value.trim(); if (!text) return;
  const profSnap = await get(ref(db, `users/${currentUser.uid}`));
  const name = profSnap.val()?.name || currentUser.email;
  const pr = push(ref(db, `comments/${id}`));
  await set(pr, { userId: currentUser.uid, userName: name, comment: text, createdAt: Date.now() });
  input.value = '';
});

function renderTimeline(r){
  const order=['Menunggu','Diverifikasi','Diproses','Selesai'];
  const idx=order.indexOf(r.status);
  const el=document.querySelector('#timeline');
  if(!el) return;
  el.innerHTML=order.map((s,i)=>`<div style="display:flex;gap:10px;align-items:center;opacity:${i<=idx?1:.4}"><span style="width:10px;height:10px;border-radius:50%;background:${i<=idx?'#087f5b':'#dfe8e3'}"></span>${s}${i===idx?' · saat ini':''}</div>`).join('');
}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function escapeAttr(v){return String(v).replace(/"/g,'&quot;')}
