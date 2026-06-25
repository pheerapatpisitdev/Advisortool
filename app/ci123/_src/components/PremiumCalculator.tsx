'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import premiumsDataRaw from '../data/premiums.json';

type PremiumEntry = {
    age: number;
    male: number;
    female: number;
};

type PremiumsData = {
    [sumInsured: string]: PremiumEntry[];
};

const premiumsData = premiumsDataRaw as PremiumsData;

export default function PremiumCalculator() {
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [age, setAge] = useState<number>(30);
    const [showResult, setShowResult] = useState<boolean>(false);
    const resultsRef = useRef<HTMLDivElement>(null);
    const ageSelectId = useId();

    // Filter out empty sum insured options and sort them
    const sumInsuredOptions = useMemo(() => {
        return Object.keys(premiumsData)
            .filter((key) => (premiumsData[key] as PremiumEntry[]).length > 0)
            .sort((a, b) => parseFloat(a) - parseFloat(b));
    }, []);

    // Get available ages from the first valid sum insured data
    const ageOptions = useMemo(() => {
        const firstKey = sumInsuredOptions[0];
        if (!firstKey) return [];
        const currentData = premiumsData[firstKey] || [];
        return currentData.map((entry) => entry.age).sort((a, b) => a - b);
    }, [sumInsuredOptions]);

    const results = useMemo(() => {
        if (!showResult) return null;

        return sumInsuredOptions
            .map((sum) => {
                const data = premiumsData[sum];
                const entry = data.find((e) => e.age === age);
                if (!entry) return null;

                const annualPremium = gender === 'male' ? entry.male : entry.female;

                return {
                    sumInsured: sum,
                    premiumYearly: annualPremium,
                    premium6Month: Math.round(annualPremium * 0.52),
                    premiumMonthly: Math.round(annualPremium * 0.09),
                };
            })
            .filter((item) => item !== null) as {
                sumInsured: string;
                premiumYearly: number;
                premium6Month: number;
                premiumMonthly: number;
            }[];
    }, [age, gender, showResult, sumInsuredOptions]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(val);

    const formatSumInsured = (val: string) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(parseFloat(val));

    const handleCalculate = () => {
        setShowResult(true);
        // Scroll to results after a short delay to allow rendering
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleShare = () => {
        if (!results) return;
        let message = `สรุปเบี้ยประกัน CI123\n`;
        message += `เพศตามกำเนิด: ${gender === 'male' ? 'ชาย' : 'หญิง'} อายุ: ${age} ปี\n\n`;
        message += `📋 ความคุ้มครอง:\n`;
        message += `• โรคร้ายแรงระยะก่อนเริ่มต้น 20% (จ่ายสูงสุดไม่เกิน 100,000 บาท)\n`;
        message += `• โรคร้ายแรงระยะรุนแรง 100%\n`;
        message += `• โรคร้ายแรงระยะเริ่มต้นถึงปานกลาง 25%\n`;
        message += `• โรคร้ายแรงสำหรับเด็ก 25%\n`;
        message += `• โรคร้ายแรงภายใต้เงื่อนไขพิเศษ 10%\n`;
        message += `• ความคุ้มครองกรณีภาวะวิกฤต 25%\n\n`;
        message += `💰 ตารางเบี้ยประกัน:\n`;
        results.forEach((item) => {
            message += `ทุน ${formatSumInsured(item.sumInsured)}:\n`;
            message += `- รายปี: ${formatCurrency(item.premiumYearly)}\n`;
            message += `- ราย 6 เดือน: ${formatCurrency(item.premium6Month)}\n`;
            message += `- รายเดือน: ${formatCurrency(item.premiumMonthly)}\n\n`;
        });
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
        window.open(lineUrl, '_blank');
    };

    return (
        <div className="mx-auto w-full max-w-[800px] min-w-0 overflow-x-hidden px-4 py-5 sm:px-5">
            {/* Header */}
            <div className="mb-6 sm:mb-8 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1b2b7a]">คำนวณเบี้ย</h2>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed">
                    เลือกเพศและอายุเพื่อดูเบี้ยประกัน
                    <br />
                    ของทุกแผนความคุ้มครอง
                </p>
            </div>

            {/* Gender */}
            <div className="mx-auto mb-4 sm:mb-6 max-w-[400px]">
                <label className="mb-3 block text-xs sm:text-sm font-semibold text-gray-700">
                    เพศตามกำเนิด
                </label>
                <div role="group" aria-label="เพศตามกำเนิด" className="flex overflow-hidden rounded-[10px] border-2 border-[#1b2b7a]">
                    <button
                        type="button"
                        aria-pressed={gender === 'male'}
                        onClick={() => setGender('male')}
                        className={`flex-1 px-6 py-3 text-sm sm:text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-inset ${gender === 'male' ? 'bg-[#1b2b7a] text-white' : 'bg-white text-[#1b2b7a]'}`}
                    >
                        ชาย
                    </button>
                    <button
                        type="button"
                        aria-pressed={gender === 'female'}
                        onClick={() => setGender('female')}
                        className={`flex-1 px-6 py-3 text-sm sm:text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-inset ${gender === 'female' ? 'bg-[#1b2b7a] text-white' : 'bg-white text-[#1b2b7a]'}`}
                    >
                        หญิง
                    </button>
                </div>
            </div>

            {/* Age */}
            <div className="mx-auto mb-5 sm:mb-6 max-w-[400px]">
                <label htmlFor={ageSelectId} className="mb-3 block text-xs sm:text-sm font-semibold text-gray-700">
                    อายุ (กรณีอายุต่ำกว่า 1 ปี ระบุ 0)
                </label>
                <div className="relative">
                    <select
                        id={ageSelectId}
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value))}
                        className="w-full appearance-none rounded-[10px] border-[1.5px] border-slate-300 bg-white py-3 pl-4 pr-11 text-sm sm:text-[15px] font-medium text-gray-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:border-[#1d4ed8]"
                    >
                        {ageOptions.map((a) => (
                            <option key={a} value={a}>
                                {a} ปี
                            </option>
                        ))}
                    </select>
                    <svg
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>

            {/* Calculate */}
            <button
                type="button"
                onClick={handleCalculate}
                className="mx-auto block w-full max-w-[400px] rounded-xl bg-[linear-gradient(135deg,#1b2b7a_0%,#2d3d9a_50%,#4cb5f5_100%)] px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#1b2b7a]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#1b2b7a]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
            >
                คำนวณเบี้ย
            </button>

            {/* Results */}
            {showResult && results && results.length > 0 && (
                <div ref={resultsRef} className="mt-8 scroll-mt-6 animate-fadeIn">
                    <h3 className="mb-3 sm:mb-4 text-center text-base sm:text-lg font-semibold text-[#1b2b7a]">
                        ตารางเบี้ยประกัน
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse overflow-hidden rounded-xl border border-slate-200">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600">
                                    <th scope="col" className="border-b border-slate-200 px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        ทุนประกัน
                                    </th>
                                    <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        รายปี
                                    </th>
                                    <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap text-gray-500">
                                        ราย 6 เดือน
                                    </th>
                                    <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap text-gray-500">
                                        รายเดือน
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, index) => (
                                    <tr key={item.sumInsured} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="border-b border-slate-200 px-3 py-3 text-left text-sm sm:text-[15px] text-slate-800 tabular-nums">
                                            {formatSumInsured(item.sumInsured)}
                                        </td>
                                        <td className="border-b border-slate-200 px-3 py-3 text-right text-sm sm:text-[15px] tabular-nums">
                                            <span className="font-bold text-[#1b2b7a]">{formatCurrency(item.premiumYearly)}</span>
                                        </td>
                                        <td className="border-b border-slate-200 px-3 py-3 text-right text-sm sm:text-[15px] text-gray-600 tabular-nums">
                                            {formatCurrency(item.premium6Month)}
                                        </td>
                                        <td className="border-b border-slate-200 px-3 py-3 text-right text-sm sm:text-[15px] text-gray-600 tabular-nums">
                                            {formatCurrency(item.premiumMonthly)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Share to LINE */}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="mx-auto mt-6 flex h-12 min-w-[220px] items-center justify-center gap-2.5 rounded-full bg-[#06c755] px-7 text-base font-semibold text-white transition-colors hover:bg-[#05b64d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06c755] focus-visible:ring-offset-2"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 5.69 2 10.23c0 4.07 3.55 7.48 8.35 8.12.32.07.77.21.88.49.1.25.06.64.03.89l-.14.85c-.04.25-.2.99.86.54 1.06-.45 5.72-3.37 7.8-5.77C21.1 13.7 22 12.05 22 10.23 22 5.69 17.52 2 12 2z" />
                        </svg>
                        แชร์ไป LINE
                    </button>
                </div>
            )}
        </div>
    );
}
