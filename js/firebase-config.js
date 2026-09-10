import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyAWlGdQn82w3P-Hb-yk3RTdPip8DHa-heo",
  authDomain: "bantusekitar-df000.firebaseapp.com",
  databaseURL: "https://bantusekitar-df000-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bantusekitar-df000",
  storageBucket: "bantusekitar-df000.firebasestorage.app",
  messagingSenderId: "570550104294",
  appId: "1:570550104294:web:763be2f0c1496a9b790b27"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
