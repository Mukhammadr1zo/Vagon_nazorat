"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate, formatKm, formatDays, formatNumber } from '@/components/shared/format';
import type { WagonStat } from '@/lib/types';

export default function WagonsPage() {
  const { wagonStats, hasData } = useData();
  if (!hasData) return <EmptyState />;

  const reusedWagons = wagonStats.filter((w) => w.trips > 1).length;
  const totalTrips = wagonStats.reduce((s, w) => s + w.trips, 0);
  const avgTrips = totalTrips / Math.max(1, wagonStats.length);

  const columns: Column<WagonStat>[] = [
    { key: 'wagonNumber', header: 'Vagon raqami', accessor: (r) => r.wagonNumber, render: (r) => <span className="font-mono">{r.wagonNumber}</span> },
    { key: 'trips', header: 'Reys', accessor: (r) => r.trips, align: 'right' },
    { key: 'routes', header: 'Marshrut', accessor: (r) => r.uniqueRoutes, align: 'right' },
    { key: 'cargo', header: 'Yuk turi', accessor: (r) => r.uniqueCargoTypes, align: 'right' },
    { key: 'distance', header: 'Jami masofa', accessor: (r) => r.totalDistanceKm, render: (r) => formatKm(r.totalDistanceKm), align: 'right' },
    { key: 'wait', header: 'O\'rt. yetkazish', accessor: (r) => r.avgWaitMinutes, render: (r) => formatDays(r.avgWaitMinutes / 1440), align: 'right' },
    { key: 'firstSeen', header: 'Birinchi', accessor: (r) => r.firstSeen, render: (r) => formatDate(r.firstSeen), align: 'right' },
    { key: 'lastSeen', header: 'So\'nggi', accessor: (r) => r.lastSeen, render: (r) => formatDate(r.lastSeen), align: 'right' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Unique vagonlar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(wagonStats.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Jami reys</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(totalTrips)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Qayta ishlatilgan</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(reusedWagons)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">O'rt. reys/vagon</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{avgTrips.toFixed(2)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Vagonlar bo'yicha to'liq statistika</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={wagonStats}
            columns={columns}
            defaultSortKey="trips"
            searchPlaceholder="Vagon raqami bo'yicha qidirish..."
            searchAccessor={(r) => r.wagonNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
}
