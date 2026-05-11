"use client";

import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/data-context';
import { EmptyState } from '@/components/shared/empty-state';
import { formatNumber } from '@/components/shared/format';
import { toast } from 'sonner';

export default function ReportsPage() {
  const {
    hasData, filtered, kpis,
    routeStats, companyStats, stationStats, cargoStats, wagonStats, anomalies,
  } = useData();

  if (!hasData) return <EmptyState />;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Shipments
    const shipmentsData = filtered.map((s) => ({
      'Вагон': s.wagonNumber,
      'Накладной': s.invoiceNumber,
      'Жўнатувчи': s.senderName,
      'Жўн. станция': `${s.senderStationCode} - ${s.senderStationName}`,
      'Қабул қилувчи': s.receiverName,
      'Манзил станция': `${s.destStationCode} - ${s.destStationName}`,
      'Юк': `${s.cargoCode} - ${s.cargoName}`,
      'Қабул сана': s.acceptanceAt ? new Date(s.acceptanceAt).toISOString() : '',
      'Чиқиш сана': s.departureAt ? new Date(s.departureAt).toISOString() : '',
      'Масофа (км)': s.distanceKm,
      'Кутиш (daq)': s.waitMinutes,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shipmentsData), 'Jo\'natmalar');

    // KPI
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([kpis]), 'KPI');
    // Marshrutlar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(routeStats), 'Marshrutlar');
    // Kompaniyalar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companyStats), 'Kompaniyalar');
    // Stansiyalar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stationStats), 'Stansiyalar');
    // Yuklar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cargoStats), 'Yuklar');
    // Vagonlar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wagonStats), 'Vagonlar');
    // Anomaliyalar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anomalies), 'Anomaliyalar');

    const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    XLSX.writeFile(wb, `vagon_nazorat_hisobot_${stamp}.xlsx`);
    toast.success('Excel hisobot yuklab olindi');
  };

  const exportCsv = () => {
    const headers = ['Wagon', 'Invoice', 'Sender', 'SenderStation', 'Receiver', 'DestStation', 'Cargo', 'AcceptedAt', 'DepartedAt', 'DistanceKm', 'WaitMin'];
    const rows = filtered.map((s) => [
      s.wagonNumber, s.invoiceNumber, s.senderName,
      `${s.senderStationCode} - ${s.senderStationName}`,
      s.receiverName,
      `${s.destStationCode} - ${s.destStationName}`,
      `${s.cargoCode} - ${s.cargoName}`,
      s.acceptanceAt ? new Date(s.acceptanceAt).toISOString() : '',
      s.departureAt ? new Date(s.departureAt).toISOString() : '',
      s.distanceKm, s.waitMinutes,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vagon_nazorat_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV yuklab olindi');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Filtrlangan</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(filtered.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">KPI bo'limlari</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">8</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Anomaliyalar</div>
          <div className="text-xl font-semibold mt-1 tabular-nums">{formatNumber(anomalies.length)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eksport variantlari</CardTitle>
          <CardDescription>Joriy filtrlangan ma'lumotlar bo'yicha hisobot tayyorlash</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={exportToExcel} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left">
              <div className="size-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <FileSpreadsheet className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Excel (.xlsx)</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  8 ta varaq: jo'natmalar, KPI, marshrut, kompaniya, stansiya, yuk, vagon, anomaliya
                </div>
              </div>
              <Download className="size-4 text-muted-foreground" />
            </button>

            <button onClick={exportCsv} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left">
              <div className="size-10 rounded-lg bg-chart-2/10 grid place-items-center shrink-0">
                <FileSpreadsheet className="size-5 text-chart-2" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">CSV (.csv)</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Faqat jo'natmalar ro'yxati (BI tools uchun)
                </div>
              </div>
              <Download className="size-4 text-muted-foreground" />
            </button>
          </div>

          <Button variant="outline" onClick={() => window.print()} className="w-full">
            <Printer className="size-4 mr-2" />
            Joriy sahifani chop etish (PDF uchun)
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Eslatma:</strong> Eksport hozirgi filtrlash holatini hisobga oladi.
        Filtrlarni Topbar dan o'zgartirib, kerakli kesimni olishingiz mumkin.
      </div>
    </div>
  );
}
