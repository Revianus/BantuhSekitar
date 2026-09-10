import { ref, onValue } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { db } from './firebase-config.js';

const latest = document.querySelector('#latest');
const total = document.querySelector('#total');
const pending = document.querySelector('#pending');
const done = document.querySelector('#done');

onValue(ref(db, 'reports'), snapshot => {
  const raw = snapshot.val() || {};
  const reports = Object.entries(raw).map(([id, value]) => ({ id, ...value }));
  reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (total) total.textContent = String(reports.length);
  if (pending) pending.textContent = String(reports.filter(item => item.status === 'Menunggu').length);
  if (done) done.textContent = String(reports.filter(item => item.status === 'Selesai').length);

  if (!latest) return;

  if (!reports.length) {
    latest.innerHTML = '<div class="card" style="grid-column:1/-1;padding:22px;text-align:center"><strong>Tidak ada laporan ditemukan.</strong><p class="muted" style="margin:6px 0 0">Jadilah yang pertama membuat laporan.</p><a class="button" href="create-report.html" style="margin-top:14px">Buat laporan sekarang</a></div>';
    return;
  }

  latest.innerHTML = reports.slice(0, 6).map(report => `
    <a href="report-detail.html?id=${encodeURIComponent(report.id)}" class="card" style="text-decoration:none;color:inherit;overflow:hidden;display:flex;flex-direction:column">
      <div style="height:160px;background:#eef6f2;overflow:hidden">
        <img src="${escapeAttr(report.photoUrl || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&auto=format&fit=crop')}" alt="" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div style="padding:14px;display:grid;gap:8px">
        <span class="badge ${escapeAttr(report.status || 'Menunggu')}">${escapeHtml(report.status || 'Menunggu')}</span>
        <h3 style="margin:0;font-size:16px;line-height:1.35">${escapeHtml(report.title || 'Tanpa judul')}</h3>
        <span class="muted" style="font-size:12px">${escapeHtml(report.category || 'Lainnya')} · ${escapeHtml(new Date(report.createdAt || Date.now()).toLocaleDateString('id-ID'))}</span>
        <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(report.address || 'Lokasi belum tersedia')}</span>
      </div>
    </a>
  `).join('');
}, error => {
  if (latest) latest.innerHTML = `<div class="card" style="grid-column:1/-1;padding:18px"><strong>Gagal mengambil data</strong><p class="muted" style="margin:6px 0 0">${escapeHtml(error.message)}</p></div>`;
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}
function escapeAttr(value) {
  return String(value).replace(/"/g, '&quot;');
}
