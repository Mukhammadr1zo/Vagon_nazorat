"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanData } from '@/lib/plans/plan-context';
import {
  generatePlanInsights,
  getExecutiveSummary,
  type PlanInsight,
  type InsightSeverity,
} from '@/lib/plans/plan-insights';
import { AnimatedNumber } from '@/components/shared/animated-number';
import {
  cardVariants,
  staggerContainer,
  EASING,
} from '@/lib/animations';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  {
    icon: typeof AlertOctagon;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  critical: {
    icon: AlertOctagon,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    label: 'Kritik',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
    border: 'border-chart-3/30',
    label: 'Diqqat',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-chart-2',
    bg: 'bg-chart-2/10',
    border: 'border-chart-2/30',
    label: 'Yaxshi',
  },
  info: {
    icon: Info,
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
    border: 'border-chart-1/30',
    label: 'Eslatma',
  },
};

const HEALTH_CONFIG = {
  critical: { color: 'text-destructive', label: 'Kritik holat', emoji: '🔴' },
  warning: { color: 'text-chart-3', label: 'Diqqat talab', emoji: '🟡' },
  good: { color: 'text-chart-2', label: 'Yaxshi', emoji: '🟢' },
  excellent: { color: 'text-chart-2', label: "A'lo darajada", emoji: '⭐' },
};

export function ExecutiveInsights() {
  const { records, kpis } = usePlanData();

  const insights = useMemo(
    () => generatePlanInsights(records, kpis),
    [records, kpis],
  );
  const summary = useMemo(() => getExecutiveSummary(insights), [insights]);

  if (insights.length === 0) return null;

  const health = HEALTH_CONFIG[summary.overallHealth];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.1, 0.08)}
      className="space-y-4"
    >
      {/* Health Score Banner */}
      <motion.div variants={cardVariants}>
        <Card className="overflow-hidden p-0 relative border-2">
          <div
            className={cn(
              'absolute inset-0 opacity-50',
              summary.overallHealth === 'critical' && 'bg-destructive/5',
              summary.overallHealth === 'warning' && 'bg-chart-3/5',
              summary.overallHealth === 'good' && 'bg-chart-2/5',
              summary.overallHealth === 'excellent' && 'bg-chart-2/10',
            )}
          />
          <div className="relative p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...EASING.spring, delay: 0.2 }}
                className={cn(
                  'size-16 md:size-20 rounded-2xl grid place-items-center shrink-0',
                  summary.overallHealth === 'critical' && 'bg-destructive/15',
                  summary.overallHealth === 'warning' && 'bg-chart-3/15',
                  (summary.overallHealth === 'good' ||
                    summary.overallHealth === 'excellent') &&
                    'bg-chart-2/15',
                )}
              >
                <Activity className={cn('size-8 md:size-10', health.color)} />
              </motion.div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Umumiy holat
                </div>
                <div className="flex items-baseline gap-2">
                  <AnimatedNumber
                    value={summary.healthScore}
                    className={cn('text-3xl md:text-4xl font-bold tabular-nums', health.color)}
                  />
                  <span className="text-base text-muted-foreground">/100</span>
                </div>
                <div className={cn('text-sm font-medium mt-0.5', health.color)}>
                  {health.emoji} {health.label}
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px h-16 bg-border" />

            <div className="flex-1 grid grid-cols-3 gap-3">
              <SeverityStat
                label="Kritik"
                count={insights.filter((i) => i.severity === 'critical').length}
                color="text-destructive"
              />
              <SeverityStat
                label="Diqqat"
                count={insights.filter((i) => i.severity === 'warning').length}
                color="text-chart-3"
              />
              <SeverityStat
                label="Yaxshi"
                count={insights.filter((i) => i.severity === 'success').length}
                color="text-chart-2"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={cardVariants}
        className="flex items-center gap-2 mt-2"
      >
        <Lightbulb className="size-5 text-chart-3" />
        <h2 className="text-lg font-semibold">Asosiy xulosalar va tavsiyalar</h2>
        <Badge variant="secondary" className="ml-auto">
          {insights.length} ta xulosa
        </Badge>
      </motion.div>

      {/* Insights cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight, idx) => (
          <InsightCard key={insight.id} insight={insight} index={idx} />
        ))}
      </div>
    </motion.div>
  );
}

function SeverityStat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="text-center md:text-left">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn('text-2xl font-bold tabular-nums', color)}>
        <AnimatedNumber value={count} />
      </div>
    </div>
  );
}

function InsightCard({
  insight,
  index,
}: {
  insight: PlanInsight;
  index: number;
}) {
  const cfg = SEVERITY_CONFIG[insight.severity];
  const Icon = cfg.icon;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          'p-4 border-l-4 h-full flex flex-col gap-2',
          cfg.border,
          cfg.bg,
        )}
      >
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 + 0.3, ...EASING.spring }}
            className={cn('size-9 rounded-lg grid place-items-center shrink-0', cfg.bg)}
          >
            <Icon className={cn('size-4', cfg.color)} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold leading-snug">
                {insight.title}
              </h3>
              {insight.trend && (
                <span className={cn('shrink-0', cfg.color)}>
                  {insight.trend === 'up' ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {insight.description}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-2 border-t border-border/50 flex items-start gap-2">
          <Target className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            <span className="font-medium">Tavsiya: </span>
            {insight.recommendation}
          </p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 h-5', cfg.color, cfg.border)}
          >
            {cfg.label}
          </Badge>
          <span className={cn('text-xs font-mono tabular-nums font-semibold', cfg.color)}>
            {insight.metric}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
