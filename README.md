# BantuSekitar

Static site + Firebase Realtime Database / Auth / Storage. Data online bersama, bukan localStorage.

## 1. Buat Project Firebase
- console.firebase.google.com > Add project
- Authentication > Sign-in method > Email/Password enable
- Realtime Database > Create > Start in locked mode > pilih region
- Storage > Get started

## 2. Isi Config
Edit `js/firebase-config.js` ganti semua `GANTI_DENGAN_*` dengan nilai dari Project Settings > General > Your apps > SDK setup and configuration.

## 3. Rules
- Realtime Database > Rules > paste `database.rules.json` > Publish
- Storage > Rules > paste `storage.rules` > Publish

## 4. Buat Admin
Register akun biasa, lalu di Realtime Database ubah `users/{uid}/role` dari `user` jadi `admin`.

## 5. Jalankan Lokal
Buka `index.html` via Live Server (VS Code) atau `npx serve .` — jangan open file:/// langsung karena import map Firebase butuh http.

## 6. Deploy Firebase Hosting
```
npm i -g firebase-tools
firebase login
firebase init hosting  # pilih project, public dir = . (atau D:\Work\BantuhSekitar)
firebase deploy
```
Domain custom: Firebase Console > Hosting > Add custom domain > ikuti record TXT/A/CNAME di DNS domain kamu.

## 7. Alternatif Hosting
Vercel / Netlify / Cloudflare Pages / GitHub Pages: push folder ini ke GitHub, connect repo di dashboard hosting.

## Keamanan Config
`apiKey` di `firebase-config.js` aman di frontend (bukan secret). Yang dijaga adalah Rules dan jangan commit service account key. Aktifkan App Check jika perlu.

## Struktur Data
users/{uid}: name, email, role, createdAt
reports/{reportId}: userId, userName, title, category, description, photoUrl, latitude, longitude, address, status, createdAt, updatedAt
comments/{reportId}/{commentId}: userId, userName, comment, createdAt
