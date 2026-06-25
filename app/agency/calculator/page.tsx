import Image from 'next/image';
import { Calculator } from '@agency/components/calculator';
import { Button } from '@agency/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CalculatorPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="relative mb-8 text-center">
            <Link href="/agency" className="inline-block">
            <Image src="/agency/logo.png" alt="Agency Blueprint" width={64} height={64} className="mx-auto mb-4 rounded-lg object-cover hover:opacity-90 transition-opacity" />
            </Link>
            <div className="absolute top-1/2 -translate-y-1/2 left-0">
                <Button asChild variant="ghost">
                    <Link href="/agency">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        กลับหน้าแรก
                    </Link>
                </Button>
            </div>
        </div>
        <Calculator />
      </main>
      <footer className="py-4 text-center text-muted-foreground text-sm">
        <p>Application by Pheerapatpisit Thongsrithong</p>
      </footer>
    </div>
  );
}
