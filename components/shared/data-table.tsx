"use client";

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  pageSize = 25,
  defaultSortKey,
  defaultSortDir = 'desc',
  emptyMessage = 'Ma\'lumot yo\'q',
  searchPlaceholder = 'Qidirish...',
  searchAccessor,
}: {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  pageSize?: number;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchAccessor?: (row: T) => string;
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((row) => {
      const text = searchAccessor
        ? searchAccessor(row)
        : columns.map((c) => String(c.accessor(row))).join(' ');
      return text.toLowerCase().includes(q);
    });
  }, [data, query, columns, searchAccessor]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const va = col.accessor(a);
      const vb = col.accessor(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="pl-8 h-9 text-sm"
          />
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'px-4 py-2.5 font-medium text-muted-foreground select-none',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    )}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    <button
                      onClick={() => onSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.header}
                      {sortKey === c.key ? (
                        sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-30" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">{emptyMessage}</td></tr>
              ) : pageData.map((row, idx) => (
                <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-4 py-2',
                        c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : '',
                      )}
                    >
                      {c.render ? c.render(row) : String(c.accessor(row))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} / {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Oldingi
            </Button>
            <span className="px-2 py-1.5">{page + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1}>
              Keyingi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
