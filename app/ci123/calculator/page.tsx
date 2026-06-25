import React from 'react';
import Link from 'next/link';
import PremiumCalculator from '../_src/components/PremiumCalculator';

export default function CalculatorPage() {
    return (
        <div className="ci123-scope min-h-dvh bg-white">
            {/* Header / Nav */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-[448px] items-center justify-between px-6">
                    <Link href="/ci123" className="text-lg font-bold text-gray-800">
                        CI 123
                    </Link>
                    <Link href="/ci123" className="text-sm text-gray-500 hover:text-gray-800">
                        หน้าแรก
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="pb-10 pt-20">
                <PremiumCalculator />
            </main>
        </div>
    );
}
