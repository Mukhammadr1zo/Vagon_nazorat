"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
};

// ============== Bajarilish taqsimoti (donut) ==============
export function FulfillmentChart() {
  const { kpis } = usePlanData();
  const data = [
    { name: 'To\'liq', value: kpis.fulfilledCount, color: STATUS_COLORS.fulfilled },
    { name: 'Qisman', value: kpis.partialCount, color: STATUS_COLORS.partial },
    { name: 'Bekor', value: kpis.canceledCount, color: STATUS_COLORS.canceled },
    { name: 'Kutilmoqda', value: kpis.pendingCount, color: STATUS_COLORS.pending },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bajarilish taqsimoti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis
                type="category"
                dataKey="name"
                width={220}
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="var(--destructive)" radius={[0, 4, 4, 0]} name="Soni" />
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Kunlik talabnomalar dinamikasi (oxirgi 90 kun)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                name="Jami"
              />
              <Line
                type="monotone"
                dataKey="fulfilled"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                name="Bajarilgan"
              />
              <Line
                type="monotone"
                dataKey="canceled"
                stroke="var(--destructive)"
                strokeWidth={2}
                dot={false}
                name="Bekor"
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="fulfilled" stackId="a" fill="var(--chart-2)" name="Bajarilgan" />
              <Bar dataKey="canceled" stackId="a" fill="var(--destructive)" name="Bekor" />
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
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="requested" fill="var(--chart-1)" name="Talab qilingan" />
              <Bar dataKey="supplied" fill="var(--chart-2)" name="Ta'minlangan" />
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 6 yuk turi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} innerRadius={50} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
