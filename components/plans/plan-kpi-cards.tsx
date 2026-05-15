"use client";

import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Train,
  TrendingUp,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { formatNumber, formatDays } from '@/components/shared/format';

export function PlanKPICards() {
  const { kpis, records } = usePlanData();

  const qualityIssues = records.filter((r) => r.hasDataQualityIssue).length;

  const items = [
    {
      label: 'Jami talabnomalar',
      value: formatNumber(kpis.totalRequests),
      icon: ClipboardList,
      accent: 'text-chart-1',
    },
    {
      label: 'To\'liq bajarilgan',
      value: formatNumber(kpis.fulfilledCount),
      sub: `${kpis.fulfillmentRatePercent.toFixed(1)}%`,
      icon: CheckCircle2,
      accent: 'text-chart-2',
    },
    {
      label: 'Qisman bajarilgan',
      value: formatNumber(kpis.partialCount),
      icon: TrendingUp,
      accent: 'text-chart-3',
    },
    {
      label: 'Bekor qilingan',
      value: formatNumber(kpis.canceledCount),
      sub: `${kpis.cancellationRatePercent.toFixed(1)}%`,
      icon: XCircle,
      accent: 'text-destructive',
    },
    {
      label: 'Talab qilingan vagon',
      value: formatNumber(kpis.totalRequestedWagons),
      icon: Train,
      accent: 'text-chart-1',
    },
    {
      label: 'Ta\'minlangan vagon',
      value: formatNumber(kpis.totalSuppliedWagons),
      sub: `${kpis.supplyRatePercent.toFixed(1)}%`,
      icon: Train,
      accent: 'text-chart-2',
    },
    {
      label: 'O\'rt. tasdiqlash',
      value: formatDays(kpis.avgApprovalLatencyDays ?? 0),
      icon: Clock,
      accent: 'text-chart-4',
    },
    {
      label: 'O\'rt. yetkazib berish',
      value: formatDays(kpis.avgDeliveryLatencyDays ?? 0),
      icon: Clock,
      accent: 'text-chart-5',
    },
    {
      label: 'Stansiyalar',
      value: formatNumber(kpis.uniqueStations),
      sub: `${formatNumber(kpis.uniqueDestStations)} manzil`,
      icon: Building2,
      accent: 'text-chart-3',
    },
    {
      label: 'Yuk turlari',
      value: formatNumber(kpis.uniqueCargos),
      icon: ClipboardList,
      accent: 'text-chart-2',
    },
    {
      label: 'Vagon turlari',
      value: formatNumber(kpis.uniqueWagonTypes),
      icon: Train,
      accent: 'text-chart-1',
    },
    {
      label: 'Sifat muammosi',
      value: formatNumber(qualityIssues),
      icon: AlertTriangle,
      accent: qualityIssues > 0 ? 'text-chart-4' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {it.label}
              </span>
              <Icon className={`size-4 ${it.accent}`} />
            </div>
            <div className="text-xl font-semibold tabular-nums">{it.value || '—'}</div>
            {it.sub && (
              <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {it.sub}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
