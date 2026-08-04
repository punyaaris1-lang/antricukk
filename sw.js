const CACHE_NAME = 'ziung-premium-cache-v10.4';

// Daftar aset yang mau disimpan di memori HP (Biar loading kenceng)
const urlsToCache = [
  '/',
  '/index.html',
  '/logomlumaster.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// --- 1. INSTALL: Simpan file ke Cache ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// --- 2. ACTIVATE: Hapus Cache Lama ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus Cache Lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- 3. FETCH: Network First, Fallback to Cache ---
self.addEventListener('fetch', event => {
  // Abaikan request selain GET (kayak POST/PUT) dan hindari nge-cache request ke Firebase Database
  if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Kalau sinyal ada, ambil dari internet dan update cachenya
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Kalau offline/sinyal putus, ambil dari cache
        return caches.match(event.request);
      })
  );
});
