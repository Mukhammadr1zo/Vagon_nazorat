"use client";

import Link from 'next/link';
import { Inbox, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function EmptyState({
  title = "Hozircha ma'lumot yo'q",
  description = "Tahlilni boshlash uchun Excel fayl yuklang",
  showUploadLink = true,
}: {
  title?: string;
  description?: string;
  showUploadLink?: boolean;
}) {
  return (
    <Card className="border-dashed border-border/60 bg-card/40 p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-muted/50 grid place-items-center mb-4">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">{description}</p>
      {showUploadLink && (
        <Link href="/upload">
          <Button size="sm">
            <Upload className="size-4 mr-2" />
            Yuklash sahifasiga o'tish
          </Button>
        </Link>
      )}
    </Card>
  );
}
