'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@agency/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@agency/components/ui/form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@agency/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@agency/components/ui/radio-group';
import { managerTestQuestions } from '@agency/lib/manager-test-questions';


// Generate the schema dynamically based on the number of questions
const formSchema = z.object({
  answers: z.array(z.string().min(1, { message: 'กรุณาเลือกคำตอบ' })).length(managerTestQuestions.length, {}),
});

type FormValues = z.infer<typeof formSchema>;

export default function ManagerTestPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            answers: Array(managerTestQuestions.length).fill(''),
        },
    });

    function onSubmit(data: FormValues) {
        const totalScore = data.answers.reduce((sum, value) => sum + parseInt(value, 10), 0);
        setScore(totalScore);
        setIsSubmitted(true);
    }
    
    const getResultContent = () => {
        if (score >= 96) { // 24 * 4
            return {
                title: "สุดยอดผู้จัดการหน่วย!",
                description: `คุณได้คะแนน ${score} เต็ม 120! คุณมีความเป็นผู้นำและทักษะการบริหารหน่วยที่ยอดเยี่ยมในทุกมิติ พร้อมที่จะนำพาทีมไปสู่ความสำเร็จอย่างยั่งยืน`
            };
        }
        if (score >= 72) { // 24 * 3
            return {
                title: "ผู้จัดการหน่วยระดับมืออาชีพ",
                description: `คุณได้คะแนน ${score} เต็ม 120. คุณมีทักษะการบริหารจัดการที่ดีและเป็นระบบ แต่ยังมีบางจุดที่สามารถพัฒนาเพิ่มเติมเพื่อยกระดับความเป็นผู้นำของคุณได้`
            };
        }
        return {
            title: "ยังมีโอกาสในการพัฒนา",
            description: `คุณได้คะแนน ${score} เต็ม 120. คุณมีความตั้งใจที่ดี แต่ยังต้องการการพัฒนาทักษะในหลายๆ ด้านเพื่อการเป็นผู้จัดการหน่วยที่มีประสิทธิภาพ`
        };
    };

    if (isSubmitted) {
        const { title, description } = getResultContent();
        return (
             <div className="flex flex-col min-h-screen" style={{ '--primary': '205 75% 45%', '--primary-foreground': '0 0% 98%', '--accent': '170 60% 40%', '--accent-foreground': '0 0% 98%', '--secondary': '210 40% 90%', '--secondary-foreground': '224 43% 27%', '--muted-foreground': '224 43% 40%', '--background': '220 20% 96%', '--foreground': '224 43% 17%', '--card': '0 0% 100%', '--card-foreground': '224 43% 17%', '--border': '210 33% 86%', '--ring': '205 75% 45%' } as React.CSSProperties}>
                <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
                    <div className="w-full max-w-2xl mx-auto">
                        <Link href="/agency" className="inline-block">
                        <Image src="/agency/logo.png" alt="Agency Blueprint" width={80} height={80} className="mx-auto mb-4 rounded-lg object-cover hover:opacity-90 transition-opacity" />
                        </Link>
                        <Card className="text-center shadow-lg animate-in fade-in duration-500">
                            <CardHeader className="items-center">
                                <div className="mx-auto bg-green-100 rounded-full p-3 w-fit mb-4">
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
                                <CardDescription className="text-base text-muted-foreground mt-2">{description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4 items-center">
                                <Button size="lg" onClick={() => {
                                    setIsSubmitted(false);
                                    setScore(0);
                                    form.reset();
                                }}>
                                    ทำแบบทดสอบอีกครั้ง
                                </Button>
                                <Button asChild variant="ghost">
                                    <Link href="/agency">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        กลับหน้าแรก
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
             </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen" style={{ '--primary': '205 75% 45%', '--primary-foreground': '0 0% 98%', '--accent': '170 60% 40%', '--accent-foreground': '0 0% 98%', '--secondary': '210 40% 90%', '--secondary-foreground': '224 43% 27%', '--muted-foreground': '224 43% 40%', '--background': '220 20% 96%', '--foreground': '224 43% 17%', '--card': '0 0% 100%', '--card-foreground': '224 43% 17%', '--border': '210 33% 86%', '--ring': '205 75% 45%' } as React.CSSProperties}>
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
                <h1 className="text-3xl font-bold text-primary">แบบทดสอบผู้จัดการ</h1>
            </div>

            <Card className="w-full max-w-4xl mx-auto shadow-md">
                 <CardHeader>
                    <CardTitle>ประเมินภาวะผู้นำในการบริหารหน่วย</CardTitle>
                    <CardDescription>ให้คะแนนความพึงพอใจในแต่ละข้อจาก 1 (ไม่เห็นด้วยอย่างยิ่ง) ถึง 5 (เห็นด้วยอย่างยิ่ง)</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {managerTestQuestions.map((question, index) => (
                                <FormField
                                    key={index}
                                    control={form.control}
                                    name={`answers.${index}`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-3 p-4 rounded-lg border bg-background hover:bg-secondary/50 transition-colors">
                                            <FormLabel className="text-base font-medium">{`${index + 1}. ${question}`}</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex justify-around items-center pt-2 sm:justify-between sm:px-8"
                                                >
                                                    <div className='hidden sm:block text-sm text-muted-foreground'>ไม่เห็นด้วยอย่างยิ่ง</div>
                                                    {[1, 2, 3, 4, 5].map((value) => (
                                                        <FormItem key={value} className="flex flex-col items-center space-y-2">
                                                            <FormControl>
                                                                <RadioGroupItem value={String(value)} className="h-5 w-5"/>
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{value}</FormLabel>
                                                        </FormItem>
                                                    ))}
                                                    <div className='hidden sm:block text-sm text-muted-foreground'>เห็นด้วยอย่างยิ่ง</div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}

                            <Button type="submit" size="lg" className="w-full text-lg py-6 bg-accent hover:bg-accent/90">ส่งแบบทดสอบ</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
        <footer className="py-4 text-center text-muted-foreground text-sm">
            <p>Application by Pheerapatpisit Thongsrithong</p>
        </footer>
        </div>
    );
}
