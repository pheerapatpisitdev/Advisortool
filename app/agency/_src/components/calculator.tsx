'use client';

import { useState } from 'react';
import { CalculatorForm } from './calculator-form';
import { ResultsDisplay } from './results-display';
import type { CalculatorFormValues, CommissionResults } from '@agency/lib/types';
import { useToast } from '@agency/hooks/use-toast';
import { Card, CardContent } from '@agency/components/ui/card';
import { BarChart } from 'lucide-react';

export function Calculator() {
  const [results, setResults] = useState<CommissionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCalculate = async (data: CalculatorFormValues) => {
    setIsLoading(true);
    setResults(null);
    try {
      const response = await fetch('/api/agency/commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = `เกิดข้อผิดพลาด: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'การคำนวณผิดพลาด';
        } catch (e) {
          errorMessage = 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
        }
        throw new Error(errorMessage);
      }

      const resultData = await response.json();
      setResults(resultData);
    } catch (error: any) {
      console.error("Calculation Error:", error.message);
      toast({
        variant: 'destructive',
        title: 'การคำนวณล้มเหลว',
        description: error.message || 'กรุณาตรวจสอบข้อมูลที่กรอกและลองใหม่อีกครั้ง',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
      <CalculatorForm onCalculate={handleCalculate} onReset={handleReset} isLoading={isLoading} />
      <div className="lg:sticky top-24">
        {isLoading && (
          <Card className="w-full animate-pulse">
             <CardContent className="p-6 h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <BarChart className="mx-auto h-12 w-12 mb-4 animate-bounce" />
                    <p className="text-lg font-medium">กำลังคำนวณ...</p>
                </div>
            </CardContent>
          </Card>
        )}
        {!isLoading && results && <ResultsDisplay results={results} />}
        {!isLoading && !results && (
          <Card className="w-full shadow-md border-dashed">
            <CardContent className="p-6 h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">ผลลัพธ์จะแสดงที่นี่</h3>
                <p>กรอกข้อมูลในฟอร์มเพื่อคำนวณค่าบริหาร</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
