// firebase-messaging-sw.js
// Script ini HARUS ada di ROOT domain Anda.

// Import Firebase SDKs
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// --- Konfigurasi Firebase (Ganti dengan config Anda) ---
// Gunakan config yang sama dengan antrian.html
const firebaseConfig = {
    apiKey: "AIzaSyALIlkIDALIk83K8s1htalvW6rmNNw02Go", 
    projectId: "sistem-antrian-b1c39", 
    messagingSenderId: "454124587608",
    appId: "1:454124587608:web:34fbb0f5211067a67f982d"
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- Logika Penanganan Notifikasi Latar Belakang ---

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Pesan latar belakang diterima ', payload);

    const plat = payload.data.plat || 'Motor Anda';
    const notificationTitle = payload.notification.title || "CAS SELESAI!";
    
    // Opsi notifikasi yang akan ditampilkan di sistem operasi
    const notificationOptions = {
        body: payload.notification.body || `Motor ${plat} telah selesai pengisian daya.`,
        icon: '/icons/battery-full.png', // WAJIB GANTI dengan path ikon yang benar
        tag: 'charging_complete', 
        vibrate: [500, 100, 500, 100, 500],
        requireInteraction: true // Notifikasi tetap di layar sampai diabaikan
    };

    // Tampilkan notifikasi push sistem
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Logika saat notifikasi diklik (Membuka kembali aplikasi)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        // Buka halaman antrian.html
        clients.openWindow('./antrian.html') 
    );
});
          
