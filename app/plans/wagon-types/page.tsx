"use client";

import Link from 'next/link';
import { ArrowLeft, Upload, Train } from 'lucide-react';
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
import type { WagonTypeStat } from '@/lib/plans/plan-types';
import { cn } from '@/lib/utils';

export default function PlanWagonTypesPage() {
  const { isHydrated, hasData, wagonTypeStats } = usePlanData();

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

  const columns: DetailColumn<WagonTypeStat>[] = [
    {
      key: 'wagonType',
      label: 'Vagon turi',
      format: (r) => <span className="font-medium">{r.wagonType}</span>,
    },
    { key: 'total', label: 'Talabnoma', align: 'right' },
    {
      key: 'requestedWagons',
      label: 'Talab qilingan',
      align: 'right',
      format: (r) => r.requestedWagons.toLocaleString(),
    },
    {
      key: 'suppliedWagons',
      label: 'Ta\'minlangan',
      align: 'right',
      format: (r) => r.suppliedWagons.toLocaleString(),
    },
    {
      key: 'supplyRate',
      label: '% Ta\'minlanish',
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
            <Train className="size-6 text-primary" />
            Vagon turlari tahlili
          </h1>
          <p className="text-sm text-muted-foreground">
            Jami {formatNumber(wagonTypeStats.length)} ta vagon turi bo'yicha ta'minlanish
          </p>
        </div>
        <SheetTabs />
      </div>

      <PlanFiltersPanel />

      <PlanDetailTable
        rows={wagonTypeStats}
        columns={columns}
        searchFields={['wagonType']}
        defaultSortKey="total"
        pageSize={30}
      />
    </div>
  );
}
