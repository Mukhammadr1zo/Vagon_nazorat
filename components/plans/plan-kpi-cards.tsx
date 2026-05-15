"use client";

import { motion } from 'framer-motion';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Train,
  TrendingUp,
  Building2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { cardVariants, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface KPIItem {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  bg: string;
}

export function PlanKPICards() {
  const { kpis, records } = usePlanData();
  const qualityIssues = records.filter((r) => r.hasDataQualityIssue).length;

  const items: KPIItem[] = [
    {
      label: 'Jami talabnomalar',
      value: kpis.totalRequests,
      icon: ClipboardList,
      accent: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      label: 'To\'liq bajarilgan',
      value: kpis.fulfilledCount,
      sub: `${kpis.fulfillmentRatePercent.toFixed(1)}%`,
      icon: CheckCircle2,
      accent: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      label: 'Qisman bajarilgan',
      value: kpis.partialCount,
      icon: TrendingUp,
      accent: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      label: 'Bekor qilingan',
      value: kpis.canceledCount,
      sub: `${kpis.cancellationRatePercent.toFixed(1)}%`,
      icon: XCircle,
      accent: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Talab qilingan vagon',
      value: kpis.totalRequestedWagons,
      icon: Train,
      accent: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      label: 'Ta\'minlangan vagon',
      value: kpis.totalSuppliedWagons,
      sub: `${kpis.supplyRatePercent.toFixed(1)}%`,
      icon: Train,
      accent: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      label: 'O\'rt. tasdiqlash',
      value: kpis.avgApprovalLatencyDays ?? 0,
      decimals: 1,
      suffix: ' kun',
      icon: Clock,
      accent: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
    {
      label: 'O\'rt. yetkazib berish',
      value: kpis.avgDeliveryLatencyDays ?? 0,
      decimals: 1,
      suffix: ' kun',
      icon: Clock,
      accent: 'text-chart-5',
      bg: 'bg-chart-5/10',
    },
    {
      label: 'Stansiyalar',
      value: kpis.uniqueStations,
      sub: `${kpis.uniqueDestStations} manzil`,
      icon: Building2,
      accent: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      label: 'Yuk turlari',
      value: kpis.uniqueCargos,
      icon: ClipboardList,
      accent: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      label: 'Vagon turlari',
      value: kpis.uniqueWagonTypes,
      icon: Train,
      accent: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      label: 'Sifat muammosi',
      value: qualityIssues,
      icon: AlertTriangle,
      accent: qualityIssues > 0 ? 'text-chart-4' : 'text-muted-foreground',
      bg: qualityIssues > 0 ? 'bg-chart-4/10' : 'bg-muted',
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.05)}
      className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={it.label}
            variants={cardVariants}
            whileHover={{
              y: -3,
              transition: { duration: 0.2 },
            }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow relative overflow-hidden h-full">
              {/* Subtle background accent */}
              <div
                className={cn(
                  'absolute -right-4 -top-4 size-20 rounded-full blur-2xl opacity-50',
                  it.bg,
                )}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {it.label}
                  </span>
                  <div className={cn('size-7 rounded-md grid place-items-center', it.bg)}>
                    <Icon className={cn('size-3.5', it.accent)} />
                  </div>
                </div>
                <AnimatedNumber
                  value={it.value}
                  decimals={it.decimals ?? 0}
                  suffix={it.suffix}
                  className="text-xl font-bold tabular-nums block"
                />
                {it.sub && (
                  <div className={cn('text-[11px] mt-0.5 tabular-nums font-medium', it.accent)}>
                    {it.sub}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
