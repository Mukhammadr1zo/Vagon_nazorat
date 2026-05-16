"use client";

import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Train,
  Buildings,
  Package,
  Clock,
  Gauge,
  Stack,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { cardVariants, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils';

// =====================================================
// BENTO GRID — Asimmetrik KPI layout
// 1 katta + 2 o'rta + 4 kichik kartochka
// Modern dashboard pattern (Apple, Linear, Vercel'dan)
// =====================================================

export function PlanKPIBento() {
  const { kpis, records } = usePlanData();
  const qualityIssues = records.filter((r) => r.hasDataQualityIssue).length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.06)}
      className="grid gap-3 grid-cols-2 md:grid-cols-6 auto-rows-[110px] md:auto-rows-[125px]"
    >
      {/* ============ 1. HERO KARTOCHKA — Jami talabnomalar (3 col × 2 row) ============ */}
      <motion.div variants={cardVariants} className="col-span-2 md:col-span-3 row-span-2">
        <HeroCard
          label="Jami talabnomalar"
          value={kpis.totalRequests}
          subLabel="Bu davr uchun"
          icon={Stack}
          accent="primary"
          metaA={{ label: 'Bajarilgan', value: kpis.fulfilledCount, color: 'text-chart-2' }}
          metaB={{ label: 'Bekor', value: kpis.canceledCount, color: 'text-destructive' }}
          metaC={{ label: 'Kutilmoqda', value: kpis.pendingCount, color: 'text-chart-3' }}
        />
      </motion.div>

      {/* ============ 2. SUPPLY RATE — Asosiy KPI (3 col × 1 row) ============ */}
      <motion.div variants={cardVariants} className="col-span-2 md:col-span-3">
        <ProgressCard
          label="Vagon ta'minlanishi"
          percent={kpis.supplyRatePercent}
          supplied={kpis.totalSuppliedWagons}
          requested={kpis.totalRequestedWagons}
        />
      </motion.div>

      {/* ============ 3. Fulfillment Rate (1.5 col × 1 row) ============ */}
      <motion.div variants={cardVariants} className="col-span-1 md:col-span-2">
        <RateCard
          label="To'liq bajarilish"
          value={kpis.fulfillmentRatePercent}
          count={kpis.fulfilledCount}
          icon={CheckCircle}
          color="text-chart-2"
          bg="bg-chart-2/10"
          trend="up"
        />
      </motion.div>

      {/* ============ 4. Cancellation Rate ============ */}
      <motion.div variants={cardVariants} className="col-span-1 md:col-span-2">
        <RateCard
          label="Bekor qilish darajasi"
          value={kpis.cancellationRatePercent}
          count={kpis.canceledCount}
          icon={XCircle}
          color="text-destructive"
          bg="bg-destructive/10"
          trend={kpis.cancellationRatePercent > 15 ? 'up' : 'down'}
          inverse
        />
      </motion.div>

      {/* ============ 5. Sifat muammosi yoki kichik KPI ============ */}
      <motion.div variants={cardVariants} className="col-span-2 md:col-span-2">
        <RateCard
          label="Sifat muammosi"
          value={records.length > 0 ? (qualityIssues / records.length) * 100 : 0}
          count={qualityIssues}
          icon={WarningCircle}
          color={qualityIssues > 0 ? 'text-chart-3' : 'text-muted-foreground'}
          bg={qualityIssues > 0 ? 'bg-chart-3/10' : 'bg-muted'}
          suffix=""
          showPercent
        />
      </motion.div>

      {/* ============ 6-9. Quyi qator — 4 ta kichik KPI ============ */}
      <motion.div variants={cardVariants} className="col-span-1 md:col-span-1">
        <MiniKPI
          label="Tasdiqlash"
          value={kpis.avgApprovalLatencyDays ?? 0}
          decimals={1}
          suffix=" kun"
          icon={Clock}
          color="text-chart-4"
        />
      </motion.div>

      <motion.div variants={cardVariants} className="col-span-1 md:col-span-1">
        <MiniKPI
          label="Yetkazib berish"
          value={kpis.avgDeliveryLatencyDays ?? 0}
          decimals={1}
          suffix=" kun"
          icon={Gauge}
          color="text-chart-5"
        />
      </motion.div>

      <motion.div variants={cardVariants} className="col-span-1 md:col-span-1">
        <MiniKPI
          label="Stansiyalar"
          value={kpis.uniqueStations}
          icon={Buildings}
          color="text-chart-1"
        />
      </motion.div>

      <motion.div variants={cardVariants} className="col-span-1 md:col-span-1">
        <MiniKPI
          label="Yuk turlari"
          value={kpis.uniqueCargos}
          icon={Package}
          color="text-chart-2"
        />
      </motion.div>

      <motion.div variants={cardVariants} className="col-span-1 md:col-span-1">
        <MiniKPI
          label="Vagon turlari"
          value={kpis.uniqueWagonTypes}
          icon={Train}
          color="text-chart-3"
        />
      </motion.div>

      <motion.div variants={cardVariants} className="col-span-1 md:col-span-1">
        <MiniKPI
          label="Manzillar"
          value={kpis.uniqueDestStations}
          icon={Buildings}
          color="text-chart-4"
        />
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// HERO CARD — Eng katta KPI (jami talabnomalar)
// =====================================================
function HeroCard({
  label,
  value,
  subLabel,
  icon: Icon,
  metaA,
  metaB,
  metaC,
}: {
  label: string;
  value: number;
  subLabel: string;
  icon: any;
  accent: string;
  metaA: { label: string; value: number; color: string };
  metaB: { label: string; value: number; color: string };
  metaC: { label: string; value: number; color: string };
}) {
  return (
    <Card className="h-full p-5 md:p-6 relative overflow-hidden group hover:shadow-xl transition-shadow flex flex-col">
      {/* Background pattern */}
      <div className="absolute -right-8 -top-8 size-48 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon weight="fill" className="size-24 text-primary" />
      </div>

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
              {label}
            </div>
            <div className="text-[10px] text-muted-foreground">{subLabel}</div>
          </div>
          <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
            <Icon weight="duotone" className="size-5 text-primary" />
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <AnimatedNumber
            value={value}
            className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
          <MetaItem {...metaA} />
          <MetaItem {...metaB} />
          <MetaItem {...metaC} />
        </div>
      </div>
    </Card>
  );
}

function MetaItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn('text-base font-semibold tabular-nums', color)}>
        <AnimatedNumber value={value} />
      </div>
    </div>
  );
}

// =====================================================
// PROGRESS CARD — Foiz + progress bar
// =====================================================
function ProgressCard({
  label,
  percent,
  supplied,
  requested,
}: {
  label: string;
  percent: number;
  supplied: number;
  requested: number;
}) {
  const color =
    percent >= 90 ? 'text-chart-2' : percent >= 70 ? 'text-chart-3' : 'text-destructive';
  const barColor =
    percent >= 90 ? 'bg-chart-2' : percent >= 70 ? 'bg-chart-3' : 'bg-destructive';

  return (
    <Card className="h-full p-4 md:p-5 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <Train weight="duotone" className="size-5 text-primary" />
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <AnimatedNumber
            value={percent}
            decimals={1}
            suffix="%"
            className={cn('text-3xl md:text-4xl font-bold tabular-nums', color)}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {supplied.toLocaleString('uz-UZ')} / {requested.toLocaleString('uz-UZ')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percent)}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className={cn('h-full rounded-full', barColor)}
          />
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// RATE CARD — Foiz + raqam
// =====================================================
function RateCard({
  label,
  value,
  count,
  icon: Icon,
  color,
  bg,
  trend,
  inverse,
  suffix = '%',
  showPercent,
}: {
  label: string;
  value: number;
  count: number;
  icon: any;
  color: string;
  bg: string;
  trend?: 'up' | 'down';
  inverse?: boolean;
  suffix?: string;
  showPercent?: boolean;
}) {
  const trendColor = inverse
    ? trend === 'up'
      ? 'text-destructive'
      : 'text-chart-2'
    : trend === 'up'
    ? 'text-chart-2'
    : 'text-destructive';

  return (
    <Card className="h-full p-4 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className={cn('absolute -right-4 -top-4 size-16 rounded-full blur-2xl opacity-50', bg)} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
            {label}
          </div>
        </div>
        <div className={cn('size-8 rounded-lg grid place-items-center', bg)}>
          <Icon weight="duotone" className={cn('size-4', color)} />
        </div>
      </div>

      <div className="relative">
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber
            value={value}
            decimals={suffix === '%' ? 1 : 0}
            suffix={suffix}
            className={cn('text-2xl md:text-3xl font-bold tabular-nums', color)}
          />
          {trend && (
            <span className={cn('text-xs', trendColor)}>
              {trend === 'up' ? (
                <ArrowUpRight weight="bold" className="size-4 inline" />
              ) : (
                <ArrowDownRight weight="bold" className="size-4 inline" />
              )}
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
          {showPercent ? `${count.toLocaleString('uz-UZ')} qator` : `${count.toLocaleString('uz-UZ')} ta`}
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// MINI KPI — kichik kartochka (1 ustun)
// =====================================================
function MiniKPI({
  label,
  value,
  decimals = 0,
  suffix = '',
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="h-full p-3 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium truncate">
          {label}
        </span>
        <Icon weight="duotone" className={cn('size-3.5 shrink-0', color)} />
      </div>
      <AnimatedNumber
        value={value}
        decimals={decimals}
        suffix={suffix}
        className="text-lg font-bold tabular-nums"
      />
    </Card>
  );
}
