"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { cn } from '@/lib/utils';
import { useData } from '@/lib/data-context';
import { BrandLogo } from '@/components/shared/brand-logo';

const NAV_ITEMS = [
  { href: '/', label: 'Bosh sahifa', sublabel: 'Дашборд', icon: LayoutDashboard },
  { href: '/delivery-time', label: 'Yetib borish', sublabel: 'Сроки доставки', icon: Clock },
  { href: '/speed', label: 'Tezlik tahlili', sublabel: 'Скорость', icon: Gauge },
  { href: '/upload', label: "Yuklash", sublabel: 'Загрузка', icon: Upload },
  { href: '/wagons', label: 'Vagonlar', sublabel: 'Вагоны', icon: Train },
  { href: '/routes', label: 'Marshrutlar', sublabel: 'Маршруты', icon: Route },
  { href: '/companies', label: 'Kompaniyalar', sublabel: 'Компании', icon: Building2 },
  { href: '/stations', label: 'Stansiyalar', sublabel: 'Станции', icon: TrainTrack },
  { href: '/cargo', label: 'Yuk turlari', sublabel: 'Грузы', icon: Package },
  { href: '/anomalies', label: 'Anomaliyalar', sublabel: 'Аномалии', icon: AlertTriangle },
  { href: '/reports', label: 'Hisobotlar', sublabel: 'Отчёты', icon: FileText },
  { href: '/plans', label: 'Rejalar', sublabel: 'Планы / Talabnoma', icon: ClipboardList },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { kpis, hasData, anomalies } = useData();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 group">
          <BrandLogo size={42} className="shadow-sm rounded-xl transition-transform group-hover:scale-105" />
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight">Vagon Nazorat</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              UzRail Analytics
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const badge =
            item.href === '/anomalies' && anomalies.length > 0
              ? anomalies.length
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className={cn('size-4 shrink-0', active ? '' : 'text-muted-foreground group-hover:text-foreground')} />
              <div className="flex-1 min-w-0">
                <div className="truncate">{item.label}</div>
                <div className={cn('text-[10px] truncate', active ? 'opacity-80' : 'text-muted-foreground')}>
                  {item.sublabel}
                </div>
              </div>
              {badge !== null && (
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-sidebar-primary-foreground/20' : 'bg-destructive/15 text-destructive',
                )}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer status */}
      <div className="px-4 py-3 border-t border-sidebar-border text-xs">
        {hasData ? (
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Jami jo'natma</span>
              <span className="font-mono text-foreground">{kpis.totalShipments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Unique vagonlar</span>
              <span className="font-mono text-foreground">{kpis.uniqueWagons.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Ma'lumot yo'q</p>
        )}
      </div>
    </aside>
  );
}
