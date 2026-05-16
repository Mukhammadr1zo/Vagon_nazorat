"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload } from 'lucide-react';
import { XCircle } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlanData } from '@/lib/plans/plan-context';
import { CancellationReasonsChart } from '@/components/plans/plan-charts';
import {
  CancellationByStationChart,
  CancellationByCancelerChart,
  CancellationRateByStationChart,
  CancellationFlowChart,
} from '@/components/plans/cancellation-charts';
import { SheetTabs } from '@/components/plans/sheet-tabs';
import { PlanFiltersPanel } from '@/components/plans/plan-filters-panel';
import { formatNumber } from '@/components/shared/format';
import { cardVariants, staggerContainer, slideUp } from '@/lib/animations';

export default function PlanCancellationsPage() {
  const { isHydrated, hasData, cancellationReasons } = usePlanData();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-10 text-center max-w-md">
          <p className="text-sm text-muted-foreground mb-4">Ma'lumot yo'q.</p>
          <Button asChild>
            <Link href="/plans/upload">
              <Upload className="size-4 mr-2" />
              Fayl yuklash
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalCancel = cancellationReasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.08)}
      className="space-y-6"
    >
      <motion.div variants={slideUp} className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/plans">
            <ArrowLeft className="size-4 mr-1" />
            Orqaga
          </Link>
        </Button>
      </motion.div>

      <motion.div
        variants={slideUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <XCircle weight="duotone" className="size-7 text-destructive" />
            Bekor qilingan talabnomalar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jami{' '}
            <span className="font-bold text-destructive tabular-nums">
              {formatNumber(totalCancel)}
            </span>{' '}
            ta bekor qilish — sabab, stansiya, korxona va yo'nalish bo'yicha tahlil
          </p>
        </div>
        <SheetTabs />
      </motion.div>

      <motion.div variants={cardVariants}>
        <PlanFiltersPanel />
      </motion.div>

      {/* Sabablar — eng tepada (eng muhim) */}
      <motion.div variants={cardVariants}>
        <CancellationReasonsChart />
      </motion.div>

      {/* Bekor qilingan stansiyalar + korxonalar yonma-yon */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={cardVariants}>
          <CancellationByStationChart />
        </motion.div>
        <motion.div variants={cardVariants}>
          <CancellationByCancelerChart />
        </motion.div>
      </div>

      {/* Performance darajasi + Yo'nalishlar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={cardVariants}>
          <CancellationRateByStationChart minTotal={30} />
        </motion.div>
        <motion.div variants={cardVariants}>
          <CancellationFlowChart />
        </motion.div>
      </div>
    </motion.div>
  );
}
