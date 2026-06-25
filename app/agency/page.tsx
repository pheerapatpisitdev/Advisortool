import Image from 'next/image';
import { Button } from '@agency/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@agency/components/ui/card';
import { Calculator, Award, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center">
                <div className="text-center mb-12">
                    <Link href="/agency" className="inline-block">
                    <Image src="/agency/logo.png" alt="Agency Blueprint" width={120} height={120} className="mx-auto mb-4 rounded-xl object-cover hover:opacity-90 transition-opacity" priority />
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-primary">Agency Blueprint</h1>
                    <p className="text-lg text-muted-foreground mt-2">เลือกเครื่องมือที่คุณต้องการใช้งาน</p>
                </div>
                <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
                        <Link href="/agency/calculator" className="transform transition-transform duration-300 hover:scale-105">
                            <Card className="h-full shadow-xl hover:shadow-2xl transition-shadow text-center rounded-2xl">
                                <CardHeader className="items-center">
                                    <div className="bg-primary/10 rounded-full p-4 mb-2">
                                        <Calculator className="h-12 w-12 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-foreground">เครื่องคำนวณค่าบริหาร</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">คำนวณรายได้ค่าบริหารจากหน่วยงานของคุณ</p>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/agency/bonus-calculator" className="transform transition-transform duration-300 hover:scale-105">
                            <Card className="h-full shadow-xl hover:shadow-2xl transition-shadow text-center rounded-2xl">
                                <CardHeader className="items-center">
                                    <div className="bg-accent/10 rounded-full p-4 mb-2">
                                        <Award className="h-12 w-12 text-accent" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-foreground">เครื่องมือคำนวนรายได้ตัวแทน</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">คำนวณรายได้และโบนัสสำหรับตัวแทน</p>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/agency/manager-test" className="transform transition-transform duration-300 hover:scale-105">
                            <Card className="h-full shadow-xl hover:shadow-2xl transition-shadow text-center rounded-2xl">
                                <CardHeader className="items-center">
                                    <div className="bg-secondary/70 rounded-full p-4 mb-2">
                                        <FileText className="h-12 w-12 text-secondary-foreground" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-foreground">แบบทดสอบผู้จัดการ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">แบบทดสอบ 24 ข้อ</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </main>
            <footer className="py-4 text-center text-muted-foreground text-sm">
                <p>Application by Pheerapatpisit Thongsrithong</p>
            </footer>
        </div>
    );
}
