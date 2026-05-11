"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDays, formatNumber, truncate } from '@/components/shared/format';
import type { StationStat } from '@/lib/types';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function StationsPage() {
  const { stationStats, hasData } = useData();
  if (!hasData) return <EmptyState />;

  const top10 = stationStats.slice(0, 10).map((s) => ({
    name: s.name,
    outbound: s.outboundShipments,
    inbound: s.inboundShipments,
  }));

  const columns: Column<StationStat>[] = [
    { key: 'station', header: 'Stansiya', accessor: (r) => r.name, render: (r) => (
      <span>
        {r.code && <span className="font-mono text-muted-foreground text-[10px] mr-1.5">{r.code}</span>}
        {r.name}
      </span>
    ) },
    { key: 'total', header: 'Jami', accessor: (r) => r.totalShipments, align: 'right' },
    { key: 'out', header: 'Jo\'natildi', accessor: (r) => r.outboundShipments, align: 'right' },
    { key: 'in', header: 'Qabul', accessor: (r) => r.inboundShipments, align: 'right' },
    { key: 'wagons', header: 'Vagonlar', accessor: (r) => r.uniqueWagons, align: 'right' },
    { key: 'wait', header: 'O\'rt. yetkazish', accessor: (r) => r.avgWaitMinutes, render: (r) => formatDays(r.avgWaitMinutes / 1440), align: 'right' },
    { key: 'topCargo', header: 'Asosiy yuk', accessor: (r) => r.topCargo, render: (r) => <span title={r.topCargo}>{truncate(r.topCargo, 30)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Jami stansiyalar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(stationStats.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Eng band</div>
          <div className="text-sm font-medium mt-1 truncate">{stationStats[0]?.name || '—'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top stansiya jo'natma</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(stationStats[0]?.totalShipments || 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top stansiya vagonlari</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(stationStats[0]?.uniqueWagons || 0)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top 10 stansiya — kirim/chiqim</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="outbound" fill="var(--chart-1)" name="Jo'natildi" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inbound" fill="var(--chart-2)" name="Qabul" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Barcha stansiyalar</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={stationStats} columns={columns} defaultSortKey="total" searchPlaceholder="Stansiya qidirish..." searchAccessor={(r) => `${r.code} ${r.name}`} />
        </CardContent>
      </Card>
    </div>
  );
}
