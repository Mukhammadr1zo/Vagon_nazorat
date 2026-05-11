// =====================================================
// ANALITIKA — KPI, statistikalar, anomaliyalar
// =====================================================

import type {
  Shipment,
  KPIs,
  RouteStat,
  CompanyStat,
  StationStat,
  CargoStat,
  WagonStat,
  DailyPoint,
  HourlyHeatPoint,
  Anomaly,
  Filters,
  RouteSpeedStat,
  ActorSpeed,
  DailyRouteGroup,
  SameDayDistanceGroup,
  DeliveryTimeEntry,
  DeliveryPeriodAggregate,
} from './types';

const MIN_TO_DAY = 1 / 1440;
const toDays = (min: number) => min * MIN_TO_DAY;

// =====================================================
// Yordamchi
// =====================================================

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[m - 1] + sorted[m]) / 2 : sorted[m];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function topByCount<T extends string>(items: T[]): T | '' {
  if (items.length === 0) return '' as T | '';
  const m = new Map<T, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  let best: T | '' = '';
  let bestN = 0;
  for (const [k, v] of m) {
    if (v > bestN) {
      bestN = v;
      best = k;
    }
  }
  return best;
}

function formatDate(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// =====================================================
// Filter qo'llash
// =====================================================

export function applyFilters(items: Shipment[], filters: Filters): Shipment[] {
  return items.filter((s) => {
    // sana oralig'i
    const ts = s[filters.dateField];
    if (filters.dateRange.start !== null && ts < filters.dateRange.start) return false;
    if (filters.dateRange.end !== null && ts > filters.dateRange.end) return false;

    if (filters.senderStations.length > 0 && !filters.senderStations.includes(s.senderStationName)) return false;
    if (filters.destStations.length > 0 && !filters.destStations.includes(s.destStationName)) return false;
    if (filters.senders.length > 0 && !filters.senders.includes(s.senderName)) return false;
    if (filters.receivers.length > 0 && !filters.receivers.includes(s.receiverName)) return false;
    if (filters.cargoTypes.length > 0 && !filters.cargoTypes.includes(s.cargoName)) return false;

    if (filters.wagonSearch) {
      const q = filters.wagonSearch.toLowerCase();
      if (
        !s.wagonNumber.toLowerCase().includes(q) &&
        !s.invoiceNumber.toLowerCase().includes(q)
      ) return false;
    }

    return true;
  });
}

// =====================================================
// KPI
// =====================================================

export function calculateKPIs(items: Shipment[]): KPIs {
  if (items.length === 0) {
    return {
      totalShipments: 0,
      uniqueWagons: 0,
      uniqueSenders: 0,
      uniqueReceivers: 0,
      uniqueRoutes: 0,
      uniqueCargoTypes: 0,
      totalDistanceKm: 0,
      avgDistanceKm: 0,
      avgTransitDays: 0,
      medianTransitDays: 0,
      p95TransitDays: 0,
      fastestTransitDays: 0,
      slowestTransitDays: 0,
    };
  }

  const wagons = new Set<string>();
  const senders = new Set<string>();
  const receivers = new Set<string>();
  const routes = new Set<string>();
  const cargoes = new Set<string>();
  const transitsDays: number[] = [];
  let totalDistance = 0;

  for (const s of items) {
    if (s.wagonNumber) wagons.add(s.wagonNumber);
    if (s.senderName) senders.add(s.senderName);
    if (s.receiverName) receivers.add(s.receiverName);
    if (s.senderStationName && s.destStationName)
      routes.add(`${s.senderStationName}→${s.destStationName}`);
    if (s.cargoName) cargoes.add(s.cargoName);
    if (s.waitMinutes > 0) transitsDays.push(toDays(s.waitMinutes));
    totalDistance += s.distanceKm;
  }

  const sorted = [...transitsDays].sort((a, b) => a - b);

  return {
    totalShipments: items.length,
    uniqueWagons: wagons.size,
    uniqueSenders: senders.size,
    uniqueReceivers: receivers.size,
    uniqueRoutes: routes.size,
    uniqueCargoTypes: cargoes.size,
    totalDistanceKm: totalDistance,
    avgDistanceKm: totalDistance / items.length,
    avgTransitDays: avg(transitsDays),
    medianTransitDays: median(transitsDays),
    p95TransitDays: percentile(sorted, 95),
    fastestTransitDays: sorted[0] ?? 0,
    slowestTransitDays: sorted[sorted.length - 1] ?? 0,
  };
}

// =====================================================
// Marshrutlar
// =====================================================

export function calculateRouteStats(items: Shipment[]): RouteStat[] {
  const groups = new Map<string, Shipment[]>();
  for (const s of items) {
    const k = `${s.senderStationName}→${s.destStationName}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  const out: RouteStat[] = [];
  for (const [key, list] of groups) {
    const wagons = new Set(list.map((x) => x.wagonNumber));
    out.push({
      key,
      senderStation: list[0].senderStationName,
      destStation: list[0].destStationName,
      shipments: list.length,
      uniqueWagons: wagons.size,
      totalDistanceKm: list.reduce((s, x) => s + x.distanceKm, 0),
      avgWaitMinutes: avg(list.filter((x) => x.waitMinutes > 0).map((x) => x.waitMinutes)),
      topCargo: topByCount(list.map((x) => x.cargoName).filter(Boolean)) || '—',
      topSender: topByCount(list.map((x) => x.senderName).filter(Boolean)) || '—',
    });
  }

  return out.sort((a, b) => b.shipments - a.shipments);
}

// =====================================================
// Kompaniyalar
// =====================================================

export function calculateCompanyStats(items: Shipment[]): CompanyStat[] {
  const out: CompanyStat[] = [];

  const grouped: Map<string, { role: 'sender' | 'receiver'; list: Shipment[] }> = new Map();
  for (const s of items) {
    if (s.senderName) {
      const k = `sender::${s.senderName}`;
      if (!grouped.has(k)) grouped.set(k, { role: 'sender', list: [] });
      grouped.get(k)!.list.push(s);
    }
    if (s.receiverName) {
      const k = `receiver::${s.receiverName}`;
      if (!grouped.has(k)) grouped.set(k, { role: 'receiver', list: [] });
      grouped.get(k)!.list.push(s);
    }
  }

  for (const [k, { role, list }] of grouped) {
    const name = k.split('::')[1];
    const wagons = new Set(list.map((x) => x.wagonNumber));
    const routes = new Set(list.map((x) => `${x.senderStationName}→${x.destStationName}`));
    const partnerStations = list.map((x) =>
      role === 'sender' ? x.destStationName : x.senderStationName,
    );
    out.push({
      name,
      role,
      shipments: list.length,
      uniqueWagons: wagons.size,
      uniqueRoutes: routes.size,
      totalDistanceKm: list.reduce((s, x) => s + x.distanceKm, 0),
      avgWaitMinutes: avg(list.filter((x) => x.waitMinutes > 0).map((x) => x.waitMinutes)),
      topCargo: topByCount(list.map((x) => x.cargoName).filter(Boolean)) || '—',
      topPartnerStation: topByCount(partnerStations.filter(Boolean)) || '—',
    });
  }

  return out.sort((a, b) => b.shipments - a.shipments);
}

// =====================================================
// Stansiyalar
// =====================================================

export function calculateStationStats(items: Shipment[]): StationStat[] {
  const map = new Map<string, { code: string; name: string; out: Shipment[]; in: Shipment[] }>();
  for (const s of items) {
    if (s.senderStationName) {
      const k = s.senderStationName;
      if (!map.has(k)) map.set(k, { code: s.senderStationCode, name: k, out: [], in: [] });
      map.get(k)!.out.push(s);
    }
    if (s.destStationName) {
      const k = s.destStationName;
      if (!map.has(k)) map.set(k, { code: s.destStationCode, name: k, out: [], in: [] });
      map.get(k)!.in.push(s);
    }
  }

  const out: StationStat[] = [];
  for (const { code, name, out: outbound, in: inbound } of map.values()) {
    const all = [...outbound, ...inbound];
    const wagons = new Set(all.map((x) => x.wagonNumber));
    out.push({
      code,
      name,
      outboundShipments: outbound.length,
      inboundShipments: inbound.length,
      totalShipments: all.length,
      avgWaitMinutes: avg(all.filter((x) => x.waitMinutes > 0).map((x) => x.waitMinutes)),
      topCargo: topByCount(all.map((x) => x.cargoName).filter(Boolean)) || '—',
      uniqueWagons: wagons.size,
    });
  }
  return out.sort((a, b) => b.totalShipments - a.totalShipments);
}

// =====================================================
// Yuk turlari
// =====================================================

export function calculateCargoStats(items: Shipment[]): CargoStat[] {
  const map = new Map<string, Shipment[]>();
  for (const s of items) {
    if (!s.cargoName) continue;
    if (!map.has(s.cargoName)) map.set(s.cargoName, []);
    map.get(s.cargoName)!.push(s);
  }
  const out: CargoStat[] = [];
  for (const [name, list] of map) {
    const wagons = new Set(list.map((x) => x.wagonNumber));
    const totalDistance = list.reduce((s, x) => s + x.distanceKm, 0);
    out.push({
      code: list[0].cargoCode,
      name,
      shipments: list.length,
      uniqueWagons: wagons.size,
      totalDistanceKm: totalDistance,
      avgDistanceKm: totalDistance / list.length,
      topSender: topByCount(list.map((x) => x.senderName).filter(Boolean)) || '—',
      topRoute: topByCount(list.map((x) => `${x.senderStationName}→${x.destStationName}`)) || '—',
    });
  }
  return out.sort((a, b) => b.shipments - a.shipments);
}

// =====================================================
// Vagonlar
// =====================================================

export function calculateWagonStats(items: Shipment[]): WagonStat[] {
  const map = new Map<string, Shipment[]>();
  for (const s of items) {
    if (!s.wagonNumber) continue;
    if (!map.has(s.wagonNumber)) map.set(s.wagonNumber, []);
    map.get(s.wagonNumber)!.push(s);
  }
  const out: WagonStat[] = [];
  for (const [wagon, list] of map) {
    const dates = list.map((x) => x.acceptanceAt || x.departureAt).filter((x) => x > 0);
    const routes = new Set(list.map((x) => `${x.senderStationName}→${x.destStationName}`));
    const cargos = new Set(list.map((x) => x.cargoName).filter(Boolean));
    out.push({
      wagonNumber: wagon,
      trips: list.length,
      totalDistanceKm: list.reduce((s, x) => s + x.distanceKm, 0),
      uniqueRoutes: routes.size,
      uniqueCargoTypes: cargos.size,
      firstSeen: Math.min(...dates, Date.now()),
      lastSeen: Math.max(...dates, 0),
      avgWaitMinutes: avg(list.filter((x) => x.waitMinutes > 0).map((x) => x.waitMinutes)),
    });
  }
  return out.sort((a, b) => b.trips - a.trips);
}

// =====================================================
// Vaqt qatorlari (Daily)
// =====================================================

export function calculateDailySeries(items: Shipment[], field: 'acceptanceAt' | 'departureAt' = 'departureAt'): DailyPoint[] {
  const map = new Map<string, Shipment[]>();
  for (const s of items) {
    const ts = s[field];
    if (!ts) continue;
    const key = formatDate(ts);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  const out: DailyPoint[] = [];
  for (const [date, list] of map) {
    const wagons = new Set(list.map((x) => x.wagonNumber));
    out.push({
      date,
      shipments: list.length,
      uniqueWagons: wagons.size,
      totalDistanceKm: list.reduce((s, x) => s + x.distanceKm, 0),
      avgWaitMinutes: avg(list.filter((x) => x.waitMinutes > 0).map((x) => x.waitMinutes)),
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// =====================================================
// Soatlik heatmap (kun × soat)
// =====================================================

export function calculateHourlyHeatmap(items: Shipment[], field: 'acceptanceAt' | 'departureAt' = 'departureAt'): HourlyHeatPoint[] {
  const grid = new Map<string, number>();
  for (const s of items) {
    const ts = s[field];
    if (!ts) continue;
    const d = new Date(ts);
    const wd = d.getUTCDay();
    const h = d.getUTCHours();
    const k = `${wd}-${h}`;
    grid.set(k, (grid.get(k) ?? 0) + 1);
  }
  const out: HourlyHeatPoint[] = [];
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      out.push({ weekday: w, hour: h, count: grid.get(`${w}-${h}`) ?? 0 });
    }
  }
  return out;
}

// =====================================================
// MARSHRUT TEZLIGI — bir xil marshrutda turli aktorlarning solishtirilishi
// =====================================================

function stdDev(arr: number[], mean: number): number {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Har bir marshrut bo'yicha umumiy tezlik statistikasi.
 * Marshrutlarni tarqoqlik (max-min) bo'yicha tartiblash mumkin.
 */
export function calculateRouteSpeedStats(items: Shipment[], minShipments = 3): RouteSpeedStat[] {
  const groups = new Map<string, Shipment[]>();
  for (const s of items) {
    if (s.waitMinutes <= 0 || !s.senderStationName || !s.destStationName) continue;
    const k = `${s.senderStationName}→${s.destStationName}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  const out: RouteSpeedStat[] = [];
  for (const [routeKey, list] of groups) {
    if (list.length < minShipments) continue;

    const days = list.map((s) => toDays(s.waitMinutes));
    const sorted = [...days].sort((a, b) => a - b);

    // Senders va receivers bo'yicha guruhlash — eng tez/sekin aktorni topish
    const playerMap = new Map<string, number[]>();
    for (const s of list) {
      const key = s.senderName || s.receiverName || '—';
      if (!playerMap.has(key)) playerMap.set(key, []);
      playerMap.get(key)!.push(toDays(s.waitMinutes));
    }

    let fastest: { name: string; avgDays: number; shipments: number } | null = null;
    let slowest: { name: string; avgDays: number; shipments: number } | null = null;
    for (const [name, ds] of playerMap) {
      if (ds.length < 2) continue;
      const a = avg(ds);
      if (!fastest || a < fastest.avgDays) fastest = { name, avgDays: a, shipments: ds.length };
      if (!slowest || a > slowest.avgDays) slowest = { name, avgDays: a, shipments: ds.length };
    }

    const senderSet = new Set(list.map((s) => s.senderName).filter(Boolean));
    const receiverSet = new Set(list.map((s) => s.receiverName).filter(Boolean));

    out.push({
      routeKey,
      senderStation: list[0].senderStationName,
      destStation: list[0].destStationName,
      totalShipments: list.length,
      totalSenders: senderSet.size,
      totalReceivers: receiverSet.size,
      medianTransitDays: median(days),
      avgTransitDays: avg(days),
      p25TransitDays: percentile(sorted, 25),
      p75TransitDays: percentile(sorted, 75),
      minTransitDays: sorted[0] ?? 0,
      maxTransitDays: sorted[sorted.length - 1] ?? 0,
      spreadDays: (sorted[sorted.length - 1] ?? 0) - (sorted[0] ?? 0),
      fastestPlayer: fastest,
      slowestPlayer: slowest,
    });
  }

  // tarqoqlik kattaligi bo'yicha tartiblash (eng diqqat talab qiluvchi marshrut)
  return out.sort((a, b) => b.spreadDays - a.spreadDays);
}

/**
 * Marshrut × aktor (sender yoki receiver) — har bir kombinatsiyaning
 * o'rtacha tranzit vaqti va marshrut median ga nisbatan og'ishi
 */
function calculateActorSpeeds(
  items: Shipment[],
  actorKey: 'senderName' | 'receiverName',
  minShipmentsPerActor = 2,
  minShipmentsPerRoute = 3,
): ActorSpeed[] {
  // Avval marshrut bo'yicha guruhlash
  const routes = new Map<string, Shipment[]>();
  for (const s of items) {
    if (s.waitMinutes <= 0) continue;
    if (!s.senderStationName || !s.destStationName) continue;
    if (!s[actorKey]) continue;
    const k = `${s.senderStationName}→${s.destStationName}`;
    if (!routes.has(k)) routes.set(k, []);
    routes.get(k)!.push(s);
  }

  const out: ActorSpeed[] = [];
  for (const [routeKey, list] of routes) {
    if (list.length < minShipmentsPerRoute) continue;
    const allDays = list.map((s) => toDays(s.waitMinutes));
    const routeMedian = median(allDays);
    const routeAvg = avg(allDays);
    const routeSd = stdDev(allDays, routeAvg);

    // aktor bo'yicha guruhlash
    const actors = new Map<string, number[]>();
    for (const s of list) {
      const a = s[actorKey];
      if (!actors.has(a)) actors.set(a, []);
      actors.get(a)!.push(toDays(s.waitMinutes));
    }

    for (const [name, ds] of actors) {
      if (ds.length < minShipmentsPerActor) continue;
      const a = avg(ds);
      const deviationPct = routeMedian > 0 ? ((a - routeMedian) / routeMedian) * 100 : 0;
      const z = routeSd > 0 ? (a - routeAvg) / routeSd : 0;

      let rank: ActorSpeed['rank'] = 'normal';
      // tez = baseline-dan kamida 25% past VA z < -0.7 (statistik mazmunli)
      if (deviationPct < -25 && z < -0.7) rank = 'fast';
      else if (deviationPct > 25 && z > 0.7) rank = 'slow';

      out.push({
        actorName: name,
        routeKey,
        senderStation: list[0].senderStationName,
        destStation: list[0].destStationName,
        shipments: ds.length,
        avgTransitDays: a,
        routeMedianDays: routeMedian,
        deviationPct,
        rank,
        zScore: z,
      });
    }
  }

  // tezdan boshlab tartiblash (eng katta og'ish — tez tomonga)
  return out.sort((a, b) => a.deviationPct - b.deviationPct);
}

export function calculateSenderSpeeds(items: Shipment[]): ActorSpeed[] {
  return calculateActorSpeeds(items, 'senderName');
}

export function calculateReceiverSpeeds(items: Shipment[]): ActorSpeed[] {
  return calculateActorSpeeds(items, 'receiverName');
}

// =====================================================
// KUNLIK MARSHRUT GURUHLARI — eng aniq taqqoslash
// (Bir kunda, bir xil marshrut, lekin har xil tezlik)
// =====================================================

/**
 * Bir xil kun + bir xil marshrut bo'yicha jo'natmalarni guruhlaydi.
 * Faqat 2+ jo'natma va spread > 0 bo'lgan guruhlar qaytariladi —
 * boshqalari taqqoslash uchun mazmunsiz.
 */
export function calculateDailyRouteGroups(items: Shipment[]): DailyRouteGroup[] {
  const groups = new Map<string, Shipment[]>();

  for (const s of items) {
    if (!s.acceptanceAt || s.waitMinutes <= 0) continue;
    if (!s.senderStationName || !s.destStationName) continue;
    const day = formatDate(s.acceptanceAt);
    const routeKey = `${s.senderStationName}→${s.destStationName}`;
    const key = `${routeKey}|${day}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  const out: DailyRouteGroup[] = [];
  for (const [groupKey, ships] of groups) {
    if (ships.length < 2) continue;
    const sorted = [...ships].sort((a, b) => a.waitMinutes - b.waitMinutes);
    const days = sorted.map((s) => toDays(s.waitMinutes));
    const minDay = days[0];
    const maxDay = days[days.length - 1];
    const spread = maxDay - minDay;
    if (spread <= 0) continue; // hech qanday farq yo'q

    const med = median(days);
    const senderSet = new Set(ships.map((s) => s.senderName).filter(Boolean));
    const receiverSet = new Set(ships.map((s) => s.receiverName).filter(Boolean));

    // Marshrut masofasi — odatda bir xil; max ni olamiz
    const dist = Math.max(...ships.map((s) => s.distanceKm).filter((d) => d > 0), 0);

    const [routeKey, day] = groupKey.split('|');
    const ts = Date.parse(day + 'T00:00:00Z');

    out.push({
      groupKey,
      acceptanceDay: day,
      acceptanceDayTs: isNaN(ts) ? 0 : ts,
      routeKey,
      senderStation: ships[0].senderStationName,
      destStation: ships[0].destStationName,
      shipments: sorted,
      count: ships.length,
      uniqueSenders: senderSet.size,
      uniqueReceivers: receiverSet.size,
      minTransitDays: minDay,
      medianTransitDays: med,
      maxTransitDays: maxDay,
      spreadDays: spread,
      distanceKm: dist,
      fastestShipmentId: sorted[0].id,
      slowestShipmentId: sorted[sorted.length - 1].id,
    });
  }

  return out.sort((a, b) => b.spreadDays - a.spreadDays);
}

// =====================================================
// ЕТИБ БОРИШ СУТКАСИ — бир кун + бир хил масофа
// =====================================================

function getISOWeek(ts: number): string {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Бир кунда бир стансиядан иккинчисига чиқиб кетган жўнатмаларни гуруҳлайди.
 * Маршрут (жўнатувчи стансия → манзил стансия) + кун бўйича.
 * Ҳар хил жўнатувчи фирмаларни бир хил маршрутда таққослаш учун.
 * Камида 2 та жўнатма бўлган гуруҳлар қайтарилади.
 */
export function calculateSameDayDistanceGroups(items: Shipment[]): SameDayDistanceGroup[] {
  const groups = new Map<string, Shipment[]>();

  for (const s of items) {
    if (!s.acceptanceAt || s.waitMinutes <= 0) continue;
    if (!s.senderStationName || !s.destStationName) continue;
    const day = formatDate(s.acceptanceAt);
    const routeKey = `${s.senderStationName}→${s.destStationName}`;
    const key = `${day}|${routeKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  const out: SameDayDistanceGroup[] = [];
  for (const [groupKey, ships] of groups) {
    if (ships.length < 2) continue; // камида 2 та жўнатма
    const sorted = [...ships].sort((a, b) => a.waitMinutes - b.waitMinutes);
    const days = sorted.map((s) => toDays(s.waitMinutes));
    const minDay = days[0];
    const maxDay = days[days.length - 1];
    const spread = maxDay - minDay;

    const med = median(days);
    const average = avg(days);
    const senderSet = new Set(ships.map((s) => s.senderName).filter(Boolean));
    const receiverSet = new Set(ships.map((s) => s.receiverName).filter(Boolean));

    const [day, routeKey] = groupKey.split('|');
    const ts = Date.parse(day + 'T00:00:00Z');

    // Маршрут масофаси — одатда бир хил, max ни оламиз
    const dist = Math.max(...ships.map((s) => s.distanceKm).filter((d) => d > 0), 0);

    out.push({
      groupKey,
      acceptanceDay: day,
      acceptanceDayTs: isNaN(ts) ? 0 : ts,
      routeKey,
      senderStation: ships[0].senderStationName,
      destStation: ships[0].destStationName,
      distanceKm: Math.round(dist),
      shipments: sorted,
      count: ships.length,
      uniqueSenders: senderSet.size,
      uniqueReceivers: receiverSet.size,
      minTransitDays: minDay,
      medianTransitDays: med,
      maxTransitDays: maxDay,
      avgTransitDays: average,
      spreadDays: spread,
    });
  }

  return out.sort((a, b) => {
    const stationDiff = a.senderStation.localeCompare(b.senderStation);
    if (stationDiff !== 0) return stationDiff;
    return b.acceptanceDayTs - a.acceptanceDayTs;
  });
}

/**
 * Танланган маршрут бўйича кунлик/ҳафталик/ойлик агрегатлар
 */
export function buildDeliveryTimeEntries(items: Shipment[], routeKey?: string): DeliveryTimeEntry[] {
  return items
    .filter((s) => {
      if (!s.acceptanceAt || s.waitMinutes <= 0) return false;
      if (!s.senderStationName || !s.destStationName) return false;
      if (routeKey !== undefined) {
        const rk = `${s.senderStationName}→${s.destStationName}`;
        if (rk !== routeKey) return false;
      }
      return true;
    })
    .map((s) => ({
      id: s.id,
      date: formatDate(s.acceptanceAt),
      week: getISOWeek(s.acceptanceAt),
      month: getMonthKey(s.acceptanceAt),
      wagonNumber: s.wagonNumber,
      senderName: s.senderName,
      receiverName: s.receiverName,
      senderStation: s.senderStationName,
      destStation: s.destStationName,
      transitDays: toDays(s.waitMinutes),
      distanceKm: Math.round(s.distanceKm),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByPeriod(
  entries: DeliveryTimeEntry[],
  period: 'daily' | 'weekly' | 'monthly',
): DeliveryPeriodAggregate[] {
  const getKey = (e: DeliveryTimeEntry) =>
    period === 'daily' ? e.date : period === 'weekly' ? e.week : e.month;

  const groups = new Map<string, DeliveryTimeEntry[]>();
  for (const e of entries) {
    const k = getKey(e);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }

  const out: DeliveryPeriodAggregate[] = [];
  for (const [key, list] of groups) {
    const days = list.map((e) => e.transitDays);
    out.push({
      period: key,
      distanceKm: list[0].distanceKm,
      count: list.length,
      avgTransitDays: avg(days),
      minTransitDays: Math.min(...days),
      maxTransitDays: Math.max(...days),
      entries: list,
    });
  }

  return out.sort((a, b) => a.period.localeCompare(b.period));
}

// =====================================================
// Anomaliyalar
// =====================================================

export function detectAnomalies(items: Shipment[]): Anomaly[] {
  const out: Anomaly[] = [];
  if (items.length === 0) return out;

  const waits = items.filter((s) => s.waitMinutes > 0).map((s) => s.waitMinutes);
  const sortedWaits = [...waits].sort((a, b) => a - b);
  const p95Wait = percentile(sortedWaits, 95);
  const medianWait = median(waits);
  const longWaitThreshold = Math.max(p95Wait, medianWait * 3, 60 * 24);

  // ===== Marshrut bo'yicha tezlik bazasi (sender va receiver) =====
  const senderSpeeds = calculateSenderSpeeds(items);
  const receiverSpeeds = calculateReceiverSpeeds(items);
  // routeKey + actorName → ActorSpeed mappingi
  const senderSpeedMap = new Map<string, typeof senderSpeeds[number]>();
  const receiverSpeedMap = new Map<string, typeof receiverSpeeds[number]>();
  for (const s of senderSpeeds) senderSpeedMap.set(`${s.routeKey}|${s.actorName}`, s);
  for (const s of receiverSpeeds) receiverSpeedMap.set(`${s.routeKey}|${s.actorName}`, s);

  const distances = items.map((s) => s.distanceKm).filter((d) => d > 0);
  const sortedDist = [...distances].sort((a, b) => a - b);
  const p99Dist = percentile(sortedDist, 99);
  const p1Dist = percentile(sortedDist, 1);

  // wagon kun bo'yicha guruhlash
  const wagonDay = new Map<string, Shipment[]>();
  const invoiceMap = new Map<string, Shipment[]>();
  for (const s of items) {
    const day = formatDate(s.departureAt || s.acceptanceAt);
    const wk = `${s.wagonNumber}|${day}`;
    if (!wagonDay.has(wk)) wagonDay.set(wk, []);
    wagonDay.get(wk)!.push(s);

    if (s.invoiceNumber) {
      if (!invoiceMap.has(s.invoiceNumber)) invoiceMap.set(s.invoiceNumber, []);
      invoiceMap.get(s.invoiceNumber)!.push(s);
    }
  }

  for (const s of items) {
    // 1) Uzoq yetkazib berish muddati
    if (s.waitMinutes > longWaitThreshold) {
      const days = toDays(s.waitMinutes);
      out.push({
        id: `${s.id}-long`,
        shipmentId: s.id,
        type: 'long-transit',
        severity: s.waitMinutes > longWaitThreshold * 2 ? 'high' : 'medium',
        title: 'Uzoq yetkazib berish',
        description: `Vagon ${s.wagonNumber} marshrutda ${days < 10 ? days.toFixed(1) : Math.round(days)} kun bo'lgan`,
        value: Math.round(days * 10) / 10,
      });
    }


    // 2) Negativ vaqt
    if (s.acceptanceAt && s.departureAt && s.departureAt < s.acceptanceAt) {
      out.push({
        id: `${s.id}-neg`,
        shipmentId: s.id,
        type: 'negative-wait',
        severity: 'high',
        title: 'Sana xatosi',
        description: `Chiqib ketgan sana qabul qilingan sanadan oldin (vagon ${s.wagonNumber})`,
      });
    }

    // 3) Ekstremal masofa
    if (distances.length >= 20 && (s.distanceKm > p99Dist || s.distanceKm < p1Dist)) {
      out.push({
        id: `${s.id}-dist`,
        shipmentId: s.id,
        type: 'extreme-distance',
        severity: 'low',
        title: 'G\'ayritabiiy masofa',
        description: `Vagon ${s.wagonNumber} — ${s.distanceKm} km (odatdagidan farq)`,
        value: s.distanceKm,
      });
    }

    // 4) Yo'q maydonlar
    const missing: string[] = [];
    if (!s.senderName) missing.push('jo\'natuvchi');
    if (!s.receiverName) missing.push('qabul qiluvchi');
    if (!s.senderStationName) missing.push('jo\'natuvchi stansiya');
    if (!s.destStationName) missing.push('manzil stansiya');
    if (!s.cargoName) missing.push('yuk');
    if (missing.length >= 2) {
      out.push({
        id: `${s.id}-missing`,
        shipmentId: s.id,
        type: 'missing-field',
        severity: 'low',
        title: 'Maydonlar to\'liq emas',
        description: `Yetishmayotgan: ${missing.join(', ')} (vagon ${s.wagonNumber})`,
      });
    }
  }

  // 5) Bir kunda vagon takror ishlatilishi
  for (const [, list] of wagonDay) {
    if (list.length > 1) {
      out.push({
        id: `wagon-${list[0].wagonNumber}-${list[0].id}`,
        shipmentId: list[0].id,
        type: 'wagon-reused-sameday',
        severity: 'medium',
        title: 'Vagon bir kunda qayta ishlatilgan',
        description: `Vagon ${list[0].wagonNumber} bitta kunda ${list.length} marta jo'natilgan`,
        value: list.length,
      });
    }
  }

  // 6) Bir xil invoice raqami turli vagonlar bilan
  for (const [inv, list] of invoiceMap) {
    const uniqueWagons = new Set(list.map((s) => s.wagonNumber));
    if (uniqueWagons.size > 1) {
      out.push({
        id: `invoice-${inv}-${list[0].id}`,
        shipmentId: list[0].id,
        type: 'duplicate-invoice',
        severity: 'medium',
        title: 'Dublikat накладной',
        description: `Накладной ${inv} — ${uniqueWagons.size} ta turli vagonda`,
        value: uniqueWagons.size,
      });
    }
  }

  // 7) Kunlik guruh ichida tezroq yetkazilgan jo'natmalar —
  //    bir kunda, bir xil marshrutda, lekin median dan sezilarli farq
  const dailyGroups = calculateDailyRouteGroups(items);
  for (const g of dailyGroups) {
    if (g.medianTransitDays <= 0) continue;
    for (const s of g.shipments) {
      const d = toDays(s.waitMinutes);
      const devPct = ((d - g.medianTransitDays) / g.medianTransitDays) * 100;
      // 30% va undan tezroq — diqqat
      if (devPct >= -30) continue;
      out.push({
        id: `fast-daily-${s.id}`,
        shipmentId: s.id,
        type: 'fast-transit',
        severity: devPct <= -50 ? 'high' : 'medium',
        title: 'Bir kunda tezroq yetkazilgan',
        description: `Vagon ${s.wagonNumber} — ${g.acceptanceDay}, ${g.routeKey}: ${d.toFixed(1)} kun (shu kun median ${g.medianTransitDays.toFixed(1)} kun, ${devPct.toFixed(0)}%) — jo'natuvchi: ${(s.senderName || '—').slice(0, 40)}`,
        value: Math.round(devPct),
      });
    }
  }

  return out.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}
