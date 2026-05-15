import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted grid place-items-center mb-4">
          <FileQuestion className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Sahifa topilmadi</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.
        </p>
        <Button asChild size="sm">
          <Link href="/">
            <Home className="size-4 mr-1.5" />
            Bosh sahifaga
          </Link>
        </Button>
      </Card>
    </div>
  );
}
