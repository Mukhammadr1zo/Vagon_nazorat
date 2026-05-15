"use client";

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

// ============== Yordamchi: raqam formatlash (qisqa) ==============
function formatShort(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('uz-UZ');
}

// Pie label render — slice ichiga foiz + raqam
function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}: any) {
  if (percent < 0.04) return null; // 4%dan kam — ko'rsatmaymiz
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
        {formatShort(value)}
      </tspan>
    </text>
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
        <CardTitle className="text-sm font-medium">Bajarilish taqsimoti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] relative">
          {/* Markazda jami */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Jami</div>
            <div className="text-2xl font-bold tabular-nums">{total.toLocaleString('uz-UZ')}</div>
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
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
              />
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
  const data = cancellationReasons.slice(0, 10).map((r) => ({
    name: truncate(r.reason, 38),
    count: r.count,
    pct: r.percentage,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bekor qilish sabablari (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={220}
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--muted)' }}
                formatter={(value: number) => [`${value.toLocaleString('uz-UZ')} ta`, 'Soni']}
              />
              <Bar
                dataKey="count"
                fill="var(--destructive)"
                radius={[0, 6, 6, 0]}
                name="Soni"
              >
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
      </CardContent>
    </Card>
  );
}

// ============== Kunlik dinamika ==============
export function DailyDynamicsChart() {
  const { dailyDynamics } = usePlanData();
  const data = dailyDynamics.slice(-90);
  const hasData = data.length > 0;
  const lastPoint = hasData ? data[data.length - 1] : null;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          Kunlik talabnomalar dinamikasi (oxirgi 90 kun)
        </CardTitle>
        {lastPoint && (
          <div className="text-xs text-muted-foreground tabular-nums">
            Oxirgi: <span className="font-semibold text-foreground">{lastPoint.total}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="dailyTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => formatShort(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  value.toLocaleString('uz-UZ'),
                  name,
                ]}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
                name="Jami"
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
              />
              <Line
                type="monotone"
                dataKey="fulfilled"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                name="Bajarilgan"
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="canceled"
                stroke="var(--destructive)"
                strokeWidth={2}
                dot={false}
                name="Bekor"
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== Stansiya samaradorligi ==============
export function StationPerformanceChart() {
  const { stationStats } = usePlanData();
  const data = stationStats.slice(0, 10).map((s) => ({
    name: truncate(s.stationName || s.stationCode, 22),
    total: s.total,
    fulfilled: s.fulfilled,
    canceled: s.canceled,
    supplyRate: s.supplyRate,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 10 stansiya (talabnomalar soni)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => formatShort(v)}
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
                  value.toLocaleString('uz-UZ'),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar
                dataKey="fulfilled"
                stackId="a"
                fill="var(--chart-2)"
                name="Bajarilgan"
              />
              <Bar
                dataKey="canceled"
                stackId="a"
                fill="var(--destructive)"
                radius={[0, 6, 6, 0]}
                name="Bekor"
              >
                <LabelList
                  dataKey="total"
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
      </CardContent>
    </Card>
  );
}

// ============== Vagon turlari taqsimoti ==============
export function WagonTypeChart() {
  const { wagonTypeStats } = usePlanData();
  const data = wagonTypeStats.slice(0, 8).map((w) => ({
    name: truncate(w.wagonType, 30),
    requested: w.requestedWagons,
    supplied: w.suppliedWagons,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Vagon turlari (Top 8)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
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
                  value.toLocaleString('uz-UZ'),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar
                dataKey="requested"
                fill="var(--chart-1)"
                name="Talab qilingan"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="requested"
                  position="top"
                  formatter={(v: number) => formatShort(v)}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fill: 'var(--chart-1)',
                  }}
                />
              </Bar>
              <Bar
                dataKey="supplied"
                fill="var(--chart-2)"
                name="Ta'minlangan"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="supplied"
                  position="top"
                  formatter={(v: number) => formatShort(v)}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fill: 'var(--chart-2)',
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== Yuk turlari ==============
export function CargoTypeChart() {
  const { cargoStats } = usePlanData();
  const data = cargoStats.slice(0, 6).map((c) => ({
    name: truncate(c.cargoName || c.cargoCode, 28),
    value: c.total,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 6 yuk turi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Jami</div>
            <div className="text-2xl font-bold tabular-nums">{total.toLocaleString('uz-UZ')}</div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={2}
                labelLine={false}
                label={renderPieLabel}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('uz-UZ')} ta`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
