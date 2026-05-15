"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ y: -16, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 16, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Mavzu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn('gap-2 text-xs', theme === 'light' && 'bg-accent')}
        >
          <Sun className="size-3.5" />
          Yorug'
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn('gap-2 text-xs', theme === 'dark' && 'bg-accent')}
        >
          <Moon className="size-3.5" />
          Qorong'i
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn('gap-2 text-xs', theme === 'system' && 'bg-accent')}
        >
          <Monitor className="size-3.5" />
          Tizim
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
