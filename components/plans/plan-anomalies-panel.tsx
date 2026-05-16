"use client";

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  WarningCircle,
  Warning,
  Info,
  CaretRight,
  Train,
  ArrowSquareOut,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePlanData } from '@/lib/plans/plan-context';
import { cn } from '@/lib/utils';
import { formatDate, formatNumber, truncate } from '@/components/shared/format';
import { Pagination, PaginatedView } from './expandable-chart';
import type { PlanAnomaly, PlanRecord, PlanStatus } from '@/lib/plans/plan-types';
import { cardVariants, staggerContainer } from '@/lib/animations';

const SEVERITY_STYLE = {
  high: 'border-l-destructive bg-destructive/5 hover:bg-destructive/10',
  medium: 'border-l-chart-4 bg-chart-4/5 hover:bg-chart-4/10',
  low: 'border-l-chart-3 bg-chart-3/5 hover:bg-chart-3/10',
};

const SEVERITY_ICON = {
  high: WarningCircle,
  medium: Warning,
  low: Info,
};

const SEVERITY_COLOR = {
  high: 'text-destructive',
  medium: 'text-chart-4',
  low: 'text-chart-3',
};

const STATUS_LABELS: Record<PlanStatus, { label: string; className: string }> = {
  fulfilled: { label: 'Bajarilgan', className: 'bg-chart-2/15 text-chart-2' },
  partial: { label: 'Qisman', className: 'bg-chart-3/15 text-chart-3' },
  canceled: { label: 'Bekor', className: 'bg-destructive/15 text-destructive' },
  pending: { label: 'Kutilmoqda', className: 'bg-chart-4/15 text-chart-4' },
};

export function PlanAnomaliesPanel() {
  const { anomalies, records } = usePlanData();
  const [selected, setSelected] = useState<PlanAnomaly | null>(null);

  // Tegishli yozuvlar — selected'ga qarab
  const relatedRecords = useMemo(() => {
    if (!selected) return [] as PlanRecord[];
    const idSet = new Set(selected.relatedRecordIds);
    return records.filter((r) => idSet.has(r.id));
  }, [selected, records]);

  if (anomalies.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        <Info weight="duotone" className="size-8 mx-auto mb-2 opacity-50" />
        Hech qanday anomaliya aniqlanmadi
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Anomaliyalar va ogohlantirishlar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {anomalies.length} ta muammo aniqlandi — batafsil ko'rish uchun bosing
          </p>
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.04, 0.06)}
          className="divide-y divide-border"
        >
          {anomalies.map((a) => {
            const Icon = SEVERITY_ICON[a.severity];
            const hasRecords = a.relatedRecordIds.length > 0;
            return (
              <motion.button
                key={a.id}
                variants={cardVariants}
                type="button"
                onClick={() => hasRecords && setSelected(a)}
                disabled={!hasRecords}
                className={cn(
                  'w-full p-4 flex items-start gap-3 border-l-4 text-left transition-colors',
                  SEVERITY_STYLE[a.severity],
                  hasRecords ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <Icon weight="duotone" className={cn('size-5 shrink-0 mt-0.5', SEVERITY_COLOR[a.severity])} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {a.title}
                    {hasRecords && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal">
                        {a.relatedRecordIds.length.toLocaleString('uz-UZ')} ta yozuv
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{a.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={cn('text-sm font-mono tabular-nums font-semibold', SEVERITY_COLOR[a.severity])}>
                    {a.metric.toLocaleString('uz-UZ')}
                  </div>
                  {hasRecords && (
                    <CaretRight weight="bold" className="size-4 text-muted-foreground" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent
          className="!fixed !inset-0 !top-0 !left-0 !w-screen !h-screen !max-w-none !max-h-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !p-0 !gap-0 sm:!max-w-none flex flex-col"
        >
          {selected && (() => {
            const Icon = SEVERITY_ICON[selected.severity];
            return (
              <>
                <div className="flex items-start gap-3 px-6 py-4 border-b border-border shrink-0 bg-card">
                  <div className={cn(
                    'size-10 rounded-xl grid place-items-center shrink-0',
                    selected.severity === 'high' ? 'bg-destructive/15' :
                    selected.severity === 'medium' ? 'bg-chart-4/15' : 'bg-chart-3/15',
                  )}>
                    <Icon weight="duotone" className={cn('size-5', SEVERITY_COLOR[selected.severity])} />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold">{selected.title}</DialogTitle>
                    <DialogDescription className="text-sm mt-1">
                      {selected.description}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {relatedRecords.length.toLocaleString('uz-UZ')} ta yozuv
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-background">
                  <div className="max-w-7xl mx-auto">
                    <RecordsTable records={relatedRecords} anomalyType={selected.type} />
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

// =====================================================
// Records jadval — anomaliya yozuvlarini ko'rsatish
// =====================================================
function RecordsTable({
  records,
  anomalyType,
}: {
  records: PlanRecord[];
  anomalyType: string;
}) {
  const showLatency = anomalyType === 'long-approval' || anomalyType === 'long-delivery';
  const isApproval = anomalyType === 'long-approval';
  const isDelivery = anomalyType === 'long-delivery';
  const isQuality = anomalyType === 'data-quality';
  const isFrequentCancel = anomalyType === 'frequent-cancel';

  return (
    <PaginatedView
      data={records}
      autoFit
      rowHeight={42}
      searchKeys={['stationRaw', 'cargoRaw', 'wagonType', 'gu12Number', 'destStationRaw']}
      render={(rows, h) => (
        <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-auto" style={{ maxHeight: h }}>
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">№</th>
                  <th className="px-3 py-2 text-left font-medium">Stansiya</th>
                  <th className="px-3 py-2 text-left font-medium">Manzil</th>
                  <th className="px-3 py-2 text-left font-medium">Yuk</th>
                  <th className="px-3 py-2 text-left font-medium">Vagon turi</th>
                  <th className="px-3 py-2 text-right font-medium">Talab (v)</th>
                  <th className="px-3 py-2 text-right font-medium">Ta'min. (v)</th>
                  {showLatency && (
                    <th className="px-3 py-2 text-right font-medium">
                      {isApproval ? 'Tasdiqlash' : 'Yetkazib berish'}
                    </th>
                  )}
                  {isFrequentCancel && (
                    <th className="px-3 py-2 text-left font-medium">Bekor sababi</th>
                  )}
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      Yozuv topilmadi
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const status = STATUS_LABELS[r.status];
                  return (
                    <tr
                      key={r.id}
                      className={cn('border-t border-border/50 hover:bg-muted/30', isQuality && r.hasDataQualityIssue && 'bg-chart-4/5')}
                    >
                      <td className="px-3 py-2 tabular-nums">{r.rowNo}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{truncate(r.stationName, 22)}</div>
                        <div className="text-[10px] text-muted-foreground">{r.stationCode}</div>
                      </td>
                      <td className="px-3 py-2">
                        {r.destStationName ? (
                          <>
                            <div>{truncate(r.destStationName, 22)}</div>
                            <div className="text-[10px] text-muted-foreground">{r.destStationCode}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div>{truncate(r.cargoName, 26)}</div>
                        <div className="text-[10px] text-muted-foreground">{r.cargoCode}</div>
                      </td>
                      <td className="px-3 py-2 text-[11px]">{truncate(r.wagonType, 18)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {r.requestedCount.toLocaleString('uz-UZ')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className={r.suppliedCount >= r.requestedCount ? 'text-chart-2' : 'text-muted-foreground'}>
                          {r.suppliedCount.toLocaleString('uz-UZ')}
                        </span>
                      </td>
                      {showLatency && (
                        <td className="px-3 py-2 text-right tabular-nums">
                          {isApproval && r.approvalLatencyDays !== null ? (
                            <span className="text-destructive font-medium">
                              {r.approvalLatencyDays.toFixed(1)} kun
                            </span>
                          ) : isDelivery && r.deliveryLatencyDays !== null ? (
                            <span className="text-destructive font-medium">
                              {r.deliveryLatencyDays.toFixed(1)} kun
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {isFrequentCancel && (
                        <td className="px-3 py-2 text-[11px] text-muted-foreground">
                          {truncate(r.cancelReasonGroup ?? '—', 30)}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <span className={cn('inline-block text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    />
  );
}
