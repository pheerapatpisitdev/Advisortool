"use client";

import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { benefitData, planDetails, calculatePremium, AS_INCURRED, NOT_COVERED } from "@/lib/data";
import type { PlanName, SubBenefitItem, Gender, Frequency } from "@/lib/types";
import { CheckCircle2, Info, User, Clock, Share2, Printer } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "./ui/button";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitcher from "./language-switcher";

const planOrder: PlanName[] = ["bronze", "silver", "gold"];

const planHeaderStyles: Record<PlanName, string> = {
  smart: "bg-gradient-to-b from-brand-blue to-brand-blue-dark text-white",
  bronze: "bg-gradient-to-b from-brand-orange to-brand-orange-dark text-white",
  silver: "bg-brand-gray text-brand-ink",
  gold: "bg-gradient-to-b from-brand-green to-brand-green-dark text-white",
};

// All plan columns share the same cell background.
const PLAN_CELL_BG = "bg-brand-cream";

export default function DetailedBenefits() {
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<Gender>("male");
  const [frequency, setFrequency] = useState<Frequency>("yearly");
  const tableRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const displayedPlans: PlanName[] = age >= 6 && age <= 10 ? ["smart", "bronze"] : planOrder;

  const handleAgeChange = (value: string) => {
    setAge(parseInt(value, 10));
  };

  const handleGenderChange = (value: Gender) => {
    setGender(value);
  };

  const handleFrequencyChange = (value: Frequency) => {
    setFrequency(value);
  };

  const overallBenefits = [
    { name: t("total_benefit_header"), smart: t("overall_benefits.smart"), bronze: t("overall_benefits.bronze"), silver: t("overall_benefits.silver"), gold: t("overall_benefits.gold") },
  ];

  const getAllPlansSummaryText = () => {
    const genderText = gender === 'male' ? t('share_gender_male') : t('share_gender_female');

    const roomBenefit = benefitData[0]?.benefits.find(b => b.id === "1");
    const opdBenefit = benefitData.find(c => c.benefits.some(b => b.id === "18"))?.benefits.find(b => b.id === "18");

    let summaryText = `📋 ${t('share_summary_title')}\n\n`;
    summaryText += `👤 ${t('share_summary_for').replace('{age}', age.toString()).replace('{gender}', genderText)}\n\n\n`;

    displayedPlans.forEach((plan, idx) => {
      const planInfo = planDetails[plan];
      const monthlyPremium = calculatePremium(age, gender, plan, 'monthly');
      const sixMonthlyPremium = calculatePremium(age, gender, plan, 'six-monthly');
      const yearlyPremium = calculatePremium(age, gender, plan, 'yearly');
      const roomValue = roomBenefit ? roomBenefit[plan].replace(/บาท/g, t('share_baht')).replace(/\s+/g, ' ').trim() : "N/A";
      const totalBenefit = overallBenefits[0][plan];
      const ipdBenefit = totalBenefit;
      const opdValue = opdBenefit ? opdBenefit[plan] : "N/A";
      const opdDisplay = opdValue === NOT_COVERED
        ? `🏥 ${t('share_opd_outpatient')} ${t('share_no_opd')}`
        : `🏥 ${t('share_opd')}: ${opdValue.replace(/บาท/g, t('share_baht'))} ${t('share_per_year')}`;

      summaryText += `🏆 ${planInfo.name[language]}\n`;
      summaryText += `✨ ${t('share_max_benefit')}: ${totalBenefit} ${t('share_per_year')}\n`;
      summaryText += `🏥 ${t('share_room_and_board')}: ${roomValue} ${t('share_per_night')}\n`;
      summaryText += `🏥 ${t('share_ipd')} ${ipdBenefit} ${t('share_per_year')}\n`;
      summaryText += `${opdDisplay}\n\n`;
      summaryText += `💰 ${t('frequency_monthly')}: ${monthlyPremium.toLocaleString('en-US')} ${t('share_baht')}\n`;
      summaryText += `💰 ${t('frequency_six_monthly')}: ${sixMonthlyPremium.toLocaleString('en-US')} ${t('share_baht')}\n`;
      summaryText += `💰 ${t('frequency_yearly')}: ${yearlyPremium.toLocaleString('en-US')} ${t('share_baht')}\n\n`;
      summaryText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (idx < displayedPlans.length - 1) {
        summaryText += `\n`;
      }
    });

    summaryText += `💼 ${t('share_life_insurance_all_plans')}: 50,000 ${t('share_baht')}\n`;
    summaryText += `   ${t('share_can_buy_more')}\n\n`;
    summaryText += `${t('share_monthly_first_note')}`;

    return summaryText;
  };

  const handleShareToLine = () => {
    const summaryText = getAllPlansSummaryText();
    const encodedText = encodeURIComponent(summaryText);
    // LINE share URL - ใช้ https://line.me/R/msg/text/? สำหรับ web
    const lineUrl = `https://line.me/R/msg/text/?${encodedText}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTableAsImage = async () => {
    if (!tableRef.current) return;

    const el = tableRef.current;
    const prevStyle = {
      width: el.style.width,
      maxWidth: el.style.maxWidth,
      margin: el.style.margin,
    };

    try {
      // Fix table width to a desktop-like size for the screenshot
      el.style.width = "1200px";
      el.style.maxWidth = "1200px";
      el.style.margin = "0 auto";

      const canvas = await html2canvas(el, {
        backgroundColor: "#faf9f5",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `iHealthy-Ultra-Plan-${age}yo-${gender}.png`;
      link.click();

      toast({
        title: t("share_image_downloaded"),
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: t("share_image_error"),
      });
    } finally {
      // Restore original styles
      el.style.width = prevStyle.width;
      el.style.maxWidth = prevStyle.maxWidth;
      el.style.margin = prevStyle.margin;
    }
  };

  const isNotCoveredValue = (value: string | undefined) => value === NOT_COVERED;
  const isAsIncurredValue = (value: string | undefined) => value === AS_INCURRED;

  const renderBenefitValue = (value: string | undefined) => {
    if (value === undefined) return null;

    if (isAsIncurredValue(value)) {
      return <div className="flex items-center justify-center gap-0.5 md:gap-2"><CheckCircle2 className="h-3 w-3 md:h-5 md:w-5 text-accent" /> <span className="hidden md:inline">{t('as_incurred')}</span></div>;
    }
    if (isNotCoveredValue(value)) {
      return (
        <span className="text-muted-foreground/80 text-[9px] sm:text-[10px] md:text-sm">
          {t('not_covered')}
        </span>
      );
    }
    
    let displayValue = value.replace(/บาท/g, t('baht'));
    if (language !== 'th' && value.includes('คืน')) {
      displayValue = displayValue.replace('คืน', t('per_night').substring(1));
    }


    if (value.includes("6,000") || value.includes("12,000")) {
        return <div className="flex items-center justify-center gap-0.5 md:gap-2"><CheckCircle2 className="h-3 w-3 md:h-5 md:w-5 text-accent" /> <span className="text-foreground text-[9px] sm:text-xs md:text-sm">{displayValue}</span></div>;
    }
    
    return <span className="text-foreground text-[9px] sm:text-[10px] md:text-sm">{displayValue}</span>;
  }

  type BenefitRow = (typeof benefitData)[0]['benefits'][0];

  const shouldMergeValue = (value: string | undefined) =>
    isNotCoveredValue(value) || isAsIncurredValue(value);

  const getMergedRowSpans = (benefits: BenefitRow[], plan: PlanName) => {
    const spans = Array(benefits.length).fill(1);
    let index = 0;

    while (index < benefits.length) {
      const currentValue = benefits[index][plan];
      if (shouldMergeValue(currentValue)) {
        let end = index + 1;
        while (end < benefits.length && benefits[end][plan] === currentValue) {
          end += 1;
        }
        spans[index] = end - index;
        for (let i = index + 1; i < end; i += 1) {
          spans[i] = 0;
        }
        index = end;
      } else {
        spans[index] = 1;
        index += 1;
      }
    }

    return spans;
  };

  const getAllPlanMergedSpans = (benefits: BenefitRow[], plans: PlanName[] = planOrder) => {
    const spans = Array(benefits.length).fill(-1);
    let index = 0;

    while (index < benefits.length) {
      const value = benefits[index][plans[0]];
      const sameAcrossPlans = plans.every(
        (plan) => benefits[index][plan] === value
      );

      if (sameAcrossPlans && shouldMergeValue(value)) {
        let end = index + 1;
        while (end < benefits.length) {
          const nextValue = benefits[end][plans[0]];
          const nextSameAcrossPlans = plans.every(
            (plan) => benefits[end][plan] === nextValue
          );

          if (!(nextSameAcrossPlans && shouldMergeValue(nextValue) && nextValue === value)) {
            break;
          }
          end += 1;
        }

        spans[index] = end - index;
        for (let i = index + 1; i < end; i += 1) {
          spans[i] = 0;
        }
        index = end;
      } else {
        spans[index] = -1;
        index += 1;
      }
    }

    return spans;
  };

  const renderBenefitRow = (
    benefit: BenefitRow,
    index: number,
    rowSpansByPlan: Record<PlanName, number[]>,
    allPlansMergedSpans: number[],
    plans: PlanName[]
  ) => {
    const isSubBenefitItem = (sub: any): sub is SubBenefitItem => typeof sub === 'object' && sub !== null && 'id' in sub && 'text' in sub;
    const allPlansSpan = allPlansMergedSpans[index];
    const isDailyCashUnder11 = benefit.id === "20" && age < 11;

    // Hide daily cash benefit (id 20) entirely for ages 66–80
    if (benefit.id === "20" && age >= 66) {
      return null;
    }

    const renderCellContent = (
      <>
        <div className="flex gap-0.5 md:gap-4">
          <span className="text-muted-foreground w-3 md:w-4 flex-shrink-0 text-[9px] sm:text-[10px] md:text-sm">{benefit.id}</span>
          <span className={`flex-1 text-[9px] sm:text-[10px] md:text-sm leading-tight`}>{benefit.name[language]}</span>
        </div>
        {benefit.subBenefit && <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 ml-3 md:ml-10 print:hidden">{benefit.subBenefit[language]}</p>}
        {benefit.subBenefits && (
          <ul className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2 space-y-0.5 md:space-y-2 ml-3 md:ml-10 [&_li]:text-muted-foreground [&_span]:text-muted-foreground print:hidden">
            {benefit.subBenefits.map(sub => (
              <li key={isSubBenefitItem(sub) ? sub.id : sub[language]} className="text-muted-foreground">
                <div className="flex gap-2 text-muted-foreground">
                  {isSubBenefitItem(sub) && <span className="w-6 flex-shrink-0 text-muted-foreground">{sub.id}</span>}
                  <span className="flex-1 text-muted-foreground">{isSubBenefitItem(sub) ? sub.text[language] : sub[language]}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
    
    const useMergedCell = allPlansSpan > 0;

    return (
      <TableRow key={benefit.name[language]} className="border-border/60">
        <TableCell className={`font-medium w-[40%] p-0 pl-1 pr-1 md:pl-[25px] border-r border-border/60 py-1.5 md:pt-[13px] md:pb-[13px] mt-0 mb-0`}>{renderCellContent}</TableCell>
        {useMergedCell ? (
          <TableCell
            rowSpan={allPlansSpan}
            colSpan={plans.length}
            className="text-center border-l border-border/40 p-0.5 md:p-4 bg-background"
          >
            {renderBenefitValue(isDailyCashUnder11 ? NOT_COVERED : benefit[plans[0]])}
          </TableCell>
        ) : (
          plans.map((plan) => {
            const value = isDailyCashUnder11 ? NOT_COVERED : benefit[plan];
            const rowSpan = rowSpansByPlan[plan][index];

            if (rowSpan === 0) {
              return null;
            }

            const highlightCell = benefit.id === "1" || benefit.id === "18";
            const cellBgClass = highlightCell
              ? isNotCoveredValue(value)
                ? "bg-background"
                : PLAN_CELL_BG
              : isNotCoveredValue(value)
                ? "bg-background"
                : "";

            return (
              <TableCell
                key={plan}
                rowSpan={rowSpan}
                className={`text-center w-[12%] sm:w-[14%] md:w-[15%] border-l border-border/40 p-0.5 md:p-4 ${cellBgClass}`}
              >
                {renderBenefitValue(value)}
              </TableCell>
            );
          })
        )}
      </TableRow>
    );
  };

  return (
    <>
    <div className="w-full max-w-6xl mx-auto">
    <Card className="shadow-xl shadow-black/5 border-border/60 ring-1 ring-black/5 overflow-hidden print:overflow-visible print:shadow-none print:ring-0 print:border-0">
       <div>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-background to-muted p-3 md:p-6 print:hidden">
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                    <CardTitle className="text-base md:text-3xl font-headline tracking-tight text-primary">
                      {t('card_title')}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/90 text-xs md:text-base">
                    {t('card_description')}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <LanguageSwitcher />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="p-2 md:p-6 border-b border-border/60 bg-background/80 print:hidden">
                <div className="rounded-xl md:rounded-2xl border border-border/60 bg-background/95 px-2 py-2 md:px-4 md:py-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-3 md:gap-8 grid-cols-1 sm:grid-cols-3">
                        <div className="space-y-1 md:space-y-3">
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                    <Label className="text-xs md:text-base font-semibold text-foreground">{t('gender_label')}</Label>
                                    <Info className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{t('gender_tooltip')}</p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                            <RadioGroup
                              value={gender}
                              onValueChange={handleGenderChange}
                              className="grid grid-cols-2 gap-2"
                            >
                              <div className="flex items-center">
                                <RadioGroupItem value="male" id="gender-male" className="peer sr-only" />
                                <Label
                                  htmlFor="gender-male"
                                  className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg md:rounded-xl border border-border/60 bg-background px-3 py-2.5 md:py-3 text-xs md:text-base font-medium text-muted-foreground cursor-pointer touch-manipulation transition-colors hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:hover:bg-primary/90"
                                >
                                  <User className="h-4 w-4 md:h-5 md:w-5" />
                                  {t('male')}
                                </Label>
                              </div>
                              <div className="flex items-center">
                                <RadioGroupItem value="female" id="gender-female" className="peer sr-only" />
                                <Label
                                  htmlFor="gender-female"
                                  className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg md:rounded-xl border border-border/60 bg-background px-3 py-2.5 md:py-3 text-xs md:text-base font-medium text-muted-foreground cursor-pointer touch-manipulation transition-colors hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:hover:bg-primary/90"
                                >
                                  <User className="h-4 w-4 md:h-5 md:w-5" />
                                  {t('female')}
                                </Label>
                              </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-1 md:space-y-3">
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                    <Label className="text-xs md:text-base font-semibold text-foreground">{t('age_label')}</Label>
                                    <Info className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{t('age_tooltip')}</p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-border/60 bg-muted flex-shrink-0">
                                  <User className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                </div>
                                <Select onValueChange={handleAgeChange} value={age.toString()}>
                                    <SelectTrigger className="min-h-[44px] h-9 md:h-11 w-full max-w-[100px] md:max-w-[120px] rounded-lg md:rounded-xl border-border/60 bg-background text-xs md:text-base shadow-sm cursor-pointer touch-manipulation">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 80 - 6 + 1 }, (_, i) => 6 + i).map((ageValue) => (
                                            <SelectItem key={ageValue} value={ageValue.toString()}>
                                                {ageValue}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1 md:space-y-3">
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                    <Label className="text-xs md:text-base font-semibold text-foreground">{t('frequency_label')}</Label>
                                    <Info className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{t('frequency_tooltip')}</p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-border/60 bg-muted flex-shrink-0">
                                <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                              </div>
                              <Select onValueChange={(val) => handleFrequencyChange(val as Frequency)} value={frequency}>
                                <SelectTrigger className="min-h-[44px] h-9 md:h-11 w-full max-w-[140px] md:max-w-[180px] rounded-lg md:rounded-xl border-border/60 bg-background text-xs md:text-base shadow-sm cursor-pointer touch-manipulation">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yearly">{t('frequency_yearly')}</SelectItem>
                                  <SelectItem value="six-monthly">{t('frequency_six_monthly')}</SelectItem>
                                  <SelectItem value="monthly">{t('frequency_monthly')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="print-area space-y-4 rounded-lg md:rounded-xl border border-border/60 bg-background/90 shadow-sm shadow-black/5" ref={tableRef}>
              {/* Header Section */}
              <div className="bg-gradient-to-r from-brand-ink to-brand-blue text-brand-cream p-4 md:p-6 rounded-t-lg md:rounded-t-xl">
                <h2 className="text-xl md:text-2xl font-bold">{t('page_title')}</h2>
                <p className="text-base md:text-xl font-semibold text-white/90 mt-1">
                  👤 {t('share_summary_for').replace('{age}', age.toString()).replace('{gender}', gender === 'male' ? t('share_gender_male') : t('share_gender_female'))}
                </p>
              </div>
              {/* Table Section */}
              <div className="overflow-x-auto print:overflow-visible px-0 text-[10px] sm:text-xs md:text-sm">
                <Table className="min-w-full table-fixed md:table-auto">
                <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="font-semibold text-left bg-gradient-to-b from-brand-ink to-brand-blue-deep text-brand-cream w-[40%] pl-1 pr-1 md:pl-6 border-r border-white/20 text-[9px] sm:text-[10px] md:text-sm tracking-wide py-0.5 md:py-0">
                    {t('benefit_header')}
                    </TableHead>
                    {displayedPlans.map((plan) => {
                    const planInfo = planDetails[plan];
                    return (
                        <TableHead key={plan} className={`font-semibold text-center w-[12%] sm:w-[14%] md:w-[15%] ${planHeaderStyles[plan]} border-l border-white/20 p-0`}>
                        <div className="flex flex-col items-center justify-center p-0.5 md:py-2 h-full">
                            <span className="text-[9px] sm:text-xs md:text-lg">{planInfo.name[language].toUpperCase()}</span>
                        </div>
                        </TableHead>
                    )
                    })}
                </TableRow>
                </TableHeader>
                <TableBody>
                <TableRow className="border-border/60">
                  <TableCell className="font-bold text-left bg-brand-cream w-[40%] pl-1 pr-1 md:pl-6 border-r border-border/60 text-[9px] sm:text-[10px] md:text-sm h-[36px] md:h-[50px] py-1">{t('premium_header')}</TableCell>
                  {displayedPlans.map(plan => {
                      const premium = calculatePremium(age, gender, plan, frequency);
                      const frequencyLabel = frequency === 'yearly' ? t('yearly_short') : frequency === 'six-monthly' ? t('six_monthly_short') : t('monthly_short');
                      return (
                        <TableCell key={plan} className="w-[12%] sm:w-[14%] md:w-[15%] p-0.5 md:p-2 bg-brand-ink text-brand-cream border-l border-border/40">
                          <div className="text-center w-full min-h-[16px] md:min-h-[20px] mx-auto flex flex-wrap items-center justify-center">
                              <span className="font-bold text-[9px] sm:text-[10px] md:text-[26px]">{premium.toLocaleString('en-US')}</span>
                              <span className="text-[8px] sm:text-[9px] md:text-sm">{frequencyLabel}</span>
                          </div>
                        </TableCell>
                      )
                  })}
                </TableRow>
                <TableRow className="border-border/60">
                    <TableCell className="font-bold text-[9px] sm:text-[10px] md:text-base bg-brand-cream pl-1 pr-1 md:pl-6 w-[40%] border-r border-border/60 py-1 md:pt-0">{t('total_benefit_header')}</TableCell>
                    {displayedPlans.map((plan) => (
                        <TableCell key={plan} className={`text-center font-bold text-[9px] sm:text-[10px] md:text-base w-[12%] sm:w-[14%] md:w-[15%] p-0.5 md:p-4 ${PLAN_CELL_BG} border-l border-border/40`}>
                        {overallBenefits[0][plan]}
                        </TableCell>
                    ))}
                    </TableRow>
                {benefitData.map((category) => {
                  const rowSpansByPlan = displayedPlans.reduce(
                    (acc, plan) => {
                      acc[plan] = getMergedRowSpans(category.benefits, plan);
                      return acc;
                    },
                    {} as Record<PlanName, number[]>
                  );
                  const allPlansMergedSpans = getAllPlanMergedSpans(
                    category.benefits,
                    displayedPlans
                  );

                  return (
                    <React.Fragment key={category.category.en}>
                        <TableRow className="border-border/60">
                            <TableCell colSpan={displayedPlans.length + 1} className="bg-gradient-to-r from-brand-ink to-brand-blue text-brand-cream text-[9px] sm:text-xs md:text-lg font-medium px-1 md:px-6 py-0.5 md:py-2 tracking-wide">
                                {category.category[language]}
                            </TableCell>
                        </TableRow>
                        {category.benefits.map((benefit, index) =>
                          renderBenefitRow(
                            benefit,
                            index,
                            rowSpansByPlan,
                            allPlansMergedSpans,
                            displayedPlans
                          )
                        )}
                    </React.Fragment>
                  );
                })}
                </TableBody>
            </Table>
            </div>
              {/* End of Table Section */}
            </div>
            {/* End of wrapper with header */}
            
        </CardContent>
      </div>
      <CardFooter className="p-2 md:p-6 justify-center items-center gap-2 md:gap-4 border-t border-border/60 flex-wrap print:hidden">
        <Button
          onClick={handleShareToLine}
          className="flex items-center gap-1.5 md:gap-2 bg-brand-green hover:bg-brand-green-dark text-white border-0 text-xs md:text-base min-h-[44px] h-8 md:h-10 px-3 md:px-4 touch-manipulation"
        >
          <Share2 className="h-3 w-3 md:h-4 md:w-4" />
          {t('share_all_plans_button_n').replace('{n}', String(displayedPlans.length))}
        </Button>
        <Button
          onClick={handleShareTableAsImage}
          className="flex items-center gap-1.5 md:gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white border-0 text-xs md:text-base min-h-[44px] h-8 md:h-10 px-3 md:px-4 touch-manipulation"
        >
          <Share2 className="h-3 w-3 md:h-4 md:w-4" />
          📸 {t('share_image_button') || 'Share as Image'}
        </Button>
        <Button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 md:gap-2 bg-brand-ink hover:bg-brand-ink-light text-white border-0 text-xs md:text-base min-h-[44px] h-8 md:h-10 px-3 md:px-4 touch-manipulation"
        >
          <Printer className="h-3 w-3 md:h-4 md:w-4" />
          {t('print_pdf_button')}
        </Button>
      </CardFooter>
    </Card>
    </div>

    <section className="mt-4 md:mt-6 mx-auto max-w-2xl rounded-lg md:rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm p-4 md:p-6 print:hidden">
      <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 md:h-5 md:w-5" />
        {t('waiting_period_title')}
      </h3>
      <div className="space-y-6 text-sm">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-24 md:w-28 text-center p-2 bg-muted/50 rounded-lg flex flex-col justify-center items-center min-h-[5rem] md:min-h-[6rem]">
            <div className="font-bold text-primary text-xs md:text-sm">{t('waiting_period_approval_title')}</div>
          </div>
          <p className="text-muted-foreground pt-2 flex-1 text-xs md:text-sm">{t('waiting_period_approval_desc')}</p>
        </div>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-24 md:w-28 text-center p-2 bg-muted/50 rounded-lg flex flex-col justify-center items-center min-h-[5rem] md:min-h-[6rem]">
            <div className="text-2xl md:text-3xl font-bold text-primary">30</div>
            <div className="text-xs text-muted-foreground">{t('waiting_period_30_days_title')}</div>
          </div>
          <p className="text-muted-foreground pt-2 flex-1 text-xs md:text-sm">{t('waiting_period_30_days_desc')}</p>
        </div>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-24 md:w-28 text-center p-2 bg-muted/50 rounded-lg flex flex-col justify-center items-center min-h-[5rem] md:min-h-[6rem]">
            <div className="text-2xl md:text-3xl font-bold text-primary">120</div>
            <div className="text-xs text-muted-foreground">{t('waiting_period_120_days_title')}</div>
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground pt-2 text-xs md:text-sm">{t('waiting_period_120_days_desc')}</p>
            <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 text-xs md:text-sm">
              <li>{t('waiting_period_120_days_item_1')}</li>
              <li>{t('waiting_period_120_days_item_2')}</li>
              <li>{t('waiting_period_120_days_item_3')}</li>
              <li>{t('waiting_period_120_days_item_4')}</li>
              <li>{t('waiting_period_120_days_item_5')}</li>
              <li>{t('waiting_period_120_days_item_6')}</li>
              <li>{t('waiting_period_120_days_item_7')}</li>
              <li>{t('waiting_period_120_days_item_8')}</li>
            </ul>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-24 md:w-28 text-center p-2 bg-muted/50 rounded-lg flex flex-col justify-center items-center min-h-[5rem] md:min-h-[6rem]">
            <div className="text-2xl md:text-3xl font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">{t('waiting_period_12_months_title')}</div>
          </div>
          <p className="text-muted-foreground pt-2 flex-1 text-xs md:text-sm">{t('waiting_period_12_months_desc')}</p>
        </div>
        <p className="text-xs text-muted-foreground pt-2">{t('waiting_period_footnote')}</p>
      </div>
    </section>
  </>
  );
}
