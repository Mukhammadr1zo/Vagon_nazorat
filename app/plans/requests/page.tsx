"use client";

import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { PlansTable } from '@/components/plans/plans-table';
import { SheetTabs } from '@/components/plans/sheet-tabs';
import { PlanFiltersPanel } from '@/components/plans/plan-filters-panel';

export default function PlanRequestsPage() {
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
          <p className="text-sm text-muted-foreground mb-4">
            Ma'lumot yo'q. Avval xlsx fayl yuklang.
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
    <div className="space-y-4">
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
          <h1 className="text-2xl font-semibold">Talabnomalar</h1>
          <p className="text-sm text-muted-foreground">
            Barcha talabnomalar ro'yxati, filtr va saralash bilan
          </p>
        </div>
        <SheetTabs />
      </div>

      <PlanFiltersPanel />

      <PlansTable />
    </div>
  );
}
