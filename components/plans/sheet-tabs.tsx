"use client";

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanData } from '@/lib/plans/plan-context';
import { formatNumber } from '@/components/shared/format';
import type { PlanSheetKind } from '@/lib/plans/plan-types';

export function SheetTabs() {
  const { filters, setFilters, records } = usePlanData();

  const counts = {
    all: records.length,
    'reja-jadvali': records.filter((r) => r.sheetKind === 'reja-jadvali').length,
    'asosiy-reja': records.filter((r) => r.sheetKind === 'asosiy-reja').length,
  };

  const value: 'all' | PlanSheetKind = filters.sheetKind;

  return (
    <Tabs
      value={value}
      onValueChange={(v) =>
        setFilters({ ...filters, sheetKind: v as 'all' | PlanSheetKind })
      }
    >
      <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-grid">
        <TabsTrigger value="all" className="gap-2">
          Hammasi
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatNumber(counts.all)}
          </span>
        </TabsTrigger>
        <TabsTrigger value="reja-jadvali" className="gap-2">
          Reja Jadvali
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatNumber(counts['reja-jadvali'])}
          </span>
        </TabsTrigger>
        <TabsTrigger value="asosiy-reja" className="gap-2">
          Asosiy reja
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatNumber(counts['asosiy-reja'])}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
