"use client";

import { useState, useMemo, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/lib/data-context';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDays, formatNumber } from '@/components/shared/format';
import { DailyGroupCard } from '@/components/speed/daily-group-card';
import { Search, AlertTriangle, Zap, TrendingUp, Calendar } from 'lucide-react';

// Og'ir Recharts componentini lazy yuklash — sahifa tez ochiladi
const SenderDynamics = lazy(() =>
  import('@/components/speed/sender-dynamics').then((m) => ({ default: m.SenderDynamics })),
);

type SortKey = 'spread' | 'date-desc' | 'date-asc' | 'count' | 'fastest';

const SPREAD_OPTIONS = [
  { value: 0, label: 'Barchasi' },
  { value: 1, label: '≥ 1 kun' },
  { value: 2, label: '≥ 2 kun' },
  { value: 3, label: '≥ 3 kun' },
  { value: 5, label: '≥ 5 kun' },
  { value: 10, label: '≥ 10 kun' },
];

const PAGE_SIZE = 12;

export default function SpeedPage() {
  const { hasData, dailyGroups, anomalies, kpis } = useData();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('spread');
  const [minSpread, setMinSpread] = useState<number>(1);
  const [minCount, setMinCount] = useState<number>(2);
  const [page, setPage] = useState(0);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = dailyGroups.filter(
      (g) => g.spreadDays >= minSpread && g.count >= minCount,
    );
    if (q) {
      list = list.filter(
        (g) =>
          g.routeKey.toLowerCase().includes(q) ||
          g.acceptanceDay.includes(q) ||
          g.shipments.some(
            (s) =>
              s.wagonNumber.toLowerCase().includes(q) ||
              s.senderName.toLowerCase().includes(q) ||
              s.receiverName.toLowerCase().includes(q),
          ),
      );
    }
    switch (sortKey) {
      case 'spread': list = [...list].sort((a, b) => b.spreadDays - a.spreadDays); break;
      case 'date-desc': list = [...list].sort((a, b) => b.acceptanceDayTs - a.acceptanceDayTs); break;
      case 'date-asc': list = [...list].sort((a, b) => a.acceptanceDayTs - b.acceptanceDayTs); break;
      case 'count': list = [...list].sort((a, b) => b.count - a.count); break;
      case 'fastest': list = [...list].sort((a, b) => a.minTransitDays - b.minTransitDays); break;
    }
    return list;
  }, [dailyGroups, query, sortKey, minSpread, minCount]);

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedGroups = useMemo(
    () => groups.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [groups, safePage],
  );

  if (!hasData) return <EmptyState />;

  const fastTransitAnomalies = anomalies.filter((a) => a.type === 'fast-transit').length;
  const highAlerts = anomalies.filter((a) => a.type === 'fast-transit' && a.severity === 'high').length;

  const resetFilters = () => {
    setQuery(''); setSortKey('spread'); setMinSpread(1); setMinCount(2); setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" /> Kunlik guruhlar
          </div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(dailyGroups.length)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">2+ vagon, farq &gt; 0</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Median yetkazib berish</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatDays(kpis.medianTransitDays)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">umumiy median</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-chart-3 flex items-center gap-1">
            <Zap className="size-3" /> Tez yetkazmalar
          </div>
          <div className="text-xl font-semibold mt-1 tabular-nums text-chart-3">{formatNumber(fastTransitAnomalies)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">guruh median dan ≥30% tez</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-destructive flex items-center gap-1">
            <AlertTriangle className="size-3" /> Yuqori darajadagi
          </div>
          <div className="text-xl font-semibold mt-1 tabular-nums text-destructive">{formatNumber(highAlerts)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">≥50% tez yetkazmalar</div>
        </Card>
      </div>

      {/* Tushuntirish */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
        <TrendingUp className="size-4 mt-0.5 shrink-0 text-primary" />
        <div>
          <strong className="text-foreground">Bitta kun, bitta marshrut, har xil tezlik.</strong>{' '}
          Quyida har bir kartochka — bitta kunda qabul qilingan va bitta marshrut bo'yicha
          yuborilgan vagonlar guruhi. Yashil = guruh median dan tezroq, qizil = sekinroq.
          Median chiziq har bir bar ustida ko'rsatilgan.
        </div>
      </div>

      {/* Dinamika grafiklari (lazy load) */}
      <Suspense fallback={<Card className="p-8 text-center text-sm text-muted-foreground">Grafik yuklanmoqda...</Card>}>
        <SenderDynamics />
      </Suspense>

      {/* Toolbar */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Sana (YYYY-MM-DD), marshrut, vagon, kompaniya..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Tartib:</span>
          <Select value={sortKey} onValueChange={(v) => { setSortKey(v as SortKey); setPage(0); }}>
            <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="spread">Farq (eng katta)</SelectItem>
              <SelectItem value="date-desc">Sana (yangidan)</SelectItem>
              <SelectItem value="date-asc">Sana (eskidan)</SelectItem>
              <SelectItem value="count">Vagonlar soni</SelectItem>
              <SelectItem value="fastest">Eng tez vagon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Min farq:</span>
          <Select value={String(minSpread)} onValueChange={(v) => { setMinSpread(parseFloat(v)); setPage(0); }}>
            <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPREAD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Min vagon:</span>
          <Select value={String(minCount)} onValueChange={(v) => { setMinCount(parseInt(v, 10)); setPage(0); }}>
            <SelectTrigger className="w-20 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" size="sm" onClick={resetFilters}>Tiklash</Button>

        <div className="text-xs text-muted-foreground ml-auto">
          {formatNumber(groups.length)} / {formatNumber(dailyGroups.length)} guruh
          {' • '}
          {formatNumber(groups.reduce((s, g) => s + g.count, 0))} vagon
        </div>
      </Card>

      {/* Daily groups (sahifalashtirildi) */}
      {groups.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Bu shartlarga mos guruh topilmadi. Filterlarni o'zgartiring.
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {pagedGroups.map((g) => (
              <DailyGroupCard key={g.groupKey} group={g} />
            ))}
          </div>

          {pageCount > 1 && (
            <Card className="p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, groups.length)} / {formatNumber(groups.length)}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={safePage === 0}>
                  «
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>
                  Oldingi
                </Button>
                <span className="px-3 py-1.5 tabular-nums">{safePage + 1} / {pageCount}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1}>
                  Keyingi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(pageCount - 1)} disabled={safePage >= pageCount - 1}>
                  »
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
