"use client";

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Zap } from 'lucide-react';
import { formatDate, formatDays, formatKm, truncate } from '@/components/shared/format';
import type { DailyRouteGroup } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Bir kun + bir marshrut bo'yicha barcha jo'natmalar yonma-yon.
 * Bir xil sharoit, lekin har xil tezlik — to'g'ridan-to'g'ri taqqoslash.
 */
function DailyGroupCardInner({ group }: { group: DailyRouteGroup }) {
  // Bar chiziq uzunligi uchun maksimum kun
  const maxDays = Math.max(group.maxTransitDays, 1);

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-sm tabular-nums">{formatDate(group.acceptanceDayTs)}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">
            {group.senderStation} <span className="text-muted-foreground mx-1">→</span> {group.destStation}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 ml-auto">
          <span><strong className="text-foreground">{group.count}</strong> vagon</span>
          <span><strong className="text-foreground">{group.uniqueSenders}</strong> jo'natuvchi</span>
          {group.distanceKm > 0 && <span><strong className="text-foreground">{formatKm(group.distanceKm)}</strong></span>}
          <span>Median: <strong className="text-foreground">{formatDays(group.medianTransitDays)}</strong></span>
          <span>Farq: <strong className="text-foreground">{formatDays(group.spreadDays)}</strong></span>
        </div>
      </div>

      {/* Yonma-yon barcha jo'natmalar */}
      <div className="space-y-1.5">
        {group.shipments.map((s, idx) => {
          const days = s.waitMinutes / 1440;
          const dev = group.medianTransitDays > 0 ? ((days - group.medianTransitDays) / group.medianTransitDays) * 100 : 0;
          const barPct = (days / maxDays) * 100;
          const medianPct = (group.medianTransitDays / maxDays) * 100;
          const isFastest = idx === 0;
          const isSlowest = idx === group.shipments.length - 1;
          const devCls = dev <= -25 ? 'text-chart-3 font-semibold' : dev >= 25 ? 'text-chart-1 font-semibold' : dev < 0 ? 'text-chart-3' : dev > 0 ? 'text-chart-1' : 'text-muted-foreground';
          const barColor = dev <= -25 ? 'bg-chart-3' : dev >= 25 ? 'bg-chart-1' : 'bg-chart-2/70';

          return (
            <div
              key={s.id}
              className={cn(
                'rounded-md px-2 py-1.5 border',
                isFastest && dev <= -25 ? 'border-chart-3/40 bg-chart-3/5' :
                isSlowest && dev >= 25 ? 'border-chart-1/40 bg-chart-1/5' :
                'border-transparent',
              )}
            >
              {/* Row 1: identifikatsiya */}
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className="text-muted-foreground tabular-nums w-4 text-right">{idx + 1}.</span>
                {isFastest && dev <= -25 && <Zap className="size-3 text-chart-3 shrink-0" />}
                <span className="font-mono shrink-0">{s.wagonNumber}</span>
                <span className="text-muted-foreground font-mono text-[10px] shrink-0">{s.invoiceNumber}</span>
                <span className="truncate flex-1" title={s.senderName}>
                  {truncate(s.senderName, 32)}
                </span>
                <span className="truncate hidden md:inline shrink-0 max-w-[160px] text-muted-foreground" title={s.receiverName}>
                  → {truncate(s.receiverName, 22)}
                </span>
              </div>

              {/* Row 2: kun bar + qiymatlar */}
              <div className="flex items-center gap-2 text-xs ml-6">
                <div className="relative flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn('absolute inset-y-0 left-0 rounded-full', barColor)} style={{ width: `${barPct}%` }} />
                  {/* median marker */}
                  <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-foreground/80" style={{ left: `${medianPct}%` }} title={`Median: ${formatDays(group.medianTransitDays)}`} />
                </div>
                <span className="font-semibold tabular-nums shrink-0 w-16 text-right">{formatDays(days)}</span>
                <span className={cn('tabular-nums shrink-0 w-14 text-right', devCls)}>
                  {dev > 0 ? '+' : ''}{dev.toFixed(0)}%
                </span>
              </div>

              {/* Row 3: ekstra detail (vaqt + yuk) */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground ml-6 mt-0.5">
                <span>Qabul: <span className="tabular-nums text-foreground/80">{formatDate(s.acceptanceAt, true)}</span></span>
                <span>Chiqish: <span className="tabular-nums text-foreground/80">{formatDate(s.departureAt, true)}</span></span>
                {s.cargoName && <span title={s.cargoName}>Yuk: <span className="text-foreground/80">{truncate(s.cargoName, 24)}</span></span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export const DailyGroupCard = memo(DailyGroupCardInner, (a, b) => a.group.groupKey === b.group.groupKey);
