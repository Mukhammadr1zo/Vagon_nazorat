"use client";

import { usePathname } from 'next/navigation';
import { Search, Calendar, RotateCcw, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/data-context';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Bosh sahifa', subtitle: 'Umumiy ko\'rinish va asosiy ko\'rsatkichlar' },
  '/upload': { title: 'Ma\'lumot yuklash', subtitle: 'Excel fayllarni yuklash va boshqarish' },
  '/wagons': { title: 'Vagonlar tahlili', subtitle: 'Har bir vagon bo\'yicha statistika' },
  '/routes': { title: 'Marshrutlar', subtitle: 'Yo\'nalish bo\'yicha tahlil' },
  '/companies': { title: 'Kompaniyalar', subtitle: 'Jo\'natuvchi va qabul qiluvchilar' },
  '/stations': { title: 'Stansiyalar', subtitle: 'Stansiya yuk aylanmasi' },
  '/cargo': { title: 'Yuk turlari', subtitle: 'Yuk bo\'yicha taqsimot' },
  '/speed': { title: 'Tezlik tahlili', subtitle: 'Marshrut bo\'yicha yetkazib berish samaradorligi' },
  '/anomalies': { title: 'Anomaliyalar', subtitle: 'Diqqat talab qiluvchi holatlar' },
  '/reports': { title: 'Hisobotlar', subtitle: 'PDF va Excel eksport' },
  '/plans': { title: 'Reja Tahlili', subtitle: 'RJU talabnomalari va bajarilish' },
  '/plans/upload': { title: 'Reja faylini yuklash', subtitle: 'XLSX import' },
  '/plans/requests': { title: 'Talabnomalar', subtitle: 'Barcha talabnomalar ro\'yxati' },
  '/plans/stations': { title: 'Stansiyalar', subtitle: 'Stansiya bo\'yicha samaradorlik' },
  '/plans/cargo': { title: 'Yuk turlari', subtitle: 'Yuk bo\'yicha taqsimot' },
  '/plans/wagon-types': { title: 'Vagon turlari', subtitle: 'Vagon ta\'minlanish' },
  '/plans/cancellations': { title: 'Bekor qilishlar', subtitle: 'Sabablar va manbalar' },
};

export function Topbar() {
  const pathname = usePathname();
  const { filters, setFilters, resetFilters, hasData, files } = useData();
  const info = PAGE_TITLES[pathname] || { title: 'Vagon Nazorat', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="px-4 lg:px-8 py-4 flex items-center gap-4">
        <MobileNav />

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">{info.title}</h1>
          <p className="text-xs text-muted-foreground truncate">{info.subtitle}</p>
        </div>

        {hasData && (
          <>
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Vagon yoki накладной..."
                  value={filters.wagonSearch}
                  onChange={(e) => setFilters({ ...filters, wagonSearch: e.target.value })}
                  className="pl-8 h-9 w-56 text-sm"
                />
              </div>

              <div className="flex items-center gap-1.5 border border-border rounded-md px-2 h-9">
                <Calendar className="size-3.5 text-muted-foreground" />
                <input
                  type="date"
                  className="bg-transparent text-xs outline-none"
                  value={filters.dateRange.start ? new Date(filters.dateRange.start).toISOString().slice(0, 10) : ''}
                  onChange={(e) => {
                    const v = e.target.value ? new Date(e.target.value).getTime() : null;
                    setFilters({ ...filters, dateRange: { ...filters.dateRange, start: v } });
                  }}
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="date"
                  className="bg-transparent text-xs outline-none"
                  value={filters.dateRange.end ? new Date(filters.dateRange.end).toISOString().slice(0, 10) : ''}
                  onChange={(e) => {
                    const v = e.target.value ? new Date(e.target.value).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
                    setFilters({ ...filters, dateRange: { ...filters.dateRange, end: v } });
                  }}
                />
              </div>

              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                <RotateCcw className="size-3.5 mr-1.5" />
                Filtr
              </Button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-3 h-9">
              <Database className="size-3.5" />
              <span className="font-mono">{files.length}</span> fayl
            </div>
          </>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
