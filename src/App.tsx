import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import GuestRoute from './components/shared/GuestRoute';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';

/* ── Public Pages ── */
const Home = lazy(() => import('./pages/public/Home'));
const Campaigns = lazy(() => import('./pages/public/Campaigns'));
const CampaignDetail = lazy(() => import('./pages/public/CampaignDetail'));
const ProgramDetail = lazy(() => import('./pages/public/ProgramDetail'));
const Donate = lazy(() => import('./pages/public/Donate'));
const PaymentSuccess = lazy(() => import('./pages/public/PaymentSuccess'));
const About = lazy(() => import('./pages/public/About'));
const Faq = lazy(() => import('./pages/public/Faq'));
const Events = lazy(() => import('./pages/public/Events'));

const LaporkanSekolah = lazy(() => import('./pages/public/LaporkanSekolah'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Leaderboard = lazy(() => import('./pages/public/Leaderboard'));

/* ── Admin Pages ── */
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCampaigns = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminDonors = lazy(() => import('./pages/admin/AdminDonors'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminSchoolReports = lazy(() => import('./pages/admin/AdminSchoolReports'));
const AdminContent = lazy(() => import('./pages/admin/AdminContent'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-16 text-center text-sm text-gray-500">
      Memuat halaman...
    </div>
  );
}

function renderWithSuspense(children: React.ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{children}</Suspense>;
}

/**
 * Komponen pembungkus (wrapper) untuk halaman-halaman publik.
 * Navbar publik bersifat fixed, jadi seluruh halaman publik memakai spacer
 * agar konten tidak tertutup header.
 */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
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
        <Route path="/" element={renderWithSuspense(<PublicLayout><Home /></PublicLayout>)} />
        <Route path="/campaigns" element={renderWithSuspense(<PublicLayout><Campaigns /></PublicLayout>)} />
        <Route path="/campaigns/:slug" element={renderWithSuspense(<PublicLayout><CampaignDetail /></PublicLayout>)} />
        <Route path="/programs/:slug" element={renderWithSuspense(<PublicLayout><ProgramDetail /></PublicLayout>)} />
        <Route path="/donate/:slug" element={renderWithSuspense(<PublicLayout><Donate /></PublicLayout>)} />
        <Route path="/payment/success" element={renderWithSuspense(<PublicLayout><PaymentSuccess /></PublicLayout>)} />
        <Route path="/tentang-kami" element={renderWithSuspense(<PublicLayout><About /></PublicLayout>)} />
        <Route path="/events" element={renderWithSuspense(<PublicLayout><Events /></PublicLayout>)} />
        <Route path="/faq" element={renderWithSuspense(<PublicLayout><Faq /></PublicLayout>)} />

        <Route path="/laporkan" element={renderWithSuspense(<PublicLayout><LaporkanSekolah /></PublicLayout>)} />
        <Route path="/kontak" element={renderWithSuspense(<PublicLayout><Contact /></PublicLayout>)} />
        <Route path="/leaderboard" element={renderWithSuspense(<PublicLayout><Leaderboard /></PublicLayout>)} />
        <Route path="/admin/login" element={renderWithSuspense(<GuestRoute><AdminLogin /></GuestRoute>)} />

        {/* Rute-rute Panel Admin */}
        <Route path="/admin" element={renderWithSuspense(<ProtectedRoute><AdminLayout /></ProtectedRoute>)}>
          <Route index element={renderWithSuspense(<AdminDashboard />)} />
          <Route path="campaigns" element={renderWithSuspense(<AdminCampaigns />)} />
          <Route path="donors" element={renderWithSuspense(<AdminDonors />)} />
          <Route path="transactions" element={renderWithSuspense(<AdminTransactions />)} />
          <Route path="school-reports" element={renderWithSuspense(<AdminSchoolReports />)} />
          <Route path="content" element={renderWithSuspense(<AdminContent />)} />
          <Route path="settings" element={renderWithSuspense(<AdminSettings />)} />
        </Route>

        {/* Rute Penanganan 404/Fallback */}
        <Route
          path="*"
          element={renderWithSuspense(
            <PublicLayout>
              <div className="py-24 text-center sm:py-32">Halaman tidak ditemukan.</div>
            </PublicLayout>,
          )}
        />
      </Routes>
    </Router>
  );
}
