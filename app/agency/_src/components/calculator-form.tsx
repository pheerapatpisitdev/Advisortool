'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@agency/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@agency/components/ui/form';
import { Input } from '@agency/components/ui/input';
import { Switch } from '@agency/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@agency/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/components/ui/tabs';
import { Loader2, PlusCircle, Trash2, RotateCcw } from 'lucide-react';
import type { CalculatorFormValues } from '@agency/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { commissionInputSchema } from '@agency/lib/schemas';

const formSchema = commissionInputSchema;


interface CalculatorFormProps {
  onCalculate: (data: CalculatorFormValues) => void;
  onReset: () => void;
  isLoading: boolean;
}

export function CalculatorForm({ onCalculate, onReset, isLoading }: CalculatorFormProps) {
  const defaultValues = {
    direct: {
      nbc: 0,
      applyAdor: false,
      managerTenure: 1,
      persistencyRate: 80,
    },
    child: [],
    grandchild: []
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: "child",
  });

  const { fields: grandchildFields, append: appendGrandchild, remove: removeGrandchild } = useFieldArray({
    control: form.control,
    name: "grandchild",
  });

  const handleResetClick = () => {
    form.reset(defaultValues);
    onReset();
  };

  const handleNbcChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const numericValue = Number(rawValue);
    if (!isNaN(numericValue)) {
        field.onChange(numericValue);
    } else if (rawValue === '') {
        field.onChange(0);
    }
  };

  const formatNbcValue = (value: number) => {
    if (value === 0) return '';
    return value.toLocaleString('en-US');
  };


  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">เครื่องคำนวณค่าบริหาร</CardTitle>
        <CardDescription>กรอกข้อมูล NBC ของแต่ละหน่วยเพื่อคำนวณค่าบริหารรวม</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onCalculate)} className="space-y-6">
            <Tabs defaultValue="direct" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="direct">หน่วยตรง</TabsTrigger>
                <TabsTrigger value="child">หน่วยลูก</TabsTrigger>
                <TabsTrigger value="grandchild">หน่วยหลาน</TabsTrigger>
              </TabsList>
              
              {/* Direct Unit Tab */}
              <TabsContent value="direct" className="mt-6">
                <div className="space-y-6">
                   <FormField
                      control={form.control}
                      name="direct.nbc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>คอมมิชชั่นของธุรกิจใหม่ (NBC)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="เช่น 50,000"
                              {...field}
                              value={formatNbcValue(field.value || 0)}
                              onChange={(e) => handleNbcChange(e, field)}
                             />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="direct.managerTenure"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>อายุงานผู้จัดการ</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกอายุงาน" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">น้อยกว่าหรือเท่ากับ 12 เดือน</SelectItem>
                                <SelectItem value="2">มากกว่า 12 เดือน</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                      control={form.control}
                      name="direct.persistencyRate"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>19-Month Persistency Rate (%)</FormLabel>
                            <span className="text-sm font-medium text-primary">{field.value}%</span>
                          </div>
                          <FormControl>
                            <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                max={100}
                                step={1}
                                className="py-2"
                            />
                          </FormControl>
                           <FormDescription>
                                อัตราความคงอยู่ของกรมธรรม์ 19 เดือน
                            </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="direct.applyAdor"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                          <div className="space-y-0.5">
                            <FormLabel>เปิดใช้งาน ADOR</FormLabel>
                            <FormDescription>
                              สำหรับตัวแทนอายุงานไม่เกิน 2 ปี ที่ผู้จัดการเป็นคนชวน
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
              </TabsContent>

              {/* Child Unit Tab */}
              <TabsContent value="child" className="mt-6">
                <div className="space-y-4">
                  {childFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                        <h4 className="font-semibold">หน่วยลูก {index + 1}</h4>
                        <FormField
                            control={form.control}
                            name={`child.${index}.nbc`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>คอมมิชชั่นของธุรกิจใหม่ (NBC)</FormLabel>
                                <FormControl>
                                    <Input 
                                    type="text" 
                                    placeholder="เช่น 30,000"
                                    {...field}
                                    value={formatNbcValue(field.value || 0)}
                                    onChange={(e) => handleNbcChange(e, field)}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`child.${index}.unitAgeYear`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>อายุของหน่วยลูก (ปี)</FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="เลือกอายุของหน่วย" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">ไม่เกิน 1 ปี</SelectItem>
                                    <SelectItem value="2">1-2 ปี</SelectItem>
                                    <SelectItem value="3">2 ปีขึ้นไป</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormDescription>MDOR จะคำนวณสำหรับหน่วยลูกอายุไม่เกิน 2 ปี</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => removeChild(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => appendChild({ nbc: 0, unitAgeYear: 1 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    เพิ่มหน่วยลูก
                  </Button>
                </div>
              </TabsContent>

              {/* Grandchild Unit Tab */}
              <TabsContent value="grandchild" className="mt-6">
                <div className="space-y-4">
                    {grandchildFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                            <h4 className="font-semibold">หน่วยหลาน {index + 1}</h4>
                            <FormField
                                control={form.control}
                                name={`grandchild.${index}.nbc`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>คอมมิชชั่นของธุรกิจใหม่ (NBC)</FormLabel>
                                    <FormControl>
                                        <Input 
                                        type="text" 
                                        placeholder="เช่น 20,000"
                                        {...field}
                                        value={formatNbcValue(field.value || 0)}
                                        onChange={(e) => handleNbcChange(e, field)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7"
                                onClick={() => removeGrandchild(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                     <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => appendGrandchild({ nbc: 0 })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        เพิ่มหน่วยหลาน
                    </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-8">
                <Button type="button" variant="outline" onClick={handleResetClick} className="w-1/4">
                    <RotateCcw className="mr-2 h-4 w-4"/>
                    ล้างข้อมูล
                </Button>
                <Button type="submit" disabled={isLoading} className="w-3/4 bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังคำนวณ...
                    </>
                ) : (
                    'คำนวณค่าบริหารทั้งหมด'
                )}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
