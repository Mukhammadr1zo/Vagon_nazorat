"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';
import { formatKm, truncate } from '@/components/shared/format';

export function TopCompaniesMini() {
  const { companyStats } = useData();
  const senders = companyStats.filter((c) => c.role === 'sender').slice(0, 5);
  const receivers = companyStats.filter((c) => c.role === 'receiver').slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top kompaniyalar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Jo'natuvchilar</div>
          <ul className="space-y-1">
            {senders.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {senders.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1" title={c.name}>{truncate(c.name, 30)}</span>
                <span className="font-mono shrink-0 tabular-nums ml-2">{c.shipments}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Qabul qiluvchilar</div>
          <ul className="space-y-1">
            {receivers.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {receivers.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1" title={c.name}>{truncate(c.name, 30)}</span>
                <span className="font-mono shrink-0 tabular-nums ml-2">{c.shipments}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
