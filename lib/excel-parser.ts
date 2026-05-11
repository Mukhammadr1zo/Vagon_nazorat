// =====================================================
// EXCEL PARSER — moslashuvchan ustun aniqlash
// Har xil ustun nomlanishlari bilan ishlay oladi
// =====================================================

import * as XLSX from 'xlsx';
import type {
  Shipment,
  FileUpload,
  ParseResult,
  ColumnMapping,
  ShipmentField,
} from './types';

// =====================================================
// Ustun nomi sinonimlari (fuzzy match uchun)
// =====================================================
const COLUMN_SYNONYMS: Record<ShipmentField, string[]> = {
  wagonNumber: [
    'вагон номер', 'номер вагона', 'вагон', 'wagon', 'wagon number',
    'vagon nomeri', 'vagon raqami', 'vagon',
  ],
  invoiceNumber: [
    'накладной номер', 'накладная', 'накладной', 'invoice', 'invoice number',
    'nakladnoy', 'nakladnoy nomer', 'nakladnoy raqam',
  ],
  senderName: [
    'жўнатувчи номи', 'отправитель', 'жунатувчи', "jo'natuvchi", 'junatuvchi',
    'sender', 'sender name', 'gruzootpravitel',
  ],
  senderStation: [
    'жўнатувчи станция', 'станция отправления', 'жунатувчи станция',
    "jo'natuvchi stansiya", 'junatuvchi stansiya', 'sender station',
    'станция отпр', 'отправл станция',
  ],
  receiverName: [
    'юк қабул қилувчи номи', 'получатель', 'qabul qiluvchi', 'юк қабул',
    'yuk qabul qiluvchi', 'receiver', 'consignee', 'gruzopoluchatel',
  ],
  destStation: [
    'манзил станция', 'станция назначения', 'manzil stansiya',
    'destination', 'dest station', 'станция назнач', 'назнач станция',
  ],
  cargo: [
    'юк номи', 'наименование груза', 'yuk nomi', 'груз', 'cargo',
    'cargo name', 'gruz', 'наим груза', 'yuk turi',
  ],
  acceptanceAt: [
    'ташишга қабул қилинган', 'дата приёма', 'дата приема',
    'tashishga qabul', 'qabul qilingan sana', 'acceptance', 'accepted',
    'дата прием', 'прием сана',
  ],
  departureAt: [
    'стикдан чиқиб кетган', 'станциядан чиқиб кетган', 'дата отправления',
    'stikdan chiqib ketgan', 'станциядан чиқиб', 'departure', 'depart',
    'отправление сана', 'отправл',
  ],
  distanceKm: [
    'масофа', 'расстояние', 'masofa', 'distance', 'км', 'km',
  ],
};

// =====================================================
// Yordamchi funksiyalar
// =====================================================

function normalize(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s\-_().,:;]+/g, ' ')
    .replace(/[«»"']+/g, '')
    .trim();
}

function matchField(headerCell: string): ShipmentField | null {
  const n = normalize(headerCell);
  if (!n) return null;

  for (const [field, syns] of Object.entries(COLUMN_SYNONYMS) as [ShipmentField, string[]][]) {
    for (const syn of syns) {
      if (n.includes(syn)) return field;
    }
  }
  return null;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Excel header qatorini topish — eng ko'p match topgan qator
 */
function findHeaderRow(rows: unknown[][]): { rowIndex: number; mapping: ColumnMapping } {
  let bestIndex = 0;
  let bestMapping: ColumnMapping = {};
  let bestCount = 0;

  const limit = Math.min(rows.length, 15);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row) continue;
    const mapping: ColumnMapping = {};
    for (let c = 0; c < row.length; c++) {
      const field = matchField(String(row[c] ?? ''));
      if (field && mapping[field] === undefined) {
        mapping[field] = c;
      }
    }
    const count = Object.keys(mapping).length;
    if (count > bestCount) {
      bestCount = count;
      bestIndex = i;
      bestMapping = mapping;
    }
  }

  return { rowIndex: bestIndex, mapping: bestMapping };
}

/**
 * Sana/vaqtni timestamp ga aylantirish.
 * Toshkent vaqt zonasi (UTC+5) deb hisoblanadi —
 * Excel-dagi mahalliy vaqt to'g'ridan-to'g'ri saqlanadi.
 */
function parseDateTime(value: unknown): number {
  if (value == null || value === '') return 0;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    // Excel serial number
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return Date.UTC(
        date.y,
        (date.m || 1) - 1,
        date.d || 1,
        date.H || 0,
        date.M || 0,
        Math.floor(date.S || 0),
      );
    }
    return 0;
  }

  if (typeof value === 'string') {
    const s = value.trim();
    // M/D/YYYY HH:mm yoki D.M.YYYY HH:mm
    const slash = s.match(/^(\d{1,2})[/\.](\d{1,2})[/\.](\d{4})\s*(\d{1,2}):(\d{2})?(?::(\d{2}))?/);
    if (slash) {
      const [, a, b, y, h, m, sec] = slash;
      // M/D/YYYY (USA) yoki D.M.YYYY (Yevropa) ni ajratish:
      // Excel "1/2/2026 15:39" — bu odatda 2-yanvar (M/D), agar dot bo'lsa D.M
      const useEU = s.includes('.');
      const day = parseInt(useEU ? a : b, 10);
      const month = parseInt(useEU ? b : a, 10) - 1;
      const year = parseInt(y, 10);
      return Date.UTC(year, month, day, parseInt(h, 10), parseInt(m || '0', 10), parseInt(sec || '0', 10));
    }
    // ISO format
    const iso = Date.parse(s);
    if (!isNaN(iso)) return iso;
    return 0;
  }

  return 0;
}

function parseNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^\d.,-]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * "735109 - Термиз" → { code: "735109", name: "Термиз" }
 * "Термиз" → { code: "", name: "Термиз" }
 */
function parseCodeName(value: unknown): { code: string; name: string } {
  const s = String(value ?? '').trim();
  if (!s) return { code: '', name: '' };

  const m = s.match(/^(\d{3,8})\s*[-–—]\s*(.+)$/);
  if (m) return { code: m[1].trim(), name: m[2].trim() };

  const m2 = s.match(/^(\d{3,8})\s+(.+)$/);
  if (m2) return { code: m2[1].trim(), name: m2[2].trim() };

  return { code: '', name: s };
}

// =====================================================
// Asosiy parser
// =====================================================

export function parseExcelFile(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number,
  manualMapping?: ColumnMapping,
): ParseResult {
  const fileId = generateId();
  const errors: string[] = [];
  const warnings: string[] = [];

  let allShipments: Shipment[] = [];
  let allDetectedColumns: string[] = [];
  let firstMapping: ColumnMapping = {};
  let firstHeaderIndex = 0;
  let firstRawRows: unknown[][] = [];

  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    if (wb.SheetNames.length === 0) {
      throw new Error("Excel fayl bo'sh");
    }

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
      if (rows.length === 0) continue;

      const detected = manualMapping
        ? { rowIndex: 0, mapping: manualMapping }
        : findHeaderRow(rows);

      const headerRow = rows[detected.rowIndex] || [];
      if (allDetectedColumns.length === 0) {
        allDetectedColumns = headerRow.map((c) => String(c ?? ''));
        firstMapping = detected.mapping;
        firstHeaderIndex = detected.rowIndex;
        firstRawRows = rows;
      }

      const mapping = detected.mapping;
      const requiredFields: ShipmentField[] = ['wagonNumber'];
      const hasRequired = requiredFields.every((f) => mapping[f] !== undefined);
      if (!hasRequired) {
        warnings.push(`"${sheetName}" varag'i — kerakli ustunlar topilmadi`);
        continue;
      }

      const sheetShipments = buildShipments(rows, detected.rowIndex, mapping, fileId);
      allShipments = [...allShipments, ...sheetShipments];
    }
  } catch (err) {
    errors.push(`Faylni o'qishda xatolik: ${err instanceof Error ? err.message : err}`);
  }

  const needsManualMapping =
    allShipments.length === 0 &&
    errors.length === 0 &&
    !manualMapping;

  const fileUpload: FileUpload = {
    id: fileId,
    fileName,
    fileSize,
    uploadedAt: Date.now(),
    rowCount: allShipments.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };

  return {
    success: allShipments.length > 0,
    shipments: allShipments,
    fileUpload,
    mapping: firstMapping,
    detectedColumns: allDetectedColumns,
    needsManualMapping,
    rawRows: needsManualMapping ? firstRawRows : undefined,
    headerRowIndex: needsManualMapping ? firstHeaderIndex : undefined,
  };
}

function buildShipments(
  rows: unknown[][],
  headerIndex: number,
  mapping: ColumnMapping,
  fileId: string,
): Shipment[] {
  const shipments: Shipment[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const get = (f: ShipmentField): unknown => {
      const idx = mapping[f];
      return idx !== undefined ? row[idx] : '';
    };

    const wagon = String(get('wagonNumber') ?? '').trim();
    if (!wagon || wagon.toLowerCase() === 'вагон номер') continue;
    // Faqat raqam bo'lmagan qatorlarni o'tkazib yuborish
    if (!/\d/.test(wagon)) continue;

    const sender = parseCodeName(get('senderStation'));
    const dest = parseCodeName(get('destStation'));
    const cargo = parseCodeName(get('cargo'));

    const acceptanceAt = parseDateTime(get('acceptanceAt'));
    const departureAt = parseDateTime(get('departureAt'));
    const waitMs = departureAt - acceptanceAt;
    const waitMinutes = acceptanceAt && departureAt ? Math.round(waitMs / 60000) : 0;

    shipments.push({
      id: generateId(),
      fileId,
      rowIndex: i + 1,
      wagonNumber: wagon,
      invoiceNumber: String(get('invoiceNumber') ?? '').trim(),
      senderName: String(get('senderName') ?? '').trim(),
      senderStationCode: sender.code,
      senderStationName: sender.name,
      receiverName: String(get('receiverName') ?? '').trim(),
      destStationCode: dest.code,
      destStationName: dest.name,
      cargoCode: cargo.code,
      cargoName: cargo.name,
      acceptanceAt,
      departureAt,
      distanceKm: parseNumber(get('distanceKm')),
      waitMinutes,
    });
  }

  return shipments;
}

/**
 * Qo'lda mapping qilish uchun — Excel headerlar ro'yxati va field tanlovi.
 */
export function getEmptyMapping(): ColumnMapping {
  return {};
}

export const FIELD_LABELS: Record<ShipmentField, string> = {
  wagonNumber: 'Вагон номер',
  invoiceNumber: 'Накладной номер',
  senderName: 'Жўнатувчи номи',
  senderStation: 'Жўнатувчи станция',
  receiverName: 'Юк қабул қилувчи',
  destStation: 'Манзил станция',
  cargo: 'Юк номи',
  acceptanceAt: 'Қабул қилинган сана',
  departureAt: 'Чиқиб кетган сана',
  distanceKm: 'Масофа (км)',
};
