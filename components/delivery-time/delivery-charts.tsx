"use client";

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend, Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SameDayDistanceGroup, DeliveryTimeEntry, DeliveryPeriodAggregate } from '@/lib/types';

// 12 та ранг — ҳар бир жўнатувчи фирмага алоҳида
const SENDER_COLORS = [
  '#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16',
  '#e11d48', '#0ea5e9',
];

const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

interface Props {
  group: SameDayDistanceGroup;
  entries: DeliveryTimeEntry[];
  periodData: DeliveryPeriodAggregate[];
  period: 'daily' | 'weekly' | 'monthly';
}

// Fullscreen модал компоненти
function FullscreenModal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="size-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
      <div
        className="flex-1 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DeliveryCharts({ group, entries, periodData, period }: Props) {
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  // Жўнатувчи фирма бўйича рангларни ажратиш
  const senderColorMap = useMemo(() => {
    const senders = Array.from(new Set(group.shipments.map((s) => s.senderName).filter(Boolean)));
    const map = new Map<string, string>();
    senders.forEach((s, i) => map.set(s, SENDER_COLORS[i % SENDER_COLORS.length]));
    return map;
  }, [group]);

  // Bar chart маълумотлари — ҳар бир вагон учун
  const wagonBarData = useMemo(() =>
    group.shipments.map((s) => ({
      wagon: s.wagonNumber,
      sender: s.senderName || '—',
      receiver: s.receiverName || '—',
      senderStation: s.senderStationName || '—',
      destStation: s.destStationName || '—',
      transitDays: +(s.waitMinutes / 1440).toFixed(2),
      color: senderColorMap.get(s.senderName) || SENDER_COLORS[0],
    })),
    [group, senderColorMap],
  );

  // Давр бўйича чизиқ график маълумотлари
  const periodChartData = useMemo(() => {
    return periodData.map((p) => ({
      period: p.period,
      avg: +p.avgTransitDays.toFixed(2),
      min: +p.minTransitDays.toFixed(2),
      max: +p.maxTransitDays.toFixed(2),
      count: p.count,
    }));
  }, [periodData]);

  // Жўнатувчилар динамикаси маълумотлари (Line chart учун)
  const senderDynamicsData = useMemo(() => {
    const getKey = (e: DeliveryTimeEntry) =>
      period === 'daily' ? e.date : period === 'weekly' ? e.week : e.month;

    const periodGroups = new Map<string, DeliveryTimeEntry[]>();
    for (const e of entries) {
      const k = getKey(e);
      if (!periodGroups.has(k)) periodGroups.set(k, []);
      periodGroups.get(k)!.push(e);
    }

    const data: any[] = [];
    const sortedPeriods = Array.from(periodGroups.keys()).sort();

    for (const p of sortedPeriods) {
      const list = periodGroups.get(p)!;
      const dataPoint: any = { period: p };
      
      const senderTotals = new Map<string, { total: number; count: number }>();
      for (const e of list) {
        const sName = e.senderName || '—';
        if (!senderTotals.has(sName)) senderTotals.set(sName, { total: 0, count: 0 });
        const st = senderTotals.get(sName)!;
        st.total += e.transitDays;
        st.count += 1;
      }
      
      for (const [sName, st] of senderTotals.entries()) {
        dataPoint[sName] = +(st.total / st.count).toFixed(2);
      }
      
      data.push(dataPoint);
    }
    
    return data;
  }, [entries, period]);

  const avgLine = group.avgTransitDays;

  // Asosiy bar chart renderlovchi funksiya
  const renderWagonChart = (height: number) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={wagonBarData}
        layout="vertical"
        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          stroke="var(--muted-foreground)"
          label={{ value: 'Kun', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="wagon"
          width={90}
          tick={{ fontSize: 10 }}
          stroke="var(--muted-foreground)"
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div style={TOOLTIP_STYLE} className="p-3 space-y-1">
                <div className="font-semibold">Vagon: {d.wagon}</div>
                <div className="text-muted-foreground">Jo'natuvchi: <span className="font-medium text-foreground">{d.sender}</span></div>
                <div className="text-muted-foreground">Qabul qiluvchi: {d.receiver}</div>
                <div className="text-muted-foreground">{d.senderStation} → {d.destStation}</div>
                <div className="font-bold mt-1" style={{ color: d.color }}>
                  {d.transitDays} kun
                </div>
              </div>
            );
          }}
        />
        <ReferenceLine
          x={avgLine}
          stroke="var(--destructive)"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{ value: `O'rt: ${avgLine.toFixed(1)}`, position: 'top', fontSize: 10, fill: 'var(--destructive)' }}
        />
        <Bar dataKey="transitDays" radius={[0, 6, 6, 0]} name="Yetib borish">
          {wagonBarData.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // Sender bar chart renderlovchi
  const senderAgg = useMemo(() => {
    const map = new Map<string, { totalDays: number; count: number; wagons: string[] }>();
    for (const s of group.shipments) {
      const name = s.senderName || '—';
      if (!map.has(name)) map.set(name, { totalDays: 0, count: 0, wagons: [] });
      const a = map.get(name)!;
      a.totalDays += s.waitMinutes / 1440;
      a.count += 1;
      a.wagons.push(s.wagonNumber);
    }
    return Array.from(map.entries())
      .map(([name, a]) => ({
        name: name.length > 35 ? name.slice(0, 33) + '…' : name,
        fullName: name,
        avgDays: +(a.totalDays / a.count).toFixed(2),
        count: a.count,
        wagons: a.wagons.join(', '),
        color: senderColorMap.get(name) || SENDER_COLORS[0],
      }))
      .sort((a, b) => a.avgDays - b.avgDays);
  }, [group, senderColorMap]);

  const renderSenderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={senderAgg}
        layout="vertical"
        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          stroke="var(--muted-foreground)"
          label={{ value: "O'rtacha kun", position: 'insideBottomRight', offset: -5, fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fontSize: 10 }}
          stroke="var(--muted-foreground)"
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div style={TOOLTIP_STYLE} className="p-3 space-y-1">
                <div className="font-semibold">{d.fullName}</div>
                <div className="text-muted-foreground">{d.count} ta vagon</div>
                <div className="text-muted-foreground text-[10px] max-w-[250px] break-words">Vagonlar: {d.wagons}</div>
                <div className="font-bold mt-1" style={{ color: d.color }}>
                  O'rtacha: {d.avgDays} kun
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="avgDays" radius={[0, 6, 6, 0]} name="O'rtacha kun">
          {senderAgg.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPeriodChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={periodChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          dataKey="avg"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          dot={{ r: 4 }}
          name="O'rtacha (kun)"
          activeDot={{ r: 6 }}
        />
        <Line
          dataKey="min"
          stroke="var(--chart-2)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 3 }}
          name="Minimal"
        />
        <Line
          dataKey="max"
          stroke="var(--chart-5)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 3 }}
          name="Maksimal"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderSenderDynamicsChart = () => {
    const allSenders = Array.from(senderColorMap.keys());
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={senderDynamicsData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {allSenders.map((sName) => (
            <Line
              key={sName}
              type="monotone"
              dataKey={sName}
              stroke={senderColorMap.get(sName)}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={sName.length > 30 ? sName.slice(0, 28) + '…' : sName}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Fullscreen button component
  const FullscreenBtn = ({ chartId }: { chartId: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); setFullscreenChart(chartId); }}
      className="size-7 rounded-md bg-muted/80 hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
      title="Kattalashtirish"
    >
      <Maximize2 className="size-3.5" />
    </button>
  );

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ============ 1. Вагонлар бўйича bar chart ============ */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Yetib borish sutkasi — har bir vagon
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  {group.senderStation} → {group.destStation} | {group.acceptanceDay} | {group.count} ta
                </span>
              </CardTitle>
              <FullscreenBtn chartId="wagon" />
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ height: Math.max(300, group.count * 36) }}>
              {renderWagonChart(Math.max(300, group.count * 36))}
            </div>

            {/* Legend — жўнатувчилар */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
              {Array.from(senderColorMap.entries()).map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5 text-[11px]">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground">{name.length > 35 ? name.slice(0, 33) + '…' : name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ============ 2. Жўнатувчилар бўйича ============ */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Jo'natuvchi firmalar bo'yicha
                <span className="text-xs text-muted-foreground font-normal ml-2">rang = jo'natuvchi</span>
              </CardTitle>
              <FullscreenBtn chartId="sender" />
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ height: Math.max(200, senderAgg.length * 44) }}>
              {renderSenderChart()}
            </div>
          </CardContent>
        </Card>

        {/* ============ 3. Давр бўйича динамика ============ */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {period === 'daily' ? 'Kunlik' : period === 'weekly' ? 'Haftalik' : 'Oylik'} dinamika
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  {group.senderStation} → {group.destStation}
                </span>
              </CardTitle>
              <FullscreenBtn chartId="period" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {periodChartData.length > 0 ? (
                renderPeriodChart()
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Бу давр учун маълумот йўқ
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============ 4. Жўнатувчилар бўйича динамика ============ */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {period === 'daily' ? 'Kunlik' : period === 'weekly' ? 'Haftalik' : 'Oylik'} dinamika — Jo'natuvchi firmalar bo'yicha
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  {group.senderStation} → {group.destStation} | rang = jo'natuvchi
                </span>
              </CardTitle>
              <FullscreenBtn chartId="sender_dynamics" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {senderDynamicsData.length > 0 ? (
                renderSenderDynamicsChart()
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Бу давр учун маълумот йўқ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ FULLSCREEN МОДАЛЛАР ============ */}
      <FullscreenModal
        isOpen={fullscreenChart === 'wagon'}
        onClose={() => setFullscreenChart(null)}
        title={`Vagonlar — ${group.senderStation} → ${group.destStation} | ${group.acceptanceDay}`}
      >
        <div className="h-full">
          {renderWagonChart(9999)}
        </div>
      </FullscreenModal>

      <FullscreenModal
        isOpen={fullscreenChart === 'sender'}
        onClose={() => setFullscreenChart(null)}
        title={`Jo'natuvchilar — ${group.senderStation} → ${group.destStation}`}
      >
        <div className="h-full">
          {renderSenderChart()}
        </div>
      </FullscreenModal>

      <FullscreenModal
        isOpen={fullscreenChart === 'period'}
        onClose={() => setFullscreenChart(null)}
        title={`${period === 'daily' ? 'Kunlik' : period === 'weekly' ? 'Haftalik' : 'Oylik'} dinamika — ${group.senderStation} → ${group.destStation}`}
      >
        <div className="h-full">
          {periodChartData.length > 0 ? renderPeriodChart() : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Ma'lumot yo'q</div>
          )}
        </div>
      </FullscreenModal>

      <FullscreenModal
        isOpen={fullscreenChart === 'sender_dynamics'}
        onClose={() => setFullscreenChart(null)}
        title={`${period === 'daily' ? 'Kunlik' : period === 'weekly' ? 'Haftalik' : 'Oylik'} dinamika (Jo'natuvchilar) — ${group.senderStation} → ${group.destStation}`}
      >
        <div className="h-full">
          {senderDynamicsData.length > 0 ? renderSenderDynamicsChart() : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Ma'lumot yo'q</div>
          )}
        </div>
      </FullscreenModal>
    </>
  );
}
