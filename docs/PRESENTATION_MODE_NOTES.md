# PRESENTATION MODE: HIDING CAMPAIGN & DONATION

Berikut adalah catatan mengenai modifikasi yang dilakukan pada file `Navbar.tsx` dan `Home.tsx` untuk menyembunyikan fitur donasi sementara waktu saat presentasi (karena Xendit masih under review).

Semua kode asli tetap dipertahankan dan **TIDAK DIHAPUS**. Modifikasi dilakukan dengan cara yang sangat aman:

1. **Di `Navbar.tsx`**: Kode `navItems` untuk Campaign dijadikan komen `//`, dan tombol CTA dibungkus dengan fungsi `{false && ( ... )}`. Kode asli tetap utuh di situ, tapi tidak dirender.
2. **Di `Home.tsx`**: Section *Happening Now* dan *Stats CTA* tidak dihapus, tetapi diletakkan di dalam blok kondisional `{false && ( <section>...</section> )}`.

### Cara Mengembalikan (Revert) Setelah Xendit Approved:
Ketika Xendit sudah *approved* nanti, Anda cukup **menghapus** tulisan `{false && (` beserta kurung tutupnya `)}` atau menghapus komennya saja. Fitur donasi dan Leaderboard akan langsung kembali seperti semula tanpa perlu koding ulang.
