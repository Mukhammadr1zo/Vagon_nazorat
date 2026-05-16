"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  Train,
  Route,
  Building2,
  TrainTrack,
  Package,
  AlertTriangle,
  FileText,
  Gauge,
  Clock,
  ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/delivery-time', label: 'Yetib borish', icon: Clock },
  { href: '/speed', label: 'Tezlik tahlili', icon: Gauge },
  { href: '/plans', label: 'Rejalar / Талабнома', icon: ClipboardList },
  { href: '/upload', label: 'Yuklash', icon: Upload },
  { href: '/wagons', label: 'Vagonlar', icon: Train },
  { href: '/routes', label: 'Marshrutlar', icon: Route },
  { href: '/companies', label: 'Kompaniyalar', icon: Building2 },
  { href: '/stations', label: 'Stansiyalar', icon: TrainTrack },
  { href: '/cargo', label: 'Yuk turlari', icon: Package },
  { href: '/anomalies', label: 'Anomaliyalar', icon: AlertTriangle },
  { href: '/reports', label: 'Hisobotlar', icon: FileText },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur" onClick={() => setOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-border p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold">Vagon Nazorat</div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((it) => {
                const active =
                  it.href === '/'
                    ? pathname === '/'
                    : pathname === it.href || pathname.startsWith(it.href + '/');
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                      active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent',
                    )}
                  >
                    <Icon className="size-4" />
                    {it.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
