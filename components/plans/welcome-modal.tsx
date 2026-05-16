"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkle,
  ChartLineUp,
  Lightning,
  Robot,
  Database,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/brand-logo';

const WELCOME_KEY = 'vn-welcome-seen-v1';

const STEPS = [
  {
    icon: Database,
    title: 'Xush kelibsiz!',
    description:
      'Vagon Nazorat — RJU rejalarini avtomatik tahlil qilib, rahbariyatga tayyor hisobot beruvchi platforma.',
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
  },
  {
    icon: Lightning,
    title: '237 ming yozuv 30 soniyada',
    description:
      'Excel faylni yuklang — tizim avtomatik 2 varaqni (Reja Jadvali + Asosiy reja) o\'qib, IndexedDB\'ga saqlaydi. Keyingi safar yuklash kerak emas.',
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
  },
  {
    icon: ChartLineUp,
    title: 'Avtomatik xulosalar',
    description:
      'Sun\'iy intellekt ma\'lumotni o\'qib, eng muhim 4-6 ta xulosa va aniq tavsiya beradi. Health Score 0-100 — bir qarashda umumiy holat.',
    color: 'text-chart-2',
    bg: 'bg-chart-2/10',
  },
  {
    icon: Sparkle,
    title: 'Taqdimotga tayyor',
    description:
      'Animatsiyali grafiklar, raqamlangan ustunlar, dark/light theme. Rahbariyatga ko\'rsatishga to\'liq tayyor.',
    color: 'text-chart-4',
    bg: 'bg-chart-4/10',
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = typeof window !== 'undefined' && localStorage.getItem(WELCOME_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setOpen(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 gradient-mesh pointer-events-none opacity-50" />

        <div className="relative p-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <BrandLogo size={36} className="rounded-lg" />
              <div>
                <DialogTitle className="text-base">Vagon Nazorat</DialogTitle>
                <DialogDescription className="text-xs">
                  UzRail Analytics Platform
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step content */}
          <div className="min-h-[180px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className={`size-14 rounded-2xl ${current.bg} grid place-items-center mb-4`}
                >
                  <Icon weight="duotone" className={`size-7 ${current.color}`} />
                </motion.div>
                <h3 className="text-lg font-bold mb-2">{current.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 py-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-8 bg-primary'
                    : i < step
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={close} className="text-xs">
              O'tkazib yuborish
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Orqaga
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (isLast) close();
                  else setStep((s) => s + 1);
                }}
              >
                {isLast ? (
                  <>
                    <CheckCircle weight="bold" className="size-4 mr-1.5" />
                    Boshlash
                  </>
                ) : (
                  <>Davom etish</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
