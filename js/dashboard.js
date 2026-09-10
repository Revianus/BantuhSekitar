import { ref, onValue } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { db } from './firebase-config.js';
import { requireAuth, logout } from './auth.js';

const nameEl = document.querySelector('#userName'), statEl = document.querySelector('#stats'), listEl = document.querySelector('#myLatest'), logoutBtn = document.querySelector('#logoutBtn');
let uid = null;
requireAuth().then(({ user, profile }) => {
  uid = user.uid;
  if (nameEl) nameEl.textContent = profile?.name || user.email;
  bindReports();
});
if (logoutBtn) logoutBtn.addEventListener('click', async () => { await logout(); location.href = 'login.html'; });

function bindReports() {
  onValue(ref(db, 'reports'), snap => {
    const all = Object.entries(snap.val() || {}).map(([id, v]) => ({ id, ...v }));
    const mine = all.filter(r => r.userId === uid);
    if (statEl) statEl.innerHTML = statCard('Total laporan', mine.length) + statCard('Menunggu', mine.filter(r => r.status === 'Menunggu').length) + statCard('Diproses', mine.filter(r => r.status === 'Diproses').length) + statCard('Selesai', mine.filter(r => r.status === 'Selesai').length);
    if (listEl) {
      mine.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      if (!mine.length) { listEl.innerHTML = '<div class="card" style="padding:18px;text-align:center"><p class="muted" style="margin:0">Anda belum membuat laporan.</p><a class="button" href="create-report.html" style="margin-top:10px">Buat laporan sekarang</a></div>'; return; }
      listEl.innerHTML = mine.slice(0,5).map(r=>`
        <a href="report-detail.html?id=${encodeURIComponent(r.id)}" style="display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid #e6ebe8;border-radius:14px;background:#fff;text-decoration:none;color:inherit;transition:box-shadow .15s">
          <img src="${escAttr(r.photoUrl||'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&q=80&auto=format&fit=crop')}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;flex-shrink:0;background:#eef6f2" alt="">
          <div style="flex:1;min-width:0;display:grid;gap:2px">
            <strong style="font:700 14px Plus Jakarta Sans,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</strong>
            <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.category||'')} · ${esc((r.address||'Lokasi belum tersedia').slice(0,50))}</span>
          </div>
          <span class="badge ${escAttr(r.status||'Menunggu')}" style="flex-shrink:0;white-space:nowrap">${esc(r.status||'Menunggu')}</span>
        </a>`).join('');
    }
  });
}
function statCard(label, value) { return `<div><strong>${value}</strong><span>${label}</span></div>`; }
function esc(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function escAttr(v){return String(v).replace(/"/g,'&quot;')}
