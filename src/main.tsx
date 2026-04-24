import { StrictMode } from 'react';
if (import.meta.env.DEV) {
  import("react-grab");
}
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Inisialisasi titik masuk utama aplikasi React
createRoot(document.getElementById('root')!).render(
  // StrictMode digunakan untuk mendeteksi masalah potensial dalam aplikasi selama fase pengembangan
  <StrictMode>
    <App />
  </StrictMode>,
);
