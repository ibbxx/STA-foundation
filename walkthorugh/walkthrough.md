# Walkthrough: Perbaikan Halaman Login Admin & Infinite Loop

Dokumen ini mencatat analisis dan perbaikan yang dilakukan untuk mengatasi masalah halaman login admin (`/admin/login`) yang tidak bisa diakses atau mengalami *infinite loop redirect*.

---

## 🔍 Analisis Masalah (Root Cause)

Ada 4 faktor utama yang menyebabkan masalah ini terjadi secara bersamaan:

### 1. Kebocoran Status Loading di `GuestRoute`
Pada file `GuestRoute.tsx`, kondisi guard untuk menampilkan spinner loading menggunakan:
```tsx
if (loading && !session) { ... }
```
*   **Masalah**: Ketika pengguna sudah memiliki session di cache (misalnya setelah login sebelumnya), `session` langsung bernilai ada (`true`), sedangkan proses pengecekan admin (`is_admin` RPC) masih berlangsung (`loading` bernilai `true`).
*   **Akibat**: Kondisi di atas mengevaluasi ke `false` sehingga spinner dilewati terlalu cepat. Aplikasi mencoba merender form login sementara status admin belum terverifikasi secara penuh, memicu flicker atau redirect loop.

### 2. Duplikasi Network Request (Tidak Ada Shared Auth State)
Setiap kali rute beralih dari `/admin/login` ke `/admin`, route guard (`GuestRoute` dan `ProtectedRoute`) akan memicu instansiasi hook `useAuth()` yang baru.
*   **Masalah**: Setiap instansi `useAuth()` memanggil kembali `supabase.auth.getSession()` dan `supabase.rpc('is_admin')`.
*   **Akibat**: Terjadi lonjakan request jaringan berulang pada setiap navigasi, yang memperlambat performa dan mempermudah terjadinya *race condition* jika server lambat merespons.

### 3. Sinyal AuthState yang Tumpang Tindih (Race Condition)
Di dalam `useAuth.ts`, terjadi bentrokan antara `loadSession()` (pembacaan manual pertama kali) dan listener `onAuthStateChange`.
*   **Masalah**: Event `INITIAL_SESSION` dari listener sering kali terpicu sebelum `loadSession()` selesai, namun status `authLoading` tidak disetel ke `false` oleh event tersebut.
*   **Akibat**: UI terjebak dalam status loading atau merender komponen dalam keadaan data tidak sinkron.

### 4. Kegagalan RPC `is_admin` Tanpa Mekanisme Toleransi
Fungsi `is_admin` di database terkadang gagal merespons dengan cepat atau terhambat oleh RLS (Row Level Security).
*   **Masalah**: Jika request RPC gagal sekali saja, status `isAdmin` langsung diset ke `false` secara permanen untuk sesi tersebut.
*   **Akibat**: Pengguna sah terkunci di luar halaman admin walaupun data autentikasi mereka benar.

---

## 🛠️ Perbaikan yang Diterapkan

Kami melakukan refaktorisasi terpusat pada sistem autentikasi rute dengan langkah-langkah berikut:

### A. Penggunaan Shared Context (React Context)
Kami memperkenalkan `AuthContext` di dalam `useAuth.ts` agar seluruh rute berbagi satu state autentikasi yang sama. 
*   **File Modifikasi**: [useAuth.ts](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/hooks/useAuth.ts)
*   **Hasil**: Mengeliminasi duplikasi request ke database Supabase saat pengguna berpindah rute di area admin.

### B. Penyederhanaan Loading Guard di `GuestRoute`
*   **File Modifikasi**: [GuestRoute.tsx](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/components/shared/GuestRoute.tsx)
*   **Perubahan**:
    ```diff
    - if (loading && !session) {
    + if (loading) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-[#f7f7f3]">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        );
      }
    ```
*   **Hasil**: Halaman login tidak akan dirender sampai status session dan hak akses admin terverifikasi sepenuhnya.

### C. Integrasi `AuthProvider` ke Router Utama
*   **File Modifikasi**: [App.tsx](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/App.tsx)
*   **Perubahan**: Membungkus seluruh hierarki rute menggunakan komponen `<AuthProvider>` agar state autentikasi terdistribusi dengan baik.

### D. Penambahan Mekanisme Retry & Fallback Timeout
Di dalam `useAuth.ts` versi baru:
1.  **RPC `is_admin` Retry**: Ditambahkan percobaan ulang otomatis sebanyak 2 kali dengan jeda 1 detik jika request awal gagal.
2.  **Fallback Timeout**: Jika listener Supabase tidak memberikan respons dalam 3 detik, sistem akan secara otomatis mencoba membaca session secara manual sebagai cadangan darurat (*graceful degradation*).

---

## 🚀 Status Saat Ini
*   **TypeScript Check**: Lulus 100% tanpa error (`npx tsc --noEmit` bersih).
*   **Stabilitas Rute**: Masalah *infinite loop* teratasi sepenuhnya karena status auth sekarang tersinkronisasi di satu sumber kebenaran (Shared Context).
