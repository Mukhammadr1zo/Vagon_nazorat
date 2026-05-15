"use client";

import Link from 'next/link';
import {
  Upload,
  ClipboardList,
  Table2,
  XCircle,
  TrainTrack,
  Package,
  Train,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlanData } from '@/lib/plans/plan-context';
import { PlanKPICards } from '@/components/plans/plan-kpi-cards';
import { SheetTabs } from '@/components/plans/sheet-tabs';
import { PlanAnomaliesPanel } from '@/components/plans/plan-anomalies-panel';
import { PlanFiltersPanel } from '@/components/plans/plan-filters-panel';
import {
  FulfillmentChart,
  CancellationReasonsChart,
  DailyDynamicsChart,
  StationPerformanceChart,
  WagonTypeChart,
  CargoTypeChart,
} from '@/components/plans/plan-charts';

export default function PlansDashboardPage() {
  const { isHydrated, hasData } = usePlanData();

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
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 grid place-items-center mb-4">
            <ClipboardList className="size-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Reja Modulu</h2>
          <p className="text-sm text-muted-foreground mb-6">
            RJU stansiyalari talabnomalari va rejalarini tahlil qilish uchun xlsx faylni yuklang.
            Bu modul mavjud Shipment dashboardidan alohida ishlaydi.
          </p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reja Tahlili</h1>
          <p className="text-sm text-muted-foreground">
            RJU stansiyalari talabnomalari va rejaning bajarilishi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SheetTabs />
          <Button asChild size="sm" variant="outline">
            <Link href="/plans/requests">
              <Table2 className="size-4 mr-1.5" />
              Jadval
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/plans/stations">
              <TrainTrack className="size-4 mr-1.5" />
              Stansiyalar
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/plans/cargo">
              <Package className="size-4 mr-1.5" />
              Yuk turlari
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/plans/wagon-types">
              <Train className="size-4 mr-1.5" />
              Vagon turlari
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/plans/cancellations">
              <XCircle className="size-4 mr-1.5" />
              Bekor qilingan
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/plans/upload">
              <Upload className="size-4 mr-1.5" />
              Yangi fayl
            </Link>
          </Button>
        </div>
      </div>

      <PlanFiltersPanel />

      <PlanKPICards />

      <div className="grid gap-4 lg:grid-cols-2">
        <FulfillmentChart />
        <CargoTypeChart />
        <CancellationReasonsChart />
        <WagonTypeChart />
      </div>

      <DailyDynamicsChart />

      <div className="grid gap-4 lg:grid-cols-2">
        <StationPerformanceChart />
        <PlanAnomaliesPanel />
      </div>
    </div>
  );
}
