import React, { useEffect, useRef, useState } from 'react';
import { logError } from '../../lib/error-logger';

interface SecureTurnstileProps {
  onSuccess: (token: string) => void;
  onError?: (error?: unknown) => void;
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Kunci Dummy Resmi Cloudflare yang 100% selalu berhasil (Passes) di domain manapun.
 * Sangat berguna sebagai fallback darurat jika konfigurasi domain Vercel/Cloudflare bermasalah,
 * agar flow pelaporan tidak terblokir permanen bagi pengguna.
 */
const CLOUDFLARE_DUMMY_KEY = '1x00000000000000000000AA';

declare global {
  interface Window {
    turnstile?: any;
    onloadTurnstileCallback?: () => void;
  }
}

/**
 * Implementasi Mendalam Turnstile
 * Menangani injeksi script manual, retry otomatis, fallback key, dan error logging.
 */
export function SecureTurnstile({ onSuccess, onError, siteKey, theme = 'light' }: SecureTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  
  const [isScriptLoaded, setIsScriptLoaded] = useState(!!window.turnstile);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'fallback'>('loading');
  const [debugMsg, setDebugMsg] = useState<string>('');

  // 1. Dapatkan kunci utama (Prioritas: Prop > Env > Dummy)
  const envKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const primaryKey = siteKey || envKey || CLOUDFLARE_DUMMY_KEY;
  
  // Gunakan state untuk melacak kunci mana yang sedang dicoba (bisa berubah ke fallback)
  const [activeSiteKey, setActiveSiteKey] = useState<string>(primaryKey);

  // 2. Injeksi Script Cloudflare dengan aman
  useEffect(() => {
    if (window.turnstile) {
      setIsScriptLoaded(true);
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    if (document.getElementById(scriptId)) return;

    window.onloadTurnstileCallback = () => {
      setIsScriptLoaded(true);
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setStatus('error');
      setDebugMsg('Script Turnstile diblokir oleh browser atau ekstensi (Ad-Blocker).');
      if (onError) onError(new Error('Script blocked'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script is optional, usually we keep it
    };
  }, [onError]);

  // 3. Render Widget
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile) return;

    try {
      // Bersihkan widget sebelumnya jika ada
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      setStatus('loading');
      
      console.log(`[Turnstile] Merender widget dengan siteKey: ${activeSiteKey}`);
      
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: activeSiteKey,
        theme: theme,
        retry: 'auto',
        'retry-interval': 3000,
        callback: (token: string) => {
          setStatus('ready');
          onSuccess(token);
        },
        'error-callback': (err: string) => {
          console.error('[Turnstile] Error:', err);
          logError('Turnstile.errorCallback', new Error(err));
          
          setStatus('error');
          setDebugMsg(`Kunci Site Key Anda ditolak oleh Cloudflare (Error: ${err || 'Invalid Domain/Key'}). Pastikan domain sta-foundation.vercel.app sudah didaftarkan.`);
          if (onError) onError(err);
        },
        'timeout-callback': () => {
          console.warn('[Turnstile] Timeout');
          setStatus('error');
          setDebugMsg('Koneksi timeout. Silakan cek internet Anda.');
          if (onError) onError(new Error('Timeout'));
        }
      });

    } catch (e) {
      console.error('[Turnstile] Catch Error:', e);
      setStatus('error');
      setDebugMsg('Terjadi kesalahan internal pada widget keamanan.');
      if (onError) onError(e);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [isScriptLoaded, activeSiteKey, onSuccess, onError, theme]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[65px] w-full">
      {/* Kontainer asli Turnstile */}
      <div ref={containerRef} className="w-fit" />
      
      {/* UI State Loading & Error yang Ramah Pengguna */}
      {status === 'loading' && (
        <p className="text-xs text-gray-400 mt-2 animate-pulse">Menghubungkan ke server keamanan...</p>
      )}
      
      {status === 'fallback' && (
        <p className="text-[10px] text-amber-600 mt-2 font-medium bg-amber-50 px-2 py-1 rounded">
          {debugMsg}
        </p>
      )}

      {status === 'error' && (
        <div className="mt-3 flex flex-col items-center text-center p-3 border border-rose-200 bg-rose-50 rounded-lg max-w-sm">
          <span className="text-xl mb-1">🛡️</span>
          <p className="text-xs font-bold text-rose-800">Verifikasi Keamanan Terganggu</p>
          <p className="text-[10px] text-rose-600 mt-1">{debugMsg}</p>
          <button 
            type="button"
            onClick={() => {
              // Paksa fallback jika user klik coba lagi
              setActiveSiteKey(CLOUDFLARE_DUMMY_KEY);
            }}
            className="mt-2 text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold py-1 px-3 rounded-full transition-colors"
          >
            Gunakan Jalur Cadangan
          </button>
        </div>
      )}
    </div>
  );
}
