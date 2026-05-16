// =====================================================
// PLAN ANALYTICS — KPI, agregatsiya, anomaliyalar
// =====================================================

import type {
  PlanRecord,
  PlanFilters,
  PlanKPIs,
  CancellationReasonStat,
  StationStat,
  CargoStat,
  WagonTypeStat,
  DailyPointStat,
  ApproverStat,
  PlanAnomaly,
} from './plan-types';

// =====================================================
// Filtrlash
// =====================================================
export function applyPlanFilters(records: PlanRecord[], filters: PlanFilters): PlanRecord[] {
  return records.filter((r) => {
    if (filters.sheetKind !== 'all' && r.sheetKind !== filters.sheetKind) return false;

    if (filters.dateRange.start || filters.dateRange.end) {
      const d = r[filters.dateField];
      if (!d) return false;
      if (filters.dateRange.start && d < filters.dateRange.start) return false;
      if (filters.dateRange.end && d > filters.dateRange.end) return false;
    }

    if (filters.stations.length > 0 && !filters.stations.includes(r.stationRaw)) return false;
    if (filters.destStations.length > 0 && r.destStationRaw && !filters.destStations.includes(r.destStationRaw)) return false;
    if (filters.cargos.length > 0 && !filters.cargos.includes(r.cargoRaw)) return false;
    if (filters.wagonTypes.length > 0 && !filters.wagonTypes.includes(r.wagonType)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(r.status)) return false;
    if (filters.approvers.length > 0 && r.approvedBy && !filters.approvers.includes(r.approvedBy)) return false;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        r.stationRaw,
        r.destStationRaw,
        r.cargoRaw,
        r.wagonType,
        r.gu12Number,
        r.cargoDocNumber,
        r.approvedBy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

// =====================================================
// KPI hisoblash
// =====================================================
export function calculatePlanKPIs(records: PlanRecord[]): PlanKPIs {
  const valid = records.filter((r) => !r.hasDataQualityIssue);

  let approvedCount = 0;
  let canceledCount = 0;
  let fulfilledCount = 0;
  let partialCount = 0;
  let pendingCount = 0;

  let totalRequested = 0;
  let totalSupplied = 0;
  let totalRemaining = 0;

  let approvalLatencySum = 0;
  let approvalLatencyCount = 0;
  let deliveryLatencySum = 0;
  let deliveryLatencyCount = 0;

  const stations = new Set<string>();
  const destStations = new Set<string>();
  const cargos = new Set<string>();
  const wagonTypes = new Set<string>();
  const approvers = new Set<string>();

  for (const r of valid) {
    if (r.approvedAt) approvedCount++;
    if (r.status === 'canceled') canceledCount++;
    if (r.status === 'fulfilled') fulfilledCount++;
    if (r.status === 'partial') partialCount++;
    if (r.status === 'pending') pendingCount++;

    totalRequested += r.requestedCount;
    totalSupplied += r.suppliedCount;
    totalRemaining += r.remainingCount;

    if (r.approvalLatencyDays !== null) {
      approvalLatencySum += r.approvalLatencyDays;
      approvalLatencyCount++;
    }
    if (r.deliveryLatencyDays !== null) {
      deliveryLatencySum += r.deliveryLatencyDays;
      deliveryLatencyCount++;
    }

    if (r.stationRaw) stations.add(r.stationRaw);
    if (r.destStationRaw) destStations.add(r.destStationRaw);
    if (r.cargoRaw) cargos.add(r.cargoRaw);
    if (r.wagonType) wagonTypes.add(r.wagonType);
    if (r.approvedBy) approvers.add(r.approvedBy);
  }

  const total = valid.length;
  const supplyRate = totalRequested > 0 ? (totalSupplied / totalRequested) * 100 : 0;

  return {
    totalRequests: total,
    approvedCount,
    canceledCount,
    fulfilledCount,
    partialCount,
    pendingCount,
    totalRequestedWagons: totalRequested,
    totalSuppliedWagons: totalSupplied,
    totalRemainingWagons: totalRemaining,
    supplyRatePercent: Math.round(supplyRate * 100) / 100,
    cancellationRatePercent: total > 0 ? Math.round((canceledCount / total) * 10000) / 100 : 0,
    fulfillmentRatePercent: total > 0 ? Math.round((fulfilledCount / total) * 10000) / 100 : 0,
    avgApprovalLatencyDays:
      approvalLatencyCount > 0
        ? Math.round((approvalLatencySum / approvalLatencyCount) * 10) / 10
        : null,
    avgDeliveryLatencyDays:
      deliveryLatencyCount > 0
        ? Math.round((deliveryLatencySum / deliveryLatencyCount) * 10) / 10
        : null,
    uniqueStations: stations.size,
    uniqueDestStations: destStations.size,
    uniqueCargos: cargos.size,
    uniqueWagonTypes: wagonTypes.size,
    uniqueApprovers: approvers.size,
  };
}

// =====================================================
// Bekor qilish sabablari
// =====================================================
export function calculateCancellationReasons(records: PlanRecord[]): CancellationReasonStat[] {
  const valid = records.filter((r) => !r.hasDataQualityIssue && r.status === 'canceled');
  const counts = new Map<string, number>();
  for (const r of valid) {
    const reason = r.cancelReasonGroup ?? 'Sabab ko\'rsatilmagan';
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  const total = valid.length;
  return Array.from(counts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// =====================================================
// Stansiyalar statistikasi
// =====================================================
export function calculateStationStats(records: PlanRecord[], topN?: number): StationStat[] {
  const valid = records.filter((r) => !r.hasDataQualityIssue);
  const map = new Map<string, StationStat>();

  for (const r of valid) {
    if (!r.stationRaw) continue;
    let s = map.get(r.stationRaw);
    if (!s) {
      s = {
        station: r.stationRaw,
        stationCode: r.stationCode,
        stationName: r.stationName,
        total: 0,
        fulfilled: 0,
        partial: 0,
        canceled: 0,
        pending: 0,
        requestedWagons: 0,
        suppliedWagons: 0,
        supplyRate: 0,
      };
      map.set(r.stationRaw, s);
    }
    s.total++;
    s[r.status]++;
    s.requestedWagons += r.requestedCount;
    s.suppliedWagons += r.suppliedCount;
  }

  const arr = Array.from(map.values());
  for (const s of arr) {
    s.supplyRate = s.requestedWagons > 0 ? Math.round((s.suppliedWagons / s.requestedWagons) * 10000) / 100 : 0;
  }

  const sorted = arr.sort((a, b) => b.total - a.total);
  return topN ? sorted.slice(0, topN) : sorted;
}

// =====================================================
// Yuk turi statistikasi
// =====================================================
export function calculateCargoStats(records: PlanRecord[], topN?: number): CargoStat[] {
  const valid = records.filter((r) => !r.hasDataQualityIssue);
  const map = new Map<string, CargoStat>();

  for (const r of valid) {
    if (!r.cargoRaw) continue;
    let c = map.get(r.cargoRaw);
    if (!c) {
      c = {
        cargo: r.cargoRaw,
        cargoCode: r.cargoCode,
        cargoName: r.cargoName,
        total: 0,
        requestedWagons: 0,
        suppliedWagons: 0,
        supplyRate: 0,
      };
      map.set(r.cargoRaw, c);
    }
    c.total++;
    c.requestedWagons += r.requestedCount;
    c.suppliedWagons += r.suppliedCount;
  }

  const arr = Array.from(map.values());
  for (const c of arr) {
    c.supplyRate = c.requestedWagons > 0 ? Math.round((c.suppliedWagons / c.requestedWagons) * 10000) / 100 : 0;
  }

  const sortedCargo = arr.sort((a, b) => b.total - a.total);
  return topN ? sortedCargo.slice(0, topN) : sortedCargo;
}

// =====================================================
// Vagon turlari
// =====================================================
export function calculateWagonTypeStats(records: PlanRecord[]): WagonTypeStat[] {
  const valid = records.filter((r) => !r.hasDataQualityIssue);
  const map = new Map<string, WagonTypeStat>();

  for (const r of valid) {
    if (!r.wagonType) continue;
    let w = map.get(r.wagonType);
    if (!w) {
      w = {
        wagonType: r.wagonType,
        total: 0,
        requestedWagons: 0,
        suppliedWagons: 0,
        supplyRate: 0,
      };
      map.set(r.wagonType, w);
    }
    w.total++;
    w.requestedWagons += r.requestedCount;
    w.suppliedWagons += r.suppliedCount;
  }

  const arr = Array.from(map.values());
  for (const w of arr) {
    w.supplyRate = w.requestedWagons > 0 ? Math.round((w.suppliedWagons / w.requestedWagons) * 10000) / 100 : 0;
  }

  return arr.sort((a, b) => b.total - a.total);
}

// =====================================================
// Kunlik dinamika
// =====================================================
export function calculateDailyDynamics(records: PlanRecord[]): DailyPointStat[] {
  const valid = records.filter((r) => !r.hasDataQualityIssue && r.requestEnteredAt);
  const map = new Map<string, DailyPointStat>();

  for (const r of valid) {
    const d = r.requestEnteredAt as Date;
    const key = d.toISOString().slice(0, 10);
    let p = map.get(key);
    if (!p) {
      p = {
        date: key,
        total: 0,
        approved: 0,
        canceled: 0,
        fulfilled: 0,
        requestedWagons: 0,
        suppliedWagons: 0,
      };
      map.set(key, p);
    }
    p.total++;
    if (r.approvedAt) p.approved++;
    if (r.status === 'canceled') p.canceled++;
    if (r.status === 'fulfilled') p.fulfilled++;
    p.requestedWagons += r.requestedCount;
    p.suppliedWagons += r.suppliedCount;
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// =====================================================
// Tasdiqlovchilar
// =====================================================
export function calculateApproverStats(records: PlanRecord[], topN?: number): ApproverStat[] {
  const valid = records.filter((r) => !r.hasDataQualityIssue);
  const map = new Map<string, ApproverStat>();

  for (const r of valid) {
    if (!r.approvedBy) continue;
    let a = map.get(r.approvedBy);
    if (!a) {
      a = { approver: r.approvedBy, total: 0, approved: 0, canceled: 0 };
      map.set(r.approvedBy, a);
    }
    a.total++;
    if (r.approvedAt) a.approved++;
    if (r.status === 'canceled') a.canceled++;
  }

  const sortedApprovers = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return topN ? sortedApprovers.slice(0, topN) : sortedApprovers;
}

// =====================================================
// Anomaliyalar
// =====================================================
export function calculatePlanAnomalies(records: PlanRecord[]): PlanAnomaly[] {
  const anomalies: PlanAnomaly[] = [];
  const valid = records.filter((r) => !r.hasDataQualityIssue);

  // Uzoq tasdiqlash (> 14 kun)
  const longApproval = valid.filter((r) => r.approvalLatencyDays !== null && r.approvalLatencyDays > 14);
  if (longApproval.length > 0) {
    anomalies.push({
      id: 'long-approval',
      type: 'long-approval',
      severity: longApproval.length > 100 ? 'high' : longApproval.length > 20 ? 'medium' : 'low',
      title: 'Uzoq tasdiqlash',
      description: `${longApproval.length.toLocaleString()} ta talabnoma 14 kundan ortiq tasdiqlangan`,
      relatedRecordIds: longApproval.slice(0, 50).map((r) => r.id),
      metric: longApproval.length,
    });
  }

  // Uzoq yetkazib berish (> 10 kun)
  const longDelivery = valid.filter((r) => r.deliveryLatencyDays !== null && r.deliveryLatencyDays > 10);
  if (longDelivery.length > 0) {
    anomalies.push({
      id: 'long-delivery',
      type: 'long-delivery',
      severity: longDelivery.length > 1000 ? 'high' : longDelivery.length > 100 ? 'medium' : 'low',
      title: 'Uzoq yetkazish',
      description: `${longDelivery.length.toLocaleString()} ta vagon 10 kundan ortiq vaqtda yetib borgan`,
      relatedRecordIds: longDelivery.slice(0, 50).map((r) => r.id),
      metric: longDelivery.length,
    });
  }

  // Tez-tez bekor qiluvchi stansiyalar
  const cancelByStation = new Map<string, number>();
  for (const r of valid) {
    if (r.status === 'canceled' && r.stationRaw) {
      cancelByStation.set(r.stationRaw, (cancelByStation.get(r.stationRaw) ?? 0) + 1);
    }
  }
  const frequentCancelers = Array.from(cancelByStation.entries())
    .filter(([, n]) => n > 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (frequentCancelers.length > 0) {
    anomalies.push({
      id: 'frequent-cancel',
      type: 'frequent-cancel',
      severity: frequentCancelers[0][1] > 200 ? 'high' : 'medium',
      title: 'Tez-tez bekor qiluvchi stansiyalar',
      description: `${frequentCancelers.length} ta stansiyada 50 dan ortiq bekor qilish: ${frequentCancelers
        .slice(0, 3)
        .map(([s, n]) => `${s} (${n})`)
        .join(', ')}`,
      relatedRecordIds: [],
      metric: frequentCancelers.length,
    });
  }

  // Ma'lumot sifati
  const qualityIssues = records.filter((r) => r.hasDataQualityIssue);
  if (qualityIssues.length > 0) {
    anomalies.push({
      id: 'data-quality',
      type: 'data-quality',
      severity: qualityIssues.length > 1000 ? 'high' : qualityIssues.length > 100 ? 'medium' : 'low',
      title: 'Ma\'lumot sifati muammolari',
      description: `${qualityIssues.length.toLocaleString()} qatorda ustun siljishi aniqlandi`,
      relatedRecordIds: qualityIssues.slice(0, 50).map((r) => r.id),
      metric: qualityIssues.length,
    });
  }

  return anomalies;
}

// =====================================================
// Unique qiymatlar (filterlar uchun)
// =====================================================
export function extractUniqueValues(records: PlanRecord[]) {
  const stations = new Set<string>();
  const destStations = new Set<string>();
  const cargos = new Set<string>();
  const wagonTypes = new Set<string>();
  const approvers = new Set<string>();

  for (const r of records) {
    if (r.hasDataQualityIssue) continue;
    if (r.stationRaw) stations.add(r.stationRaw);
    if (r.destStationRaw) destStations.add(r.destStationRaw);
    if (r.cargoRaw) cargos.add(r.cargoRaw);
    if (r.wagonType) wagonTypes.add(r.wagonType);
    if (r.approvedBy) approvers.add(r.approvedBy);
  }

  return {
    stations: Array.from(stations).sort(),
    destStations: Array.from(destStations).sort(),
    cargos: Array.from(cargos).sort(),
    wagonTypes: Array.from(wagonTypes).sort(),
    approvers: Array.from(approvers).sort(),
  };
}
