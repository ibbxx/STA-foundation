import React, { useEffect, useRef, useState } from 'react';
import { logError } from '../../lib/error-logger';

interface SecureTurnstileProps {
  onSuccess: (token: string) => void;
  onError?: (error?: unknown) => void;
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Kunci utama dari Dashboard Cloudflare Turnstile.
 * Digunakan untuk widget captcha pada form pelaporan.
 */
const USER_SITE_KEY = '0x4AAAAAADDxv-_d95-X9IVJ';

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
  // 1. Dapatkan kunci utama (Prioritas: User Key > Env > Prop > Dummy)
  // Kita utamakan USER_SITE_KEY yang sudah pasti benar dari Cloudflare Dashboard Anda
  const envKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const primaryKey = USER_SITE_KEY || siteKey || envKey;
  
  // Gunakan state untuk melacak kunci mana yang sedang dicoba
  const [activeSiteKey, setActiveSiteKey] = useState<string>(primaryKey);
  const [hostname, setHostname] = useState<string>('');

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

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

  // Gunakan ref untuk callback agar tidak memicu re-render widget jika fungsi berubah
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // 3. Render Widget
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile) return;

    try {
      // JANGAN hapus widget jika siteKey tidak berubah untuk mencegah looping
      if (widgetIdRef.current) return;

      setStatus('loading');
      
      console.log(`[Turnstile] Merender widget dengan siteKey: ${activeSiteKey}`);
      
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: activeSiteKey,
        theme: theme,
        retry: 'auto',
        'retry-interval': 3000,
        callback: (token: string) => {
          setStatus('ready');
          onSuccessRef.current(token);
        },
        'error-callback': (err: string) => {
          console.error('[Turnstile] Error:', err);
          logError('Turnstile.errorCallback', new Error(err));
          
          setStatus('error');
          setDebugMsg(`Cloudflare menolak akses di domain: ${window.location.hostname}. Pastikan domain ini sudah terdaftar di dashboard Cloudflare Anda.`);
          if (onErrorRef.current) onErrorRef.current(err);
        },
        'timeout-callback': () => {
          console.warn('[Turnstile] Timeout');
          setStatus('error');
          setDebugMsg('Koneksi timeout. Silakan cek internet Anda.');
          if (onErrorRef.current) onErrorRef.current(new Error('Timeout'));
        }
      });

    } catch (e) {
      console.error('[Turnstile] Catch Error:', e);
      setStatus('error');
      setDebugMsg('Terjadi kesalahan internal pada widget keamanan.');
      if (onErrorRef.current) onErrorRef.current(e);
    }

    return () => {
      // Hanya cleanup saat benar-benar unmount atau siteKey berubah
    };
  }, [isScriptLoaded, activeSiteKey, theme]); // Hapus onSuccess dan onError dari dependency

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
          <p className="text-[10px] text-gray-500 mt-2">Coba muat ulang halaman atau nonaktifkan Ad-Blocker Anda.</p>
        </div>
      )}

    </div>
  );
}
