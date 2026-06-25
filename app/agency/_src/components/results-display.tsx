'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@agency/components/ui/card';
import { formatCurrency } from '@agency/lib/formatters';
import type { CommissionResults } from '@agency/lib/types';
import { Target, Star, Wallet, Building, Users, Network, Copy, MessageCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { HierarchyChart } from './hierarchy-chart';
import { Button } from './ui/button';
import { useToast } from '@agency/hooks/use-toast';

interface ResultsDisplayProps {
    results: CommissionResults;
}

const totalCommissionItems = [
    { key: 'tor', label: 'ค่าตอบแทน (TOR)', icon: Target },
    { key: 'ador', label: 'ค่าตอบแทนการพัฒนาตัวแทน (ADOR)', icon: Star },
    { key: 'mdor', label: 'ค่าตอบแทนการพัฒนาผู้จัดการ (MDOR)', icon: Building },
] as const;

export function ResultsDisplay({ results }: ResultsDisplayProps) {
    const { toast } = useToast();

    // Share logic
    const generateShareText = () => {
        let text = `📊 *สรุปค่าบริหารหน่วย KTAXA*\n` +
            `--------------------------------\n` +
            `💰 *รายได้รวมสุทธิ*\n` +
            `• ต่อเดือน: ${formatCurrency(results.monthlyIncome)}\n` +
            `• ต่อปี (ประมาณ): ${formatCurrency(results.totalAnnualIncome)}\n` +
            `--------------------------------\n` +
            `📈 *รายละเอียดรายได้*\n` +
            `• ค่าตอบแทน (TOR): ${formatCurrency(results.breakdown.tor)}\n` +
            `• พัฒนาตัวแทน (ADOR): ${formatCurrency(results.breakdown.ador)}\n` +
            `• พัฒนาผู้จัดการ (MDOR): ${formatCurrency(results.breakdown.mdor)}\n`;

        if (results.detailsByLevel) {
            text += `--------------------------------\n` +
                `🏢 *แยกตามหน่วยงาน*\n`;

            if (results.detailsByLevel.direct) {
                const directIncome = results.detailsByLevel.direct.tor + (results.detailsByLevel.direct.ador ?? 0);
                if (directIncome > 0) {
                    text += `• หน่วยตรง: ${formatCurrency(directIncome)}\n`;
                }
            }

            if (results.detailsByLevel.child && results.detailsByLevel.child.length > 0) {
                const childIncome = results.detailsByLevel.child.reduce((sum, unit) => sum + unit.tor + (unit.mdor ?? 0), 0);
                if (childIncome > 0) {
                    text += `• หน่วยลูก (${results.detailsByLevel.child.length} หน่วย): ${formatCurrency(childIncome)}\n`;
                }
            }

            if (results.detailsByLevel.grandchild && results.detailsByLevel.grandchild.length > 0) {
                const grandChildIncome = results.detailsByLevel.grandchild.reduce((sum, unit) => sum + unit.tor, 0);
                if (grandChildIncome > 0) {
                    text += `• หน่วยหลาน (${results.detailsByLevel.grandchild.length} หน่วย): ${formatCurrency(grandChildIncome)}\n`;
                }
            }
        }

        text += `--------------------------------\n` +
            `Application by Pheerapatpisit Thongsrithong`;
        return text;
    };

    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(generateShareText());
            toast({
                title: '✅ คัดลอกข้อความสำเร็จ',
                description: 'สามารถนำไปวางในแอปอื่นได้เลย',
            });
        } catch (err) {
            toast({
                title: '❌ ไม่สามารถคัดลอกได้',
                description: 'กรุณาลองใหม่อีกครั้ง',
                variant: 'destructive',
            });
        }
    };

    const handleShareLine = () => {
        const text = encodeURIComponent(generateShareText());
        const lineUrl = `https://line.me/R/share?text=${text}`;
        window.open(lineUrl, '_blank', 'width=600,height=500');
    };

    const hasBreakdown = Object.values(results.breakdown).some(val => val > 0);
    const hasDetails = results.detailsByLevel && (
        (results.detailsByLevel.direct && (results.detailsByLevel.direct.tor > 0 || (results.detailsByLevel.direct.ador ?? 0) > 0)) ||
        (results.detailsByLevel.child && results.detailsByLevel.child.some(c => c.tor > 0 || (c.mdor ?? 0) > 0)) ||
        (results.detailsByLevel.grandchild && results.detailsByLevel.grandchild.some(g => g.tor > 0))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="w-full shadow-lg border-primary/20">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">ภาพรวมรายได้ทั้งหมด</CardTitle>
                    <CardDescription>รายได้โดยประมาณจากทุกหน่วยงานรวมกัน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between text-center p-4 bg-accent/10 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">รายได้ต่อเดือน</p>
                            <p className="text-3xl font-bold text-accent">{formatCurrency(results.monthlyIncome)}</p>
                        </div>
                        <Separator orientation="vertical" className="h-16 mx-4" />
                        <div>
                            <p className="text-sm text-muted-foreground">รายได้รวมต่อปี (โดยประมาณ)</p>
                            <p className="text-3xl font-bold text-accent">{formatCurrency(results.totalAnnualIncome)}</p>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyText}
                            className="gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            คัดลอกข้อความ
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleShareLine}
                            className="gap-2 bg-[#06C755] hover:bg-[#05b04c] text-white"
                        >
                            <MessageCircle className="h-4 w-4" />
                            แชร์ผ่าน LINE
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {hasDetails && (
                <HierarchyChart details={results.detailsByLevel} />
            )}

            {hasBreakdown && (
                <Card>
                    <CardHeader>
                        <CardTitle>แจกแจงรายได้รวม</CardTitle>
                        <CardDescription>รายละเอียดองค์ประกอบคอมมิชชั่นรวมทุกส่วน</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {totalCommissionItems.map((item) => {
                                const value = results.breakdown[item.key];
                                if (value > 0) {
                                    return (
                                        <li key={item.key} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <item.icon className="h-5 w-5 text-muted-foreground" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </div>
                                            <span className="font-semibold text-foreground">{formatCurrency(value)}</span>
                                        </li>
                                    );
                                }
                                return null;
                            })}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {hasDetails && (
                <Card>
                    <CardHeader>
                        <CardTitle>รายละเอียดตามหน่วยงาน</CardTitle>
                        <CardDescription>แจกแจงรายได้ของแต่ละประเภทหน่วย</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {results.detailsByLevel?.direct && (results.detailsByLevel.direct.tor > 0 || (results.detailsByLevel.direct.ador ?? 0) > 0) && (
                            <div className="space-y-3">
                                <div className='flex items-center gap-3'>
                                    <Building className="h-6 w-6 text-primary" />
                                    <h4 className="font-semibold text-lg text-primary">หน่วยตรง</h4>
                                </div>
                                <ul className='space-y-2 pl-4'>
                                    {results.detailsByLevel.direct.tor > 0 &&
                                        <li className="flex items-center justify-between">
                                            <span className='text-sm'>ค่าตอบแทนหน่วยตรง (1TOR)</span>
                                            <span className='font-medium'>{formatCurrency(results.detailsByLevel.direct.tor)}</span>
                                        </li>
                                    }
                                    {(results.detailsByLevel.direct.ador ?? 0) > 0 && (
                                        <li className="flex items-center justify-between">
                                            <span className='text-sm'>ค่าตอบแทนการพัฒนาตัวแทน ADOR</span>
                                            <span className='font-medium'>{formatCurrency(results.detailsByLevel.direct.ador ?? 0)}</span>
                                        </li>
                                    )}
                                </ul>
                                <Separator />
                            </div>
                        )}

                        {results.detailsByLevel?.child && results.detailsByLevel.child.map((unit, index) => (
                            (unit.tor > 0 || (unit.mdor ?? 0) > 0) &&
                            <div key={`child-detail-${index}`} className="space-y-3">
                                <div className='flex items-center gap-3'>
                                    <Users className="h-6 w-6 text-primary" />
                                    <h4 className="font-semibold text-lg text-primary">หน่วยลูก {index + 1}</h4>
                                </div>
                                <ul className='space-y-2 pl-4'>
                                    {unit.tor > 0 &&
                                        <li className="flex items-center justify-between">
                                            <span className='text-sm'>ค่าตอบแทนหน่วยลูก (2TOR)</span>
                                            <span className='font-medium'>{formatCurrency(unit.tor)}</span>
                                        </li>
                                    }
                                    {(unit.mdor ?? 0) > 0 && (
                                        <li className="flex items-center justify-between">
                                            <span className='text-sm'>ค่าตอบแทนการพัฒนาผู้จัดการ (MDOR)</span>
                                            <span className='font-medium'>{formatCurrency(unit.mdor ?? 0)}</span>
                                        </li>
                                    )}
                                </ul>
                                <Separator />
                            </div>
                        ))}

                        {results.detailsByLevel?.grandchild && results.detailsByLevel.grandchild.map((unit, index) => (
                            unit.tor > 0 &&
                            <div key={`grandchild-detail-${index}`} className="space-y-3">
                                <div className='flex items-center gap-3'>
                                    <Network className="h-6 w-6 text-primary" />
                                    <h4 className="font-semibold text-lg text-primary">หน่วยหลาน {index + 1}</h4>
                                </div>
                                <ul className='space-y-2 pl-4'>
                                    <li className="flex items-center justify-between">
                                        <span className='text-sm'>ค่าตอบแทนหน่วยหลาน (3TOR)</span>
                                        <span className='font-medium'>{formatCurrency(unit.tor)}</span>
                                    </li>
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
