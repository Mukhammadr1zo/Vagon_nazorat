"use client";

import Link from 'next/link';
import { ArrowLeft, Upload, Package } from 'lucide-react';
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
import type { CargoStat } from '@/lib/plans/plan-types';
import { cn } from '@/lib/utils';

export default function PlanCargoPage() {
  const { isHydrated, hasData, cargoStats } = usePlanData();

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

  const columns: DetailColumn<CargoStat>[] = [
    {
      key: 'cargo',
      label: 'Yuk turi',
      format: (r) => (
        <div>
          <div className="font-medium">{r.cargoName || '—'}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{r.cargoCode}</div>
        </div>
      ),
    },
    { key: 'total', label: 'Talabnoma', align: 'right' },
    {
      key: 'requestedWagons',
      label: 'Talab qilingan (vagon)',
      align: 'right',
      format: (r) => r.requestedWagons.toLocaleString(),
    },
    {
      key: 'suppliedWagons',
      label: 'Ta\'minlangan (vagon)',
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
            <Package className="size-6 text-primary" />
            Yuk turlari tahlili
          </h1>
          <p className="text-sm text-muted-foreground">
            Jami {formatNumber(cargoStats.length)} ta yuk turi bo'yicha statistika
          </p>
        </div>
        <SheetTabs />
      </div>

      <PlanFiltersPanel />

      <PlanDetailTable
        rows={cargoStats}
        columns={columns}
        searchFields={['cargoName', 'cargoCode']}
        defaultSortKey="total"
        pageSize={30}
      />
    </div>
  );
}
