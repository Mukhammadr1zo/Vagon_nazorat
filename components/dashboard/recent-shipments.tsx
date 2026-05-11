"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { formatDate, formatKm, formatDays, truncate } from '@/components/shared/format';

export function RecentShipments() {
  const { filtered } = useData();
  const recent = [...filtered]
    .sort((a, b) => b.departureAt - a.departureAt)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">So'nggi jo'natmalar</CardTitle>
        <span className="text-xs text-muted-foreground">{filtered.length} dan</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/30 text-left">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 font-medium">Vagon</th>
                <th className="px-4 py-2 font-medium">Marshrut</th>
                <th className="px-4 py-2 font-medium">Yuk</th>
                <th className="px-4 py-2 font-medium">Jo'nat.</th>
                <th className="px-4 py-2 font-medium">Chiqish</th>
                <th className="px-4 py-2 font-medium text-right">Yetkazish</th>
                <th className="px-4 py-2 font-medium text-right">Km</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Filtrlangan ma'lumot yo'q</td></tr>
              )}
              {recent.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2 font-mono">{s.wagonNumber}</td>
                  <td className="px-4 py-2">
                    <span className="text-muted-foreground">{s.senderStationName}</span>
                    <span className="mx-1.5">→</span>
                    <span>{s.destStationName}</span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{truncate(s.cargoName, 24)}</td>
                  <td className="px-4 py-2 text-muted-foreground" title={truncate(s.senderName, 80)}>{truncate(s.senderName, 18)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatDate(s.departureAt, true)}</td>
                  <td className="px-4 py-2 tabular-nums text-right">{formatDays(s.waitMinutes / 1440)}</td>
                  <td className="px-4 py-2 tabular-nums text-right">{formatKm(s.distanceKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
