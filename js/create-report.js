import { ref as dbRef, push, set } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import { db, storage } from './firebase-config.js';
import { requireAuth } from './auth.js';

let user = null, profile = null, lat = null, lng = null, map = null, marker = null;
const msg = document.querySelector('#msg'), btn = document.querySelector('#submitBtn'), locationButton = document.querySelector('#useLocation'), locationStatus = document.querySelector('#locationStatus');
const searchInput = document.querySelector('#addressSearch'), searchBtn = document.querySelector('#searchBtn'), searchResults = document.querySelector('#searchResults'), copyBtn = document.querySelector('#copyCoords');

requireAuth().then(data => {
  user = data.user;
  profile = data.profile;
  initMap();
});

function initMap() {
  map = L.map('map').setView([-6.2, 106.83], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
  map.on('click', e => setPoint(e.latlng.lat, e.latlng.lng));
  setTimeout(() => map.invalidateSize(), 400);
}

function setPoint(a, b, opts = {}) {
  lat = a; lng = b;
  const skipReverse = opts.skipReverse === true;
  locationStatus.textContent = `Lokasi dipilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}${skipReverse ? '' : ' · mencari alamat…'}`;
  locationStatus.className = 'msg ok';
  document.querySelector('#lat').value = lat.toFixed(6);
  document.querySelector('#lng').value = lng.toFixed(6);
  if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map);
  if (!skipReverse) reverseGeocode(lat, lng);
}

async function reverseGeocode(a, b) {
  const addressInput = document.querySelector('#address');
  addressInput.placeholder = 'Mencari alamat akurat…';
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(a)}&lon=${encodeURIComponent(b)}&zoom=18&addressdetails=1&accept-language=id`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('Geocode gagal');
    const j = await r.json();
    const addr = j.address || {};
    const road = j.name || addr.road || addr.pedestrian || addr.footway || addr.path || addr.cycleway || '';
    const house = addr.house_number ? `No. ${addr.house_number}` : '';
    const village = addr.village || addr.hamlet || addr.suburb || addr.neighbourhood || addr.quarter || '';
    const district = addr.city_district || addr.district || addr.subdistrict || '';
    const city = addr.city || addr.town || addr.municipality || addr.county || '';
    const state = addr.state || addr.province || '';
    const postcode = addr.postcode || '';
    const top = [road, house].filter(Boolean).join(' ');
    const rest = [village, district, city, state, postcode].filter(Boolean).join(', ');
    const pretty = [top, rest].filter(Boolean).join(', ') || j.display_name || '';
    const withCoords = pretty ? `${pretty} (${a.toFixed(6)}, ${b.toFixed(6)})` : `${a.toFixed(6)}, ${b.toFixed(6)}`;
    addressInput.value = pretty || withCoords;
    locationStatus.textContent = `Alamat ditemukan: ${pretty || withCoords}`;
    locationStatus.className = 'msg ok';
    addressInput.placeholder = 'Alamat akurat — bisa diedit jika kurang pas';
  } catch {
    addressInput.placeholder = 'Alamat otomatis gagal — isi manual';
    locationStatus.textContent = `Koordinat disimpan: ${a.toFixed(6)}, ${b.toFixed(6)} — silakan edit alamat manual.`;
    locationStatus.className = 'msg';
  }
}

async function searchAddress(query) {
  const q = query.trim();
  if (!q) { locationStatus.textContent = 'Ketik alamat dulu.'; locationStatus.className = 'msg err'; return; }
  searchBtn.disabled = true; searchBtn.textContent = 'Mencari…';
  searchResults.style.display = 'none'; searchResults.innerHTML = '';
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=6&addressdetails=1&accept-language=id&countrycodes=id`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const list = await r.json();
    if (!Array.isArray(list) || !list.length) {
      locationStatus.textContent = 'Alamat tidak ditemukan. Coba kata kunci lain atau klik peta.';
      locationStatus.className = 'msg err';
      return;
    }
    searchResults.innerHTML = list.map(item => `<button type="button" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${escapeAttr(item.display_name)}">${escapeHtml(item.display_name)}</button>`).join('');
    searchResults.style.display = 'block';
    locationStatus.textContent = `Ditemukan ${list.length} hasil — pilih salah satu.`;
    locationStatus.className = 'msg ok';
    searchResults.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const la = parseFloat(b.dataset.lat), lo = parseFloat(b.dataset.lon);
      document.querySelector('#address').value = b.dataset.name;
      searchResults.style.display = 'none';
      setPoint(la, lo, { skipReverse: false });
      map.setView([la, lo], 17);
    }));
  } catch (e) {
    locationStatus.textContent = 'Pencarian gagal: ' + e.message;
    locationStatus.className = 'msg err';
  } finally {
    searchBtn.disabled = false; searchBtn.textContent = 'Cari';
  }
}

locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = 'Browser tidak mendukung lokasi. Gunakan pencarian alamat atau klik peta.';
    locationStatus.className = 'msg err';
    return;
  }
  locationButton.disabled = true;
  locationButton.textContent = 'Mencari lokasi…';
  locationStatus.textContent = 'Mohon izinkan akses lokasi pada pop-up browser.';
  locationStatus.className = 'msg';
  navigator.geolocation.getCurrentPosition(
    p => {
      locationButton.disabled = false;
      locationButton.textContent = 'Lokasi Ditemukan';
      setPoint(p.coords.latitude, p.coords.longitude);
      map.setView([lat, lng], 18);
    },
    error => {
      locationButton.disabled = false;
      locationButton.textContent = 'Coba Lagi';
      const reason = error.code === 1 ? 'Izin lokasi ditolak.' : error.code === 2 ? 'Lokasi tidak tersedia.' : 'Waktu habis.';
      locationStatus.textContent = `${reason} Gunakan pencarian alamat atau klik peta manual.`;
      locationStatus.className = 'msg err';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
});

if (searchBtn) searchBtn.addEventListener('click', () => searchAddress(searchInput.value));
if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchAddress(searchInput.value); } });
if (copyBtn) copyBtn.addEventListener('click', async () => {
  if (lat === null) { locationStatus.textContent = 'Belum ada koordinat untuk disalin.'; locationStatus.className = 'msg err'; return; }
  const t = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  try { await navigator.clipboard.writeText(t); locationStatus.textContent = `Disalin: ${t}`; locationStatus.className = 'msg ok'; } catch { locationStatus.textContent = t; }
});

function compressImage(file, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
}

document.querySelector('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.querySelector('#title').value.trim();
  const category = document.querySelector('#category').value;
  const description = document.querySelector('#description').value.trim();
  const file = document.querySelector('#photo').files[0];
  const directUrl = document.querySelector('#photoUrlInput').value.trim();
  if (!title || !description) { msg.textContent = 'Lengkapi judul dan deskripsi.'; msg.className = 'msg err'; return; }
  if (lat === null || lng === null) { msg.textContent = 'Tentukan lokasi dengan cari alamat, klik peta, atau tombol lokasi.'; msg.className = 'msg err'; return; }
  btn.disabled = true; btn.textContent = 'Mengirim laporan...'; msg.textContent = ''; msg.className = 'msg';
  try {
    let photoUrl = directUrl || '';
    if (file) {
      btn.textContent = 'Mengunggah foto…';
      try {
        const fileExt = file.name.split('.').pop();
        const r = storageRef(storage, `reports/${user.uid}/${Date.now()}.${fileExt}`);
        await uploadBytes(r, file);
        photoUrl = await getDownloadURL(r);
      } catch (storageErr) {
        console.warn('Storage fallback:', storageErr.message);
        photoUrl = await compressImage(file, 700, 0.65);
      }
    }
    btn.textContent = 'Menyimpan ke database…';
    const pushRef = push(dbRef(db, 'reports'));
    await set(pushRef, { userId: user.uid, userName: profile?.name || user.email, title, category, description, photoUrl, latitude: lat, longitude: lng, address: document.querySelector('#address').value.trim() || `${lat.toFixed(6)}, ${lng.toFixed(6)}`, status: 'Menunggu', createdAt: Date.now(), updatedAt: Date.now() });
    msg.textContent = 'Laporan berhasil dibuat!'; msg.className = 'msg ok';
    setTimeout(() => location.href = 'reports.html', 900);
  } catch (err) {
    console.error(err);
    msg.textContent = 'Gagal membuat laporan: ' + err.message; msg.className = 'msg err';
    btn.disabled = false; btn.textContent = 'Kirim Laporan';
  }
});

function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function escapeAttr(v){return String(v).replace(/"/g,'&quot;')}
