/* file: sw.js (MODE GALAK) */
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  
  // Opsi Notifikasi "Galak"
  const options = {
    body: data.body || 'Segera kembali ke lokasi!',
    icon: 'icon-192.png', 
    badge: 'icon-192.png',
    
    // GETARAN PANJANG (Seperti Telepon: Getar 1dtk, diam 0.2dtk, ulang)
    vibrate: [1000, 200, 1000, 200, 1000, 200, 1000, 200, 1000],
    
    // AGAR MUNCUL DI ATAS (Heads Up)
    tag: 'queue-alert',
    renotify: true,
    
    // PENTING: Notif tidak akan hilang sampai diklik user
    requireInteraction: true,
    
    // Tambah Tombol
    actions: [
      { action: 'open', title: '🚀 BUKA APLIKASI' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'PANGGILAN ANTRIAN', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Saat diklik, buka aplikasi/jendela browser
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Kalau tab sudah terbuka, fokuskan
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) { client = clientList[i]; }
        }
        return client.focus();
      }
      // Kalau belum, buka baru
      return clients.openWindow('/');
    })
  );
});
