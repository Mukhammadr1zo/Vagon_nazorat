"use client";

import { type ReactNode } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { truncate } from '@/components/shared/format';
import {
  ExpandableChartDialog,
  ExpandButton,
  PaginatedView,
} from './expandable-chart';

const COMPACT_LIMIT = 15;
const PAGE_SIZE = 25;
const ROW_HEIGHT = 28;

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const STATUS_COLORS = {
  fulfilled: 'var(--chart-2)',
  partial: 'var(--chart-3)',
  canceled: 'var(--destructive)',
  pending: 'var(--chart-4)',
};

const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
};

function formatShort(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('uz-UZ');
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}: any) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{
        fontSize: 11,
        fontWeight: 600,
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <tspan x={x} dy="-0.4em">{(percent * 100).toFixed(1)}%</tspan>
      <tspan x={x} dy="1.2em" style={{ fontSize: 10, fontWeight: 500 }}>
        {formatShort(value)} ta
      </tspan>
    </text>
  );
}

// =====================================================
// Chart header
// =====================================================
function ChartHeader({
  title,
  meta,
  total,
  unit = 'ta',
  expandTitle,
  expandDescription,
  expandContent,
}: {
  title: string;
  meta?: ReactNode;
  total: number;
  unit?: string;
  expandTitle: string;
  expandDescription?: string;
  expandContent: ReactNode;
}) {
  const hasMore = total > COMPACT_LIMIT;
  return (
    <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {meta && <div className="text-[10px] text-muted-foreground mt-0.5">{meta}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {hasMore
            ? `${COMPACT_LIMIT} / ${total.toLocaleString('uz-UZ')} ${unit}`
            : `${total.toLocaleString('uz-UZ')} ${unit}`}
        </span>
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
    </CardHeader>
  );
}

// =====================================================
// Vertikal Bar chart renderer
// =====================================================
function renderVerticalBarChart(
  data: any[],
  options: {
    dataKey: string;
    nameKey?: string;
    color?: string;
    width?: number;
    cellFn?: (i: number) => string;
    unit?: string;
    /** Explicit height (autoFit dialog ichida); default — data.length asosida */
    height?: number;
  },
) {
  const height =
    options.height ?? Math.max(280, data.length * ROW_HEIGHT + 60);
  const unit = options.unit ?? '';
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke="var(--muted-foreground)"
            tickFormatter={formatShort}
          />
          <YAxis
            type="category"
            dataKey={options.nameKey ?? 'name'}
            width={options.width ?? 200}
            tick={{ fontSize: 10 }}
            stroke="var(--muted-foreground)"
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'var(--muted)' }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString('uz-UZ')}${unit ? ' ' + unit : ''}`,
              name,
            ]}
          />
          <Bar dataKey={options.dataKey} radius={[0, 6, 6, 0]} fill={options.color}>
            {options.cellFn &&
              data.map((_, i) => <Cell key={i} fill={options.cellFn!(i)} />)}
            <LabelList
              dataKey={options.dataKey}
              position="right"
              formatter={(v: number) =>
                unit ? `${v.toLocaleString('uz-UZ')} ${unit}` : v.toLocaleString('uz-UZ')
              }
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
  );
}

// ============== Bajarilish taqsimoti (donut) ==============
export function FulfillmentChart() {
  const { kpis } = usePlanData();
  const data = [
    { name: 'To\'liq', value: kpis.fulfilledCount, color: STATUS_COLORS.fulfilled },
    { name: 'Qisman', value: kpis.partialCount, color: STATUS_COLORS.partial },
    { name: 'Bekor', value: kpis.canceledCount, color: STATUS_COLORS.canceled },
    { name: 'Kutilmoqda', value: kpis.pendingCount, color: STATUS_COLORS.pending },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bajarilish taqsimoti (talabnomalar)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Jami</div>
            <div className="text-2xl font-bold tabular-nums">{total.toLocaleString('uz-UZ')}</div>
            <div className="text-[10px] text-muted-foreground">ta talabnoma</div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                labelLine={false}
                label={renderPieLabel}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('uz-UZ')} ta`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== Bekor qilish sabablari ==============
export function CancellationReasonsChart() {
  const { cancellationReasons } = usePlanData();
  const all = cancellationReasons.map((r) => ({
    name: truncate(r.reason, 38),
    fullName: r.reason,
    count: r.count,
    pct: r.percentage,
  }));

  const compact = all.slice(0, COMPACT_LIMIT);

  return (
    <Card>
      <ChartHeader
        title="Bekor qilish sabablari"
        total={all.length}
        unit="sabab"
        expandTitle="Bekor qilish sabablari — barcha"
        expandDescription={`Jami ${all.length} ta sabab | har biri o'z sahifasida`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            searchKeys={['fullName']}
            render={(rows, h) =>
              renderVerticalBarChart(rows, {
                dataKey: 'count',
                color: 'var(--destructive)',
                width: 240,
                unit: 'ta',
                height: h,
              })
            }
          />
        }
      />
      <CardContent>
        {renderVerticalBarChart(compact, {
          dataKey: 'count',
          color: 'var(--destructive)',
          width: 220,
          unit: 'ta',
        })}
      </CardContent>
    </Card>
  );
}

// ============== Kunlik dinamika ==============
export function DailyDynamicsChart() {
  const { dailyDynamics } = usePlanData();
  const data = dailyDynamics;
  const hasData = data.length > 0;
  const firstPoint = hasData ? data[0] : null;
  const lastPoint = hasData ? data[data.length - 1] : null;

  // Compact view — oxirgi 60 kun
  const compactData = data.slice(-60);

  const renderLine = (rows: typeof data, minWidth = 0, h = 320) => {
    const width = minWidth || '100%';
    return (
      <div style={{ width: width, minWidth, height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
              tickFormatter={(v) => formatShort(v)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('uz-UZ')} ta`,
                name,
              ]}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            <Line type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} name="Jami" />
            <Line type="monotone" dataKey="fulfilled" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Bajarilgan" />
            <Line type="monotone" dataKey="canceled" stroke="var(--destructive)" strokeWidth={2} dot={false} name="Bekor" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <ChartHeader
        title="Kunlik talabnomalar dinamikasi"
        meta={
          firstPoint && lastPoint
            ? `${firstPoint.date} → ${lastPoint.date} (oxirgi 60 kun)`
            : 'Davr ma\'lumotlari yo\'q'
        }
        total={data.length}
        unit="kun"
        expandTitle="Kunlik dinamika — to'liq davr"
        expandDescription={
          firstPoint && lastPoint
            ? `${firstPoint.date} → ${lastPoint.date} (${data.length} kun)`
            : ''
        }
        expandContent={
          <div className="h-full overflow-x-auto overflow-y-hidden">
            {renderLine(
              data,
              Math.max(800, data.length * 8),
              typeof window !== 'undefined' ? window.innerHeight - 200 : 600,
            )}
          </div>
        }
      />
      <CardContent>{renderLine(compactData)}</CardContent>
    </Card>
  );
}

// ============== Stansiya samaradorligi ==============
export function StationPerformanceChart() {
  const { stationStats } = usePlanData();
  const all = stationStats.map((s) => ({
    name: truncate(s.stationName || s.stationCode, 22),
    fullName: s.stationName || s.stationCode,
    total: s.total,
    fulfilled: s.fulfilled,
    canceled: s.canceled,
  }));

  const compact = all.slice(0, COMPACT_LIMIT);

  const renderBars = (rows: typeof all, h?: number) => {
    const height = h ?? Math.max(280, rows.length * ROW_HEIGHT + 60);
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
              width={140}
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'var(--muted)' }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('uz-UZ')} ta`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            <Bar dataKey="fulfilled" stackId="a" fill="var(--chart-2)" name="Bajarilgan" />
            <Bar dataKey="canceled" stackId="a" fill="var(--destructive)" radius={[0, 6, 6, 0]} name="Bekor">
              <LabelList
                dataKey="total"
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

  return (
    <Card>
      <ChartHeader
        title="Stansiyalar (talabnomalar soni)"
        total={all.length}
        unit="stansiya"
        expandTitle="Stansiyalar — barcha"
        expandDescription={`Jami ${all.length} ta stansiya bo'yicha talabnomalar`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            searchKeys={['fullName']}
            render={(rows, h) => renderBars(rows, h)}
          />
        }
      />
      <CardContent>{renderBars(compact)}</CardContent>
    </Card>
  );
}

// ============== Vagon turlari ==============
export function WagonTypeChart() {
  const { wagonTypeStats } = usePlanData();
  const all = wagonTypeStats.map((w) => ({
    name: truncate(w.wagonType, 30),
    fullName: w.wagonType,
    requested: w.requestedWagons,
    supplied: w.suppliedWagons,
  }));

  const compact = all.slice(0, COMPACT_LIMIT);

  const renderBars = (rows: typeof all, h?: number) => {
    const width = Math.max(640, rows.length * 80);
    return (
      <div className="overflow-x-auto h-full">
        <div style={{ width, height: h ?? 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9 }}
                stroke="var(--muted-foreground)"
                angle={-30}
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => formatShort(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--muted)' }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('uz-UZ')} vagon`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="requested" fill="var(--chart-1)" name="Talab qilingan" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="requested"
                  position="top"
                  formatter={(v: number) => `${formatShort(v)} v`}
                  style={{ fontSize: 10, fontWeight: 600, fill: 'var(--chart-1)' }}
                />
              </Bar>
              <Bar dataKey="supplied" fill="var(--chart-2)" name="Ta'minlangan" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="supplied"
                  position="top"
                  formatter={(v: number) => `${formatShort(v)} v`}
                  style={{ fontSize: 10, fontWeight: 600, fill: 'var(--chart-2)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <ChartHeader
        title="Vagon turlari"
        total={all.length}
        unit="tur"
        expandTitle="Vagon turlari — barcha"
        expandDescription={`Jami ${all.length} ta vagon turi (talab va ta'minlanish vagon hisobida)`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit={false}
            pageSize={20}
            searchKeys={['fullName']}
            render={(rows) =>
              renderBars(
                rows,
                typeof window !== 'undefined' ? window.innerHeight - 220 : 600,
              )
            }
          />
        }
      />
      <CardContent>{renderBars(compact)}</CardContent>
    </Card>
  );
}

// ============== Yuk turlari ==============
export function CargoTypeChart() {
  const { cargoStats } = usePlanData();
  const all = cargoStats.map((c) => ({
    name: truncate(c.cargoName || c.cargoCode, 28),
    fullName: c.cargoName || c.cargoCode,
    value: c.total,
  }));
  const total = all.reduce((s, d) => s + d.value, 0);
  const compact = all.slice(0, COMPACT_LIMIT);

  return (
    <Card>
      <ChartHeader
        title="Yuk turlari"
        meta={`Jami ${total.toLocaleString('uz-UZ')} ta talabnoma`}
        total={all.length}
        unit="yuk turi"
        expandTitle="Yuk turlari — barcha"
        expandDescription={`Jami ${all.length} ta yuk turi | ${total.toLocaleString('uz-UZ')} ta talabnoma`}
        expandContent={
          <PaginatedView
            data={all}
            autoFit
            searchKeys={['fullName']}
            render={(rows, h) =>
              renderVerticalBarChart(rows, {
                dataKey: 'value',
                width: 220,
                cellFn: (i) => COLORS[i % COLORS.length],
                unit: 'ta',
                height: h,
              })
            }
          />
        }
      />
      <CardContent>
        {renderVerticalBarChart(compact, {
          dataKey: 'value',
          width: 200,
          cellFn: (i) => COLORS[i % COLORS.length],
          unit: 'ta',
        })}
      </CardContent>
    </Card>
  );
}
