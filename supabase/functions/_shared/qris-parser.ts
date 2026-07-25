// @ts-nocheck
// ============================================================
// QRIS EMV TLV Parser — Shared utility untuk Edge Functions
// ============================================================

/**
 * Parsed TLV entry: tag, length, dan value.
 * Menjaga urutan asli tag agar rebuild string QRIS menghasilkan
 * output yang sesuai standar.
 */
export interface QrisTlvEntry {
  tag: string;
  value: string;
}

/**
 * Parse string QRIS EMV TLV menjadi array of TLV entries.
 * Mempertahankan urutan tag sesuai string asli.
 */
export function parseQrisTlv(qrisString: string): QrisTlvEntry[] {
  const entries: QrisTlvEntry[] = [];
  let index = 0;

  // Jangan parse 4 karakter terakhir (tag 63 CRC value)
  // tetapi kita parsing secara normal karena CRC termasuk sebagai tag tersendiri
  while (index + 4 <= qrisString.length) {
    const tag = qrisString.substring(index, index + 2);
    const lengthStr = qrisString.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || length < 0) break;
    if (index + 4 + length > qrisString.length) break;

    const value = qrisString.substring(index + 4, index + 4 + length);
    entries.push({ tag, value });
    index += 4 + length;
  }

  return entries;
}

/**
 * Build string QRIS dinamis dari array TLV entries.
 *
 * Langkah:
 * 1. Ubah tag 01 (Point of Initiation) dari "11" (statis) ke "12" (dinamis).
 * 2. Sisipkan/ganti tag 54 (Transaction Amount) dengan finalAmount.
 * 3. Hapus tag 63 (CRC) lama.
 * 4. Rebuild string.
 * 5. Append placeholder CRC "6304".
 * 6. Hitung CRC-16/CCITT-FALSE.
 * 7. Append 4-char hex CRC.
 */
export function buildDynamicQris(entries: QrisTlvEntry[], finalAmount: number): string {
  // Clone agar tidak mutate input
  const modified: QrisTlvEntry[] = entries.map((e) => ({ ...e }));

  // 1. Ubah Point of Initiation ke dinamis
  const poiEntry = modified.find((e) => e.tag === '01');
  if (poiEntry) {
    poiEntry.value = '12';
  }

  // 2. Sisipkan/ganti Transaction Amount (tag 54)
  const amountStr = finalAmount.toString();
  const existingAmount = modified.findIndex((e) => e.tag === '54');
  if (existingAmount >= 0) {
    modified[existingAmount].value = amountStr;
  } else {
    // Sisipkan setelah tag 53 (Transaction Currency) jika ada, atau sebelum tag 58
    const insertAfter = modified.findIndex((e) => e.tag === '53');
    if (insertAfter >= 0) {
      modified.splice(insertAfter + 1, 0, { tag: '54', value: amountStr });
    } else {
      // Fallback: sisipkan sebelum tag 58 (Country Code)
      const beforeCountry = modified.findIndex((e) => e.tag === '58');
      if (beforeCountry >= 0) {
        modified.splice(beforeCountry, 0, { tag: '54', value: amountStr });
      } else {
        // Last resort: append sebelum CRC
        modified.push({ tag: '54', value: amountStr });
      }
    }
  }

  // 3. Hapus tag 63 (CRC) jika ada
  const crcIndex = modified.findIndex((e) => e.tag === '63');
  if (crcIndex >= 0) {
    modified.splice(crcIndex, 1);
  }

  // 4. Rebuild string
  let result = '';
  for (const entry of modified) {
    const len = entry.value.length.toString().padStart(2, '0');
    result += entry.tag + len + entry.value;
  }

  // 5. Append placeholder CRC
  result += '6304';

  // 6. Hitung CRC
  const crc = crc16CcittFalse(result);

  // 7. Append CRC
  result += crc;

  return result;
}

/**
 * CRC-16/CCITT-FALSE checksum.
 *
 * Spesifikasi:
 * - Polynomial: 0x1021
 * - Initial Value: 0xFFFF
 * - Final XOR: 0x0000
 * - Input Reflected: No
 * - Output Reflected: No
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
 * Validasi dasar raw QRIS string.
 * Memeriksa panjang minimal, prefix, dan CRC.
 */
export function validateQrisRawString(str: string): { valid: boolean; error?: string } {
  if (!str || str.length < 20) {
    return { valid: false, error: 'String QRIS terlalu pendek.' };
  }
  if (!str.startsWith('0002')) {
    return { valid: false, error: 'String QRIS harus diawali dengan "0002".' };
  }
  // Validasi CRC di 4 karakter terakhir
  const payload = str.slice(0, -4);
  const expectedCrc = str.slice(-4);
  const calculatedCrc = crc16CcittFalse(payload);
  if (calculatedCrc !== expectedCrc.toUpperCase()) {
    return { valid: false, error: 'CRC tidak valid. Pastikan string QRIS lengkap dan benar.' };
  }
  return { valid: true };
}
