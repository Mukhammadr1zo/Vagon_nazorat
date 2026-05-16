"use client";

import { type ReactNode, useState, useMemo, useEffect } from 'react';
import {
  ArrowsOut,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
} from '@phosphor-icons/react/dist/ssr';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// =====================================================
// Hook: viewport-aware page size hisoblash
// =====================================================
// Available chart area = window.innerHeight - reservedSpace
// pageSize = floor(available / rowHeight)
// =====================================================
function useAutoPageSize(rowHeight = 32, reserved = 280): {
  pageSize: number;
  chartHeight: number;
} {
  const [dims, setDims] = useState({ pageSize: 20, chartHeight: 600 });

  useEffect(() => {
    const calc = () => {
      const available = Math.max(360, window.innerHeight - reserved);
      const pageSize = Math.max(8, Math.floor(available / rowHeight));
      setDims({ pageSize, chartHeight: available });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [rowHeight, reserved]);

  return dims;
}

// =====================================================
// 1. Fullscreen Dialog wrapper — to'liq ekran
// =====================================================
interface DialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode | ((helpers: { search: string }) => ReactNode);
  searchable?: boolean;
}

export function ExpandableChartDialog({
  trigger,
  title,
  description,
  children,
  searchable = false,
}: DialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="!fixed !inset-0 !top-0 !left-0 !w-screen !h-screen !max-w-none !max-h-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !p-0 !gap-0 sm:!max-w-none flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border shrink-0 bg-card">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-sm mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            {searchable && (
              <Input
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm h-10"
              />
            )}
          </div>

          {/* Content — 1 viewscreen ichida sig'adi */}
          <div className="flex-1 min-h-0 overflow-hidden p-6 bg-background">
            <div className="max-w-7xl mx-auto h-full">
              {typeof children === 'function' ? children({ search }) : children}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// =====================================================
// 2. "Hammasi" tugmasi
// =====================================================
export function ExpandButton({
  count,
  total,
}: {
  count?: number;
  total: number;
}) {
  const remaining = count !== undefined ? Math.max(0, total - count) : total;
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10">
      <ArrowsOut weight="bold" className="size-3.5" />
      <span>Hammasi</span>
      {remaining > 0 && (
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-mono">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

// =====================================================
// 3. Pagination komponenti
// =====================================================
export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  total: number;
  pageSize: number;
}) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="text-xs text-muted-foreground tabular-nums">
        <span className="font-semibold text-foreground">{from.toLocaleString('uz-UZ')}</span>
        {' – '}
        <span className="font-semibold text-foreground">{to.toLocaleString('uz-UZ')}</span>
        {' / '}
        <span className="font-mono">{total.toLocaleString('uz-UZ')}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
        >
          <CaretDoubleLeft weight="bold" className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          <CaretLeft weight="bold" className="size-3.5" />
        </Button>
        <div className="px-3 h-8 grid place-items-center text-xs tabular-nums font-medium">
          {page + 1} / {totalPages}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          <CaretRight weight="bold" className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
        >
          <CaretDoubleRight weight="bold" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// 4. Paginatsiyali view — viewport-aware (1 ekranga sig'adi)
// =====================================================
interface PaginatedViewProps<T> {
  data: T[];
  /** Statik page size (autoFit=false bo'lganda) */
  pageSize?: number;
  /** Avtomatik viewport balandligiga moslab page size hisoblash */
  autoFit?: boolean;
  /** Har bir qator balandligi (autoFit hisobi uchun) */
  rowHeight?: number;
  /** Header + pagination + padding uchun ajratiladigan joy (px) */
  reservedSpace?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  /** render(rows, chartHeight) — chartHeight autoFit bo'lganda available height */
  render: (rows: T[], chartHeight: number) => ReactNode;
  externalSearch?: string;
}

export function PaginatedView<T extends Record<string, any>>({
  data,
  pageSize: staticPageSize = 30,
  autoFit = true,
  rowHeight = 32,
  reservedSpace = 240,
  searchable = false,
  searchKeys = [],
  render,
  externalSearch = '',
}: PaginatedViewProps<T>) {
  const [page, setPage] = useState(0);
  const { pageSize: autoSize, chartHeight: autoHeight } = useAutoPageSize(
    rowHeight,
    reservedSpace,
  );

  const pageSize = autoFit ? autoSize : staticPageSize;
  const chartHeight = autoFit ? autoHeight : staticPageSize * rowHeight;

  const filtered = useMemo(() => {
    if (!externalSearch || searchKeys.length === 0) return data;
    const q = externalSearch.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
    );
  }, [data, externalSearch, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="shrink-0">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          total={filtered.length}
          pageSize={pageSize}
        />
      </div>
      <div className="flex-1 min-h-0">{render(pageRows, chartHeight)}</div>
    </div>
  );
}
