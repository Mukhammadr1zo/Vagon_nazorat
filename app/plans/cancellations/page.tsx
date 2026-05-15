"use client";

import Link from 'next/link';
import { ArrowLeft, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { CancellationReasonsChart } from '@/components/plans/plan-charts';
import { SheetTabs } from '@/components/plans/sheet-tabs';
import { PlanFiltersPanel } from '@/components/plans/plan-filters-panel';
import { formatNumber } from '@/components/shared/format';
import { useMemo } from 'react';
import { truncate } from '@/components/shared/format';

export default function PlanCancellationsPage() {
  const { isHydrated, hasData, filtered, cancellationReasons } = usePlanData();

  const stationCancelStats = useMemo(() => {
    const map = new Map<string, { station: string; total: number; canceled: number }>();
    for (const r of filtered) {
      if (r.hasDataQualityIssue) continue;
      let s = map.get(r.stationRaw);
      if (!s) {
        s = { station: r.stationRaw, total: 0, canceled: 0 };
        map.set(r.stationRaw, s);
      }
      s.total++;
      if (r.status === 'canceled') s.canceled++;
    }
    return Array.from(map.values())
      .filter((s) => s.canceled > 0)
      .map((s) => ({
        ...s,
        rate: s.total > 0 ? (s.canceled / s.total) * 100 : 0,
      }))
      .sort((a, b) => b.canceled - a.canceled)
      .slice(0, 20);
  }, [filtered]);

  const cancelers = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || r.status !== 'canceled' || !r.canceledBy) continue;
      map.set(r.canceledBy, (map.get(r.canceledBy) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [filtered]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-10 text-center max-w-md">
          <p className="text-sm text-muted-foreground mb-4">Ma'lumot yo'q.</p>
          <Button asChild>
            <Link href="/plans/upload">
              <Upload className="size-4 mr-2" />
              Fayl yuklash
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalCancel = cancellationReasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/plans">
            <ArrowLeft className="size-4 mr-1" />
            Orqaga
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <XCircle className="size-6 text-destructive" />
            Bekor qilingan talabnomalar tahlili
          </h1>
          <p className="text-sm text-muted-foreground">
            Jami {formatNumber(totalCancel)} ta bekor qilish — sabab va manbalarini ko'ring
          </p>
        </div>
        <SheetTabs />
      </div>

      <PlanFiltersPanel />

      <CancellationReasonsChart />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Top 20 stansiya bo'yicha bekor qilishlar</h3>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {stationCancelStats.map((s) => (
              <div key={s.station} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="text-sm truncate">{truncate(s.station, 40)}</div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s.canceled} / {s.total}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-destructive w-12 text-right">
                    {s.rate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Top 15 bekor qiluvchi shaxslar</h3>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {cancelers.map((c) => (
              <div key={c.name} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="text-sm truncate">{truncate(c.name, 40)}</div>
                <span className="text-xs font-mono tabular-nums text-destructive">
                  {c.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
