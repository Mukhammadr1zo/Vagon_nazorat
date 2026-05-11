"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ScatterChart, Scatter, ZAxis, BarChart, Bar,
} from 'recharts';
import { useData } from '@/lib/data-context';
import { formatDays, formatKm, truncate } from '@/components/shared/format';
import { CalendarDays, RotateCcw } from 'lucide-react';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444',
  '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  '#6366F1', '#22C55E', '#EAB308', '#D946EF', '#DC2626',
];

const TOP_N_OPTIONS = [3, 5, 8, 10, 15];

type Aggregation = 'day' | 'week' | 'month';
type Scope = 'sender' | 'receiver';

function toDays(min: number): number {
  return min / 1440;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function getAggKey(ts: number, mode: Aggregation): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  if (mode === 'month') return `${y}-${m}`;
  if (mode === 'week') {
    // ISO hafta — yakshanbadan boshlash
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
  }
  return `${y}-${m}-${pad(d.getUTCDate())}`;
}

function getDateInputValue(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function parseDateInput(v: string): number | null {
  if (!v) return null;
  const ts = Date.parse(v + 'T00:00:00Z');
  return isNaN(ts) ? null : ts;
}

// Scatter performance — max nuqtalar
const MAX_SCATTER_POINTS = 1500;

export function SenderDynamics() {
  const { filtered } = useData();
  const [topN, setTopN] = useState(8);
  const [scope, setScope] = useState<Scope>('sender');
  const [aggregation, setAggregation] = useState<Aggregation>('day');
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);

  // Sana diapazoni filtri (mahalliy — faqat grafik uchun)
  const scoped = useMemo(() => {
    if (!startDate && !endDate) return filtered;
    return filtered.filter((s) => {
      const t = s.acceptanceAt || s.departureAt;
      if (!t) return false;
      if (startDate && t < startDate) return false;
      if (endDate && t > endDate + 24 * 60 * 60 * 1000 - 1) return false;
      return true;
    });
  }, [filtered, startDate, endDate]);

  const { senders, lineData, scatterData, totalRawPoints, scatterShown } = useMemo(() => {
    const actorField = (scope === 'sender' ? 'senderName' : 'receiverName') as 'senderName' | 'receiverName';

    // Top N aktorlar — jo'natma soni bo'yicha
    const counts = new Map<string, number>();
    for (const s of scoped) {
      const name = s[actorField];
      if (!name || s.waitMinutes <= 0) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const topActors = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([n]) => n);
    const topSet = new Set(topActors);

    // Qisqartirilgan nomlar (legend uchun)
    const shortNames = new Map<string, string>();
    const usedShort = new Set<string>();
    for (const a of topActors) {
      const base = truncate(a, 22);
      let candidate = base;
      let i = 1;
      while (usedShort.has(candidate)) {
        candidate = `${base} (${i})`;
        i++;
      }
      shortNames.set(a, candidate);
      usedShort.add(candidate);
    }

    // 1) Davr × Aktor matritsasi
    const periodGrid = new Map<string, Map<string, number[]>>();
    for (const s of scoped) {
      const name = s[actorField];
      if (!name || !topSet.has(name) || s.waitMinutes <= 0 || !s.acceptanceAt) continue;
      const key = getAggKey(s.acceptanceAt, aggregation);
      if (!periodGrid.has(key)) periodGrid.set(key, new Map());
      const m = periodGrid.get(key)!;
      if (!m.has(name)) m.set(name, []);
      m.get(name)!.push(toDays(s.waitMinutes));
    }

    const sortedPeriods = [...periodGrid.keys()].sort((a, b) => a.localeCompare(b));
    const lineData: Record<string, number | string | null>[] = sortedPeriods.map((p) => {
      const point: Record<string, number | string | null> = { period: p };
      for (const a of topActors) {
        const ds = periodGrid.get(p)?.get(a) ?? [];
        const key = shortNames.get(a)!;
        point[key] = ds.length > 0 ? +(ds.reduce((sum, x) => sum + x, 0) / ds.length).toFixed(2) : null;
      }
      return point;
    });

    // 2) Scatter — masofa × kun
    const scatterByActor: Record<string, { x: number; y: number; wagon: string; date: string; full: string }[]> = {};
    for (const a of topActors) scatterByActor[shortNames.get(a)!] = [];

    let totalPoints = 0;
    // Birinchi to'la o'tib hisoblash
    const allPoints: { actor: string; x: number; y: number; wagon: string; date: string; full: string }[] = [];
    for (const s of scoped) {
      const name = s[actorField];
      if (!name || !topSet.has(name) || s.waitMinutes <= 0 || s.distanceKm <= 0) continue;
      totalPoints++;
      allPoints.push({
        actor: name,
        x: s.distanceKm,
        y: +toDays(s.waitMinutes).toFixed(2),
        wagon: s.wagonNumber,
        date: getAggKey(s.acceptanceAt, 'day'),
        full: name,
      });
    }
    // Agar nuqtalar juda ko'p bo'lsa — namuna olamiz (random sampling)
    let scatterShown = totalPoints;
    let pointsToUse = allPoints;
    if (totalPoints > MAX_SCATTER_POINTS) {
      const step = totalPoints / MAX_SCATTER_POINTS;
      pointsToUse = [];
      for (let i = 0; i < totalPoints; i += step) {
        pointsToUse.push(allPoints[Math.floor(i)]);
      }
      scatterShown = pointsToUse.length;
    }
    for (const p of pointsToUse) {
      const key = shortNames.get(p.actor);
      if (key) scatterByActor[key].push({ x: p.x, y: p.y, wagon: p.wagon, date: p.date, full: p.full });
    }

    return {
      senders: topActors.map((a) => shortNames.get(a)!),
      lineData,
      scatterData: scatterByActor,
      totalRawPoints: totalPoints,
      scatterShown,
    };
  }, [scoped, topN, scope, aggregation]);

  const hasLineData = senders.length > 0 && lineData.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium">
              {scope === 'sender' ? 'Jo\'natuvchilar' : 'Qabul qiluvchilar'} dinamikasi (top {topN})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {aggregation === 'day' ? 'Kunlik' : aggregation === 'week' ? 'Haftalik' : 'Oylik'} o'rtacha + masofa bo'yicha taqsimot
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sender">Jo'natuvchilar</SelectItem>
                <SelectItem value="receiver">Qabul qiluvchilar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(topN)} onValueChange={(v) => setTopN(parseInt(v, 10))}>
              <SelectTrigger className="w-20 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TOP_N_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>Top {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={aggregation} onValueChange={(v) => setAggregation(v as Aggregation)}>
              <SelectTrigger className="w-24 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Kunlik</SelectItem>
                <SelectItem value="week">Haftalik</SelectItem>
                <SelectItem value="month">Oylik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kalendar — sana diapazoni */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Davr:</span>
          <div className="flex items-center gap-1.5 border border-border rounded-md px-2 h-9">
            <input
              type="date"
              className="bg-transparent text-xs outline-none w-32"
              value={getDateInputValue(startDate)}
              onChange={(e) => setStartDate(parseDateInput(e.target.value))}
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              className="bg-transparent text-xs outline-none w-32"
              value={getDateInputValue(endDate)}
              onChange={(e) => setEndDate(parseDateInput(e.target.value))}
            />
          </div>
          {/* Tezkor tugmalar */}
          <Button variant="outline" size="sm" className="h-9 text-xs"
            onClick={() => { const e = Date.now(); setEndDate(e); setStartDate(e - 7 * 86400000); }}>
            Oxirgi 7 kun
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs"
            onClick={() => { const e = Date.now(); setEndDate(e); setStartDate(e - 30 * 86400000); }}>
            Oxirgi 30 kun
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs"
            onClick={() => {
              const n = new Date();
              const start = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1);
              const end = Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 0, 23, 59, 59);
              setStartDate(start); setEndDate(end);
            }}>
            Bu oy
          </Button>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs"
              onClick={() => { setStartDate(null); setEndDate(null); }}>
              <RotateCcw className="size-3 mr-1" /> Tozalash
            </Button>
          )}
          <div className="text-muted-foreground ml-auto">
            {scoped.length.toLocaleString()} jo'natma
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasLineData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Bu davrda ma'lumot yo'q</p>
        ) : (
          <Tabs defaultValue="time">
            <TabsList>
              <TabsTrigger value="time">O'rtacha dinamika</TabsTrigger>
              <TabsTrigger value="distance">Masofa × Kun</TabsTrigger>
            </TabsList>

            <TabsContent value="time" className="mt-4">
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  {aggregation === 'month' ? (
                    <BarChart data={lineData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)"
                        label={{ value: 'kun', position: 'insideLeft', angle: -90, style: { fontSize: 11, fill: 'var(--muted-foreground)' } }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 8 }}
                        formatter={(val: number | string) => typeof val === 'number' ? `${val.toFixed(2)} kun` : '—'}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                      {senders.map((s, i) => (
                        <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={lineData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)"
                        angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)"
                        label={{ value: 'kun', position: 'insideLeft', angle: -90, style: { fontSize: 11, fill: 'var(--muted-foreground)' } }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 8 }}
                        formatter={(val: number | string) => typeof val === 'number' ? `${val.toFixed(2)} kun` : '—'}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                      {senders.map((s, i) => (
                        <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]}
                          strokeWidth={2} dot={{ r: 3 }} connectNulls
                          isAnimationActive={false} />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Har bir nuqta — {aggregation === 'day' ? 'shu kun' : aggregation === 'week' ? 'shu hafta' : 'shu oy'} aktorning barcha vagonlari bo'yicha o'rtacha yetkazib berish kuni.
              </p>
            </TabsContent>

            <TabsContent value="distance" className="mt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" dataKey="x" name="Masofa" unit=" km"
                      tick={{ fontSize: 11 }} stroke="var(--muted-foreground)"
                      label={{ value: 'Masofa (km)', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: 'var(--muted-foreground)' } }} />
                    <YAxis type="number" dataKey="y" name="Kun" unit=" kun"
                      tick={{ fontSize: 11 }} stroke="var(--muted-foreground)"
                      label={{ value: 'Kun', position: 'insideLeft', angle: -90, style: { fontSize: 11, fill: 'var(--muted-foreground)' } }} />
                    <ZAxis range={[35, 80]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const p = payload[0].payload as { x: number; y: number; wagon: string; date: string; full: string };
                        return (
                          <div className="bg-popover border border-border rounded-lg p-2 text-xs shadow">
                            <div className="font-semibold">{truncate(p.full, 40)}</div>
                            <div className="text-muted-foreground font-mono mt-0.5">Vagon {p.wagon} • {p.date}</div>
                            <div className="mt-1 flex gap-3">
                              <span>Masofa: <strong>{formatKm(p.x)}</strong></span>
                              <span>Kun: <strong>{formatDays(p.y)}</strong></span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    {senders.map((s, i) => (
                      <Scatter key={s} name={s} data={scatterData[s]}
                        fill={COLORS[i % COLORS.length]} fillOpacity={0.7}
                        isAnimationActive={false} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Har bir nuqta — alohida vagon: gorizontal — masofa (km), vertikal — yetkazib berish kuni.
                {totalRawPoints > MAX_SCATTER_POINTS && (
                  <span className="text-chart-3"> {' '}({scatterShown.toLocaleString()} / {totalRawPoints.toLocaleString()} ko'rsatilmoqda — namuna)</span>
                )}
              </p>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
