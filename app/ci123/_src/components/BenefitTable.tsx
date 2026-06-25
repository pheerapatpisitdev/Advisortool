import React from 'react';

type Row = {
    coverage: string;
    note?: string;
    count: number;
    benefit: string;
    benefitNote?: string;
    emphasize?: boolean;
};

const rows: Row[] = [
    { coverage: 'โรคร้ายแรงระยะก่อนเริ่มต้น', count: 6, benefit: '20%', benefitNote: 'จ่ายสูงสุดไม่เกิน 100,000 บาท' },
    { coverage: 'โรคร้ายแรงระยะเริ่มต้นถึงปานกลาง', count: 42, benefit: '25%' },
    {
        coverage: 'โรคร้ายแรงสำหรับเด็ก',
        note: 'สำหรับผู้เอาประกันภัยอายุ 1 เดือน – 18 ปี คุ้มครองต่อเนื่องถึงอายุ 19 ปี',
        count: 17,
        benefit: '25%',
    },
    { coverage: 'โรคร้ายแรงภายใต้เงื่อนไขพิเศษ', count: 4, benefit: '10%' },
    { coverage: 'โรคร้ายแรงระยะรุนแรง', count: 53, benefit: '100%', emphasize: true },
    {
        coverage: 'กรณีภาวะวิกฤต',
        note: 'หากผู้เอาประกันภัยมีการป่วยหรือบาดเจ็บ จนทำให้เกิดเหตุการณ์ใดเหตุการณ์หนึ่งดังต่อไปนี้ • การเข้ารับการรักษาในหอผู้ป่วยหนัก (ICU) ที่ต้องใช้เครื่องช่วยหายใจแบบสอดท่อหรือเจาะคอ (MV) หรือเครื่องพยุงการทำงานของหัวใจและปอด (ECMO) อย่างน้อย 5 วันติดต่อกัน • การไม่สามารถปฏิบัติกิจวัตรประจำวันได้ด้วยตนเองอย่างถาวร ตั้งแต่ 2 อย่างขึ้นไป',
        count: 1,
        benefit: '25%',
    },
];

export default function BenefitTable() {
    return (
        <section className="w-full max-w-[1000px] mx-auto" aria-labelledby="benefit-table-heading">
            <h2
                id="benefit-table-heading"
                className="mb-4 sm:mb-8 text-center text-lg sm:text-2xl md:text-3xl font-bold text-[#1d4ed8] break-words"
            >
                ตารางการจ่ายผลประโยชน์ CI 123
            </h2>

            <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full table-fixed border-collapse text-left">
                    <colgroup>
                        <col className="w-[52%]" />
                        <col className="w-[22%]" />
                        <col className="w-[26%]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-[#eef2f6] text-[#1e3a8a]">
                            <th scope="col" className="px-3 py-3 sm:px-5 sm:py-4 text-sm sm:text-base font-bold">
                                ความคุ้มครอง
                            </th>
                            <th scope="col" className="px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-base font-bold">
                                จำนวนโรคที่คุ้มครอง
                            </th>
                            <th scope="col" className="px-2 py-3 sm:px-4 sm:py-4 text-center text-xs sm:text-base font-bold">
                                ผลประโยชน์
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr
                                key={row.coverage}
                                className={`align-top border-t border-gray-200 ${row.emphasize ? 'bg-[#dbeafe]' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                            >
                                <th scope="row" className="px-3 py-3 sm:px-5 sm:py-4 font-normal break-words">
                                    <span className={`block text-sm sm:text-base ${row.emphasize ? 'font-bold text-[#1b2b7a]' : 'font-semibold text-[#1f2937]'}`}>
                                        {row.coverage}
                                    </span>
                                    {row.note && (
                                        <span className="mt-1 block text-xs sm:text-sm font-normal text-gray-500 leading-snug">
                                            {row.note}
                                        </span>
                                    )}
                                </th>
                                <td className="px-2 py-3 sm:px-4 sm:py-4 text-center align-middle">
                                    <span className={`text-base sm:text-lg font-bold tabular-nums ${row.emphasize ? 'text-[#1b2b7a]' : 'text-[#1e3a8a]'}`}>
                                        {row.count}
                                    </span>
                                </td>
                                <td className="px-2 py-3 sm:px-4 sm:py-4 text-center align-middle">
                                    <span className={`block text-base sm:text-lg font-bold tabular-nums ${row.emphasize ? 'text-[#1b2b7a]' : 'text-[#1d4ed8]'}`}>
                                        {row.benefit}
                                    </span>
                                    {row.benefitNote && (
                                        <span className="mt-0.5 block text-[11px] sm:text-xs font-normal text-gray-500 leading-snug">
                                            ({row.benefitNote})
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-xs text-gray-400 text-center">
                ผลประโยชน์เทียบกับจำนวนเงินเอาประกันภัยเริ่มต้นของโรคร้ายแรงระยะรุนแรง
            </p>
        </section>
    );
}
