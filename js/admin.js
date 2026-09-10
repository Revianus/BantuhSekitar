import { ref, onValue, update } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { db } from './firebase-config.js';
import { requireAuth } from './auth.js';

requireAuth().then(({profile})=>{
  if(profile?.role!=='admin'){document.body.innerHTML='<div style="padding:40px"><h1>Akses ditolak</h1><p>Butuh role admin di Realtime Database: users/{uid}/role = admin</p><a href="index.html">Kembali</a></div>';return;}
  bind();
});
let reportsCache=[];
function bind(){
  onValue(ref(db,'reports'),snap=>{
    const all=Object.entries(snap.val()||{}).map(([id,v])=>({id,...v})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    reportsCache=all;
    const stats=document.querySelector('#adminStats');
    if(stats) stats.innerHTML = kpi('Total',all.length)+kpi('Menunggu',all.filter(r=>r.status==='Menunggu').length)+kpi('Diverifikasi',all.filter(r=>r.status==='Diverifikasi').length)+kpi('Diproses',all.filter(r=>r.status==='Diproses').length)+kpi('Selesai',all.filter(r=>r.status==='Selesai').length)+kpi('Ditolak',all.filter(r=>r.status==='Ditolak').length);
    renderTable(all);
    renderCards(all);
  });
  window.addEventListener('resize',()=>{renderTable(reportsCache);renderCards(reportsCache);});
}
function renderTable(all){
  const tbody=document.querySelector('#adminTable tbody');
  if(!tbody) return;
  if(!all.length){tbody.innerHTML='<tr><td colspan="7">Tidak ada laporan ditemukan.</td></tr>';return;}
  tbody.innerHTML=all.map(r=>`<tr><td><code style="font-size:11px;background:#f4f6f5;padding:3px 6px;border-radius:6px">${escapeHtml(r.id.slice(-6))}</code></td><td style="max-width:220px"><strong style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.title)}</strong><span class="muted" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${escapeHtml((r.address||'').slice(0,48))}</span></td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.userName||'-')}</td><td>${new Date(r.createdAt).toLocaleDateString('id-ID')}</td><td><span class="badge ${escapeAttr(r.status)}">${escapeHtml(r.status)}</span></td><td style="min-width:210px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><a class="button secondary" href="report-detail.html?id=${encodeURIComponent(r.id)}" style="padding:8px 14px;font-size:12px">Buka</a><select data-id="${escapeAttr(r.id)}" class="statusSelect"><option ${r.status==='Menunggu'?'selected':''}>Menunggu</option><option ${r.status==='Diverifikasi'?'selected':''}>Diverifikasi</option><option ${r.status==='Diproses'?'selected':''}>Diproses</option><option ${r.status==='Selesai'?'selected':''}>Selesai</option><option ${r.status==='Ditolak'?'selected':''}>Ditolak</option></select></div></td></tr>`).join('');
  attachHandlers();
}
function renderCards(all){
  const wrap=document.querySelector('#adminCards');
  if(!wrap) return;
  if(!all.length){wrap.innerHTML='<div class="card" style="padding:18px;text-align:center">Tidak ada laporan ditemukan.</div>';return;}
  wrap.innerHTML=all.map(r=>`<div class="card" style="padding:14px;display:grid;gap:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="badge ${escapeAttr(r.status)}">${escapeHtml(r.status)}</span><code style="font-size:11px;background:#f4f6f5;padding:3px 6px;border-radius:6px">${escapeHtml(r.id.slice(-6))}</code></div><strong style="font:700 14px Plus Jakarta Sans,sans-serif;line-height:1.35">${escapeHtml(r.title)}</strong><span class="muted" style="font-size:12px">${escapeHtml(r.category)} · ${escapeHtml(r.userName||'-')} · ${new Date(r.createdAt).toLocaleDateString('id-ID')}</span><span class="muted" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.address||'Lokasi belum tersedia')}</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><a class="button secondary" href="report-detail.html?id=${encodeURIComponent(r.id)}" style="flex:1 1 90px;justify-content:center;padding:9px 12px;font-size:12px">Buka</a><select data-id="${escapeAttr(r.id)}" class="statusSelect" style="flex:2 1 140px"><option ${r.status==='Menunggu'?'selected':''}>Menunggu</option><option ${r.status==='Diverifikasi'?'selected':''}>Diverifikasi</option><option ${r.status==='Diproses'?'selected':''}>Diproses</option><option ${r.status==='Selesai'?'selected':''}>Selesai</option><option ${r.status==='Ditolak'?'selected':''}>Ditolak</option></select></div></div>`).join('');
  attachHandlers();
}
function attachHandlers(){
  document.querySelectorAll('.statusSelect').forEach(sel=>{
    if(sel.dataset.bound==='1') return;
    sel.dataset.bound='1';
    sel.addEventListener('change',async()=>{
      const nid=sel.dataset.id, ns=sel.value;
      sel.disabled=true;
      try{ await update(ref(db,`reports/${nid}`),{status:ns,updatedAt:Date.now()}); }
      catch(e){ alert('Gagal ubah status: '+e.message); }
      sel.disabled=false;
    });
  });
}
function kpi(l,v){return `<div><strong>${v}</strong><span>${l}</span></div>`}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function escapeAttr(v){return String(v).replace(/"/g,'&quot;')}
