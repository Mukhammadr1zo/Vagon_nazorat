"use client";

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanData } from '@/lib/plans/plan-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/components/shared/format';

export function PlanUploader() {
  const { uploadFile, uploading, uploadProgress, lastParseResult, hasData, meta, clearData } =
    usePlanData();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        toast.error('Faqat .xlsx yoki .xls fayllar qabul qilinadi');
        return;
      }
      try {
        const result = await uploadFile(file);
        if (result.errors.length > 0) {
          toast.error('Yuklashda muammo', { description: result.errors[0] });
          return;
        }
        toast.success(`${formatNumber(result.records.length)} ta yozuv yuklandi`, {
          description: `Reja Jadvali: ${formatNumber(result.sheetCounts['reja-jadvali'])} | Asosiy reja: ${formatNumber(result.sheetCounts['asosiy-reja'])}`,
        });
        setTimeout(() => router.push('/plans'), 600);
      } catch (err) {
        toast.error('Xatolik yuz berdi', {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [uploadFile, router],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = Array.from(e.dataTransfer.files).find((f) => /\.(xlsx|xls)$/i.test(f.name));
      if (file) handleFile(file);
      else toast.error('Excel fayl (.xlsx yoki .xls) tashlang');
    },
    [handleFile],
  );

  const onSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  if (uploading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="size-10 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-base font-semibold mb-2">
          {uploadProgress?.phase ?? 'Boshlanmoqda...'}
        </h3>
        <Progress value={uploadProgress?.percent ?? 0} className="mb-2" />
        <p className="text-xs text-muted-foreground">
          {uploadProgress?.percent ?? 0}% — 22 MB fayl uchun 15–30 soniya kerak bo'lishi mumkin
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasData && meta && (
        <Card className="p-4 border-chart-2/30 bg-chart-2/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-chart-2 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">{meta.fileName}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Jami: {formatNumber(meta.totalRows)} qator | Reja Jadvali:{' '}
                  {formatNumber(meta.sheetCounts['reja-jadvali'])} | Asosiy reja:{' '}
                  {formatNumber(meta.sheetCounts['asosiy-reja'])}
                </div>
                {meta.qualityIssueCount > 0 && (
                  <div className="text-xs text-chart-4 mt-1 flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    {formatNumber(meta.qualityIssueCount)} qator ma'lumot sifati muammosi
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-1">
                  Yuklangan: {new Date(meta.parsedAt).toLocaleString('uz-UZ')}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await clearData();
                toast.success('Ma\'lumotlar tozalandi');
              }}
            >
              <Trash2 className="size-4 mr-1.5" />
              Tozalash
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'relative p-12 text-center transition-colors',
            isDragging ? 'bg-primary/5' : '',
          )}
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 grid place-items-center mb-4">
            <FileSpreadsheet className="size-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">
            {isDragging ? 'Faylni qo\'yib yuboring' : 'Reja faylini shu yerga tashlang'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            yoki tanlash uchun bosing — .xlsx, .xls
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Kutilgan varaqlar: <span className="font-mono">«Режа Жадвали»</span> va{' '}
            <span className="font-mono">«Asosiy reja»</span>
          </p>
          <Button asChild size="sm">
            <label className="cursor-pointer">
              <Upload className="size-4 mr-2" />
              Fayl tanlash
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onSelect}
                className="hidden"
              />
            </label>
          </Button>
        </div>

        <div className="border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground flex items-start gap-2">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Bu modul mavjud "Vagon Nazorat" dashboardidan ALOHIDA ishlaydi va ma'lumotlar aralashmaydi.
            22 MB gacha hajmdagi fayllar qo'llab-quvvatlanadi. Ustun siljishi avtomatik aniqlanadi.
          </span>
        </div>
      </Card>

      {lastParseResult && (
        <Card className="p-4 text-xs space-y-1">
          <div className="font-medium text-sm mb-2">Oxirgi yuklash natijasi</div>
          <div>
            ⏱ Davomiyligi: {(lastParseResult.durationMs / 1000).toFixed(1)} sekund
          </div>
          {lastParseResult.warnings.map((w, i) => (
            <div key={i} className="text-chart-4">
              ⚠ {w}
            </div>
          ))}
          {lastParseResult.errors.map((e, i) => (
            <div key={i} className="text-destructive">
              ✕ {e}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
