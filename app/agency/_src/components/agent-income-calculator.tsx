'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@agency/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@agency/components/ui/form';
import { Input } from '@agency/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@agency/components/ui/select';
import { Button } from '@agency/components/ui/button';
import { Loader2, RotateCcw, Award, BarChart, Wallet, Link2, MessageCircle, Copy } from 'lucide-react';
import { agentIncomeInputSchema } from '@agency/lib/schemas';
import { formatCurrency } from '@agency/lib/formatters';
import { Slider } from './ui/slider';
import { insuranceProducts } from '@agency/lib/products';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@agency/hooks/use-toast';

type FormValues = z.infer<typeof agentIncomeInputSchema>;
interface CalculationResult {
  commission: number;
  firstYearCommissionRate: number;
  nbc: number;
  modeCreditRate: number;
  quarterlyBonus: number;
  qvbRate: number;
  yearlyBonus: number;
  yebRate: number;
  actualTotalIncome: number;
  commissionProjection: {
    year: number;
    rate: number;
    commission: number;
  }[];
  incomeProjection: {
    year: number;
    newBusinessIncome: number;
    renewalIncome: number;
    totalIncome: number;
  }[];
}

const formSchema = agentIncomeInputSchema;

export function AgentIncomeCalculator() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      ape: 0,
      productId: insuranceProducts[0].id,
      paymentMode: 'yearly',
      persistencyModifier: 100,
    },
  });

  // Load from URL params on mount
  useEffect(() => {
    const ape = searchParams.get('ape');
    const productId = searchParams.get('product');
    const paymentMode = searchParams.get('mode');
    const persistency = searchParams.get('p');

    if (ape) {
      const values: FormValues = {
        ape: parseInt(ape, 10) || 0,
        productId: productId || insuranceProducts[0].id,
        paymentMode: (paymentMode as 'yearly' | 'semi-annually' | 'monthly') || 'yearly',
        persistencyModifier: parseInt(persistency || '100', 10),
      };
      form.reset(values);
      // Auto-calculate if params exist
      if (values.ape > 0) {
        setTimeout(() => form.handleSubmit(onSubmit)(), 500);
      }
    }
  }, [searchParams]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/agency/agent-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('การคำนวณผิดพลาด');
      }

      const resultData = await response.json();
      setResult(resultData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      ape: 0,
      productId: insuranceProducts[0].id,
      paymentMode: 'yearly',
      persistencyModifier: 100,
    });
    setResult(null);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const numericValue = Number(rawValue);
    if (!isNaN(numericValue)) {
      field.onChange(numericValue);
    } else if (rawValue === '') {
      field.onChange(0);
    }
  };

  const formatCurrencyValue = (value: number) => {
    if (value === 0) return '';
    return value.toLocaleString('en-US');
  };

  const formData = form.watch();

  // Share functions
  const generateShareUrl = () => {
    const params = new URLSearchParams({
      ape: formData.ape.toString(),
      product: formData.productId,
      mode: formData.paymentMode,
      p: formData.persistencyModifier.toString(),
    });
    return `${window.location.origin}/bonus-calculator?${params.toString()}`;
  };

  const generateShareText = () => {
    if (!result) return '';
    const product = insuranceProducts.find(p => p.id === formData.productId);

    // Helper to format percentage values
    const toPercent = (val: number) => Math.round(val * 100);

    return `🧮 *สรุปผลคำนวณรายได้ตัวแทน KTAXA*\n` +
      `--------------------------------\n` +
      `📋 *ข้อมูลแบบประกัน*\n` +
      `• แบบประกัน: ${product?.name || formData.productId}\n` +
      `• เบี้ยรายปี (APE): ${formatCurrency(formData.ape)}\n` +
      `• การชำระเบี้ย: ${formData.paymentMode === 'yearly' ? 'รายปี' : formData.paymentMode === 'semi-annually' ? 'ราย 6 เดือน' : 'รายเดือน'}\n` +
      `• Persistency: ${formData.persistencyModifier}%\n\n` +

      `💰 *รายได้รวมสุทธิ: ${formatCurrency(result.actualTotalIncome)}*\n` +
      `--------------------------------\n` +
      `📊 *รายละเอียดการคำนวณ*\n\n` +

      `1️⃣ *คอมมิชชั่นปีแรก*\n` +
      `   • เรทคอมฯ: ${result.firstYearCommissionRate}%\n` +
      `   > ได้รับ: ${formatCurrency(result.commission)}\n\n` +

      `2️⃣ *เครดิตผลงาน (NBC)*\n` +
      `   • Mode Credit: ${toPercent(result.modeCreditRate)}%\n` +
      `   > NBC Credit: ${formatCurrency(result.nbc)}\n\n` +

      `3️⃣ *โบนัสไตรมาส (QVB)*\n` +
      `   • เรท QVB: ${toPercent(result.qvbRate)}%\n` +
      `   > ได้รับ: ${formatCurrency(result.quarterlyBonus)}\n\n` +

      `4️⃣ *โบนัสสิ้นปี (YEB)*\n` +
      `   • เรท YEB: ${toPercent(result.yebRate)}%\n` +
      `   > ได้รับ: ${formatCurrency(result.yearlyBonus)}\n` +
      `--------------------------------\n` +
      `Application by Pheerapatpisit Thongsrithong`;
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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">คำนวณรายได้และโบนัสตัวแทน</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อคำนวณ NBC Credit, โบนัสไตรมาส และโบนัสสิ้นปี</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="ape"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบี้ยประกันรายปี (APE)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="เช่น 50,000"
                        {...field}
                        value={formatCurrencyValue(field.value || 0)}
                        onChange={(e) => handleCurrencyChange(e, field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แบบประกัน</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกแบบประกัน" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insuranceProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      อัตราค่าคอมมิชชั่นจะถูกกำหนดโดยอัตโนมัติตามแบบประกันที่เลือก
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>งวดการชำระเบี้ย (Mode)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกงวดการชำระ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yearly">รายปี</SelectItem>
                        <SelectItem value="semi-annually">ราย 6 เดือน</SelectItem>
                        <SelectItem value="monthly">รายเดือน</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      ใช้สำหรับคำนวณ NBC Credit เพื่อหาโบนัสไตรมาส (QVB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="persistencyModifier"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Persistency Modifier (%)</FormLabel>
                      <span className="text-sm font-medium text-primary">{field.value}%</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={130}
                        step={1}
                        className="py-2"
                      />
                    </FormControl>
                    <FormDescription>
                      อัตราความยั่งยืนกรมธรรม์ที่ปรับปรุงแล้ว (P%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 mt-8">
                <Button type="button" variant="outline" onClick={handleReset} className="w-1/4">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  ล้าง
                </Button>
                <Button type="submit" disabled={isLoading} className="w-3/4 bg-accent hover:bg-accent/90">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังคำนวณ...
                    </>
                  ) : (
                    'คำนวณ'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="lg:sticky top-24 space-y-6">
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

        {!isLoading && (result ? (
          <>
            <Card className="w-full shadow-lg animate-in fade-in duration-500 border-2 border-accent">
              <CardHeader className="p-0">
                <CardTitle className="text-xl text-accent-foreground bg-accent text-center p-3">
                  <div className="flex items-center justify-center gap-2">
                    <Wallet className="h-6 w-6" />
                    <span>รายได้ที่เข้ากระเป๋าตามจริง</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-accent">
                    {formatCurrency(result.actualTotalIncome)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2 !mt-6">
                  <p className="flex justify-between items-center">
                    <span>คอมมิชชั่นปีแรก</span>
                    <span className="font-mono text-foreground">{formatCurrency(result.commission)}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>โบนัสไตรมาส (QVB)</span>
                    <span className="font-mono text-foreground">{formatCurrency(result.quarterlyBonus)}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>โบนัสสิ้นปี (YEB)</span>
                    <span className="font-mono text-foreground">{formatCurrency(result.yearlyBonus)}</span>
                  </p>
                </div>

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-2 justify-center pt-4 border-t">
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

            <Card className="w-full shadow-lg animate-in fade-in duration-500">
              <CardHeader>
                <CardTitle className="text-xl text-primary font-bold">รายละเอียดการคำนวณ</CardTitle>
                <CardDescription>
                  ข้อมูลรายละเอียดการคำนวณคอมมิชชั่น NBC และโบนัสต่างๆ
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Year Commission */}
                <div className="space-y-4 p-4 border rounded-xl bg-card/50">
                  <div>
                    <h4 className="font-bold text-primary mb-1">1. ผลการคำนวณคอมมิชชั่นปีแรก</h4>
                    <p className="text-xs text-muted-foreground">สูตร: เบี้ยประกันรายปี (APE) &times; อัตราคอมมิชชั่นปีแรก</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p className="flex justify-between">
                      <span>เบี้ยประกันรายปี (APE):</span>
                      <span className="font-mono text-foreground">{formatCurrency(formData.ape)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>อัตราคอมมิชชั่นปีแรก:</span>
                      <span className="font-mono text-foreground"> &times; {result.firstYearCommissionRate}%</span>
                    </p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs text-primary">คอมมิชชั่นที่ได้รับ</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(result.commission)}
                    </p>
                  </div>
                </div>

                {/* NBC Calculation */}
                <div className="space-y-4 p-4 border rounded-xl bg-card/50">
                  <div>
                    <h4 className="font-bold text-primary mb-1">2. ผลการคำนวณ NBC</h4>
                    <p className="text-xs text-muted-foreground">สูตร: Commission (ปีแรก) &times; Mode Credit</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p className="flex justify-between">
                      <span>คอมมิชชั่น (ปีแรก):</span>
                      <span className="font-mono text-foreground">{formatCurrency(result.commission)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Mode Credit ({formData.paymentMode === 'yearly' ? 'รายปี' : formData.paymentMode === 'semi-annually' ? 'ราย 6 เดือน' : 'รายเดือน'}):</span>
                      <span className="font-mono text-foreground"> &times; {result.modeCreditRate * 100}%</span>
                    </p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs text-primary">มูลค่าธุรกิจใหม่ (NBC Credit)</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(result.nbc)}
                    </p>
                  </div>
                </div>

                {/* QVB Bonus */}
                <div className="space-y-4 p-4 border rounded-xl bg-card/50">
                  <div>
                    <h4 className="font-bold text-accent mb-1">3. โบนัสผลงานประจำไตรมาส (QVB)</h4>
                    <p className="text-xs text-muted-foreground">สูตร: NBC Credit &times; อัตรา QVB &times; Persistency Modifier</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p className="flex justify-between">
                      <span>NBC Credit:</span>
                      <span className="font-mono text-foreground">{formatCurrency(result.nbc)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>อัตราโบนัส QVB:</span>
                      <span className="font-mono text-foreground">&times; {result.qvbRate * 100}%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Persistency Modifier:</span>
                      <span className="font-mono text-foreground">&times; {formData.persistencyModifier}%</span>
                    </p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-xs text-accent">โบนัสไตรมาส (QVB)</p>
                    <p className="text-2xl font-bold text-accent">
                      {formatCurrency(result.quarterlyBonus)}
                    </p>
                  </div>
                </div>

                {/* YEB Bonus */}
                <div className="space-y-4 p-4 border rounded-xl bg-card/50">
                  <div>
                    <h4 className="font-bold text-primary mb-1">4. โบนัสสิ้นปี (YEB)</h4>
                    <p className="text-xs text-muted-foreground">สูตร: NBC ส่วนตัวทั้งปี &times; อัตรา YEB &times; Persistency Modifier</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p className="flex justify-between">
                      <span>NBC ส่วนตัวทั้งปี (จากปีแรก):</span>
                      <span className="font-mono text-foreground">{formatCurrency(result.commission)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>อัตราโบนัสสิ้นปี (YEB Rate):</span>
                      <span className="font-mono text-foreground">&times; {result.yebRate * 100}%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Persistency Modifier:</span>
                      <span className="font-mono text-foreground">&times; {formData.persistencyModifier}%</span>
                    </p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs text-primary">โบนัสสิ้นปี (YEB)</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(result.yearlyBonus)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full shadow-lg animate-in fade-in duration-500">
              <CardHeader>
                <CardTitle className="text-xl text-primary">ประมาณการคอมมิชชั่น (7 ปี)</CardTitle>
                <CardDescription>
                  แสดงรายได้ค่าคอมมิชชั่นจากเบี้ยประกันปีแรกและเบี้ยปีต่อ (ยังไม่รวมโบนัส)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ปีที่</TableHead>
                      <TableHead>อัตราคอมฯ</TableHead>
                      <TableHead className="text-right">คอมมิชชั่น</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.commissionProjection.map((item) => (
                      <TableRow key={item.year}>
                        <TableCell className="font-medium">{item.year}</TableCell>
                        <TableCell>{item.rate}%</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.commission)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>รวม 7 ปี</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(result.commissionProjection.reduce((acc, item) => acc + item.commission, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {result.incomeProjection && (
              <Card className="w-full shadow-lg animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">ประมาณการรายได้สะสม 7 ปี</CardTitle>
                  <CardDescription>
                    แสดงรายได้รวมในแต่ละปี หากสร้างผลงาน APE เท่าเดิมทุกปี (รวมคอมมิชชั่นปีต่อ)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">ปีที่</TableHead>
                        <TableHead className="text-right">รายได้จากเบี้ยใหม่</TableHead>
                        <TableHead className="text-right">รายได้จากเบี้ยปีต่อ</TableHead>
                        <TableHead className="text-right font-semibold">รายได้รวม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.incomeProjection.map((item) => (
                        <TableRow key={item.year}>
                          <TableCell className="font-medium">{item.year}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(item.newBusinessIncome)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(item.renewalIncome)}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{formatCurrency(item.totalIncome)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell>รวม 7 ปี</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(result.incomeProjection.reduce((acc, item) => acc + item.newBusinessIncome, 0))}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(result.incomeProjection.reduce((acc, item) => acc + item.renewalIncome, 0))}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(result.incomeProjection.reduce((acc, item) => acc + item.totalIncome, 0))}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            )}

          </>
        ) : (
          <Card className="w-full shadow-md border-dashed">
            <CardContent className="p-6 h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Award className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">ผลลัพธ์จะแสดงที่นี่</h3>
                <p>กรอกข้อมูลเพื่อคำนวณ NBC Credit และ โบนัสต่างๆ</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
