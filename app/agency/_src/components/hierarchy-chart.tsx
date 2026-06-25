'use client';

import type { CommissionResults } from '@agency/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, Building, Users, Network } from 'lucide-react';
import { formatCurrency } from '@agency/lib/formatters';

interface HierarchyChartProps {
  details: CommissionResults['detailsByLevel'];
}

const Node = ({ title, icon: Icon, items, isRoot = false }: { title: string, icon: React.ElementType, items: {label: string, value: number}[], isRoot?: boolean }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return null;

    return (
        <Card className="text-center shadow-md border-primary/20 w-full">
            <CardHeader className="p-4 items-center">
                <div className={`p-3 rounded-full ${isRoot ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <Icon className={`h-6 w-6 ${isRoot ? '' : 'text-primary'}`} />
                </div>
                <CardTitle className="text-base font-semibold mt-2">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
                <p className="text-xl font-bold text-primary">{formatCurrency(total)}</p>
                <div className="text-xs text-muted-foreground">
                    {items.map(item => item.value > 0 && (
                        <div key={item.label}>
                            <span>{item.label}: </span>
                            <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export function HierarchyChart({ details }: HierarchyChartProps) {

  const directItems = [
    { label: '1TOR', value: details?.direct?.tor ?? 0 },
    { label: 'ADOR', value: details?.direct?.ador ?? 0 },
  ];
  const directTotal = directItems.reduce((sum, item) => sum + item.value, 0);

  const hasChildUnits = details?.child && details.child.length > 0 && details.child.some(c => c.tor > 0);
  const hasGrandchildUnits = details?.grandchild && details.grandchild.length > 0 && details.grandchild.some(g => g.tor > 0);

  if (!details || (directTotal === 0 && !hasChildUnits && !hasGrandchildUnits)) {
    return null;
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>แผนภูมิโครงสร้าง</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="relative flex flex-col items-center">
                {/* Manager Node */}
                <div className="w-48 z-10">
                    <Card className="text-center bg-primary text-primary-foreground shadow-lg">
                        <CardHeader className="p-4 items-center">
                            <User className="h-8 w-8" />
                            <CardTitle className="text-lg">ผู้จัดการ</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
                
                {/* Connecting Lines to Level 1 */}
                 {(directTotal > 0 || hasChildUnits) && (
                    <div className="absolute top-[70px] h-8 w-px bg-border z-0"></div>
                )}
                
                {/* Level 1 Wrapper */}
                <div className="relative mt-8 flex justify-center items-start gap-4 w-full">
                    
                    {/* Horizontal Line for Level 1 */}
                    {directTotal > 0 && hasChildUnits && (
                         <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 h-px bg-border w-[calc(100%-200px)]"></div>
                    )}
                    
                    {/* Direct Unit */}
                    {directTotal > 0 && (
                        <div className="relative flex flex-col items-center flex-1 max-w-48">
                            <div className="absolute top-[-16px] h-4 w-px bg-border"></div>
                            <Node title="หน่วยตรง" icon={Building} items={directItems} />
                        </div>
                    )}
                    
                    {/* Child Units Column */}
                    {hasChildUnits && (
                         <div className="relative flex flex-col items-center flex-1 max-w-48 space-y-4">
                            <div className="absolute top-[-16px] h-4 w-px bg-border"></div>
                            {details.child?.map((unit, index) => {
                                const childItems = [
                                    { label: '2TOR', value: unit.tor ?? 0 },
                                    { label: 'MDOR', value: unit.mdor ?? 0 },
                                ];
                                if(childItems.reduce((s,i) => s+i.value, 0) === 0) return null;
                                return (
                                    <div key={`child-${index}`} className="w-full">
                                        <Node title={`หน่วยลูก ${index + 1}`} icon={Users} items={childItems} />
                                    </div>
                                )
                             })}

                            {/* Grandchild units go below child units */}
                            {hasGrandchildUnits && (
                                <>
                                <div className="h-6 w-px bg-border"></div>
                                <div className="w-full space-y-4">
                                     {details.grandchild?.map((unit, index) => {
                                        const grandchildItems = [
                                            { label: '3TOR', value: unit.tor ?? 0 },
                                        ];
                                        if(grandchildItems.reduce((s,i) => s+i.value, 0) === 0) return null;
                                        return (
                                            <div key={`grandchild-${index}`} className="w-full">
                                                <Node title={`หน่วยหลาน ${index + 1}`} icon={Network} items={grandchildItems} />
                                            </div>
                                        )
                                    })}
                                </div>
                                </>
                             )}
                         </div>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
