"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatKm, formatNumber, truncate } from '@/components/shared/format';
import type { CargoStat } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function CargoPage() {
  const { cargoStats, hasData } = useData();
  if (!hasData) return <EmptyState />;

  const top = cargoStats.slice(0, 8).map((c) => ({
    name: truncate(c.name, 24),
    value: c.shipments,
  }));

  const columns: Column<CargoStat>[] = [
    { key: 'name', header: 'Yuk turi', accessor: (r) => r.name, render: (r) => (
      <span>
        {r.code && <span className="font-mono text-muted-foreground text-[10px] mr-1.5">{r.code}</span>}
        {r.name}
      </span>
    ) },
    { key: 'shipments', header: 'Jo\'natma', accessor: (r) => r.shipments, align: 'right' },
    { key: 'wagons', header: 'Vagonlar', accessor: (r) => r.uniqueWagons, align: 'right' },
    { key: 'distance', header: 'Jami км', accessor: (r) => r.totalDistanceKm, render: (r) => formatKm(r.totalDistanceKm), align: 'right' },
    { key: 'avgDist', header: 'O\'rt. км', accessor: (r) => r.avgDistanceKm, render: (r) => formatKm(r.avgDistanceKm), align: 'right' },
    { key: 'topSender', header: 'Asosiy jo\'natuvchi', accessor: (r) => r.topSender, render: (r) => <span title={r.topSender}>{truncate(r.topSender, 26)}</span> },
    { key: 'topRoute', header: 'Asosiy marshrut', accessor: (r) => r.topRoute, render: (r) => <span title={r.topRoute}>{truncate(r.topRoute, 30)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Yuk turlari</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(cargoStats.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Asosiy yuk</div>
          <div className="text-sm font-medium mt-1 truncate" title={cargoStats[0]?.name}>{truncate(cargoStats[0]?.name || '—', 26)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Asosiy yuk ulushi</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">
            {cargoStats[0] && cargoStats.length > 0
              ? `${((cargoStats[0].shipments / cargoStats.reduce((s, c) => s + c.shipments, 0)) * 100).toFixed(1)}%`
              : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Eng uzoq yuk</div>
          <div className="text-sm font-medium mt-1 truncate">
            {[...cargoStats].sort((a, b) => b.avgDistanceKm - a.avgDistanceKm)[0]?.name?.slice(0, 24) || '—'}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top 8 yuk turi taqsimoti</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={top} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={2}>
                  {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Barcha yuk turlari</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={cargoStats} columns={columns} defaultSortKey="shipments" searchPlaceholder="Yuk qidirish..." searchAccessor={(r) => `${r.code} ${r.name}`} />
        </CardContent>
      </Card>
    </div>
  );
}
