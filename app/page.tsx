"use client";

import { useData } from '@/lib/data-context';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { OverviewCharts } from '@/components/dashboard/overview-charts';
import { RecentShipments } from '@/components/dashboard/recent-shipments';
import { QuickAnomalies } from '@/components/dashboard/quick-anomalies';
import { TopCompaniesMini } from '@/components/dashboard/top-companies-mini';
import { EmptyState } from '@/components/shared/empty-state';

export default function DashboardPage() {
  const { hasData, isHydrated } = useData();

  if (!isHydrated) {
    return <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!hasData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <KPIGrid />
      <OverviewCharts />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><RecentShipments /></div>
        <div className="space-y-4">
          <QuickAnomalies />
          <TopCompaniesMini />
        </div>
      </div>
    </div>
  );
}
