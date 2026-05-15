"use client";

import { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/components/shared/format';
import { cn } from '@/lib/utils';

export interface DetailColumn<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  format?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
}

interface Props<T extends { [k: string]: any }> {
  rows: T[];
  columns: DetailColumn<T>[];
  searchFields?: (keyof T)[];
  defaultSortKey?: string;
  pageSize?: number;
  emptyText?: string;
}

export function PlanDetailTable<T extends { [k: string]: any }>({
  rows,
  columns,
  searchFields = [],
  defaultSortKey,
  pageSize = 25,
  emptyText = 'Ma\'lumot topilmadi',
}: Props<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search || searchFields.length === 0) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      searchFields.some((f) => String(r[f] ?? '').toLowerCase().includes(q)),
    );
  }, [rows, search, searchFields]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    const getter = col?.sortValue ?? ((r: T) => r[sortKey as keyof T] as any);
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-border p-3 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        {searchFields.length > 0 && (
          <div className="relative max-w-sm w-full">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Qidiruv..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-8 h-9"
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatNumber(sorted.length)} qator
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                ‹
              </Button>
              <span className="text-xs tabular-nums whitespace-nowrap">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                ›
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={cn(
                    'px-3 py-2 font-medium whitespace-nowrap',
                    c.align === 'right'
                      ? 'text-right'
                      : c.align === 'center'
                      ? 'text-center'
                      : 'text-left',
                  )}
                  style={c.width ? { width: c.width } : undefined}
                >
                  <button
                    onClick={() => toggleSort(String(c.key))}
                    className={cn(
                      'inline-flex items-center gap-1 hover:text-foreground transition-colors',
                      c.align === 'right' && 'flex-row-reverse',
                    )}
                  >
                    {c.label}
                    <ArrowUpDown
                      className={cn(
                        'size-3',
                        sortKey === c.key ? 'text-foreground' : 'opacity-40',
                      )}
                    />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {pageRows.map((row, i) => (
              <tr
                key={i}
                className="border-t border-border/50 hover:bg-muted/30"
              >
                {columns.map((c) => (
                  <td
                    key={String(c.key)}
                    className={cn(
                      'px-3 py-2',
                      c.align === 'right'
                        ? 'text-right tabular-nums'
                        : c.align === 'center'
                        ? 'text-center'
                        : 'text-left',
                    )}
                  >
                    {c.format ? c.format(row) : String(row[c.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
