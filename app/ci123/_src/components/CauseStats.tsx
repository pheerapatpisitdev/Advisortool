import React from 'react';

type Stat = {
    value: string;
    desc: string;
    source: string;
};

type Category = {
    name: string;
    headerClass: string;
    valueClass: string;
    stats: Stat[];
};

const categories: Category[] = [
    {
        name: 'พฤติกรรมการใช้ชีวิต',
        headerClass: 'bg-[#1b2b7a]',
        valueClass: 'text-[#1b2b7a]',
        stats: [
            { value: '46%', desc: 'มีภาวะเครียดสูงจากงาน', source: 'ThaiJO, 2023' },
            { value: '76%', desc: 'นั่งทำงานนานเกิน 7 ชม./วัน', source: 'PLOS One, 2023' },
            { value: '30%', desc: 'ขาดการออกกำลังกาย', source: 'The MATTER, 2023' },
        ],
    },
    {
        name: 'พฤติกรรมการบริโภค',
        headerClass: 'bg-[#1d4ed8]',
        valueClass: 'text-[#1d4ed8]',
        stats: [
            { value: '90%', desc: 'บริโภคน้ำตาลเกินมาตรฐาน และ 80% บริโภคโซเดียมเกินมาตรฐาน', source: 'MGR Online, 2023' },
            { value: '50%', desc: 'ทานอาหารสำเร็จรูป 2 วัน/สัปดาห์', source: 'Thairath Online, 2024' },
        ],
    },
    {
        name: 'สภาพแวดล้อม',
        headerClass: 'bg-[#0e9bb5]',
        valueClass: 'text-[#0e9bb5]',
        stats: [
            { value: '38 ล้านคน', desc: 'อยู่ในพื้นที่ PM2.5 เกินมาตรฐาน', source: 'Hfocus, 2023' },
        ],
    },
];

export default function CauseStats() {
    return (
        <section className="w-full max-w-[1000px] mx-auto" aria-labelledby="cause-stats-heading">
            <h2
                id="cause-stats-heading"
                className="mb-4 sm:mb-8 text-center text-lg sm:text-2xl md:text-3xl font-bold text-[#1b2b7a] break-words"
            >
                สาเหตุที่โรคร้าย...เข้าใกล้เรามากขึ้น
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {categories.map((cat) => (
                    <div
                        key={cat.name}
                        className="flex flex-col rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm"
                    >
                        <div className={`${cat.headerClass} px-4 py-3 text-center text-sm sm:text-base font-bold text-white`}>
                            {cat.name}
                        </div>
                        <div className="flex-1 p-4 sm:p-5 space-y-4 sm:space-y-5 text-left">
                            {cat.stats.map((s) => (
                                <div key={s.desc}>
                                    <div className={`text-3xl sm:text-4xl font-extrabold leading-tight ${cat.valueClass}`}>
                                        {s.value}
                                    </div>
                                    <p className="mt-1 text-sm sm:text-base text-gray-700 leading-snug">
                                        {s.desc}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">ที่มา: {s.source}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
