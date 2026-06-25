import Image from 'next/image';
import PremiumCalculator from './_src/components/PremiumCalculator';
import Conditions from './_src/components/Conditions';
import BenefitTable from './_src/components/BenefitTable';
import DiseaseList from './_src/components/DiseaseList';
import {
  preEarlyStage,
  earlyToModerate,
  severeStage,
  childrenDiseases,
  specialConditions,
} from './_src/data/diseases';

export default function Home() {
  return (
    <main className="ci123-scope min-h-dvh bg-white px-3 py-6 sm:px-10 sm:py-10 md:px-16 lg:px-24 overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center w-full min-w-0 gap-8 sm:gap-16">

        {/* Hero */}
        <header className="w-full flex flex-col items-center">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#1b2b7a] text-center break-words leading-snug">
            ทำไมต้องทำประกันโรคร้ายแรง
          </h1>
        </header>

        {/* Causes (stats) */}
        <Image
          src="/ci123/cause-stats.png"
          alt="สาเหตุที่โรคร้าย...เข้าใกล้เรามากขึ้น — 46% มีภาวะเครียดสูงจากงาน, 76% นั่งทำงานนานเกิน 7 ชม./วัน, 30% ขาดการออกกำลังกาย, 90% บริโภคน้ำตาลเกินมาตรฐาน, 50% ทานอาหารสำเร็จรูป 2 วัน/สัปดาห์, 38 ล้านคนอยู่ในพื้นที่ PM2.5 เกินมาตรฐาน"
          width={2000}
          height={942}
          priority
          className="w-full max-w-[1000px] h-auto"
        />

        {/* Primary CTA → calculator */}
        <a
          href="#calculator"
          className="inline-flex items-center justify-center rounded-full bg-[#1b2b7a] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#1b2b7a]/25 transition-all hover:bg-[#152466] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
        >
          คำนวณเบี้ยประกันของคุณ
        </a>

        {/* Benefit payout table */}
        <BenefitTable />

        {/* Covered critical illnesses */}
        <section className="w-full min-w-0 max-w-[1000px]" aria-labelledby="disease-heading">
          <h2
            id="disease-heading"
            className="mb-4 sm:mb-8 text-center text-lg sm:text-2xl md:text-3xl font-bold text-[#1d4ed8] break-words"
          >
            รายชื่อโรคร้ายแรงที่คุ้มครองของประกันโรคร้ายแรง CI 123
          </h2>

          <div className="flex flex-col gap-3 sm:gap-4">
            <DiseaseList
              title="โรคร้ายแรงระยะก่อนเริ่มต้น"
              badge="20%"
              badgeNote="จ่ายสูงสุดไม่เกิน 100,000 บาท"
              diseases={preEarlyStage}
            />
            <DiseaseList
              title="โรคร้ายแรงระยะเริ่มต้นถึงปานกลาง"
              badge="25%"
              diseases={earlyToModerate}
            />
            <DiseaseList
              title="โรคร้ายแรงระยะรุนแรง"
              badge="100%"
              diseases={severeStage}
            />
            <DiseaseList
              title="โรคร้ายแรงสำหรับเด็ก"
              badge="25%"
              diseases={childrenDiseases}
            />
            <DiseaseList
              title="โรคร้ายแรงภายใต้เงื่อนไขพิเศษ"
              badge="10%"
              diseases={specialConditions}
            />
          </div>
        </section>

        {/* Critical condition coverage */}
        <section className="w-full max-w-[1000px]">
          <div className="rounded-lg sm:rounded-xl bg-gray-50/50 overflow-hidden border border-gray-100">
            <h3 className="bg-[#eef2f6] px-3 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-base sm:text-xl font-bold text-[#1e3a8a]">ความคุ้มครองกรณีภาวะวิกฤต</span>
              <span className="inline-flex items-center rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-[#1e3a8a]">
                25%
              </span>
            </h3>
            <div className="p-3 sm:p-6 text-left text-[#1f2937] text-sm sm:text-base">
              <p className="mb-3 sm:mb-4">
                หากผู้เอาประกันภัยมีการป่วย หรือบาดเจ็บจนทำให้เกิดเหตุการณ์ใดเหตุการณ์หนึ่ง ดังต่อไปนี้
              </p>
              <ul className="list-disc space-y-2 sm:space-y-3 pl-4 sm:pl-6">
                <li>
                  การเข้ารับการรักษาในหอผู้ป่วยหนัก (ICU) ที่ต้องใช้เครื่องแบบสอดท่อหรือเจาะคอ (MV) หรือเครื่องพยุงการทำงานของหัวใจและปอด (ECMO) อย่างน้อย 5 วันติดต่อกัน
                </li>
                <li>
                  การไม่สามารถปฏิบัติกิจวัตรประจำวันได้ด้วยตนเองอย่างถาวรตั้งแต่ 2 อย่างขึ้นไป
                </li>
              </ul>
            </div>
          </div>
        </section>

        <Conditions />

        {/* Premium Calculator */}
        <section id="calculator" className="w-full max-w-full min-w-0 overflow-x-hidden scroll-mt-6">
          <PremiumCalculator />
        </section>

      </div>
    </main>
  );
}
