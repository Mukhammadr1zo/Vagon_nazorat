// =====================================================
// PLAN INSIGHTS — Avtomatik xulosa va tavsiyalar generator
// Rahbariyat uchun "bir qarashda yechim" beradigan tahlil
// =====================================================

import type { PlanRecord, PlanKPIs } from './plan-types';

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';
export type InsightCategory = 'performance' | 'cancellation' | 'efficiency' | 'risk' | 'opportunity';

export interface PlanInsight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  description: string;
  recommendation: string;
  metric: string;
  trend?: 'up' | 'down' | 'stable';
  priority: number; // 1-10, yuqori = muhimroq
}

// =====================================================
// Tavsiya thresholds (chegaralar)
// =====================================================
const THRESHOLDS = {
  CANCELLATION_CRITICAL: 20, // % > 20 = kritik
  CANCELLATION_WARNING: 10,
  SUPPLY_RATE_CRITICAL: 60, // % < 60 = kritik
  SUPPLY_RATE_WARNING: 80,
  APPROVAL_DAYS_WARNING: 7,
  APPROVAL_DAYS_CRITICAL: 14,
  DELIVERY_DAYS_WARNING: 7,
  DELIVERY_DAYS_CRITICAL: 14,
  STATION_CANCEL_THRESHOLD: 30, // % stansiya darajasida
  CARGO_CONCENTRATION_THRESHOLD: 40, // % bitta yuk turi
};

// =====================================================
// Asosiy generator
// =====================================================
export function generatePlanInsights(
  records: PlanRecord[],
  kpis: PlanKPIs,
): PlanInsight[] {
  const insights: PlanInsight[] = [];
  const valid = records.filter((r) => !r.hasDataQualityIssue);

  if (valid.length === 0) return insights;

  // --- 1. Bekor qilish darajasi ---
  if (kpis.cancellationRatePercent >= THRESHOLDS.CANCELLATION_CRITICAL) {
    insights.push({
      id: 'cancel-critical',
      severity: 'critical',
      category: 'cancellation',
      title: `Bekor qilish darajasi yuqori: ${kpis.cancellationRatePercent.toFixed(1)}%`,
      description: `Har 5 ta talabnomadan 1 tasi bekor qilingan. Bu sanoat o'rtacha ko'rsatkichidan (~10%) 2 baravar yuqori.`,
      recommendation: 'Eng tez-tez bekor qilingan sabablarni ko\'rib chiqing va talabnoma tasdiqlash jarayonini kuchaytirib, oldingi tekshiruvni joriy eting.',
      metric: `${kpis.canceledCount.toLocaleString()} ta bekor`,
      trend: 'up',
      priority: 10,
    });
  } else if (kpis.cancellationRatePercent >= THRESHOLDS.CANCELLATION_WARNING) {
    insights.push({
      id: 'cancel-warning',
      severity: 'warning',
      category: 'cancellation',
      title: `Bekor qilish darajasi o'rtacha yuqori: ${kpis.cancellationRatePercent.toFixed(1)}%`,
      description: `${kpis.canceledCount.toLocaleString()} ta talabnoma bekor qilingan. Trend kuzatuv ostida ushlash kerak.`,
      recommendation: 'Bekor qilish sabablarini guruhlab tahlil qiling — eng yirik 3 sababga e\'tibor qarating.',
      metric: `${kpis.cancellationRatePercent.toFixed(1)}%`,
      priority: 7,
    });
  } else if (kpis.cancellationRatePercent < 5 && kpis.totalRequests > 100) {
    insights.push({
      id: 'cancel-success',
      severity: 'success',
      category: 'cancellation',
      title: 'Bekor qilish darajasi past',
      description: `Atigi ${kpis.cancellationRatePercent.toFixed(1)}% talabnoma bekor qilingan — bu juda yaxshi ko'rsatkich.`,
      recommendation: 'Mavjud tasdiqlash jarayonini saqlab qoling.',
      metric: `${kpis.cancellationRatePercent.toFixed(1)}%`,
      priority: 2,
    });
  }

  // --- 2. Vagon ta'minlanish darajasi ---
  if (kpis.supplyRatePercent < THRESHOLDS.SUPPLY_RATE_CRITICAL) {
    const gap = kpis.totalRequestedWagons - kpis.totalSuppliedWagons;
    insights.push({
      id: 'supply-critical',
      severity: 'critical',
      category: 'performance',
      title: `Vagon ta'minlanish darajasi past: ${kpis.supplyRatePercent.toFixed(1)}%`,
      description: `${gap.toLocaleString()} ta vagon yetishmadi. Bu yuk jo'natuvchilar uchun jiddiy muammo.`,
      recommendation: 'Vagon parki yetishmaslik sabablarini aniqlang. Eng ko\'p talab qilingan vagon turi yuzasidan tezkor harakat kerak.',
      metric: `${kpis.totalSuppliedWagons.toLocaleString()} / ${kpis.totalRequestedWagons.toLocaleString()}`,
      trend: 'down',
      priority: 10,
    });
  } else if (kpis.supplyRatePercent < THRESHOLDS.SUPPLY_RATE_WARNING) {
    insights.push({
      id: 'supply-warning',
      severity: 'warning',
      category: 'performance',
      title: `Ta'minlanish darajasi o'rtacha: ${kpis.supplyRatePercent.toFixed(1)}%`,
      description: `Talab qilingan vagonlarning ${(100 - kpis.supplyRatePercent).toFixed(1)}% qismi ta'minlanmagan.`,
      recommendation: 'Eng kam ta\'minlanayotgan vagon turi va stansiyalarni aniqlang.',
      metric: `${kpis.supplyRatePercent.toFixed(1)}%`,
      priority: 6,
    });
  } else if (kpis.supplyRatePercent >= 95) {
    insights.push({
      id: 'supply-success',
      severity: 'success',
      category: 'performance',
      title: 'Vagon ta\'minlanishi a\'lo darajada',
      description: `${kpis.supplyRatePercent.toFixed(1)}% talablar to'liq ta'minlangan.`,
      recommendation: 'Joriy logistika rejasi samarali ishlamoqda.',
      metric: `${kpis.supplyRatePercent.toFixed(1)}%`,
      priority: 2,
    });
  }

  // --- 3. Tasdiqlash kechikishi ---
  if (
    kpis.avgApprovalLatencyDays !== null &&
    kpis.avgApprovalLatencyDays >= THRESHOLDS.APPROVAL_DAYS_CRITICAL
  ) {
    insights.push({
      id: 'approval-critical',
      severity: 'critical',
      category: 'efficiency',
      title: `Tasdiqlash juda sekin: ${kpis.avgApprovalLatencyDays.toFixed(1)} kun`,
      description: 'Talabnomalar 2 haftadan ko\'p vaqt davomida tasdiqlanmoqda. Bu mijoz tajribasiga salbiy ta\'sir qiladi.',
      recommendation: 'Tasdiqlash jarayonini avtomatlashtiring yoki tasdiqlovchilar sonini ko\'paytiring.',
      metric: `${kpis.avgApprovalLatencyDays.toFixed(1)} kun`,
      trend: 'up',
      priority: 9,
    });
  } else if (
    kpis.avgApprovalLatencyDays !== null &&
    kpis.avgApprovalLatencyDays >= THRESHOLDS.APPROVAL_DAYS_WARNING
  ) {
    insights.push({
      id: 'approval-warning',
      severity: 'warning',
      category: 'efficiency',
      title: `O'rtacha tasdiqlash vaqti: ${kpis.avgApprovalLatencyDays.toFixed(1)} kun`,
      description: 'Tasdiqlash uchun 1 haftadan ko\'p vaqt sarflanmoqda.',
      recommendation: 'Tasdiqlovchi shaxslar bo\'yicha taqsimot va eng sekin bo\'g\'imlarni aniqlang.',
      metric: `${kpis.avgApprovalLatencyDays.toFixed(1)} kun`,
      priority: 5,
    });
  }

  // --- 4. Stansiya darajasidagi muammolar ---
  const stationStats = new Map<string, { total: number; canceled: number }>();
  for (const r of valid) {
    if (!r.stationRaw) continue;
    const s = stationStats.get(r.stationRaw) ?? { total: 0, canceled: 0 };
    s.total++;
    if (r.status === 'canceled') s.canceled++;
    stationStats.set(r.stationRaw, s);
  }

  const problemStations = Array.from(stationStats.entries())
    .filter(([, s]) => s.total >= 50)
    .map(([name, s]) => ({
      name,
      rate: (s.canceled / s.total) * 100,
      canceled: s.canceled,
      total: s.total,
    }))
    .filter((s) => s.rate >= THRESHOLDS.STATION_CANCEL_THRESHOLD)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  if (problemStations.length > 0) {
    const top = problemStations[0];
    insights.push({
      id: 'station-cancel-hotspot',
      severity: 'critical',
      category: 'risk',
      title: `Muammoli stansiyalar aniqlandi (${problemStations.length} ta)`,
      description: `Eng yomon: "${top.name}" — talabnomalarning ${top.rate.toFixed(1)}% (${top.canceled} ta) bekor qilingan.`,
      recommendation: `Birinchi 3 ta stansiya bo'yicha alohida tekshiruv o'tkazing: ${problemStations
        .map((s) => `${s.name.slice(0, 30)}`)
        .join(', ')}`,
      metric: `${top.rate.toFixed(1)}%`,
      priority: 9,
    });
  }

  // --- 5. Yuk turi konsentratsiyasi (risk diversifikatsiyasi) ---
  const cargoMap = new Map<string, number>();
  for (const r of valid) {
    if (!r.cargoRaw) continue;
    cargoMap.set(r.cargoRaw, (cargoMap.get(r.cargoRaw) ?? 0) + 1);
  }
  const sortedCargos = Array.from(cargoMap.entries()).sort((a, b) => b[1] - a[1]);
  if (sortedCargos.length > 0) {
    const topCargo = sortedCargos[0];
    const topShare = (topCargo[1] / valid.length) * 100;
    if (topShare >= THRESHOLDS.CARGO_CONCENTRATION_THRESHOLD) {
      insights.push({
        id: 'cargo-concentration',
        severity: 'warning',
        category: 'risk',
        title: 'Yuk turi konsentratsiyasi yuqori',
        description: `Bitta yuk turi ("${topCargo[0].slice(0, 40)}") barcha talabnomalarning ${topShare.toFixed(1)}% ni tashkil etadi.`,
        recommendation: 'Diversifikatsiya strategiyasini ko\'rib chiqing — bu yuk turida muammo bo\'lsa, butun biznes ta\'sirlanadi.',
        metric: `${topShare.toFixed(1)}%`,
        priority: 6,
      });
    }
  }

  // --- 6. Ma'lumot sifati ---
  const qualityIssues = records.filter((r) => r.hasDataQualityIssue).length;
  if (qualityIssues > 0) {
    const issueRate = (qualityIssues / records.length) * 100;
    insights.push({
      id: 'data-quality',
      severity: issueRate > 5 ? 'warning' : 'info',
      category: 'risk',
      title: `Ma'lumot sifati muammosi: ${qualityIssues.toLocaleString()} qator`,
      description: `${issueRate.toFixed(2)}% qatorlarda ustun siljishi yoki nuqsonli qiymatlar mavjud.`,
      recommendation: 'Manbada Excel shablonini standartlashtiring. Bu qatorlar tahlilga kiritilmagan.',
      metric: `${issueRate.toFixed(2)}%`,
      priority: issueRate > 5 ? 5 : 3,
    });
  }

  // --- 7. Imkoniyatlar (positive) ---
  if (kpis.fulfillmentRatePercent >= 75 && kpis.cancellationRatePercent < 10) {
    insights.push({
      id: 'high-performance',
      severity: 'success',
      category: 'opportunity',
      title: 'Yuqori samaradorlik aniqlandi',
      description: `${kpis.fulfillmentRatePercent.toFixed(1)}% talabnomalar to'liq bajarilgan, bekor qilish ham past darajada.`,
      recommendation: 'Joriy operatsion modelni saqlab qoling va hajmni oshirishni ko\'rib chiqing.',
      metric: `${kpis.fulfillmentRatePercent.toFixed(1)}%`,
      trend: 'up',
      priority: 3,
    });
  }

  // Priorit bo'yicha tartiblaymiz
  return insights.sort((a, b) => b.priority - a.priority);
}

// =====================================================
// Executive Summary — eng muhim 3 ta xulosa
// =====================================================
export function getExecutiveSummary(insights: PlanInsight[]): {
  topInsights: PlanInsight[];
  overallHealth: 'critical' | 'warning' | 'good' | 'excellent';
  healthScore: number;
} {
  const topInsights = insights.slice(0, 4);

  const critical = insights.filter((i) => i.severity === 'critical').length;
  const warning = insights.filter((i) => i.severity === 'warning').length;
  const success = insights.filter((i) => i.severity === 'success').length;

  let healthScore = 100;
  healthScore -= critical * 25;
  healthScore -= warning * 10;
  healthScore += success * 5;
  healthScore = Math.max(0, Math.min(100, healthScore));

  let overallHealth: 'critical' | 'warning' | 'good' | 'excellent';
  if (healthScore < 40) overallHealth = 'critical';
  else if (healthScore < 70) overallHealth = 'warning';
  else if (healthScore < 90) overallHealth = 'good';
  else overallHealth = 'excellent';

  return { topInsights, overallHealth, healthScore };
}
