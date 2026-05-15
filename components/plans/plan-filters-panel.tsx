"use client";

import { useState } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlanData } from '@/lib/plans/plan-context';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/components/shared/format';
import type {
  PlanFilters,
  PlanStatus,
  PlanDateField,
} from '@/lib/plans/plan-types';

const STATUS_OPTIONS: { value: PlanStatus; label: string; className: string }[] = [
  { value: 'fulfilled', label: 'Bajarilgan', className: 'text-chart-2' },
  { value: 'partial', label: 'Qisman', className: 'text-chart-3' },
  { value: 'canceled', label: 'Bekor qilingan', className: 'text-destructive' },
  { value: 'pending', label: 'Kutilmoqda', className: 'text-chart-4' },
];

const DATE_FIELDS: { value: PlanDateField; label: string }[] = [
  { value: 'requestEnteredAt', label: 'Talabnoma kiritilgan' },
  { value: 'approvedAt', label: 'Tasdiqlangan' },
  { value: 'canceledAt', label: 'Bekor qilingan' },
  { value: 'dispatchedAt', label: 'Jo\'natilgan' },
  { value: 'arrivedAt', label: 'Yetib kelgan' },
];

function toInputDate(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

function fromInputDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// =====================================================
// MultiSelect (popover bilan)
// =====================================================
function MultiSelect({
  label,
  values,
  options,
  onChange,
  searchPlaceholder = 'Qidirish...',
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder?: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;
  const visibleSlice = filtered.slice(0, 200);

  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between font-normal h-9"
        >
          <span className="truncate">
            {label}
            {values.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5">
                {values.length}
              </Badge>
            )}
          </span>
          <ChevronDown className="size-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-2 border-b border-border">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {visibleSlice.length === 0 && (
            <div className="text-xs text-center text-muted-foreground py-6">
              Topilmadi
            </div>
          )}
          {visibleSlice.map((o) => {
            const checked = values.includes(o);
            return (
              <label
                key={o}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs hover:bg-accent',
                  checked && 'bg-accent/50',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(o)}
                  className="size-3.5"
                />
                <span className="flex-1 truncate" title={o}>
                  {o}
                </span>
              </label>
            );
          })}
          {filtered.length > 200 && (
            <div className="text-[10px] text-center text-muted-foreground py-2 border-t border-border mt-1">
              {filtered.length - 200} ta yana — qidiruvni torting
            </div>
          )}
        </div>
        {values.length > 0 && (
          <div className="border-t border-border p-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {values.length} ta tanlangan
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onChange([])}
            >
              Tozalash
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// =====================================================
// Asosiy filter panel
// =====================================================
export function PlanFiltersPanel() {
  const { filters, setFilters, resetFilters, uniqueValues, filtered, records } =
    usePlanData();
  const [open, setOpen] = useState(true);

  const activeCount =
    filters.stations.length +
    filters.destStations.length +
    filters.cargos.length +
    filters.wagonTypes.length +
    filters.statuses.length +
    filters.approvers.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    (filters.search ? 1 : 0);

  const update = <K extends keyof PlanFilters>(key: K, value: PlanFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  const toggleStatus = (s: PlanStatus) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : [...filters.statuses, s];
    update('statuses', next);
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full px-4 py-3 flex items-center justify-between border-b border-border hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Filterlar</span>
              {activeCount > 0 && (
                <Badge variant="secondary" className="px-2 py-0 h-5">
                  {activeCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatNumber(filtered.length)} / {formatNumber(records.length)}
              </span>
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform',
                  open && 'rotate-180',
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Qidiruv */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Umumiy qidiruv
              </Label>
              <Input
                placeholder="Stansiya, yuk, GU-12, hujjat, vagon turi..."
                value={filters.search}
                onChange={(e) => update('search', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Sana */}
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Sana maydonini tanlash
                </Label>
                <Select
                  value={filters.dateField}
                  onValueChange={(v) => update('dateField', v as PlanDateField)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FIELDS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Dan
                </Label>
                <Input
                  type="date"
                  value={toInputDate(filters.dateRange.start)}
                  onChange={(e) =>
                    update('dateRange', {
                      ...filters.dateRange,
                      start: fromInputDate(e.target.value),
                    })
                  }
                  className="h-9 w-[160px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Gacha
                </Label>
                <Input
                  type="date"
                  value={toInputDate(filters.dateRange.end)}
                  onChange={(e) =>
                    update('dateRange', {
                      ...filters.dateRange,
                      end: fromInputDate(e.target.value),
                    })
                  }
                  className="h-9 w-[160px]"
                />
              </div>
            </div>

            {/* Status checkboxlar */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const active = filters.statuses.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleStatus(s.value)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        active
                          ? 'border-foreground bg-foreground/10 font-medium'
                          : 'border-border hover:bg-accent',
                        s.className,
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-select'lar */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <MultiSelect
                label="Stansiya (manba)"
                values={filters.stations}
                options={uniqueValues.stations}
                onChange={(v) => update('stations', v)}
                searchPlaceholder="Stansiya qidirish..."
              />
              <MultiSelect
                label="Stansiya (manzil)"
                values={filters.destStations}
                options={uniqueValues.destStations}
                onChange={(v) => update('destStations', v)}
                searchPlaceholder="Manzil stansiya..."
              />
              <MultiSelect
                label="Yuk turi"
                values={filters.cargos}
                options={uniqueValues.cargos}
                onChange={(v) => update('cargos', v)}
                searchPlaceholder="Yuk qidirish..."
              />
              <MultiSelect
                label="Vagon turi"
                values={filters.wagonTypes}
                options={uniqueValues.wagonTypes}
                onChange={(v) => update('wagonTypes', v)}
                searchPlaceholder="Vagon turi..."
              />
              <MultiSelect
                label="Tasdiqlovchi shaxs"
                values={filters.approvers}
                options={uniqueValues.approvers}
                onChange={(v) => update('approvers', v)}
                searchPlaceholder="Tasdiqlovchi..."
              />
            </div>

            {/* Bottom action */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                {activeCount > 0
                  ? `${activeCount} ta filtr faol`
                  : 'Filtrlar qo\'llanmagan'}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={resetFilters}
                disabled={activeCount === 0}
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Filtrlarni tozalash
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
