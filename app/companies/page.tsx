"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatKm, formatDays, formatNumber, truncate } from '@/components/shared/format';
import type { CompanyStat } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function CompaniesPage() {
  const { companyStats, hasData } = useData();
  const [tab, setTab] = useState<'sender' | 'receiver'>('sender');
  if (!hasData) return <EmptyState />;

  const senders = companyStats.filter((c) => c.role === 'sender');
  const receivers = companyStats.filter((c) => c.role === 'receiver');

  const columns: Column<CompanyStat>[] = [
    { key: 'name', header: 'Kompaniya', accessor: (r) => r.name, render: (r) => <span title={r.name}>{truncate(r.name, 50)}</span> },
    { key: 'shipments', header: 'Jo\'natma', accessor: (r) => r.shipments, align: 'right' },
    { key: 'wagons', header: 'Vagonlar', accessor: (r) => r.uniqueWagons, align: 'right' },
    { key: 'routes', header: 'Marshrut', accessor: (r) => r.uniqueRoutes, align: 'right' },
    { key: 'distance', header: 'Jami км', accessor: (r) => r.totalDistanceKm, render: (r) => formatKm(r.totalDistanceKm), align: 'right' },
    { key: 'wait', header: 'O\'rt. yetkazish', accessor: (r) => r.avgWaitMinutes, render: (r) => formatDays(r.avgWaitMinutes / 1440), align: 'right' },
    { key: 'topCargo', header: 'Asosiy yuk', accessor: (r) => r.topCargo, render: (r) => <span title={r.topCargo}>{truncate(r.topCargo, 28)}</span> },
    { key: 'topPartner', header: 'Asosiy stansiya', accessor: (r) => r.topPartnerStation, render: (r) => <span title={r.topPartnerStation}>{truncate(r.topPartnerStation, 24)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Jo'natuvchilar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(senders.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Qabul qiluvchilar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(receivers.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top jo'natuvchi</div>
          <div className="text-sm font-medium mt-1 truncate" title={senders[0]?.name}>{truncate(senders[0]?.name || '—', 26)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top qabul qiluvchi</div>
          <div className="text-sm font-medium mt-1 truncate" title={receivers[0]?.name}>{truncate(receivers[0]?.name || '—', 26)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Kompaniyalar bo'yicha tahlil</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'sender' | 'receiver')}>
            <TabsList>
              <TabsTrigger value="sender">Jo'natuvchilar ({senders.length})</TabsTrigger>
              <TabsTrigger value="receiver">Qabul qiluvchilar ({receivers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="sender" className="mt-4">
              <DataTable data={senders} columns={columns} defaultSortKey="shipments" searchPlaceholder="Kompaniya qidirish..." searchAccessor={(r) => r.name} />
            </TabsContent>
            <TabsContent value="receiver" className="mt-4">
              <DataTable data={receivers} columns={columns} defaultSortKey="shipments" searchPlaceholder="Kompaniya qidirish..." searchAccessor={(r) => r.name} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
