const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

// Inisialisasi Admin SDK
admin.initializeApp();
const db = admin.firestore();

// --- FUNGSI UTAMA: scheduleCharge ---
// Dipanggil oleh aplikasi klien saat pengguna mendaftar atau saat cas dimulai.
exports.scheduleCharge = functions.https.onCall(async (data, context) => {
    
    // Validasi data yang diterima dari klien
    if (!data.plat || !data.token || !data.endTime || !data.durationMinutes) {
        throw new functions.https.HttpsError('invalid-argument', 'Data pendaftaran tidak lengkap.');
    }

    const { plat, token, endTime, durationMinutes } = data;
    
    // ID unik untuk notifikasi yang dijadwalkan (Kita gunakan Plat)
    const notificationId = plat; 
    
    // Hitung penundaan (delay) dalam milidetik
    const delayMs = endTime - Date.now();

    // Batasan: Jika delay terlalu lama (> 4 jam), berikan peringatan.
    // Cloud Functions tidak dirancang untuk menahan koneksi selama berjam-jam.
    if (delayMs <= 0 || delayMs > (4 * 60 * 60 * 1000)) { 
        if (delayMs > 0) {
            console.warn(`Jadwal untuk Plat ${plat} (${durationMinutes} menit) terlalu panjang. Berisiko gagal jika runtime Function berakhir.`);
        }
    }
    
    console.log(`Jadwal FCM untuk Plat ${plat} dalam ${Math.ceil(delayMs / 60000)} menit.`);
    
    // 1. Catat Jadwal di Database (untuk tujuan administrasi dan pembatalan)
    await db.collection('scheduled_notifications').doc(notificationId).set({
        token: token,
        plat: plat,
        scheduledFor: Timestamp.fromMillis(endTime),
        duration: durationMinutes,
        status: 'SCHEDULED'
    });
    
    // 2. Jadwalkan pengiriman notifikasi menggunakan timer Server (setTimeout)
    // NOTE: Timeout ini berjalan di latar belakang server Function.
    setTimeout(async () => {
        // --- Logika Pengiriman dan Cek Pembatalan ---
        try {
            // Cek status slot terbaru sebelum mengirim notifikasi (PENTING!)
            const antrianDoc = await db.collection('antrian').doc('utama').get();
            const slots = antrianDoc.data()?.chargingSlots || [];
            
            // Cek apakah Plat yang sama masih ada di Slot Charging
            const isStillCharging = slots.some(s => s && s.plat === plat);

            if (isStillCharging) {
                // KIRIM NOTIFIKASI FCM
                const payload = {
                    notification: {
                        title: "🔔 CAS SELESAI!",
                        body: `Motor Plat ${plat} telah selesai pengisian daya. Segera diambil.`,
                        icon: '/icons/battery-full.png', 
                        click_action: './antrian.html', // Link yang akan dibuka saat notifikasi diklik
                    },
                    data: {
                        plat: plat,
                        type: 'CHARGING_COMPLETE'
                    }
                };

                await admin.messaging().sendToDevice(token, payload);
                console.log(`Notifikasi sukses terkirim ke Plat ${plat}.`);

                await db.collection('scheduled_notifications').doc(notificationId).update({ status: 'SENT' });
                
            } else {
                // Notifikasi dibatalkan (slot sudah dikosongkan/dihentikan)
                console.log(`Notifikasi untuk Plat ${plat} dibatalkan: Slot sudah kosong.`);
                await db.collection('scheduled_notifications').doc(notificationId).update({ status: 'CANCELLED_EMPTY' });
            }

        } catch (error) {
            console.error(`Gagal mengirim notifikasi untuk ${plat}:`, error);
        }
        
        // Hapus catatan jadwal dari database (bersihkan)
        await db.collection('scheduled_notifications').doc(notificationId).delete();
        
    }, delayMs); 

    return { success: true, message: `Notification scheduled for ${durationMinutes} minutes` };
});
          
