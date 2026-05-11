"use client";

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/data-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ColumnMapper } from './column-mapper';
import type { ColumnMapping, ParseResult } from '@/lib/types';
import { parseExcelFile } from '@/lib/excel-parser';

type ManualState = {
  file: File;
  detectedColumns: string[];
  initialMapping: ColumnMapping;
};

export function UploadZone() {
  const { uploadFile, isLoading } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [manual, setManual] = useState<ManualState | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // birinchi urinish — avtomatik
      const buf = await file.arrayBuffer();
      const probe = parseExcelFile(buf, file.name, file.size);
      if (probe.success) {
        const result = await uploadFile(file);
        return showResult(result);
      }
      if (probe.needsManualMapping) {
        setManual({
          file,
          detectedColumns: probe.detectedColumns,
          initialMapping: probe.mapping,
        });
        toast.info('Ustunlarni qo\'lda mappingga kerak', {
          description: `${probe.detectedColumns.length} ta ustun topildi — moslang`,
        });
        return;
      }
      showResult(probe);
    },
    [uploadFile],
  );

  const showResult = (r: ParseResult) => {
    if (r.success) {
      toast.success(`${r.shipments.length} ta yozuv yuklandi`, {
        description: r.fileUpload.fileName,
      });
    } else {
      toast.error('Yuklashda xatolik', {
        description: r.fileUpload.errors[0] || 'Ma\'lumot topilmadi',
      });
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = Array.from(e.dataTransfer.files).find((f) =>
        /\.(xlsx|xls|csv)$/i.test(f.name),
      );
      if (file) handleFile(file);
      else toast.error('Excel fayl tashlang (.xlsx, .xls, .csv)');
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

  const onManualConfirm = useCallback(
    async (mapping: ColumnMapping) => {
      if (!manual) return;
      const result = await uploadFile(manual.file, mapping);
      showResult(result);
      setManual(null);
    },
    [manual, uploadFile],
  );

  if (manual) {
    return (
      <ColumnMapper
        fileName={manual.file.name}
        detectedColumns={manual.detectedColumns}
        initialMapping={manual.initialMapping}
        onConfirm={onManualConfirm}
        onCancel={() => setManual(null)}
      />
    );
  }

  return (
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
          isLoading && 'opacity-50 pointer-events-none',
        )}
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 grid place-items-center mb-4">
          {isLoading ? (
            <Loader2 className="size-7 animate-spin text-primary" />
          ) : (
            <FileSpreadsheet className="size-7 text-primary" />
          )}
        </div>
        <h3 className="text-base font-semibold mb-1">
          {isDragging ? 'Faylni qo\'yib yuboring' : 'Excel faylni shu yerga tashlang'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          yoki tanlash uchun bosing — .xlsx, .xls, .csv
        </p>
        <Button asChild size="sm">
          <label className="cursor-pointer">
            <Upload className="size-4 mr-2" />
            Fayl tanlash
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onSelect}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </Button>
      </div>

      <div className="border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
        <span>
          Ustunlar avtomatik aniqlanadi. Agar aniqlanmasa, qo'lda mapping qilish dialogi ochiladi.
          Bir necha fayl ketma-ket yuklasangiz, ma'lumotlar birlashtiriladi.
        </span>
      </div>
    </Card>
  );
}

// shim — eski result icons (used in mapper)
export const ResultIcons = { CheckCircle2, XCircle };
