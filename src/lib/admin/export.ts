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
  return /^https?:\/\//i.test(value);
}

export async function downloadXlsx(
  filename: string,
  sheetName: string,
  rows: Array<Record<string, unknown>>,
) {
  if (rows.length === 0) return;

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const normalizedRows = rows.map((row) => (
    headers.reduce<Record<string, string>>((acc, header) => {
      acc[header] = normalizeExportValue(row[header]);
      return acc;
    }, {})
  ));

  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(normalizedRows, { header: headers });

  normalizedRows.forEach((row, rowIndex) => {
    headers.forEach((header, columnIndex) => {
      const value = row[header];
      if (!isHttpUrl(value)) return;

      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex });
      const cell = worksheet[cellAddress];
      if (cell) {
        cell.l = { Target: value, Tooltip: value };
      }
    });
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, createSafeSheetName(sheetName));
  XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
}
