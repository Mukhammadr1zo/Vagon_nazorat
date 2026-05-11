"use client";

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Users, ChevronDown, ChevronUp, Train, Search } from 'lucide-react';
import type { SameDayDistanceGroup } from '@/lib/types';

interface Props {
  groups: SameDayDistanceGroup[];
  uniqueRoutes: { routeKey: string; count: number; groups: number; senderStation: string; destStation: string }[];
  selectedGroup: SameDayDistanceGroup | null;
  onSelect: (group: SameDayDistanceGroup | null) => void;
}

export function DistanceGroupCards({ groups, uniqueRoutes, selectedGroup, onSelect }: Props) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Фильтрланган гуруҳлар
  const filteredGroups = useMemo(() => {
    if (selectedRoute === null) return groups;
    return groups.filter((g) => g.routeKey === selectedRoute);
  }, [groups, selectedRoute]);

  const visibleGroups = showAll ? filteredGroups : filteredGroups.slice(0, 12);
  const hasMore = filteredGroups.length > 12;

  const getSpreadColor = (spread: number) => {
    if (spread <= 0.5) return 'text-emerald-500';
    if (spread <= 2) return 'text-amber-500';
    return 'text-rose-500';
  };

  // Ранглар маршрутлар учун
  const routeColors = [
    'from-indigo-500/15 to-indigo-500/5 border-indigo-500/25',
    'from-cyan-500/15 to-cyan-500/5 border-cyan-500/25',
    'from-amber-500/15 to-amber-500/5 border-amber-500/25',
    'from-rose-500/15 to-rose-500/5 border-rose-500/25',
    'from-emerald-500/15 to-emerald-500/5 border-emerald-500/25',
    'from-violet-500/15 to-violet-500/5 border-violet-500/25',
    'from-orange-500/15 to-orange-500/5 border-orange-500/25',
    'from-teal-500/15 to-teal-500/5 border-teal-500/25',
  ];

  const getRouteColor = (routeKey: string) => {
    const idx = uniqueRoutes.findIndex((r) => r.routeKey === routeKey);
    return routeColors[idx % routeColors.length];
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Routes filtered by search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return uniqueRoutes;
    const q = searchQuery.toLowerCase();
    return uniqueRoutes.filter(r => 
      r.senderStation.toLowerCase().includes(q) || 
      r.destStation.toLowerCase().includes(q)
    );
  }, [uniqueRoutes, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Маршрут фильтр ва қидирув */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={() => setSelectedRoute(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all border whitespace-nowrap',
              selectedRoute === null
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground',
            )}
          >
            Barchasi ({groups.length})
          </button>
          
          {/* Qidiruv (Auto-suggestion) */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Marshrutni qidirish... (masalan: Kitob)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Barcha marshrutlar chiplari (qidiruvga qarab filtrlanadi) */}
        <div className="flex flex-wrap gap-2 p-1">
          {filteredRoutes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 px-1">Hech narsa topilmadi</div>
          ) : (
            filteredRoutes.map(({ routeKey, count, senderStation, destStation }) => (
              <button
                key={routeKey}
                onClick={() => setSelectedRoute(routeKey === selectedRoute ? null : routeKey)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  selectedRoute === routeKey
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {senderStation} → {destStation} ({count})
              </button>
            ))
          )}
        </div>
      </div>

      {/* Гуруҳ карточкалари */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleGroups.map((g) => {
          const isSelected = selectedGroup?.groupKey === g.groupKey;
          return (
            <button
              key={g.groupKey}
              onClick={() => onSelect(isSelected ? null : g)}
              className={cn(
                'group relative text-left rounded-xl border p-4 transition-all duration-200',
                'bg-gradient-to-br hover:shadow-lg hover:scale-[1.02]',
                isSelected
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02] ' + getRouteColor(g.routeKey)
                  : getRouteColor(g.routeKey) + ' hover:ring-1 hover:ring-primary/50',
              )}
            >
              {/* Маршрут */}
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-foreground">
                <Train className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{g.senderStation}</span>
                <ArrowRight className="size-3 shrink-0 text-primary" />
                <span className="truncate">{g.destStation}</span>
              </div>

              {/* Сана ва масофа */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">{g.acceptanceDay}</span>
                {g.distanceKm > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/60 backdrop-blur">
                    {g.distanceKm} км
                  </span>
                )}
              </div>

              {/* Жўнатмалар сони */}
              <div className="text-lg font-bold">{g.count} <span className="text-xs font-normal text-muted-foreground">vagon</span></div>

              {/* Етиб бориш вақти */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Min — Maks</span>
                  <span className={cn('font-semibold', getSpreadColor(g.spreadDays))}>
                    {g.minTransitDays.toFixed(1)} — {g.maxTransitDays.toFixed(1)} kun
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">O'rtacha</span>
                  <span className="font-medium">{g.avgTransitDays.toFixed(1)} kun</span>
                </div>
                {g.spreadDays > 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Farq</span>
                    <span className={cn('font-bold', getSpreadColor(g.spreadDays))}>
                      {g.spreadDays.toFixed(1)} kun
                    </span>
                  </div>
                )}
              </div>

              {/* Компаниялар */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Users className="size-3" />
                <span>{g.uniqueSenders} jo'n.</span>
                <ArrowRight className="size-2.5" />
                <span>{g.uniqueReceivers} qab.</span>
              </div>

              {/* Active indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 size-3 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Кўпроқ кўрсатиш */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {showAll ? 'Kamroq' : `Yana ${filteredGroups.length - 12} ta ko'rsatish`}
        </button>
      )}
    </div>
  );
}
