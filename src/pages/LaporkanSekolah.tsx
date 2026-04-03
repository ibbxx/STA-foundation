import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Search, Banknote, Loader2, Heart } from 'lucide-react';

export default function LaporkanSekolah() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Group A: Data Pelapor
    namaPelapor: '',
    nomorWa: '',
    hubungan: '',
    // Group B: Data Sekolah
    namaSekolah: '',
    jenjang: '',
    alamat: '',
    lokasi: '',
    namaKepsek: '',
    kontakSekolah: '',
    // Group C: Kondisi
    jenisBantuan: '',
    jumlahSiswa: '',
    kondisi: '',
    cerita: '',
    linkDokumentasi: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const message = `*HALO TIM STA, SAYA INGIN MELAPORKAN SEKOLAH*
    
*A. DATA PELAPOR*
Nama Lengkap: ${formData.namaPelapor}
Nomor WhatsApp: ${formData.nomorWa}
Hubungan dg Sekolah: ${formData.hubungan}

*B. DATA SEKOLAH*
Nama Sekolah: ${formData.namaSekolah}
Jenjang: ${formData.jenjang}
Alamat: ${formData.alamat}
Kecamatan/Kota: ${formData.lokasi}
Nama Kepsek: ${formData.namaKepsek}
Kontak Sekolah: ${formData.kontakSekolah || '-'}

*C. KONDISI & KEBUTUHAN*
Jenis Bantuan Diperlukan: ${formData.jenisBantuan}
Jumlah Siswa Terdampak: ${formData.jumlahSiswa}
Kondisi Sekolah: ${formData.kondisi}

*Cerita Singkat:*
${formData.cerita}

*Link Bukti/Dokumentasi:*
${formData.linkDokumentasi || 'Tidak dilampirkan'}`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/6281234567890?text=${encodedMessage}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        window.open(waUrl, '_blank');
      }, 1500);
    }, 1200);
  };

  const inputClass = "w-full bg-transparent border-b border-gray-300 py-3 text-gray-900 focus:outline-none focus:border-[#2C5F4F] transition-colors placeholder:text-gray-400 text-[15px] font-light";
  const labelClass = "block text-xs font-semibold text-[#2C5F4F] tracking-wider uppercase mb-1";

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF8] pt-24 sm:pt-32 pb-20 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* TOP INTRO SECTION */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeUpVariant}
          className="max-w-3xl mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2C5F4F]" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Platform Transparansi</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1] tracking-tight mb-8">
            Laporkan Sekolah yang Membutuhkan Bantuan.
          </h1>
          
          <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl mb-10">
            Setiap informasi yang Anda berikan adalah langkah awal untuk merajut harapan baru bagi pendidikan mereka. Tim relawan kami akan mempelajari, memverifikasi, dan mengambil tindakan yang tepat.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#2C5F4F]" size={20} />
              <span className="text-sm font-medium text-gray-700">Ditinjau Tim STA</span>
            </div>
            <div className="flex items-center gap-3">
              <Search className="text-[#2C5F4F]" size={20} />
              <span className="text-sm font-medium text-gray-700">Verifikasi Awal</span>
            </div>
            <div className="flex items-center gap-3">
              <Banknote className="text-[#2C5F4F]" size={20} />
              <span className="text-sm font-medium text-gray-700">Tanpa Biaya</span>
            </div>
          </div>
        </motion.div>

        {/* MAIN COMPOSITION - SPLIT LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left Side: Editorial & Trust */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 lg:sticky lg:top-32 space-y-12"
          >
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Mengapa laporan Anda penting?</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                Di pelosok Nusantara, masih banyak bilik ilmu yang rapuh tak tersentuh. Mata Anda di lapangan sangat berharga bagi kami untuk dapat mendistribusikan kebaikan secara tepat sasaran. Pastikan data yang Anda isi valid dan tidak dibuat-buat.
              </p>
            </div>
            

          </motion.div>

          {/* Right Side: Form */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-7 bg-white/80 backdrop-blur-md border border-gray-200/60 p-8 sm:p-12 lg:p-14 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)]"
          >
            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* Group A */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-100">A. Data Diri Pelapor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <label className={labelClass}>Nama Lengkap</label>
                    <input required type="text" name="namaPelapor" value={formData.namaPelapor} onChange={handleChange} className={inputClass} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>Nomor WhatsApp</label>
                    <input required type="tel" name="nomorWa" value={formData.nomorWa} onChange={handleChange} className={inputClass} placeholder="0812..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Hubungan dengan Sekolah</label>
                    <input required type="text" name="hubungan" value={formData.hubungan} onChange={handleChange} className={inputClass} placeholder="Contoh: Guru / Relawan / Warga Setempat" />
                  </div>
                </div>
              </div>

              {/* Group B */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-100">B. Identitas Sekolah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Nama Sekolah</label>
                    <input required type="text" name="namaSekolah" value={formData.namaSekolah} onChange={handleChange} className={inputClass} placeholder="SDN 01 Contoh" />
                  </div>
                  <div>
                    <label className={labelClass}>Jenjang</label>
                    <select required name="jenjang" value={formData.jenjang} onChange={handleChange} className={inputClass}>
                      <option value="" disabled>Pilih Jenjang</option>
                      <option value="SD/Sederajat">SD / Sederajat</option>
                      <option value="SMP/Sederajat">SMP / Sederajat</option>
                      <option value="SMA/Sederajat">SMA / Sederajat</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nama Kepala Sekolah</label>
                    <input required type="text" name="namaKepsek" value={formData.namaKepsek} onChange={handleChange} className={inputClass} placeholder="Opsional jika tahu" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Alamat Lengkap</label>
                    <input required type="text" name="alamat" value={formData.alamat} onChange={handleChange} className={inputClass} placeholder="Jalan, RT/RW, Desa" />
                  </div>
                  <div>
                    <label className={labelClass}>Kecamatan / Kota / Provinsi</label>
                    <input required type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} className={inputClass} placeholder="Kecamatan X, Kab Y" />
                  </div>
                  <div>
                    <label className={labelClass}>Kontak Sekolah (Opsional)</label>
                    <input type="text" name="kontakSekolah" value={formData.kontakSekolah} onChange={handleChange} className={inputClass} placeholder="No HP/Telepon" />
                  </div>
                </div>
              </div>

              {/* Group C */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-100">C. Kondisi & Kebutuhan</h3>
                <div className="grid grid-cols-1 gap-6 sm:gap-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <label className={labelClass}>Jenis Bantuan Utama</label>
                      <select required name="jenisBantuan" value={formData.jenisBantuan} onChange={handleChange} className={inputClass}>
                        <option value="" disabled>Pilih Kebutuhan</option>
                        <option value="Renovasi Bangunan">Renovasi Bangunan Redup/Rubuh</option>
                        <option value="Fasilitas Belajar">Buku & Fasilitas Belajar</option>
                        <option value="Sanitasi / Air Bersih">Sanitasi & Air Bersih</option>
                        <option value="Akses Listrik/Internet">Akses Listrik & Internet</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Estimasi Siswa Terdampak</label>
                      <input required type="number" name="jumlahSiswa" min="1" value={formData.jumlahSiswa} onChange={handleChange} className={inputClass} placeholder="Misal: 150" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Kondisi Fisik Saat Ini</label>
                    <input required type="text" name="kondisi" value={formData.kondisi} onChange={handleChange} className={inputClass} placeholder="Atap bocor, tidak ada meja, dinding bambu lapuk..." />
                  </div>
                  <div>
                    <label className={labelClass}>Cerita Singkat Mengapa Mereka Bantuan</label>
                    <textarea required name="cerita" value={formData.cerita} onChange={handleChange} rows={4} className={`${inputClass} resize-none`} placeholder="Ceritakan pengamatan Anda..." />
                  </div>
                  <div>
                    <label className={labelClass}>Tautan Bukti Dokumentasi (Opsional tapi Penting)</label>
                    <input type="url" name="linkDokumentasi" value={formData.linkDokumentasi} onChange={handleChange} className={inputClass} placeholder="Link Google Drive foto/video kondisi sekolah" />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-6">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full py-4 bg-emerald-50 text-[#2C5F4F] border border-emerald-200 rounded-lg flex items-center justify-center gap-3 font-medium"
                    >
                      <Heart className="fill-[#2C5F4F]" size={20} />
                      Mengarahkan ke WhatsApp...
                    </motion.div>
                  ) : (
                    <motion.button
                      key="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#2C5F4F] text-[#F5F1E8] text-base font-light rounded-sm hover:bg-[#234A3D] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin text-[#F5F1E8]/70" />
                      ) : (
                        "Kirim Laporan ke WhatsApp"
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
                <p className="text-center text-xs text-gray-400 mt-4 font-light">
                  Data Anda aman dan ditangani sesuai kebijakan privasi NGO.
                </p>
              </div>

            </form>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
