// =====================================================
// PLAN PARSER — Reja Jadvali / Asosiy Reja xlsx fayllari
// Ustun siljishi va sana formatlarini avtomatik tozalaydi
// =====================================================

import * as XLSX from 'xlsx';
import type {
  PlanRecord,
  PlanParseResult,
  PlanSheetKind,
  PlanStatus,
} from './plan-types';

// =====================================================
// Sheet aniqlash
// =====================================================
const SHEET_NAME_MAP: Record<string, PlanSheetKind> = {
  'режа жадвали': 'reja-jadvali',
  'reja jadvali': 'reja-jadvali',
  'asosiy reja': 'asosiy-reja',
  'асосий режа': 'asosiy-reja',
  'основной план': 'asosiy-reja',
};

function detectSheetKind(name: string): PlanSheetKind | null {
  const normalized = name.toLowerCase().trim();
  for (const [key, kind] of Object.entries(SHEET_NAME_MAP)) {
    if (normalized.includes(key)) return kind;
  }
  return null;
}

// =====================================================
// Yordamchi funksiyalar
// =====================================================

function generateId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s;
}

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;

  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }

  if (typeof v === 'number') {
    // Excel serial date
    if (v > 25569 && v < 100000) {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    // 1970-yilgi sanalarni epoch hisoblab tashlash
    if (d.getFullYear() < 2000) return null;
    return d;
  }

  return null;
}

function splitCodeName(raw: string | null): { code: string; name: string } {
  if (!raw) return { code: '', name: '' };
  const idx = raw.indexOf('-');
  if (idx === -1) return { code: '', name: raw };
  return {
    code: raw.slice(0, idx).trim(),
    name: raw.slice(idx + 1).trim(),
  };
}

function daysBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return null;
  return Math.round((ms / (1000 * 60 * 60 * 24)) * 10) / 10;
}

// =====================================================
// Ustun siljishini aniqlash
// Agar "Талаб этилган вагон сони" (M, index 12) raqam emas bo'lsa
// yoki "Бекор қилиш сабаби гуруҳи" (H, index 7) raqam bo'lsa
// =====================================================
function hasColumnShift(row: unknown[]): boolean {
  const requestedRaw = row[12];
  const reasonGroup = row[7];

  if (requestedRaw !== null && requestedRaw !== undefined && requestedRaw !== '') {
    const asNum = typeof requestedRaw === 'number' ? requestedRaw : Number(requestedRaw);
    if (isNaN(asNum)) return true;
    if (typeof requestedRaw === 'string' && /\d{4}-\d{2}-\d{2}/.test(requestedRaw)) return true;
  }

  if (typeof reasonGroup === 'number') return true;

  return false;
}

// =====================================================
// Status hisoblash
// =====================================================
function computeStatus(
  requested: number,
  supplied: number,
  remaining: number,
  canceledAt: Date | null,
): PlanStatus {
  if (canceledAt) return 'canceled';
  if (supplied > 0 && remaining === 0) return 'fulfilled';
  if (supplied > 0 && remaining > 0) return 'partial';
  return 'pending';
}

// =====================================================
// Bir qatorni record ga aylantirish
// =====================================================
function parseRow(
  row: unknown[],
  sheetKind: PlanSheetKind,
  rowIndex: number,
): PlanRecord | null {
  // Bo'sh qator
  if (!row || row.length === 0) return null;
  if (!row[1] || !row[2]) return null;

  const hasIssue = hasColumnShift(row);

  // Ustun siljigan qatorlarni o'tkazib yuboramiz lekin sanab boramiz
  if (hasIssue) {
    return {
      id: generateId(sheetKind, rowIndex),
      rowNo: rowIndex,
      sheetKind,
      stationCode: '',
      stationName: String(row[1] ?? ''),
      stationRaw: String(row[1] ?? ''),
      destStationCode: null,
      destStationName: null,
      destStationRaw: null,
      cargoCode: '',
      cargoName: String(row[2] ?? ''),
      cargoRaw: String(row[2] ?? ''),
      requestEnteredAt: null,
      approvedAt: null,
      approvedBy: null,
      canceledAt: null,
      cancelReasonGroup: null,
      cancelReasonDetail: null,
      canceledBy: null,
      gu12Number: null,
      wagonType: '',
      requestedCount: 0,
      suppliedCount: 0,
      remainingCount: 0,
      cargoDocNumber: null,
      cargoDocFormalizedAt: null,
      dispatchedAt: null,
      arrivedAt: null,
      unloadedAt: null,
      status: 'pending',
      hasDataQualityIssue: true,
      approvalLatencyDays: null,
      deliveryLatencyDays: null,
    };
  }

  const stationRaw = toStr(row[1]) ?? '';
  const cargoRaw = toStr(row[2]) ?? '';
  const destRaw = toStr(row[13]);

  const station = splitCodeName(stationRaw);
  const cargo = splitCodeName(cargoRaw);
  const dest = destRaw ? splitCodeName(destRaw) : null;

  const requestEnteredAt = toDate(row[3]);
  const approvedAt = toDate(row[4]);
  const canceledAt = toDate(row[6]);
  const cargoDocFormalizedAt = toDate(row[17]);
  const dispatchedAt = toDate(row[18]);
  const arrivedAt = toDate(row[19]);
  const unloadedAt = row.length > 20 ? toDate(row[20]) : null;

  const requested = toNum(row[12]);
  const supplied = toNum(row[14]);
  const remaining = toNum(row[15]);

  const status = computeStatus(requested, supplied, remaining, canceledAt);

  return {
    id: generateId(sheetKind, rowIndex),
    rowNo: rowIndex,
    sheetKind,
    stationCode: station.code,
    stationName: station.name,
    stationRaw,
    destStationCode: dest?.code ?? null,
    destStationName: dest?.name ?? null,
    destStationRaw: destRaw,
    cargoCode: cargo.code,
    cargoName: cargo.name,
    cargoRaw,
    requestEnteredAt,
    approvedAt,
    approvedBy: toStr(row[5]),
    canceledAt,
    cancelReasonGroup: toStr(row[7]),
    cancelReasonDetail: toStr(row[8]),
    canceledBy: toStr(row[9]),
    gu12Number: toStr(row[10]),
    wagonType: toStr(row[11]) ?? '',
    requestedCount: requested,
    suppliedCount: supplied,
    remainingCount: remaining,
    cargoDocNumber: toStr(row[16]),
    cargoDocFormalizedAt,
    dispatchedAt,
    arrivedAt,
    unloadedAt,
    status,
    hasDataQualityIssue: false,
    approvalLatencyDays: daysBetween(requestEnteredAt, approvedAt),
    deliveryLatencyDays: daysBetween(dispatchedAt, arrivedAt),
  };
}

// =====================================================
// Asosiy parser funksiyasi
// =====================================================
export async function parsePlanFile(
  file: File,
  onProgress?: (phase: string, percent: number) => void,
): Promise<PlanParseResult> {
  const startedAt = Date.now();

  onProgress?.('Fayl o\'qilmoqda', 5);
  const buffer = await file.arrayBuffer();

  onProgress?.('Excel parse qilinmoqda', 15);
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const records: PlanRecord[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const sheetCounts: Record<PlanSheetKind, number> = {
    'reja-jadvali': 0,
    'asosiy-reja': 0,
  };
  let qualityIssueCount = 0;
  let totalRows = 0;

  const sheetEntries = workbook.SheetNames.map((name, idx) => ({
    name,
    kind: detectSheetKind(name),
    index: idx,
  }));

  const validSheets = sheetEntries.filter((s) => s.kind !== null);

  if (validSheets.length === 0) {
    errors.push(
      `Tanilgan varaq topilmadi. Faylda quyidagi varaqlar bor: ${workbook.SheetNames.join(', ')}. ` +
      `Kutilgan nomlar: "Режа Жадвали" yoki "Asosiy reja".`,
    );
  }

  for (let si = 0; si < validSheets.length; si++) {
    const sheetInfo = validSheets[si];
    const sheet = workbook.Sheets[sheetInfo.name];
    const sheetKind = sheetInfo.kind as PlanSheetKind;

    const progressBase = 20 + (si / validSheets.length) * 70;
    onProgress?.(`"${sheetInfo.name}" varag'i o'qilmoqda`, progressBase);

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    // Birinchi qator: title, ikkinchi qator: headers, qolgani: data
    const dataRows = rows.slice(2);
    totalRows += dataRows.length;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const record = parseRow(row, sheetKind, i + 1);
      if (record) {
        records.push(record);
        sheetCounts[sheetKind]++;
        if (record.hasDataQualityIssue) qualityIssueCount++;
      }

      if (i % 10000 === 0 && i > 0) {
        const subProgress = (i / dataRows.length) * (70 / validSheets.length);
        onProgress?.(
          `"${sheetInfo.name}": ${i.toLocaleString()} / ${dataRows.length.toLocaleString()}`,
          progressBase + subProgress,
        );
      }
    }
  }

  onProgress?.('Yakunlanmoqda', 95);

  if (qualityIssueCount > 0) {
    warnings.push(
      `${qualityIssueCount.toLocaleString()} qator ustun siljishi bilan aniqlandi va alohida belgilangan.`,
    );
  }

  onProgress?.('Tayyor', 100);

  return {
    records,
    sheetCounts,
    totalRows,
    qualityIssueCount,
    warnings,
    errors,
    fileName: file.name,
    fileSize: file.size,
    parsedAt: new Date(),
    durationMs: Date.now() - startedAt,
  };
}
