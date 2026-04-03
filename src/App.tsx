import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Donate from './pages/Donate';
import PaymentSuccess from './pages/PaymentSuccess';
import About from './pages/About';
import LaporkanSekolah from './pages/LaporkanSekolah';
import Contact from './pages/Contact';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminDonors from './pages/admin/AdminDonors';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminContent from './pages/admin/AdminContent';
import AdminSettings from './pages/admin/AdminSettings';

/**
 * Komponen pembungkus (wrapper) untuk halaman-halaman publik.
 * Pada halaman beranda, navbar menimpa hero (tidak ada spacer).
 * Pada halaman lain, ditambahkan spacer agar konten tidak tertutup navbar fixed.
 */
function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isTransparentNavPage = location.pathname === '/' || location.pathname === '/tentang-kami';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Spacer untuk halaman selain beranda (navbar fixed butuh ruang) */}
      {!isTransparentNavPage && <div className="h-16 sm:h-20" />}
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/**
 * Komponen utama aplikasi yang mendefinisikan seluruh rute (routing).
 */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rute-rute Publik */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/campaigns" element={<PublicLayout><Campaigns /></PublicLayout>} />
        <Route path="/campaigns/:slug" element={<PublicLayout><CampaignDetail /></PublicLayout>} />
        <Route path="/donate/:slug" element={<PublicLayout><Donate /></PublicLayout>} />
        <Route path="/payment/success" element={<PublicLayout><PaymentSuccess /></PublicLayout>} />
        <Route path="/tentang-kami" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/laporkan" element={<PublicLayout><LaporkanSekolah /></PublicLayout>} />
        <Route path="/kontak" element={<PublicLayout><Contact /></PublicLayout>} />

        {/* Rute-rute Panel Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Rute Penanganan 404/Fallback */}
        <Route path="*" element={<PublicLayout><div className="py-32 text-center">Halaman tidak ditemukan.</div></PublicLayout>} />
      </Routes>
    </Router>
  );
}
