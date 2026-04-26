import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logError, registerGlobalErrorLogging } from './lib/error-logger.ts';

registerGlobalErrorLogging();

if (import.meta.env.DEV) {
  import('react-grab').catch((error) => {
    logError('main.react-grab-import', error);
  });
}

// Inisialisasi titik masuk utama aplikasi React
createRoot(document.getElementById('root')!, {
  onCaughtError(error, errorInfo) {
    logError('react.caught-error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary?.constructor.name,
    });
  },
  onRecoverableError(error, errorInfo) {
    logError('react.recoverable-error', error, {
      componentStack: errorInfo.componentStack,
    });
  },
  onUncaughtError(error, errorInfo) {
    logError('react.uncaught-error', error, {
      componentStack: errorInfo.componentStack,
    });
  },
}).render(
  // StrictMode digunakan untuk mendeteksi masalah potensial dalam aplikasi selama fase pengembangan
  <StrictMode>
    <App />
  </StrictMode>,
);
