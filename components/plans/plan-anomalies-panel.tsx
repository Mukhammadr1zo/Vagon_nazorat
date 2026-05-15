"use client";

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { cn } from '@/lib/utils';

const SEVERITY_STYLE = {
  high: 'border-destructive/40 bg-destructive/5',
  medium: 'border-chart-4/40 bg-chart-4/5',
  low: 'border-chart-3/40 bg-chart-3/5',
};

const SEVERITY_ICON = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const SEVERITY_COLOR = {
  high: 'text-destructive',
  medium: 'text-chart-4',
  low: 'text-chart-3',
};

export function PlanAnomaliesPanel() {
  const { anomalies } = usePlanData();

  if (anomalies.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        <Info className="size-8 mx-auto mb-2 opacity-50" />
        Hech qanday anomaliya aniqlanmadi
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Anomaliyalar va ogohlantirishlar</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {anomalies.length} ta muammo aniqlandi
        </p>
      </div>
      <div className="divide-y divide-border">
        {anomalies.map((a) => {
          const Icon = SEVERITY_ICON[a.severity];
          return (
            <div
              key={a.id}
              className={cn('p-4 flex items-start gap-3 border-l-4', SEVERITY_STYLE[a.severity])}
            >
              <Icon className={cn('size-5 shrink-0 mt-0.5', SEVERITY_COLOR[a.severity])} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.description}</div>
              </div>
              <div className={cn('text-xs font-mono tabular-nums', SEVERITY_COLOR[a.severity])}>
                {a.metric.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
