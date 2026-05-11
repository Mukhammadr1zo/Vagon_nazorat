"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SameDayDistanceGroup } from '@/lib/types';

interface Props {
  group: SameDayDistanceGroup;
}

function getTransitColor(days: number, avg: number): string {
  const ratio = days / avg;
  if (ratio <= 0.7) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  if (ratio <= 0.9) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500';
  if (ratio <= 1.1) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
  if (ratio <= 1.3) return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
  return 'bg-rose-500/15 text-rose-700 dark:text-rose-400';
}

function getRankLabel(days: number, avg: number): string {
  const ratio = days / avg;
  if (ratio <= 0.7) return 'Juda tez';
  if (ratio <= 0.9) return 'Tez';
  if (ratio <= 1.1) return "O'rta";
  if (ratio <= 1.3) return 'Sekin';
  return 'Juda sekin';
}

export function DeliveryTable({ group }: Props) {
  const avg = group.avgTransitDays;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Batafsil jadval — {group.senderStation} → {group.destStation}
          <span className="text-xs text-muted-foreground font-normal ml-2">
            {group.acceptanceDay} | {group.distanceKm > 0 ? `${group.distanceKm} km | ` : ''}{group.count} ta vagon
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Vagon nomer</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Jo'natuvchi firma</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Qabul qiluvchi</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Jo'natuvchi st.</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Manzil st.</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">Masofa</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">Yetib borish</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">Baho</th>
              </tr>
            </thead>
            <tbody>
              {group.shipments.map((s, i) => {
                const days = s.waitMinutes / 1440;
                const colorClass = getTransitColor(days, avg);
                const rank = getRankLabel(days, avg);
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-muted/50',
                      i === 0 && 'bg-emerald-500/5',
                      i === group.shipments.length - 1 && 'bg-rose-500/5',
                    )}
                  >
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-xs font-semibold">{s.wagonNumber}</td>
                    <td className="py-2.5 px-3 text-xs max-w-[180px] truncate" title={s.senderName}>
                      {s.senderName || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-xs max-w-[180px] truncate" title={s.receiverName}>
                      {s.receiverName || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-xs">{s.senderStationName || '—'}</td>
                    <td className="py-2.5 px-3 text-xs">{s.destStationName || '—'}</td>
                    <td className="py-2.5 px-3 text-xs text-right font-mono">
                      {s.distanceKm > 0 ? `${s.distanceKm} km` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn('text-xs font-bold px-2 py-1 rounded-md', colorClass)}>
                        {days.toFixed(1)} kun
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', colorClass)}>
                        {rank}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td colSpan={7} className="py-2.5 px-3 text-xs font-semibold">O'rtacha</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-xs font-bold px-2 py-1 rounded-md bg-primary/10 text-primary">
                    {avg.toFixed(1)} kun
                  </span>
                </td>
                <td></td>
              </tr>
              <tr className="bg-muted/20">
                <td colSpan={7} className="py-2 px-3 text-xs text-muted-foreground">Min — Maks</td>
                <td className="py-2 px-3 text-right text-xs text-muted-foreground font-mono">
                  {group.minTransitDays.toFixed(1)} — {group.maxTransitDays.toFixed(1)} kun
                </td>
                <td></td>
              </tr>
              <tr className="bg-muted/20">
                <td colSpan={7} className="py-2 px-3 text-xs text-muted-foreground">Farq</td>
                <td className="py-2 px-3 text-right text-xs font-bold text-rose-500 font-mono">
                  {group.spreadDays.toFixed(1)} kun
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
