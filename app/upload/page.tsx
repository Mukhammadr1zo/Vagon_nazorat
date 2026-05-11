"use client";

import { UploadZone } from '@/components/upload/upload-zone';
import { UploadHistory } from '@/components/upload/upload-history';

export default function UploadPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <UploadZone />
      <UploadHistory />

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-2">
        <div className="font-medium text-foreground">📋 Qo'llanma</div>
        <ul className="space-y-1 list-disc pl-5">
          <li>Excel fayl ustunlari avtomatik aniqlanadi (Вагон номер, Накладной номер, Жўнатувчи va h.k.)</li>
          <li>Agar aniqlanmasa, qo'lda mapping dialogi ochiladi</li>
          <li>Bir necha fayl ketma-ket yuklasangiz, ma'lumotlar birlashadi — dublikatlar saqlanadi</li>
          <li>Ma'lumotlar lokal saqlanadi va sahifa yangilanganda yo'qolmaydi</li>
          <li>To'liq tozalash uchun "Barchasini tozalash" tugmasini bosing</li>
        </ul>
      </div>
    </div>
  );
}
