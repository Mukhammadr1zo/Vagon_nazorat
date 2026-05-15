"use client";

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { usePlanData } from '@/lib/plans/plan-context';
import { formatNumber, formatDate, truncate } from '@/components/shared/format';
import type { PlanRecord, PlanStatus } from '@/lib/plans/plan-types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<PlanStatus, { label: string; className: string }> = {
  fulfilled: { label: 'Bajarilgan', className: 'bg-chart-2/15 text-chart-2' },
  partial: { label: 'Qisman', className: 'bg-chart-3/15 text-chart-3' },
  canceled: { label: 'Bekor', className: 'bg-destructive/15 text-destructive' },
  pending: { label: 'Kutilmoqda', className: 'bg-chart-4/15 text-chart-4' },
};

type SortKey =
  | 'rowNo'
  | 'stationName'
  | 'cargoName'
  | 'requestEnteredAt'
  | 'approvedAt'
  | 'requestedCount'
  | 'suppliedCount'
  | 'status';

export function PlansTable() {
  const { filtered, filters, setFilters } = usePlanData();
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('rowNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (av instanceof Date) av = av.getTime();
      if (bv instanceof Date) bv = bv.getTime();
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown
        className={cn('size-3', sortKey === k ? 'text-foreground' : 'opacity-40')}
      />
    </button>
  );

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-border p-3 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Qidiruv: stansiya, yuk, GU-12, hujjat..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="max-w-sm h-9"
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatNumber(sorted.length)} ta yozuv
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs tabular-nums whitespace-nowrap">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">
                <SortHeader k="rowNo" label="№" />
              </th>
              <th className="text-left px-3 py-2 font-medium">Varaq</th>
              <th className="text-left px-3 py-2 font-medium">
                <SortHeader k="stationName" label="Stansiya" />
              </th>
              <th className="text-left px-3 py-2 font-medium">Manzil</th>
              <th className="text-left px-3 py-2 font-medium">
                <SortHeader k="cargoName" label="Yuk" />
              </th>
              <th className="text-left px-3 py-2 font-medium">Vagon turi</th>
              <th className="text-right px-3 py-2 font-medium">
                <SortHeader k="requestedCount" label="Talab" />
              </th>
              <th className="text-right px-3 py-2 font-medium">
                <SortHeader k="suppliedCount" label="Ta'min." />
              </th>
              <th className="text-left px-3 py-2 font-medium">
                <SortHeader k="requestEnteredAt" label="Talabnoma" />
              </th>
              <th className="text-left px-3 py-2 font-medium">
                <SortHeader k="approvedAt" label="Tasdiqlangan" />
              </th>
              <th className="text-left px-3 py-2 font-medium">
                <SortHeader k="status" label="Status" />
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-12 text-muted-foreground">
                  Ma'lumot topilmadi
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <PlanRow key={r.id} record={r} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PlanRow({ record: r }: { record: PlanRecord }) {
  const status = STATUS_LABELS[r.status];
  return (
    <tr className={cn('border-t border-border/50 hover:bg-muted/30', r.hasDataQualityIssue && 'opacity-60')}>
      <td className="px-3 py-2 tabular-nums">
        {r.rowNo}
        {r.hasDataQualityIssue && (
          <AlertTriangle className="size-3 text-chart-4 inline ml-1" />
        )}
      </td>
      <td className="px-3 py-2 text-[10px] uppercase text-muted-foreground">
        {r.sheetKind === 'reja-jadvali' ? 'Reja' : 'Asosiy'}
      </td>
      <td className="px-3 py-2">
        <div className="font-medium">{truncate(r.stationName, 24)}</div>
        <div className="text-[10px] text-muted-foreground">{r.stationCode}</div>
      </td>
      <td className="px-3 py-2">
        {r.destStationName ? (
          <>
            <div>{truncate(r.destStationName, 24)}</div>
            <div className="text-[10px] text-muted-foreground">{r.destStationCode}</div>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div>{truncate(r.cargoName, 28)}</div>
        <div className="text-[10px] text-muted-foreground">{r.cargoCode}</div>
      </td>
      <td className="px-3 py-2 text-[11px]">{truncate(r.wagonType, 20)}</td>
      <td className="px-3 py-2 text-right tabular-nums font-medium">{r.requestedCount.toLocaleString()}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        <span className={r.suppliedCount >= r.requestedCount ? 'text-chart-2' : 'text-muted-foreground'}>
          {r.suppliedCount.toLocaleString()}
        </span>
      </td>
      <td className="px-3 py-2 text-[11px] text-muted-foreground">
        {r.requestEnteredAt ? formatDate(r.requestEnteredAt.getTime()) : '—'}
      </td>
      <td className="px-3 py-2 text-[11px] text-muted-foreground">
        {r.approvedAt ? formatDate(r.approvedAt.getTime()) : '—'}
      </td>
      <td className="px-3 py-2">
        <span className={cn('inline-block text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>
          {status.label}
        </span>
      </td>
    </tr>
  );
}
