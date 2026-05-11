"use client";

import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/lib/data-context';

const SEVERITY = {
  high: { color: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Yuqori' },
  medium: { color: 'bg-chart-3/15 text-chart-3 border-chart-3/30', label: 'O\'rta' },
  low: { color: 'bg-muted text-muted-foreground border-border', label: 'Past' },
} as const;

export function QuickAnomalies() {
  const { anomalies } = useData();
  const top = anomalies.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="size-4 text-chart-3" />
          Anomaliyalar
        </CardTitle>
        <Link href="/anomalies" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
          Barchasini ko'rish <ChevronRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Anomaliya topilmadi ✓</p>
        ) : (
          top.map((a) => {
            const sev = SEVERITY[a.severity];
            return (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/30">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${sev.color}`}>
                  {sev.label}
                </span>
                <div className="text-xs flex-1 min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-muted-foreground truncate">{a.description}</div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
