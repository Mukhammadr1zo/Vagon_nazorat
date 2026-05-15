// =====================================================
// PLAN TYPES — RJU Reja Jadvali va Asosiy Reja
// Mavjud Shipment turlaridan butunlay alohida
// =====================================================

export type PlanSheetKind = 'reja-jadvali' | 'asosiy-reja';

export type PlanStatus = 'fulfilled' | 'partial' | 'canceled' | 'pending';

export interface PlanRecord {
  id: string;
  rowNo: number;
  sheetKind: PlanSheetKind;

  // Stansiya (manba)
  stationCode: string;
  stationName: string;
  stationRaw: string;

  // Stansiya (manzil)
  destStationCode: string | null;
  destStationName: string | null;
  destStationRaw: string | null;

  // Yuk
  cargoCode: string;
  cargoName: string;
  cargoRaw: string;

  // Talabnoma sanalari
  requestEnteredAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;

  canceledAt: Date | null;
  cancelReasonGroup: string | null;
  cancelReasonDetail: string | null;
  canceledBy: string | null;

  gu12Number: string | null;

  // Vagon
  wagonType: string;
  requestedCount: number;
  suppliedCount: number;
  remainingCount: number;

  // Hujjat va harakat
  cargoDocNumber: string | null;
  cargoDocFormalizedAt: Date | null;
  dispatchedAt: Date | null;
  arrivedAt: Date | null;
  unloadedAt: Date | null;

  // Hisoblangan
  status: PlanStatus;
  hasDataQualityIssue: boolean;

  // Vaqt oraliqlari (kunlarda)
  approvalLatencyDays: number | null;
  deliveryLatencyDays: number | null;
}

export interface PlanParseResult {
  records: PlanRecord[];
  sheetCounts: Record<PlanSheetKind, number>;
  totalRows: number;
  qualityIssueCount: number;
  warnings: string[];
  errors: string[];
  fileName: string;
  fileSize: number;
  parsedAt: Date;
  durationMs: number;
}

export type PlanDateField =
  | 'requestEnteredAt'
  | 'approvedAt'
  | 'canceledAt'
  | 'dispatchedAt'
  | 'arrivedAt';

export interface PlanFilters {
  sheetKind: PlanSheetKind | 'all';
  dateRange: { start: Date | null; end: Date | null };
  dateField: PlanDateField;
  stations: string[];
  destStations: string[];
  cargos: string[];
  wagonTypes: string[];
  statuses: PlanStatus[];
  approvers: string[];
  search: string;
}

export interface PlanKPIs {
  totalRequests: number;
  approvedCount: number;
  canceledCount: number;
  fulfilledCount: number;
  partialCount: number;
  pendingCount: number;

  totalRequestedWagons: number;
  totalSuppliedWagons: number;
  totalRemainingWagons: number;
  supplyRatePercent: number;

  cancellationRatePercent: number;
  fulfillmentRatePercent: number;

  avgApprovalLatencyDays: number | null;
  avgDeliveryLatencyDays: number | null;

  uniqueStations: number;
  uniqueDestStations: number;
  uniqueCargos: number;
  uniqueWagonTypes: number;
  uniqueApprovers: number;
}

export interface CancellationReasonStat {
  reason: string;
  count: number;
  percentage: number;
}

export interface StationStat {
  station: string;
  stationCode: string;
  stationName: string;
  total: number;
  fulfilled: number;
  partial: number;
  canceled: number;
  pending: number;
  requestedWagons: number;
  suppliedWagons: number;
  supplyRate: number;
}

export interface CargoStat {
  cargo: string;
  cargoCode: string;
  cargoName: string;
  total: number;
  requestedWagons: number;
  suppliedWagons: number;
  supplyRate: number;
}

export interface WagonTypeStat {
  wagonType: string;
  total: number;
  requestedWagons: number;
  suppliedWagons: number;
  supplyRate: number;
}

export interface DailyPointStat {
  date: string;
  total: number;
  approved: number;
  canceled: number;
  fulfilled: number;
  requestedWagons: number;
  suppliedWagons: number;
}

export interface ApproverStat {
  approver: string;
  total: number;
  approved: number;
  canceled: number;
}

export interface PlanAnomaly {
  id: string;
  type: 'long-approval' | 'long-delivery' | 'frequent-cancel' | 'oversupply' | 'data-quality';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  relatedRecordIds: string[];
  metric: number;
}

export interface PlanMeta {
  fileName: string;
  fileSize: number;
  parsedAt: string;
  totalRows: number;
  qualityIssueCount: number;
  sheetCounts: Record<PlanSheetKind, number>;
}