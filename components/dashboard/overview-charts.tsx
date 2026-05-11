"use client";

import { Fragment } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';

const COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)',
];

export function OverviewCharts() {
  const { dailySeries, cargoStats, routeStats, hourlyHeatmap } = useData();

  const cargoData = cargoStats.slice(0, 6).map((c) => ({
    name: c.name.length > 24 ? c.name.slice(0, 22) + '…' : c.name,
    value: c.shipments,
  }));

  const topRoutes = routeStats.slice(0, 8).map((r) => ({
    name: `${r.senderStation} → ${r.destStation}`,
    shipments: r.shipments,
    wagons: r.uniqueWagons,
  }));

  // Heatmap (kun × soat)
  const heatRows = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
    weekday: wd,
    cells: hourlyHeatmap.filter((p) => p.weekday === wd).sort((a, b) => a.hour - b.hour),
  }));
  const maxHeat = Math.max(1, ...hourlyHeatmap.map((p) => p.count));
  const dayNames = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Kunlik trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Kunlik jo'natmalar dinamikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySeries}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area dataKey="shipments" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} name="Jo'natma" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yuk turlari (donut) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Yuk turlari taqsimoti (Top 6)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cargoData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {cargoData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top marshrutlar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Eng faol marshrutlar (Top 8)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRoutes} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="shipments" fill="var(--chart-2)" name="Jo'natma" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Soatlik heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Faollik issiqlik xaritasi (kun × soat)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-0.5 text-[9px]">
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-center text-muted-foreground">{h}</div>
                ))}
                {heatRows.map((row) => (
                  <Fragment key={`row-${row.weekday}`}>
                    <div className="text-muted-foreground self-center pr-1">{dayNames[row.weekday]}</div>
                    {row.cells.map((cell) => {
                      const intensity = cell.count / maxHeat;
                      return (
                        <div
                          key={`${row.weekday}-${cell.hour}`}
                          title={`${dayNames[row.weekday]} ${cell.hour}:00 — ${cell.count} ta`}
                          className="aspect-square rounded-sm"
                          style={{
                            backgroundColor:
                              cell.count === 0
                                ? 'var(--muted)'
                                : `color-mix(in oklab, var(--chart-1) ${15 + intensity * 80}%, transparent)`,
                          }}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
