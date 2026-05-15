"use client";

import Link from 'next/link';
import { ArrowLeft, Upload, TrainTrack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { SheetTabs } from '@/components/plans/sheet-tabs';
import { PlanFiltersPanel } from '@/components/plans/plan-filters-panel';
import {
  PlanDetailTable,
  type DetailColumn,
} from '@/components/plans/plan-detail-table';
import { formatNumber } from '@/components/shared/format';
import type { StationStat } from '@/lib/plans/plan-types';
import { cn } from '@/lib/utils';

export default function PlanStationsPage() {
  const { isHydrated, hasData, stationStats } = usePlanData();

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

  const columns: DetailColumn<StationStat>[] = [
    {
      key: 'station',
      label: 'Stansiya',
      format: (r) => (
        <div>
          <div className="font-medium">{r.stationName || '—'}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{r.stationCode}</div>
        </div>
      ),
    },
    { key: 'total', label: 'Jami', align: 'right' },
    {
      key: 'fulfilled',
      label: 'Bajarilgan',
      align: 'right',
      format: (r) => <span className="text-chart-2">{r.fulfilled.toLocaleString()}</span>,
    },
    {
      key: 'partial',
      label: 'Qisman',
      align: 'right',
      format: (r) => <span className="text-chart-3">{r.partial.toLocaleString()}</span>,
    },
    {
      key: 'canceled',
      label: 'Bekor',
      align: 'right',
      format: (r) => <span className="text-destructive">{r.canceled.toLocaleString()}</span>,
    },
    {
      key: 'pending',
      label: 'Kutilmoqda',
      align: 'right',
      format: (r) => <span className="text-chart-4">{r.pending.toLocaleString()}</span>,
    },
    {
      key: 'requestedWagons',
      label: 'Talab (vagon)',
      align: 'right',
      format: (r) => r.requestedWagons.toLocaleString(),
    },
    {
      key: 'suppliedWagons',
      label: 'Ta\'min. (vagon)',
      align: 'right',
      format: (r) => r.suppliedWagons.toLocaleString(),
    },
    {
      key: 'supplyRate',
      label: '% Ta\'min.',
      align: 'right',
      format: (r) => (
        <span
          className={cn(
            'font-medium',
            r.supplyRate >= 90
              ? 'text-chart-2'
              : r.supplyRate >= 50
              ? 'text-chart-3'
              : 'text-destructive',
          )}
        >
          {r.supplyRate.toFixed(1)}%
        </span>
      ),
    },
  ];

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
            <TrainTrack className="size-6 text-primary" />
            Stansiyalar tahlili
          </h1>
          <p className="text-sm text-muted-foreground">
            Jami {formatNumber(stationStats.length)} ta stansiya — talabnoma soni, vagon ta'minlanishi
          </p>
        </div>
        <SheetTabs />
      </div>

      <PlanFiltersPanel />

      <PlanDetailTable
        rows={stationStats}
        columns={columns}
        searchFields={['stationName', 'stationCode']}
        defaultSortKey="total"
        pageSize={30}
      />
    </div>
  );
}
