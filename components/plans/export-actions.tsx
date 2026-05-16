"use client";

import { useState } from 'react';
import {
  Printer,
  FilePdf,
  FileXls,
  Download,
  CaretDown,
} from '@phosphor-icons/react/dist/ssr';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePlanData } from '@/lib/plans/plan-context';
import * as XLSX from 'xlsx';

export function ExportActions() {
  const { filtered, kpis, meta } = usePlanData();
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    toast.info('Chop etish dialogi ochilmoqda', {
      description: 'PDF saqlash uchun "Saqlash PDF sifatida" tanlang',
    });
    setTimeout(() => window.print(), 300);
  };

  const handleExcel = () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: KPI Summary
      const summary = [
        ['Vagon Nazorat — Reja Tahlili Hisoboti'],
        [`Sana: ${new Date().toLocaleDateString('uz-UZ')}`],
        meta ? [`Manba fayl: ${meta.fileName}`] : [],
        [],
        ['KPI', 'Qiymat'],
        ['Jami talabnomalar', kpis.totalRequests],
        ['To\'liq bajarilgan', kpis.fulfilledCount],
        ['Qisman bajarilgan', kpis.partialCount],
        ['Bekor qilingan', kpis.canceledCount],
        ['Kutilmoqda', kpis.pendingCount],
        [],
        ['Talab qilingan vagon', kpis.totalRequestedWagons],
        ['Ta\'minlangan vagon', kpis.totalSuppliedWagons],
        ['Ta\'minlanish %', `${kpis.supplyRatePercent.toFixed(2)}%`],
        ['Bekor qilish %', `${kpis.cancellationRatePercent.toFixed(2)}%`],
        ['Bajarilish %', `${kpis.fulfillmentRatePercent.toFixed(2)}%`],
        [],
        ['O\'rt. tasdiqlash (kun)', kpis.avgApprovalLatencyDays?.toFixed(1) ?? '—'],
        ['O\'rt. yetkazib berish (kun)', kpis.avgDeliveryLatencyDays?.toFixed(1) ?? '—'],
        [],
        ['Stansiyalar', kpis.uniqueStations],
        ['Manzil stansiyalar', kpis.uniqueDestStations],
        ['Yuk turlari', kpis.uniqueCargos],
        ['Vagon turlari', kpis.uniqueWagonTypes],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'KPI Hisoboti');

      // Sheet 2: Records (cheklangan, agar juda ko'p bo'lsa)
      const limit = 50000;
      const data = filtered.slice(0, limit).map((r) => ({
        '№': r.rowNo,
        Varaq: r.sheetKind === 'reja-jadvali' ? 'Reja Jadvali' : 'Asosiy reja',
        'Stansiya kodi': r.stationCode,
        'Stansiya nomi': r.stationName,
        'Manzil kodi': r.destStationCode ?? '',
        'Manzil nomi': r.destStationName ?? '',
        'Yuk kodi': r.cargoCode,
        'Yuk nomi': r.cargoName,
        'Vagon turi': r.wagonType,
        'Talab': r.requestedCount,
        'Ta\'min.': r.suppliedCount,
        'Qoldiq': r.remainingCount,
        'Talabnoma sanasi': r.requestEnteredAt?.toLocaleDateString('uz-UZ') ?? '',
        'Tasdiqlangan': r.approvedAt?.toLocaleDateString('uz-UZ') ?? '',
        'Tasdiqlovchi': r.approvedBy ?? '',
        'Bekor sanasi': r.canceledAt?.toLocaleDateString('uz-UZ') ?? '',
        'Bekor sababi': r.cancelReasonGroup ?? '',
        'Status':
          r.status === 'fulfilled'
            ? 'Bajarilgan'
            : r.status === 'partial'
            ? 'Qisman'
            : r.status === 'canceled'
            ? 'Bekor'
            : 'Kutilmoqda',
      }));
      const wsData = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, wsData, 'Ma\'lumotlar');

      const fname = `vagon-nazorat-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fname);

      toast.success('Excel hisobot saqlandi', {
        description: `${data.length.toLocaleString('uz-UZ')} qator | ${fname}`,
      });

      if (filtered.length > limit) {
        toast.warning(
          `Faqat ${limit.toLocaleString('uz-UZ')} qator eksport qilindi (filterlar bilan kamaytiring)`,
        );
      }
    } catch (err) {
      toast.error('Excel eksportda xatolik', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="default" disabled={loading} className="shadow-md">
          <Download weight="bold" className="size-4 mr-1.5" />
          Eksport
          <CaretDown weight="bold" className="size-3 ml-1.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel className="text-xs">Hisobot formati</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
          <FilePdf weight="duotone" className="size-4 text-destructive" />
          <div className="flex-1">
            <div className="text-sm">PDF (chop etish)</div>
            <div className="text-[10px] text-muted-foreground">
              Rahbariyatga jo'natish uchun
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExcel}
          disabled={loading}
          className="gap-2 cursor-pointer"
        >
          <FileXls weight="duotone" className="size-4 text-chart-2" />
          <div className="flex-1">
            <div className="text-sm">Excel (XLSX)</div>
            <div className="text-[10px] text-muted-foreground">
              Qo'shimcha tahlil uchun
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
          <Printer weight="duotone" className="size-4" />
          <div className="text-sm">Chop etish</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
