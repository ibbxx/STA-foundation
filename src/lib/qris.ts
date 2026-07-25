// ============================================================
// QRIS Frontend Utilities
// Rendering QR code, formatting, dan countdown timer.
// ============================================================

/** Response dari edge function generate-qris-dynamic */
export interface QrisDynamicData {
  donation_id: string;
  qris_string: string;
  final_amount: number;
  unique_code: number;
  expires_at: string;
}

/**
 * Render QRIS string menjadi QR code data URL (PNG base64).
 * Menggunakan library 'qrcode' yang ditambahkan ke dependencies.
 */
export async function generateQrisDataUrl(qrisString: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(qrisString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Download gambar QR Code dari data URL sebagai file PNG.
 */
export function downloadQrisImage(dataUrl: string, filename = 'QRIS-Donasi-SekolahTanahAir.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format nominal unik untuk ditampilkan ke donatur.
 * Contoh: formatUniqueAmount(50000, 12, formatCurrency) → "Rp 50.000 + Rp 12 = Rp 50.012"
 */
export function formatUniqueAmount(
  amount: number,
  uniqueCode: number,
  formatter: (n: number) => string,
): string {
  return `${formatter(amount)} + ${formatter(uniqueCode)} = ${formatter(amount + uniqueCode)}`;
}

/**
 * Hitung sisa waktu dalam detik dari sekarang ke expires_at.
 */
export function getRemainingSeconds(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Format detik menjadi MM:SS.
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * CRC-16/CCITT-FALSE checksum (frontend version).
 * Digunakan untuk validasi QRIS raw string di admin panel.
 */
export function crc16CcittFalse(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Validasi dasar raw QRIS string (untuk admin panel).
 */
export function validateQrisRawString(str: string): { valid: boolean; error?: string } {
  if (!str || str.length < 20) {
    return { valid: false, error: 'String QRIS terlalu pendek.' };
  }
  if (!str.startsWith('0002')) {
    return { valid: false, error: 'String QRIS harus diawali dengan "0002".' };
  }
  const payload = str.slice(0, -4);
  const expectedCrc = str.slice(-4);
  const calculatedCrc = crc16CcittFalse(payload);
  if (calculatedCrc !== expectedCrc.toUpperCase()) {
    return { valid: false, error: 'CRC tidak valid. Pastikan string QRIS lengkap dan benar.' };
  }
  return { valid: true };
}
