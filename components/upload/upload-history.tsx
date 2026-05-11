"use client";

import { Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/data-context';
import { formatDate, formatNumber } from '@/components/shared/format';
import { toast } from 'sonner';

export function UploadHistory() {
  const { files, removeFile, shipments, clearData } = useData();

  const onRemove = (id: string, name: string) => {
    if (confirm(`"${name}" ni o'chirasizmi? Bu faylning ma'lumotlari ham o'chadi.`)) {
      removeFile(id);
      toast.success('Fayl o\'chirildi');
    }
  };

  const onClearAll = () => {
    if (confirm('Barcha ma\'lumotlarni tozalaysizmi? Bu amal qaytarib bo\'lmaydi.')) {
      clearData();
      toast.success('Barcha ma\'lumot tozalandi');
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Hozircha yuklangan fayl yo'q
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">Yuklash tarixi</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {files.length} ta fayl • {formatNumber(shipments.length)} ta yozuv
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5 mr-1.5" />
          Barchasini tozalash
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {files.map((f) => (
            <div key={f.id} className="px-6 py-3 flex items-center gap-3 hover:bg-muted/30">
              <FileSpreadsheet className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.fileName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span>{formatDate(f.uploadedAt, true)}</span>
                  <span>•</span>
                  <span>{formatNumber(f.rowCount)} ta yozuv</span>
                  <span>•</span>
                  <span>{(f.fileSize / 1024).toFixed(1)} KB</span>
                  {f.warningCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-chart-3 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {f.warningCount} ogohlantirish
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(f.id, f.fileName)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
