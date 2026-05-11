"use client";

import {
  Train, Package2, Building2, Route, MapPin, Boxes,
  Gauge, Clock, Zap, Turtle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { formatNumber, formatKm, formatDays } from '@/components/shared/format';

const KPIS = (k: ReturnType<typeof useData>['kpis']) => [
  { label: 'Jami jo\'natma', value: formatNumber(k.totalShipments), icon: Package2, accent: 'text-chart-1' },
  { label: 'Unique vagonlar', value: formatNumber(k.uniqueWagons), icon: Train, accent: 'text-chart-2' },
  { label: 'Marshrutlar', value: formatNumber(k.uniqueRoutes), icon: Route, accent: 'text-chart-3' },
  { label: 'Jo\'natuvchilar', value: formatNumber(k.uniqueSenders), icon: Building2, accent: 'text-chart-4' },
  { label: 'Qabul qiluvchi', value: formatNumber(k.uniqueReceivers), icon: Building2, accent: 'text-chart-5' },
  { label: 'Stansiyalar', value: '', icon: MapPin, accent: 'text-chart-1', special: 'stations' as const },
  { label: 'Yuk turlari', value: formatNumber(k.uniqueCargoTypes), icon: Boxes, accent: 'text-chart-2' },
  { label: 'Jami masofa', value: formatKm(k.totalDistanceKm), icon: Gauge, accent: 'text-chart-3' },
  { label: 'O\'rt. yetkazib berish', value: formatDays(k.avgTransitDays), icon: Clock, accent: 'text-chart-4' },
  { label: 'Median', value: formatDays(k.medianTransitDays), icon: Clock, accent: 'text-chart-5' },
  { label: 'Eng tez', value: formatDays(k.fastestTransitDays), icon: Zap, accent: 'text-chart-2' },
  { label: 'Eng sekin', value: formatDays(k.slowestTransitDays), icon: Turtle, accent: 'text-chart-3' },
];

export function KPIGrid() {
  const { kpis, stationStats } = useData();
  const items = KPIS(kpis).map((it) =>
    it.special === 'stations' ? { ...it, value: formatNumber(stationStats.length) } : it,
  );

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{it.label}</span>
              <Icon className={`size-4 ${it.accent}`} />
            </div>
            <div className="text-xl font-semibold tabular-nums">{it.value || '—'}</div>
          </Card>
        );
      })}
    </div>
  );
}
