/* file: sw.js */
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'FC Charging', {
    body: data.body || 'Ada update antrian!',
    icon: 'icon-192.png', // Pastikan ada file icon-192.png
    vibrate: [200, 100, 200, 100, 200],
    tag: 'queue-alert',
    renotify: true,
    requireInteraction: true
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) { client = clientList[i]; }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
