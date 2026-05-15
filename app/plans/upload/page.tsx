"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanUploader } from '@/components/plans/plan-uploader';

export default function PlanUploadPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/plans">
            <ArrowLeft className="size-4 mr-1" />
            Orqaga
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-1">Reja faylini yuklash</h1>
        <p className="text-sm text-muted-foreground">
          «Режа Жадвали» va «Asosiy reja» varaqlari avtomatik aniqlanadi va alohida tahlil qilinadi
        </p>
      </div>

      <PlanUploader />
    </div>
  );
}
