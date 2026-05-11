// =====================================================
// TEMIR YO'L LOGISTIKA — DATA MODELS
// Mahalliy eksport (Local export) ma'lumotlari
// =====================================================

/**
 * Asosiy ma'lumot birligi — bitta jo'natma (vagon yuborilishi)
 */
export interface Shipment {
  id: string;
  fileId: string;          // qaysi yuklamadan kelgan
  rowIndex: number;        // Excel-dagi original qator

  // Identifikatorlar
  wagonNumber: string;     // Вагон номер
  invoiceNumber: string;   // Накладной номер

  // Jo'natuvchi (Sender)
  senderName: string;                  // Жўнатувчи номи
  senderStationCode: string;           // Stansiya kodi (735109)
  senderStationName: string;           // Stansiya nomi (Термиз)

  // Qabul qiluvchi (Receiver)
  receiverName: string;                // Юк қабул қилувчи номи
  destStationCode: string;             // Манзил станция kodi
  destStationName: string;             // Манзил станция nomi

  // Yuk (Cargo)
  cargoCode: string;                   // 281048
  cargoName: string;                   // Портландцемент строительный

  // Vaqtlar (UTC timestamp, ms)
  acceptanceAt: number;                // Ташишга қабул қилинган сана
  departureAt: number;                 // Стикдан чиқиб кетган сана

  // Masofa
  distanceKm: number;                  // Масофа (км)

  // Hisoblangan maydonlar
  waitMinutes: number;                 // departure - acceptance (daqiqa)
}

/**
 * Yuklangan fayl meta-ma'lumotlari
 */
export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Shipment maydonlari — column mapping uchun
 */
export type ShipmentField =
  | 'wagonNumber'
  | 'invoiceNumber'
  | 'senderName'
  | 'senderStation'
  | 'receiverName'
  | 'destStation'
  | 'cargo'
  | 'acceptanceAt'
  | 'departureAt'
  | 'distanceKm';

/**
 * Excel ustun → field xaritalanishi
 * key = field name, value = Excel ustun indeksi (0-based)
 */
export type ColumnMapping = Partial<Record<ShipmentField, number>>;

/**
 * Excel parser natijasi
 */
export interface ParseResult {
  success: boolean;
  shipments: Shipment[];
  fileUpload: FileUpload;
  mapping: ColumnMapping;
  detectedColumns: string[];           // Excel header qatorlari
  needsManualMapping: boolean;         // True bo'lsa, foydalanuvchi mapping qiladi
  rawRows?: unknown[][];               // Manual mapping uchun keyin ishlatish
  headerRowIndex?: number;
}

/**
 * Filtrlar
 */
export interface Filters {
  dateRange: { start: number | null; end: number | null };
  dateField: 'acceptanceAt' | 'departureAt';
  senderStations: string[];
  destStations: string[];
  senders: string[];
  receivers: string[];
  cargoTypes: string[];
  wagonSearch: string;
}

/**
 * KPI ma'lumotlari (vaqt — kunlarda)
 */
export interface KPIs {
  totalShipments: number;
  uniqueWagons: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  uniqueRoutes: number;
  uniqueCargoTypes: number;
  totalDistanceKm: number;
  avgDistanceKm: number;
  avgTransitDays: number;
  medianTransitDays: number;
  p95TransitDays: number;
  fastestTransitDays: number;
  slowestTransitDays: number;
}

/**
 * Marshrut statistikasi (sender_station → dest_station)
 */
export interface RouteStat {
  key: string;
  senderStation: string;
  destStation: string;
  shipments: number;
  uniqueWagons: number;
  totalDistanceKm: number;
  avgWaitMinutes: number;
  topCargo: string;
  topSender: string;
}

/**
 * Kompaniya statistikasi
 */
export interface CompanyStat {
  name: string;
  role: 'sender' | 'receiver';
  shipments: number;
  uniqueWagons: number;
  uniqueRoutes: number;
  totalDistanceKm: number;
  avgWaitMinutes: number;
  topCargo: string;
  topPartnerStation: string;
}

/**
 * Stansiya statistikasi
 */
export interface StationStat {
  code: string;
  name: string;
  outboundShipments: number;
  inboundShipments: number;
  totalShipments: number;
  avgWaitMinutes: number;
  topCargo: string;
  uniqueWagons: number;
}

/**
 * Yuk turi statistikasi
 */
export interface CargoStat {
  code: string;
  name: string;
  shipments: number;
  uniqueWagons: number;
  totalDistanceKm: number;
  avgDistanceKm: number;
  topSender: string;
  topRoute: string;
}

/**
 * Vagon statistikasi
 */
export interface WagonStat {
  wagonNumber: string;
  trips: number;
  totalDistanceKm: number;
  uniqueRoutes: number;
  uniqueCargoTypes: number;
  firstSeen: number;
  lastSeen: number;
  avgWaitMinutes: number;
}

/**
 * Kunlik vaqt qatori
 */
export interface DailyPoint {
  date: string;             // YYYY-MM-DD
  shipments: number;
  uniqueWagons: number;
  totalDistanceKm: number;
  avgWaitMinutes: number;
}

/**
 * Soatlik intensivlik (heatmap uchun)
 */
export interface HourlyHeatPoint {
  weekday: number;          // 0=Yakshanba ... 6=Shanba
  hour: number;             // 0..23
  count: number;
}

/**
 * Anomaliya
 */
export interface Anomaly {
  id: string;
  shipmentId: string;
  type:
    | 'long-transit'
    | 'fast-transit'
    | 'negative-wait'
    | 'wagon-reused-sameday'
    | 'duplicate-invoice'
    | 'missing-field'
    | 'extreme-distance';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  value?: string | number;
}

/**
 * Marshrut tezligi statistikasi —
 * Bir marshrut bo'yicha jo'natuvchilarni solishtirish uchun
 */
export interface RouteSpeedStat {
  routeKey: string;
  senderStation: string;
  destStation: string;
  totalShipments: number;
  totalSenders: number;
  totalReceivers: number;
  medianTransitDays: number;
  avgTransitDays: number;
  p25TransitDays: number;       // 25-protsentil (tez)
  p75TransitDays: number;       // 75-protsentil (sekin)
  minTransitDays: number;
  maxTransitDays: number;
  spreadDays: number;           // max - min (tarqoqlik darajasi)
  fastestPlayer: { name: string; avgDays: number; shipments: number } | null;
  slowestPlayer: { name: string; avgDays: number; shipments: number } | null;
}

/**
 * Aktor tezligi — bitta jo'natuvchi / qabul qiluvchi
 * ma'lum marshrut bo'yicha o'rtacha vaqti
 */
export interface ActorSpeed {
  actorName: string;
  routeKey: string;
  senderStation: string;
  destStation: string;
  shipments: number;
  avgTransitDays: number;
  routeMedianDays: number;       // marshrut bo'yicha umumiy median (baseline)
  deviationPct: number;          // (avg - median) / median * 100  (manfiy = tezroq)
  rank: 'fast' | 'normal' | 'slow';
  zScore: number;                // marshrut bo'yicha standart og'ish
}

/**
 * Kunlik marshrut guruhi — bir kunda qabul qilingan,
 * bir xil marshrut bo'yicha jo'natmalar.
 * Bu eng aniq taqqoslash — xuddi shu sharoit, xuddi shu kun.
 */
export interface DailyRouteGroup {
  groupKey: string;
  acceptanceDay: string;          // YYYY-MM-DD
  acceptanceDayTs: number;
  routeKey: string;
  senderStation: string;
  destStation: string;
  shipments: Shipment[];          // shu guruhga tegishli jo'natmalar
  count: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  minTransitDays: number;
  medianTransitDays: number;
  maxTransitDays: number;
  spreadDays: number;             // max - min (qancha katta = qiziqarli)
  distanceKm: number;             // marshrut masofasi
  fastestShipmentId: string;
  slowestShipmentId: string;
}

/**
 * Бир кунда бир стансиядан иккинчисига чиқиб кетган жўнатмалар гуруҳи.
 * Маршрут (жўнатувчи стансия → манзил стансия) + кун бўйича гуруҳланади.
 * Бир хил маршрутда ҳар хил жўнатувчи фирмаларни таққослаш учун.
 */
export interface SameDayDistanceGroup {
  groupKey: string;                   // "YYYY-MM-DD|Термиз→Тошкент"
  acceptanceDay: string;              // YYYY-MM-DD
  acceptanceDayTs: number;
  routeKey: string;                   // "Термиз→Тошкент"
  senderStation: string;              // жўнатувчи стансия
  destStation: string;                // манзил стансия
  distanceKm: number;                 // маршрут масофаси
  shipments: Shipment[];
  count: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  minTransitDays: number;
  medianTransitDays: number;
  maxTransitDays: number;
  avgTransitDays: number;
  spreadDays: number;                 // max - min
}

/**
 * Етиб бориш вақти — битта жўнатма учун
 */
export interface DeliveryTimeEntry {
  id: string;
  date: string;                       // YYYY-MM-DD
  week: string;                       // YYYY-Wxx
  month: string;                      // YYYY-MM
  wagonNumber: string;
  senderName: string;
  receiverName: string;
  senderStation: string;
  destStation: string;
  transitDays: number;
  distanceKm: number;
}

/**
 * Кунлик/ҳафталик/ойлик агрегат
 */
export interface DeliveryPeriodAggregate {
  period: string;                     // sana, hafta, yoki oy
  distanceKm: number;
  count: number;
  avgTransitDays: number;
  minTransitDays: number;
  maxTransitDays: number;
  entries: DeliveryTimeEntry[];
}

