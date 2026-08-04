import { safeNormalizeUrl } from '../sanitize';

function normalizeExportValue(value: unknown) {
  if (value == null) return '';

  let raw: string;
  if (Array.isArray(value)) {
    raw = value.map((item) => normalizeExportValue(item)).filter(Boolean).join(', ');
  } else if (typeof value === 'object') {
    raw = JSON.stringify(value);
  } else {
    raw = String(value);
  }

  return raw !== '-' && /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
}

function escapeCsvCell(value: unknown) {
  const raw = normalizeExportValue(value);
  if (!/[",\n]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ];

  const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function createSafeSheetName(sheetName: string) {
  const cleaned = sheetName.replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || 'Sheet 1').slice(0, 31);
}

function isHttpUrl(value: string) {
  return /^https:\/\//i.test(value) && Boolean(safeNormalizeUrl(value, ''));
}

export interface XlsxExportOptions {
  title?: string;
  subtitle?: string;
  filterInfo?: string;
  columnLabels?: Record<string, string>;
}

export async function downloadXlsx(
  filename: string,
  sheetName: string,
  rows: Array<Record<string, unknown>>,
  options?: XlsxExportOptions,
) {
  if (rows.length === 0) return;

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sekolah Tanah Air';
  workbook.lastModifiedBy = 'STA Admin Platform';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(createSafeSheetName(sheetName), {
    views: [{ showGridLines: true }],
  });

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const displayHeaders = headers.map((header) => options?.columnLabels?.[header] ?? header);
  const numCols = headers.length;

  const hasTitle = Boolean(options?.title);
  let currentRowIndex = 1;

  if (hasTitle) {
    // Row 1: Main Title Banner
    const r1 = worksheet.getRow(1);
    r1.height = 32;
    const c1 = r1.getCell(1);
    c1.value = 'SEKOLAH TANAH AIR';
    c1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(1, 1, 1, numCols);

    // Fill merged cells styling for R1
    for (let c = 2; c <= numCols; c++) {
      const cell = r1.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    }

    // Row 2: Subtitle / Report Name
    const r2 = worksheet.getRow(2);
    r2.height = 26;
    const c2 = r2.getCell(1);
    c2.value = options!.title!.toUpperCase();
    c2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(2, 1, 2, numCols);

    for (let c = 2; c <= numCols; c++) {
      const cell = r2.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    }

    // Row 3: Metadata Row
    const nowFormatted = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const filterText = options?.filterInfo ? ` | Filter: ${options.filterInfo}` : '';
    const metaStr = `Tanggal Unduh: ${nowFormatted} | Total Data: ${rows.length} Record${filterText}`;

    const r3 = worksheet.getRow(3);
    r3.height = 22;
    const c3 = r3.getCell(1);
    c3.value = metaStr;
    c3.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(3, 1, 3, numCols);

    for (let c = 2; c <= numCols; c++) {
      const cell = r3.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    }

    // Row 4: Spacer Row
    const r4 = worksheet.getRow(4);
    r4.height = 10;

    currentRowIndex = 5;
  }

  // Header Row
  const headerRowNumber = currentRowIndex;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.height = 28;

  displayHeaders.forEach((label, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = label;
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF047857' } },
      bottom: { style: 'medium', color: { argb: 'FF047857' } },
      left: { style: 'thin', color: { argb: 'FF047857' } },
      right: { style: 'thin', color: { argb: 'FF047857' } },
    };
  });

  // Enable AutoFilter on header row
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: numCols },
  };

  const colMaxCharLen: number[] = displayHeaders.map((h) => String(h).length);

  // Populate Data Rows
  const startDataRow = headerRowNumber + 1;

  rows.forEach((row, rowIdx) => {
    const rNum = startDataRow + rowIdx;
    const dataRow = worksheet.getRow(rNum);
    dataRow.height = 22;
    const isEven = rowIdx % 2 === 1;
    const bgArgb = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    headers.forEach((headerKey, colIdx) => {
      const colNum = colIdx + 1;
      const cell = dataRow.getCell(colNum);
      const rawVal = row[headerKey];

      // Base formatting for data cells
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (rawVal == null) {
        cell.value = '';
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        return;
      }

      // Check number format (amount, total, count)
      const isNumberField = typeof rawVal === 'number' || (typeof rawVal === 'string' && !isNaN(Number(rawVal)) && rawVal.trim() !== '' && /^\d+$/.test(rawVal.trim()));

      if (isNumberField) {
        const numVal = Number(rawVal);
        cell.value = numVal;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };

        const isCurrency = /amount|donated|total/i.test(headerKey) || /nominal|total/i.test(displayHeaders[colIdx]);
        if (isCurrency) {
          cell.numFmt = '"Rp" #,##0';
        } else {
          cell.numFmt = '#,##0';
        }

        const lenStr = `Rp ${numVal.toLocaleString('id-ID')}`;
        if (lenStr.length > colMaxCharLen[colIdx]) {
          colMaxCharLen[colIdx] = lenStr.length;
        }
        return;
      }

      // Check URL format
      const strVal = String(rawVal);
      if (isHttpUrl(strVal)) {
        cell.value = { text: strVal, hyperlink: strVal };
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0284C7' }, underline: true };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };

        if (strVal.length > colMaxCharLen[colIdx]) {
          colMaxCharLen[colIdx] = strVal.length;
        }
        return;
      }

      // Check Boolean
      if (typeof rawVal === 'boolean') {
        const boolText = rawVal ? 'Ya' : 'Tidak';
        cell.value = boolText;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        return;
      }

      // Standard String / Object
      const normalized = normalizeExportValue(rawVal);
      cell.value = normalized;
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };

      if (normalized.length > colMaxCharLen[colIdx]) {
        colMaxCharLen[colIdx] = normalized.length;
      }
    });
  });

  // Apply Auto Width
  colMaxCharLen.forEach((maxLen, colIdx) => {
    const col = worksheet.getColumn(colIdx + 1);
    col.width = Math.min(Math.max(maxLen + 4, 14), 65);
  });

  // Generate buffer & trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
