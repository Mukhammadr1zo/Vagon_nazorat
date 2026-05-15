"use client";

import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

// =====================================================
// AnimatedNumber — raqamlar count-up animatsiya bilan
// Faqat ekranda ko'ringanda animatsiya boshlanadi
// =====================================================
export function AnimatedNumber({
  value,
  duration = 1.2,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 60,
    damping: 18,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (latest) => {
    if (latest === 0 && value !== 0) return `${prefix}0${suffix}`;
    const formatted = latest.toLocaleString('uz-UZ', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
