"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIELD_LABELS } from '@/lib/excel-parser';
import type { ColumnMapping, ShipmentField } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

const FIELDS: ShipmentField[] = [
  'wagonNumber', 'invoiceNumber',
  'senderName', 'senderStation',
  'receiverName', 'destStation',
  'cargo', 'acceptanceAt', 'departureAt', 'distanceKm',
];

const REQUIRED: ShipmentField[] = ['wagonNumber'];

export function ColumnMapper({
  fileName,
  detectedColumns,
  initialMapping,
  onConfirm,
  onCancel,
}: {
  fileName: string;
  detectedColumns: string[];
  initialMapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}) {
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);

  const update = (field: ShipmentField, value: string) => {
    const m = { ...mapping };
    if (value === '__none__') delete m[field];
    else m[field] = parseInt(value, 10);
    setMapping(m);
  };

  const requiredOk = REQUIRED.every((f) => mapping[f] !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustunlarni moslash</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">{fileName}</span> — ustunlar avtomatik
          aniqlanmadi. Quyidagi maydonlarni Excel ustunlariga moslang.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => {
            const isRequired = REQUIRED.includes(field);
            const value = mapping[field];
            return (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1">
                  {FIELD_LABELS[field]}
                  {isRequired && <span className="text-destructive">*</span>}
                </label>
                <Select
                  value={value !== undefined ? String(value) : '__none__'}
                  onValueChange={(v) => update(field, v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Ustun tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Yo'q —</SelectItem>
                    {detectedColumns.map((col, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        <span className="font-mono text-muted-foreground mr-2">[{idx}]</span>
                        {col || `(bo'sh)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" onClick={onCancel}>Bekor qilish</Button>
          <Button onClick={() => onConfirm(mapping)} disabled={!requiredOk}>
            Tasdiqlash va yuklash
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
