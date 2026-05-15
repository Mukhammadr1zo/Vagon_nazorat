"use client";

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { pageVariants } from '@/lib/animations';

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
