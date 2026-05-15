"use client";

import { useEffect } from 'react';
import { AlertOctagon, RefreshCw, ClipboardList, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clearPlanData } from '@/lib/plans/plan-storage';
import { toast } from 'sonner';

export default function PlansError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PlansError]', error);
  }, [error]);

  const onResetData = async () => {
    try {
      await clearPlanData();
      toast.success('Reja ma\'lumotlari tozalandi');
      reset();
    } catch (err) {
      toast.error('Tozalashda muammo', {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 grid place-items-center mb-4">
          <AlertOctagon className="size-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Reja modulida xatolik</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Ma'lumotlarni o'qishda yoki ko'rsatishda muammo yuz berdi.
          IndexedDB ma'lumotlari buzilgan bo'lishi mumkin.
        </p>
        {error.message && (
          <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md mt-3 mb-4 text-left break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={reset} size="sm">
            <RefreshCw className="size-4 mr-1.5" />
            Qayta urinish
          </Button>
          <Button onClick={onResetData} size="sm" variant="destructive">
            <Trash2 className="size-4 mr-1.5" />
            Ma'lumotni tozalash
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/plans">
              <ClipboardList className="size-4 mr-1.5" />
              Reja bosh sahifa
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
