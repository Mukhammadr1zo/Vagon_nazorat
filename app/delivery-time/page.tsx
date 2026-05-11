"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { EmptyState } from '@/components/shared/empty-state';
import { DistanceGroupCards } from '@/components/delivery-time/distance-group-cards';
import { DeliveryCharts } from '@/components/delivery-time/delivery-charts';
import { DeliveryTable } from '@/components/delivery-time/delivery-table';
import { buildDeliveryTimeEntries, aggregateByPeriod } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, Table2, TrendingUp, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SameDayDistanceGroup } from '@/lib/types';

type ViewMode = 'charts' | 'table';
type PeriodMode = 'daily' | 'weekly' | 'monthly';

export default function DeliveryTimePage() {
  const { hasData, isHydrated, filtered, sameDayDistanceGroups } = useData();
  const [selectedGroup, setSelectedGroup] = useState<SameDayDistanceGroup | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('charts');
  const [period, setPeriod] = useState<PeriodMode>('daily');

  // Танланган маршрут бўйича маълумотлар
  const selectedRoute = selectedGroup?.routeKey ?? null;

  const entries = useMemo(
    () => selectedRoute !== null ? buildDeliveryTimeEntries(filtered, selectedRoute) : [],
    [filtered, selectedRoute],
  );

  const periodData = useMemo(
    () => aggregateByPeriod(entries, period),
    [entries, period],
  );

  // Уникал маршрутлар рўйхати
  const uniqueRoutes = useMemo(() => {
    const routeMap = new Map<string, { count: number; groups: number; senderStation: string; destStation: string }>();
    for (const g of sameDayDistanceGroups) {
      const existing = routeMap.get(g.routeKey);
      if (existing) {
        existing.count += g.count;
        existing.groups += 1;
      } else {
        routeMap.set(g.routeKey, {
          count: g.count,
          groups: 1,
          senderStation: g.senderStation,
          destStation: g.destStation,
        });
      }
    }
    return Array.from(routeMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([routeKey, data]) => ({ routeKey, ...data }));
  }, [sameDayDistanceGroups]);

  if (!isHydrated) {
    return <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!hasData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Сарлавҳа */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Yetib borish sutkasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bir kunda bir stansiyadan ikkinchisiga chiqqan har xil jo'natuvchilarni taqqoslash
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('charts')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'charts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <BarChart3 className="size-3.5" />
            Графиклар
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Table2 className="size-3.5" />
            Жадвал
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Guruhlar</div>
            <div className="text-2xl font-bold mt-1">{sameDayDistanceGroups.length}</div>
            <div className="text-[10px] text-muted-foreground">kun + marshrut</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Marshrutlar</div>
            <div className="text-2xl font-bold mt-1">{uniqueRoutes.length}</div>
            <div className="text-[10px] text-muted-foreground">unikal marshrut</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Jami vagonlar</div>
            <div className="text-2xl font-bold mt-1">
              {sameDayDistanceGroups.reduce((s, g) => s + g.count, 0)}
            </div>
            <div className="text-[10px] text-muted-foreground">taqqoslanadigan</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Eng katta farq</div>
            <div className="text-2xl font-bold mt-1">
              {sameDayDistanceGroups.length > 0
                ? Math.max(...sameDayDistanceGroups.map((g) => g.spreadDays)).toFixed(1)
                : 0}
            </div>
            <div className="text-[10px] text-muted-foreground">kunda</div>
          </CardContent>
        </Card>
      </div>

      {/* Маршрут гуруҳлари — карточкалар */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="size-4 text-muted-foreground" />
            Marshrut + kun bo'yicha guruhlar
            <span className="text-xs text-muted-foreground font-normal">— tanlang taqqoslash uchun</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DistanceGroupCards
            groups={sameDayDistanceGroups}
            uniqueRoutes={uniqueRoutes}
            selectedGroup={selectedGroup}
            onSelect={setSelectedGroup}
          />
        </CardContent>
      </Card>

      {/* Танланган гуруҳ учун контент */}
      {selectedGroup && (
        <>
          {/* Давр танлаш */}
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedGroup.senderStation} → {selectedGroup.destStation}
            </span>
            <span className="text-xs text-muted-foreground">
              {selectedGroup.acceptanceDay} | {selectedGroup.distanceKm > 0 ? `${selectedGroup.distanceKm} km | ` : ''}{selectedGroup.count} ta vagon
            </span>
            <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as PeriodMode[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    period === p
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p === 'daily' ? 'Kunlik' : p === 'weekly' ? 'Haftalik' : 'Oylik'}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'charts' ? (
            <DeliveryCharts
              group={selectedGroup}
              entries={entries}
              periodData={periodData}
              period={period}
            />
          ) : (
            <DeliveryTable group={selectedGroup} />
          )}
        </>
      )}

      {/* Танланмаган ҳолат */}
      {!selectedGroup && sameDayDistanceGroups.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Clock className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Yuqoridagi marshrut guruhlaridan birini tanlang —<br />
              yetib borish sutkasini taqqoslash grafiklari ko'rsatiladi
            </p>
          </CardContent>
        </Card>
      )}

      {sameDayDistanceGroups.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Clock className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Bir kunda bir marshrutda chiqqan 2+ jo'natma topilmadi.<br />
              Ma'lumotlarda stansiya va qabul sanasi bo'lishi kerak.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
