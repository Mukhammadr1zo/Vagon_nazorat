"use client";

import { useEffect } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 grid place-items-center mb-4">
          <AlertOctagon className="size-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Xatolik yuz berdi</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Sahifani yuklashda kutilmagan muammo bo'ldi.
        </p>
        {error.message && (
          <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md mt-3 mb-4 text-left break-all">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-[10px] text-muted-foreground mb-4">
            Xato kodi: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm">
            <RefreshCw className="size-4 mr-1.5" />
            Qayta urinish
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/">
              <Home className="size-4 mr-1.5" />
              Bosh sahifa
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
