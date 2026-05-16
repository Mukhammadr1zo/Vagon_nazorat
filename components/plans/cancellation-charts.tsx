"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  LabelList,
  Cell,
} from 'recharts';
import {
  Buildings,
  Train,
  ArrowRight,
  Warning,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanData } from '@/lib/plans/plan-context';
import { truncate, formatNumber } from '@/components/shared/format';
import { cardVariants, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  color: 'var(--foreground)',
};

function formatShort(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('uz-UZ');
}

// =====================================================
// 1. Bekor qilingan stansiyalar bar chart (HAMMASI)
// =====================================================
export function CancellationByStationChart() {
  const { filtered } = usePlanData();

  const data = useMemo(() => {
    const map = new Map<
      string,
      { name: string; canceled: number; total: number }
    >();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || !r.stationRaw) continue;
      let s = map.get(r.stationRaw);
      if (!s) {
        s = { name: r.stationName || r.stationCode || r.stationRaw, canceled: 0, total: 0 };
        map.set(r.stationRaw, s);
      }
      s.total++;
      if (r.status === 'canceled') s.canceled++;
    }
    return Array.from(map.values())
      .filter((s) => s.canceled > 0)
      .map((s) => ({
        ...s,
        name: truncate(s.name, 28),
        rate: s.total > 0 ? (s.canceled / s.total) * 100 : 0,
      }))
      .sort((a, b) => b.canceled - a.canceled);
  }, [filtered]);

  const total = data.reduce((s, d) => s + d.canceled, 0);
  const chartHeight = Math.max(460, data.length * 26 + 40);

  // Rang gradient — top 3 = qizilroq, top 10 = sariq, qolgan = oqroq
  const getColor = (i: number) => {
    if (i < 3) return 'var(--destructive)';
    if (i < 10) return 'color-mix(in oklab, var(--destructive) 75%, var(--chart-3))';
    return 'color-mix(in oklab, var(--destructive) 50%, var(--chart-3))';
  };

  if (data.length === 0) {
    return (
      <EmptyChart
        title="Bekor qilingan stansiyalar"
        icon={Train}
        message="Bekor qilish ma'lumotlari topilmadi"
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-destructive/10 grid place-items-center">
            <Train weight="duotone" className="size-4 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Bekor qilingan stansiyalar</h3>
            <p className="text-[10px] text-muted-foreground">
              {data.length} ta stansiya — jami {formatNumber(total)} ta bekor qilish
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {data.length} ta
        </Badge>
      </div>
      <div className="p-4">
        <div>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 60 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickFormatter={formatShort}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{ fontSize: 10 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={tooltipStyle}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        className="rounded-lg border bg-popover p-2.5 shadow-lg"
                        style={{ minWidth: 200 }}
                      >
                        <div className="font-semibold text-xs mb-2">{d.name}</div>
                        <div className="space-y-1 text-xs">
                          <Row label="Bekor qilingan:" value={`${d.canceled.toLocaleString('uz-UZ')} ta`} color="text-destructive" />
                          <Row label="Jami talabnoma:" value={`${d.total.toLocaleString('uz-UZ')} ta`} color="text-foreground" />
                          <Row label="Bekor %:" value={`${d.rate.toFixed(1)}%`} color="text-destructive" />
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="canceled" radius={[0, 6, 6, 0]} name="Bekor">
                  {data.map((_, i) => (
                    <Cell key={i} fill={getColor(i)} />
                  ))}
                  <LabelList
                    dataKey="canceled"
                    position="right"
                    formatter={(v: number) => v.toLocaleString('uz-UZ')}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fill: 'var(--foreground)',
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// 2. Bekor qiluvchi korxonalar / shaxslar (HAMMASI)
// =====================================================
export function CancellationByCancelerChart() {
  const { filtered } = usePlanData();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || r.status !== 'canceled') continue;
      const key = r.canceledBy || 'Aniqlanmagan';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name: truncate(name, 28),
        fullName: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const total = data.reduce((s, d) => s + d.count, 0);
  const chartHeight = Math.max(460, data.length * 26 + 40);

  const getColor = (i: number) => {
    if (i < 3) return 'var(--chart-4)';
    if (i < 10) return 'color-mix(in oklab, var(--chart-4) 75%, var(--chart-5))';
    return 'color-mix(in oklab, var(--chart-4) 50%, var(--chart-5))';
  };

  if (data.length === 0) {
    return (
      <EmptyChart
        title="Bekor qiluvchi korxonalar"
        icon={Buildings}
        message="Bekor qiluvchi shaxs ma'lumotlari topilmadi"
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-chart-4/10 grid place-items-center">
            <Buildings weight="duotone" className="size-4 text-chart-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Bekor qiluvchi korxonalar/shaxslar</h3>
            <p className="text-[10px] text-muted-foreground">
              {data.length} ta — jami {formatNumber(total)} ta bekor qilish
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {data.length} ta
        </Badge>
      </div>
      <div className="p-4">
        <div>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 60 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickFormatter={formatShort}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{ fontSize: 10 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={tooltipStyle}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    const pct = total > 0 ? (d.count / total) * 100 : 0;
                    return (
                      <div className="rounded-lg border bg-popover p-2.5 shadow-lg min-w-[200px]">
                        <div className="font-semibold text-xs mb-2">{d.fullName}</div>
                        <div className="space-y-1 text-xs">
                          <Row
                            label="Bekor qilingan:"
                            value={`${d.count.toLocaleString('uz-UZ')} ta`}
                            color="text-chart-4"
                          />
                          <Row
                            label="Umumiy ulush:"
                            value={`${pct.toFixed(1)}%`}
                            color="text-muted-foreground"
                          />
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Bekor qilingan">
                  {data.map((_, i) => (
                    <Cell key={i} fill={getColor(i)} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    formatter={(v: number) => v.toLocaleString('uz-UZ')}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fill: 'var(--foreground)',
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// 3. Bekor qilish darajasi (HAMMASI scroll bilan)
// =====================================================
export function CancellationRateByStationChart({ minTotal = 30 }: { minTotal?: number }) {
  const { filtered } = usePlanData();

  const data = useMemo(() => {
    const map = new Map<
      string,
      { name: string; canceled: number; total: number }
    >();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || !r.stationRaw) continue;
      let s = map.get(r.stationRaw);
      if (!s) {
        s = { name: r.stationName || r.stationCode || r.stationRaw, canceled: 0, total: 0 };
        map.set(r.stationRaw, s);
      }
      s.total++;
      if (r.status === 'canceled') s.canceled++;
    }
    return Array.from(map.values())
      .filter((s) => s.total >= minTotal && s.canceled > 0)
      .map((s) => ({
        name: truncate(s.name, 28),
        rate: (s.canceled / s.total) * 100,
        canceled: s.canceled,
        total: s.total,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filtered, minTotal]);

  if (data.length === 0) {
    return (
      <EmptyChart
        title="Bekor qilish darajasi (%)"
        icon={Warning}
        message={`Kamida ${minTotal} ta talabnomasi bo'lgan stansiyalar topilmadi`}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-destructive/10 grid place-items-center">
              <Warning weight="duotone" className="size-4 text-destructive" />
            </div>
            <h3 className="text-sm font-semibold">Eng yomon performance stansiyalar</h3>
          </div>
          <Badge variant="destructive" className="text-[10px]">
            {data.length} ta
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground pl-10">
          Bekor qilish foizi bo'yicha (min. {minTotal} ta talabnoma)
        </p>
      </div>
      <div className="p-4">
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.02, 0.03)}
            className="space-y-2.5"
          >
            {data.map((d, i) => (
              <motion.div
                key={d.name + i}
                variants={cardVariants}
                className="space-y-1"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'size-5 rounded grid place-items-center text-[10px] font-bold shrink-0',
                        i < 3
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="text-muted-foreground text-[10px]">
                      {d.canceled}/{d.total}
                    </span>
                    <span
                      className={cn(
                        'font-bold tabular-nums w-12 text-right',
                        d.rate >= 50
                          ? 'text-destructive'
                          : d.rate >= 25
                          ? 'text-chart-3'
                          : 'text-chart-4',
                      )}
                    >
                      {d.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, d.rate)}%` }}
                    transition={{
                      duration: 0.6,
                      delay: Math.min(1, i * 0.02),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={cn(
                      'h-full rounded-full',
                      d.rate >= 50
                        ? 'bg-destructive'
                        : d.rate >= 25
                        ? 'bg-chart-3'
                        : 'bg-chart-4',
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// 4. Stansiya → Manzil "oqim" tahlili (HAMMASI scroll bilan)
// =====================================================
export function CancellationFlowChart() {
  const { filtered } = usePlanData();

  const data = useMemo(() => {
    const map = new Map<string, { source: string; dest: string; count: number }>();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || r.status !== 'canceled') continue;
      if (!r.stationRaw || !r.destStationRaw) continue;
      const key = `${r.stationRaw}→${r.destStationRaw}`;
      const item = map.get(key);
      if (item) {
        item.count++;
      } else {
        map.set(key, {
          source: r.stationName || r.stationCode || r.stationRaw,
          dest: r.destStationName || r.destStationCode || r.destStationRaw,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return (
      <EmptyChart
        title="Bekor qilingan yo'nalishlar"
        icon={ArrowRight}
        message="Yo'nalish ma'lumotlari topilmadi"
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-chart-5/10 grid place-items-center">
            <ArrowRight weight="duotone" className="size-4 text-chart-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Bekor qilingan yo'nalishlar</h3>
            <p className="text-[10px] text-muted-foreground">
              Stansiya → Manzil bo'yicha
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {data.length} ta yo'nalish
        </Badge>
      </div>
      <div className="p-4">
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.02, 0.03)}
            className="space-y-3"
          >
            {data.map((flow, i) => {
              const widthPct = (flow.count / maxCount) * 100;
              return (
                <motion.div key={i} variants={cardVariants} className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="size-5 rounded bg-chart-5/15 text-chart-5 grid place-items-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-2 text-xs min-w-0">
                      <span className="font-medium truncate flex-1">{truncate(flow.source, 24)}</span>
                      <ArrowRight weight="bold" className="size-3 text-chart-5 shrink-0" />
                      <span className="font-medium truncate flex-1">{truncate(flow.dest, 24)}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-destructive shrink-0">
                      {flow.count.toLocaleString('uz-UZ')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-7">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{
                        duration: 0.6,
                        delay: Math.min(1, i * 0.02),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full bg-gradient-to-r from-chart-5 to-destructive rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// Yordamchi
// =====================================================
function EmptyChart({
  title,
  icon: Icon,
  message,
}: {
  title: string;
  icon: any;
  message: string;
}) {
  return (
    <Card className="p-8 text-center">
      <Icon
        weight="duotone"
        className="size-12 mx-auto mb-3 text-muted-foreground opacity-50"
      />
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{message}</p>
    </Card>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', color)}>{value}</span>
    </div>
  );
}
