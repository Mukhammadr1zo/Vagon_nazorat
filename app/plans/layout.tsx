"use client";

import type { ReactNode } from 'react';
import { PlanProvider } from '@/lib/plans/plan-context';

export default function PlansLayout({ children }: { children: ReactNode }) {
  return <PlanProvider>{children}</PlanProvider>;
}
