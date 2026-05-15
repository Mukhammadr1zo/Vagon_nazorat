"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Upload,
  ClipboardList,
  Table2,
  XCircle,
  TrainTrack,
  Package,
  Train,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlanData } from '@/lib/plans/plan-context';
import { PlanKPICards } from '@/components/plans/plan-kpi-cards';
import { SheetTabs } from '@/components/plans/sheet-tabs';
import { PlanAnomaliesPanel } from '@/components/plans/plan-anomalies-panel';
import { PlanFiltersPanel } from '@/components/plans/plan-filters-panel';
import { ExecutiveInsights } from '@/components/plans/executive-insights';
import { PlanDashboardSkeleton } from '@/components/plans/plan-skeletons';
import {
  FulfillmentChart,
  CancellationReasonsChart,
  DailyDynamicsChart,
  StationPerformanceChart,
  WagonTypeChart,
  CargoTypeChart,
} from '@/components/plans/plan-charts';
import {
  cardVariants,
  staggerContainer,
  slideUp,
} from '@/lib/animations';

export default function PlansDashboardPage() {
  const { isHydrated, hasData } = usePlanData();

  if (!isHydrated) {
    return <PlanDashboardSkeleton />;
  }

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[70vh]"
      >
        <Card className="p-10 text-center max-w-md gradient-card">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 grid place-items-center mb-5"
          >
            <ClipboardList className="size-9 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Reja Tahlili Moduli</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            RJU stansiyalari talabnomalari va rejalarini avtomatik tahlil qilish
            tizimi. Xlsx faylni yuklang — sun'iy intellekt sizga eng muhim
            xulosa va tavsiyalarni taqdim etadi.
          </p>
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/plans/upload">
              <Upload className="size-4 mr-2" />
              Faylni yuklash
            </Link>
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.08)}
      className="space-y-6"
    >
      <motion.div
        variants={slideUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reja Tahlili</h1>
          <p className="text-sm text-muted-foreground mt-1">
            RJU stansiyalari talabnomalari va rejaning bajarilishi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SheetTabs />
          <NavButton href="/plans/requests" icon={Table2} label="Jadval" />
          <NavButton href="/plans/stations" icon={TrainTrack} label="Stansiyalar" />
          <NavButton href="/plans/cargo" icon={Package} label="Yuk turlari" />
          <NavButton href="/plans/wagon-types" icon={Train} label="Vagon turlari" />
          <NavButton href="/plans/cancellations" icon={XCircle} label="Bekor qilingan" />
          <NavButton href="/plans/upload" icon={Upload} label="Yangi fayl" />
        </div>
      </motion.div>

      <motion.div variants={cardVariants}>
        <PlanFiltersPanel />
      </motion.div>

      {/* RAHBARIYAT UCHUN — Asosiy xulosa va tavsiyalar */}
      <ExecutiveInsights />

      <motion.div variants={cardVariants}>
        <PlanKPICards />
      </motion.div>

      <motion.div variants={staggerContainer(0.1, 0.1)} className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={cardVariants}>
          <FulfillmentChart />
        </motion.div>
        <motion.div variants={cardVariants}>
          <CargoTypeChart />
        </motion.div>
        <motion.div variants={cardVariants}>
          <CancellationReasonsChart />
        </motion.div>
        <motion.div variants={cardVariants}>
          <WagonTypeChart />
        </motion.div>
      </motion.div>

      <motion.div variants={cardVariants}>
        <DailyDynamicsChart />
      </motion.div>

      <motion.div variants={staggerContainer(0.1, 0.1)} className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={cardVariants}>
          <StationPerformanceChart />
        </motion.div>
        <motion.div variants={cardVariants}>
          <PlanAnomaliesPanel />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function NavButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Upload;
  label: string;
}) {
  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
      <Button asChild size="sm" variant="outline">
        <Link href={href}>
          <Icon className="size-4 mr-1.5" />
          {label}
        </Link>
      </Button>
    </motion.div>
  );
}
