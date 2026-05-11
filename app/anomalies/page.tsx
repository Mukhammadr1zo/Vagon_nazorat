"use client";

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { EmptyState } from '@/components/shared/empty-state';
import { formatNumber } from '@/components/shared/format';
import { DataTable, type Column } from '@/components/shared/data-table';
import type { Anomaly } from '@/lib/types';

const SEVERITY_META = {
  high: { color: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Yuqori', icon: AlertTriangle },
  medium: { color: 'bg-chart-3/15 text-chart-3 border-chart-3/30', label: 'O\'rta', icon: AlertCircle },
  low: { color: 'bg-muted text-muted-foreground border-border', label: 'Past', icon: Info },
} as const;

const TYPE_LABELS: Record<Anomaly['type'], string> = {
  'long-transit': 'Uzoq yetkazib berish',
  'fast-transit': 'Tezroq yetkazib berish',
  'negative-wait': 'Sana xatosi',
  'wagon-reused-sameday': 'Bir kunda qayta ishlatish',
  'duplicate-invoice': 'Dublikat накладной',
  'missing-field': 'Maydon to\'liq emas',
  'extreme-distance': 'G\'ayritabiiy masofa',
};

export default function AnomaliesPage() {
  const { anomalies, hasData } = useData();
  if (!hasData) return <EmptyState />;

  const high = anomalies.filter((a) => a.severity === 'high');
  const medium = anomalies.filter((a) => a.severity === 'medium');
  const low = anomalies.filter((a) => a.severity === 'low');

  const byType: Record<string, number> = {};
  for (const a of anomalies) byType[a.type] = (byType[a.type] ?? 0) + 1;

  const columns: Column<Anomaly>[] = [
    { key: 'severity', header: 'Daraja', accessor: (r) => r.severity, render: (r) => {
      const meta = SEVERITY_META[r.severity];
      const Icon = meta.icon;
      return <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${meta.color}`}>
        <Icon className="size-3" />{meta.label}
      </span>;
    } },
    { key: 'type', header: 'Tur', accessor: (r) => r.type, render: (r) => TYPE_LABELS[r.type] },
    { key: 'title', header: 'Sarlavha', accessor: (r) => r.title },
    { key: 'description', header: 'Tavsif', accessor: (r) => r.description },
    { key: 'value', header: 'Qiymat', accessor: (r) => String(r.value ?? ''), align: 'right' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Jami anomaliyalar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(anomalies.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-destructive">Yuqori</div>
          <div className="text-xl font-semibold mt-1 tabular-nums text-destructive">{formatNumber(high.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-chart-3">O'rta</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(medium.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Past</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(low.length)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Anomaliya turlari bo'yicha</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(byType).map(([t, n]) => (
              <div key={t} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                <span className="text-sm">{TYPE_LABELS[t as Anomaly['type']]}</span>
                <span className="text-sm font-semibold tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Barcha anomaliyalar</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={anomalies} columns={columns} defaultSortKey="severity" defaultSortDir="asc" searchPlaceholder="Anomaliya qidirish..." searchAccessor={(r) => `${r.title} ${r.description}`} />
        </CardContent>
      </Card>
    </div>
  );
}
