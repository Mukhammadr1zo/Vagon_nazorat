"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatKm, formatDays, formatNumber, truncate } from '@/components/shared/format';
import type { RouteStat } from '@/lib/types';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function RoutesPage() {
  const { routeStats, hasData } = useData();
  if (!hasData) return <EmptyState />;

  const top10 = routeStats.slice(0, 10).map((r) => ({
    name: `${r.senderStation}→${r.destStation}`,
    shipments: r.shipments,
  }));

  const columns: Column<RouteStat>[] = [
    { key: 'route', header: 'Marshrut', accessor: (r) => r.key, render: (r) => (
      <div className="space-x-1">
        <span className="font-medium">{r.senderStation}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium">{r.destStation}</span>
      </div>
    ) },
    { key: 'shipments', header: 'Jo\'natma', accessor: (r) => r.shipments, align: 'right' },
    { key: 'wagons', header: 'Vagonlar', accessor: (r) => r.uniqueWagons, align: 'right' },
    { key: 'distance', header: 'Jami км', accessor: (r) => r.totalDistanceKm, render: (r) => formatKm(r.totalDistanceKm), align: 'right' },
    { key: 'wait', header: 'O\'rt. yetkazish', accessor: (r) => r.avgWaitMinutes, render: (r) => formatDays(r.avgWaitMinutes / 1440), align: 'right' },
    { key: 'topCargo', header: 'Asosiy yuk', accessor: (r) => r.topCargo, render: (r) => <span title={r.topCargo}>{truncate(r.topCargo, 28)}</span> },
    { key: 'topSender', header: 'Asosiy jo\'natuvchi', accessor: (r) => r.topSender, render: (r) => <span title={r.topSender}>{truncate(r.topSender, 28)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Marshrutlar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(routeStats.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Eng faol</div>
          <div className="text-sm font-medium mt-1 truncate">{routeStats[0]?.key || '—'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top marshrut jo'natma</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(routeStats[0]?.shipments || 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Eng uzun</div>
          <div className="text-sm font-medium mt-1">
            {formatKm(Math.max(0, ...routeStats.map((r) => r.totalDistanceKm / Math.max(1, r.shipments))))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top 10 marshrut</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="shipments" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Barcha marshrutlar</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={routeStats} columns={columns} defaultSortKey="shipments" searchPlaceholder="Marshrut qidirish..." searchAccessor={(r) => r.key} />
        </CardContent>
      </Card>
    </div>
  );
}
