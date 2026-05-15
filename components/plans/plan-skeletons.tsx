"use client";

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { staggerContainer, cardVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

function Bar({ className, w }: { className?: string; w?: string }) {
  return (
    <div
      className={cn('h-3 rounded skeleton-shimmer', className)}
      style={{ width: w }}
    />
  );
}

export function KPICardsSkeleton() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.02, 0.04)}
      className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div key={i} variants={cardVariants}>
          <Card className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Bar w="50%" className="h-2" />
              <div className="size-4 rounded skeleton-shimmer" />
            </div>
            <Bar w="70%" className="h-6" />
            <Bar w="40%" className="h-2" />
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Card className="p-4 space-y-3">
      <Bar w="40%" className="h-3" />
      <div
        className="skeleton-shimmer rounded"
        style={{ height: `${height}px` }}
      />
    </Card>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <Bar w="200px" className="h-8" />
        <Bar w="100px" className="h-6" />
      </div>
      <div className="p-3 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Bar className="h-3 flex-1" />
            <Bar className="h-3 w-16" />
            <Bar className="h-3 w-20" />
            <Bar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl skeleton-shimmer" />
          <div className="space-y-2 flex-1">
            <Bar w="120px" className="h-2" />
            <Bar w="80px" className="h-8" />
            <Bar w="100px" className="h-3" />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <Bar w="80%" className="h-3" />
                <Bar w="100%" className="h-2" />
                <Bar w="60%" className="h-2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PlanDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <InsightsSkeleton />
      <KPICardsSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
