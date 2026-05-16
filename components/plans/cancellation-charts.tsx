"use client";

import { type ReactNode, useMemo } from 'react';
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
import {
  ExpandableChartDialog,
  ExpandButton,
  PaginatedView,
} from './expandable-chart';

const COMPACT_LIMIT = 15;
const PAGE_SIZE = 25;
const ROW_HEIGHT = 28;

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
// Section header
// =====================================================
function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  meta,
  total,
  unit = 'ta',
  badgeVariant = 'secondary',
  expandContent,
  expandTitle,
  expandDescription,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  meta?: string;
  total: number;
  unit?: string;
  badgeVariant?: 'secondary' | 'destructive';
  expandContent: ReactNode;
  expandTitle: string;
  expandDescription?: string;
}) {
  const hasMore = total > COMPACT_LIMIT;
  return (
    <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <div className={cn('size-8 rounded-lg grid place-items-center shrink-0', iconBg)}>
          <Icon weight="duotone" className={cn('size-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {meta && <p className="text-[10px] text-muted-foreground mt-0.5">{meta}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={badgeVariant} className="text-[10px]">
          {hasMore
            ? `${COMPACT_LIMIT} / ${total.toLocaleString('uz-UZ')} ${unit}`
            : `${total.toLocaleString('uz-UZ')} ${unit}`}
        </Badge>
        {hasMore && (
          <ExpandableChartDialog
            title={expandTitle}
            description={expandDescription}
            trigger={<ExpandButton count={COMPACT_LIMIT} total={total} />}
          >
            {expandContent}
          </ExpandableChartDialog>
        )}
      </div>
    </div>
  );
}

// =====================================================
// 1. Bekor qilingan stansiyalar
// =====================================================
export function CancellationByStationChart() {
  const { filtered } = usePlanData();

  const all = useMemo(() => {
    const map = new Map<
      string,
      { name: string; fullName: string; canceled: number; total: number }
    >();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || !r.stationRaw) continue;
      let s = map.get(r.stationRaw);
      if (!s) {
        const name = r.stationName || r.stationCode || r.stationRaw;
        s = { name: truncate(name, 28), fullName: name, canceled: 0, total: 0 };
        map.set(r.stationRaw, s);
      }
      s.total++;
      if (r.status === 'canceled') s.canceled++;
    }
    return Array.from(map.values())
      .filter((s) => s.canceled > 0)
      .map((s) => ({
        ...s,
        rate: s.total > 0 ? (s.canceled / s.total) * 100 : 0,
      }))
      .sort((a, b) => b.canceled - a.canceled);
  }, [filtered]);

  const total = all.reduce((s, d) => s + d.canceled, 0);
  const compact = all.slice(0, COMPACT_LIMIT);

  const getColor = (i: number) => {
    if (i < 3) return 'var(--destructive)';
    if (i < 10) return 'color-mix(in oklab, var(--destructive) 75%, var(--chart-3))';
    return 'color-mix(in oklab, var(--destructive) 50%, var(--chart-3))';
  };

  const renderChart = (rows: typeof all, h?: number) => {
    const height = h ?? Math.max(280, rows.length * ROW_HEIGHT + 40);
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
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
                  <div className="rounded-lg border bg-popover p-2.5 shadow-lg min-w-[220px]">
                    <div className="font-semibold text-xs mb-2">{d.fullName}</div>
                    <div className="space-y-1 text-xs">
                      <Row label="Bekor qilingan:" value={`${d.canceled.toLocaleString('uz-UZ')} ta talabnoma`} color="text-destructive" />
                      <Row label="Jami talabnoma:" value={`${d.total.toLocaleString('uz-UZ')} ta`} color="text-foreground" />
                      <Row label="Bekor foizi:" value={`${d.rate.toFixed(1)}%`} color="text-destructive" />
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="canceled" radius={[0, 6, 6, 0]} name="Bekor qilingan">
              {rows.map((_, i) => (
                <Cell key={i} fill={getColor(i)} />
              ))}
              <LabelList
                dataKey="canceled"
                position="right"
                formatter={(v: number) => `${v.toLocaleString('uz-UZ')} ta`}
                style={{ fontSize: 11, fontWeight: 600, fill: 'var(--foreground)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (all.length === 0) {
    return <EmptyChart title="Bekor qilingan stansiyalar" icon={Train} message="Ma'lumot topilmadi" />;
  }

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        icon={Train}
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        title="Bekor qilingan stansiyalar"
        meta={`Jami ${formatNumber(total)} ta bekor qilingan talabnoma`}
        total={all.length}
        unit="stansiya"
        expandTitle="Bekor qilingan stansiyalar — barcha"
        expandDescription={`${all.length} ta stansiya | Jami ${formatNumber(total)} ta bekor qilingan talabnoma`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            searchKeys={['fullName']}
            render={(rows, h) => renderChart(rows, h)}
          />
        }
      />
      <div className="p-4">{renderChart(compact)}</div>
    </Card>
  );
}

// =====================================================
// 2. Bekor qiluvchi korxonalar/shaxslar
// =====================================================
export function CancellationByCancelerChart() {
  const { filtered } = usePlanData();

  const all = useMemo(() => {
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

  const total = all.reduce((s, d) => s + d.count, 0);
  const compact = all.slice(0, COMPACT_LIMIT);

  const getColor = (i: number) => {
    if (i < 3) return 'var(--chart-4)';
    if (i < 10) return 'color-mix(in oklab, var(--chart-4) 75%, var(--chart-5))';
    return 'color-mix(in oklab, var(--chart-4) 50%, var(--chart-5))';
  };

  const renderChart = (rows: typeof all, h?: number) => {
    const height = h ?? Math.max(280, rows.length * ROW_HEIGHT + 40);
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
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
                  <div className="rounded-lg border bg-popover p-2.5 shadow-lg min-w-[220px]">
                    <div className="font-semibold text-xs mb-2">{d.fullName}</div>
                    <div className="space-y-1 text-xs">
                      <Row label="Bekor qilingan:" value={`${d.count.toLocaleString('uz-UZ')} ta talabnoma`} color="text-chart-4" />
                      <Row label="Umumiy ulush:" value={`${pct.toFixed(1)}%`} color="text-muted-foreground" />
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Bekor qilingan">
              {rows.map((_, i) => (
                <Cell key={i} fill={getColor(i)} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                formatter={(v: number) => `${v.toLocaleString('uz-UZ')} ta`}
                style={{ fontSize: 11, fontWeight: 600, fill: 'var(--foreground)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (all.length === 0) {
    return <EmptyChart title="Bekor qiluvchi korxonalar" icon={Buildings} message="Ma'lumot topilmadi" />;
  }

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        icon={Buildings}
        iconBg="bg-chart-4/10"
        iconColor="text-chart-4"
        title="Bekor qiluvchi korxonalar/shaxslar"
        meta={`Jami ${formatNumber(total)} ta bekor qilish`}
        total={all.length}
        unit="korxona"
        expandTitle="Bekor qiluvchi korxonalar/shaxslar — barcha"
        expandDescription={`${all.length} ta korxona/shaxs | Jami ${formatNumber(total)} ta bekor qilish`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            searchKeys={['fullName']}
            render={(rows, h) => renderChart(rows, h)}
          />
        }
      />
      <div className="p-4">{renderChart(compact)}</div>
    </Card>
  );
}

// =====================================================
// 3. Bekor qilish darajasi (rate)
// =====================================================
export function CancellationRateByStationChart({ minTotal = 30 }: { minTotal?: number }) {
  const { filtered } = usePlanData();

  const all = useMemo(() => {
    const map = new Map<string, { name: string; fullName: string; canceled: number; total: number }>();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || !r.stationRaw) continue;
      let s = map.get(r.stationRaw);
      if (!s) {
        const name = r.stationName || r.stationCode || r.stationRaw;
        s = { name: truncate(name, 28), fullName: name, canceled: 0, total: 0 };
        map.set(r.stationRaw, s);
      }
      s.total++;
      if (r.status === 'canceled') s.canceled++;
    }
    return Array.from(map.values())
      .filter((s) => s.total >= minTotal && s.canceled > 0)
      .map((s) => ({
        ...s,
        rate: (s.canceled / s.total) * 100,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filtered, minTotal]);

  const compact = all.slice(0, COMPACT_LIMIT);

  const renderRows = (rows: typeof all) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.02, 0.03)}
      className="space-y-2.5"
    >
      {rows.map((d, i) => (
        <motion.div key={d.fullName + i} variants={cardVariants} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'size-5 rounded grid place-items-center text-[10px] font-bold shrink-0',
                  i < 3 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span className="font-medium truncate">{d.fullName}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="text-muted-foreground text-[10px]">
                {d.canceled} / {d.total} ta
              </span>
              <span
                className={cn(
                  'font-bold tabular-nums w-14 text-right',
                  d.rate >= 50 ? 'text-destructive' : d.rate >= 25 ? 'text-chart-3' : 'text-chart-4',
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
                d.rate >= 50 ? 'bg-destructive' : d.rate >= 25 ? 'bg-chart-3' : 'bg-chart-4',
              )}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  if (all.length === 0) {
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
      <SectionHeader
        icon={Warning}
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        title="Eng yomon performance stansiyalar"
        meta={`Bekor qilish foizi bo'yicha (min. ${minTotal} ta talabnoma)`}
        total={all.length}
        unit="stansiya"
        badgeVariant="destructive"
        expandTitle="Eng yomon performance — barcha stansiyalar"
        expandDescription={`${all.length} ta stansiya | Bekor qilish foizi tartibida`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            rowHeight={42}
            searchKeys={['fullName']}
            render={(rows) => renderRows(rows)}
          />
        }
      />
      <div className="p-4">{renderRows(compact)}</div>
    </Card>
  );
}

// =====================================================
// 4. Bekor qilingan yo'nalishlar
// =====================================================
export function CancellationFlowChart() {
  const { filtered } = usePlanData();

  const all = useMemo(() => {
    const map = new Map<
      string,
      { source: string; dest: string; sourceFull: string; destFull: string; count: number }
    >();
    for (const r of filtered) {
      if (r.hasDataQualityIssue || r.status !== 'canceled') continue;
      if (!r.stationRaw || !r.destStationRaw) continue;
      const key = `${r.stationRaw}→${r.destStationRaw}`;
      const item = map.get(key);
      if (item) {
        item.count++;
      } else {
        const sName = r.stationName || r.stationCode || r.stationRaw;
        const dName = r.destStationName || r.destStationCode || r.destStationRaw;
        map.set(key, {
          source: truncate(sName, 24),
          dest: truncate(dName, 24),
          sourceFull: sName,
          destFull: dName,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const compact = all.slice(0, COMPACT_LIMIT);
  const maxCount = Math.max(1, ...all.map((d) => d.count));

  const renderRows = (rows: typeof all) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.02, 0.03)}
      className="space-y-3"
    >
      {rows.map((flow, i) => {
        const widthPct = (flow.count / maxCount) * 100;
        return (
          <motion.div key={i} variants={cardVariants} className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="size-5 rounded bg-chart-5/15 text-chart-5 grid place-items-center text-[10px] font-bold">
                {i + 1}
              </span>
              <div className="flex-1 flex items-center gap-2 text-xs min-w-0">
                <span className="font-medium truncate flex-1" title={flow.sourceFull}>{flow.source}</span>
                <ArrowRight weight="bold" className="size-3 text-chart-5 shrink-0" />
                <span className="font-medium truncate flex-1" title={flow.destFull}>{flow.dest}</span>
              </div>
              <span className="text-xs font-bold tabular-nums text-destructive shrink-0">
                {flow.count.toLocaleString('uz-UZ')} ta
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
  );

  if (all.length === 0) {
    return <EmptyChart title="Bekor qilingan yo'nalishlar" icon={ArrowRight} message="Yo'nalish ma'lumotlari topilmadi" />;
  }

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        icon={ArrowRight}
        iconBg="bg-chart-5/10"
        iconColor="text-chart-5"
        title="Bekor qilingan yo'nalishlar"
        meta="Stansiya → Manzil bo'yicha"
        total={all.length}
        unit="yo'nalish"
        expandTitle="Bekor qilingan yo'nalishlar — barcha"
        expandDescription={`${all.length} ta yo'nalish`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            rowHeight={42}
            searchKeys={['sourceFull', 'destFull']}
            render={(rows) => renderRows(rows)}
          />
        }
      />
      <div className="p-4">{renderRows(compact)}</div>
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
      <Icon weight="duotone" className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{message}</p>
    </Card>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', color)}>{value}</span>
    </div>
  );
}
