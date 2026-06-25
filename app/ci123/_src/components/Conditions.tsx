'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Conditions() {
    const [activeSection, setActiveSection] = useState<'conditions' | 'examples' | null>(null);

    const toggleSection = (section: 'conditions' | 'examples') => {
        if (activeSection === section) {
            setActiveSection(null);
        } else {
            setActiveSection(section);
        }
    };

    return (
        <div className="w-full max-w-[1200px] mt-10 sm:mt-16 md:mt-20 mb-10 sm:mb-20">
            {/* Toggle buttons - flat, on-brand */}
            <div className="mx-auto flex justify-center gap-3 sm:gap-6 flex-wrap w-full max-w-[913px] py-2">
                <button
                    type="button"
                    onClick={() => toggleSection('conditions')}
                    aria-expanded={activeSection === 'conditions'}
                    className={`inline-flex min-h-[48px] min-w-[160px] sm:min-w-[220px] items-center justify-center rounded-full border px-6 py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1d4ed8]
                        ${activeSection === 'conditions'
                            ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white shadow-md shadow-[#1d4ed8]/25'
                            : 'border-[#1d4ed8] bg-white text-[#1d4ed8] hover:bg-[#eff4ff]'}`}
                >
                    {activeSection === 'conditions' ? 'ซ่อนเงื่อนไข' : 'ดูเงื่อนไขและข้อยกเว้น'}
                </button>

                <button
                    type="button"
                    onClick={() => toggleSection('examples')}
                    aria-expanded={activeSection === 'examples'}
                    className={`inline-flex min-h-[48px] min-w-[160px] sm:min-w-[220px] items-center justify-center rounded-full border px-6 py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1b2b7a]
                        ${activeSection === 'examples'
                            ? 'border-[#1b2b7a] bg-[#1b2b7a] text-white shadow-md shadow-[#1b2b7a]/25'
                            : 'border-[#1b2b7a] bg-white text-[#1b2b7a] hover:bg-[#eef0f9]'}`}
                >
                    {activeSection === 'examples' ? 'ซ่อนตัวอย่างการเคลม' : 'ตัวอย่างการเคลม'}
                </button>
            </div>

            {/* Conditions Content */}
            {activeSection === 'conditions' && (
                <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 md:p-10 text-left text-[#1f2937] shadow-lg animate-fadeIn">
                    <h2 className="text-lg sm:text-2xl font-bold text-[#1b2b7a] mb-4 sm:mb-6">เงื่อนไขและข้อยกเว้นบางส่วนของประกันโรคร้ายแรง CI 123</h2>

                    <div className="space-y-4 sm:space-y-8">
                        <section>
                            <h3 className="text-base sm:text-lg font-bold text-[#1d4ed8] mb-3 sm:mb-4">ประกันโรคร้ายแรง CI 123 ฉบับนี้ไม่คุ้มครองกรณี ดังต่อไปนี้</h3>

                            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base leading-relaxed">
                                <div>
                                    <p className="font-semibold mb-2">1. กรณีเจ็บป่วยด้วยโรคร้ายแรง เว้นแต่การสูญเสียการดำรงชีพอย่างอิสระ ซึ่งเกิดขึ้นโดยทางตรง หรือทางอ้อม ทั้งหมดหรือแต่บางส่วนอันเนื่องมาจากสาเหตุดังต่อไปนี้</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                        <li>ความผิดปกติซึ่งแพทย์ยืนยันและมีหลักฐานชัดเจนว่าเกี่ยวข้องกับโรคร้ายแรง หรือโรคร้ายแรงที่เกิดขึ้นก่อนวันเริ่มมีผลคุ้มครองตามสัญญาเพิ่มเติมนี้ หรือก่อนวันที่มีการต่ออายุสัญญาเมื่อสัญญาเพิ่มเติมสิ้นผลบังคับ (Reinstatement) หรือก่อนวันที่บริษัทอนุมัติให้เพิ่มจำนวนเงินเอาประกันภัยของสัญญาเพิ่มเติมนี้ แล้วแต่วันใดจะเกิดขึ้นภายหลัง ทั้งนี้ ในกรณีที่บริษัทอนุมัติให้เพิ่มจำนวนเงินเอาประกันภัย บริษัทจะไม่คุ้มครองเฉพาะในส่วนของจำนวนเงินเอาประกันภัยที่เพิ่มขึ้นเท่านั้น เว้นแต่ ผู้เอาประกันภัยได้แถลงให้บริษัททราบและบริษัทยินยอมรับความเสี่ยงภัย โดยไม่มีเงื่อนไขยกเว้นความคุ้มครองดังกล่าว</li>
                                        <li>การฆ่าตัวตาย หรือการทำร้ายร่างกายตนเอง หรือพยายามกระทำเช่นว่านั้น</li>
                                        <li>สูดดม กิน ดื่ม ฉีด หรือนำสารพิษเข้าร่างกายไม่ว่าด้วยวิธีใด ในขณะที่รู้สึกผิดชอบ หรือวิกลจริต หรือไม่ก็ตาม</li>
                                        <li>ผู้เอาประกันภัยปฏิเสธไม่ยอมรับการรักษา แนะนำ หรือ ปฏิบัติตามคำแนะนำของแพทย์</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold mb-2">2. กรณีการสูญเสียการดำรงชีพอย่างอิสระ อันเนื่องมาจากสาเหตุดังต่อไปนี้</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                        <li>การฆ่าตัวตาย พยายามฆ่าตัวตาย หรือการทำร้ายร่างกายตนเอง</li>
                                        <li>การบาดเจ็บขณะที่ผู้เอาประกันภัยก่ออาชญากรรมที่มีความผิดสถานหนัก หรือขณะถูกจับกุม หรือหลบหนีการจับกุม</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold mb-2">3. กรณีภาวะวิกฤต จะไม่คุ้มครองกลุ่มถึงภาวะหรือโรคใดๆ ที่เกิดขึ้นโดยตรงหรือโดยอ้อม ทั้งหมดหรือบางส่วน จากเหตุการณ์ใดเหตุการณ์หนึ่งดังต่อไปนี้</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                        <li>การฆ่าตัวตาย การพยายามฆ่าตัวตาย การทำร้ายร่างกายตนเอง</li>
                                        <li>การรักษาหรือการบำบัดการติดยาเสพติดให้โทษ บุหรี่ สุรา หรือสารออกฤทธิ์ต่อจิตประสาท</li>
                                        <li>การตรวจรักษาหรือการผ่าตัดเพื่อเสริมสวย</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-base sm:text-lg font-bold text-[#1d4ed8] mb-3 sm:mb-4">ระยะเวลาที่ไม่คุ้มครอง (Waiting Period)</h3>
                            <p className="text-xs sm:text-sm md:text-base text-gray-600">
                                90 วันนับแต่วันเริ่มมีผลคุ้มครองตามสัญญาเพิ่มเติมนี้ หรือหากมีการต่ออายุสัญญาเมื่อสัญญาเพิ่มเติมสิ้นผลบังคับ (Reinstatement) ให้นับแต่วันเริ่มมีผลคุ้มครองตามการต่ออายุครั้งสุดท้าย หรือวันที่บริษัทอนุมัติให้เพิ่มจำนวนเงินเอาประกันภัยของสัญญาเพิ่มเติมนี้ แล้วแต่วันใดจะเกิดขึ้นภายหลัง ยกเว้นกรณีอุบัติเหตุภายใต้ความคุ้มครองกรณีภาวะวิกฤต
                            </p>
                        </section>

                    </div>
                </div>
            )}

            {/* Examples Content */}
            {activeSection === 'examples' && (
                <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 md:p-10 text-left text-[#1f2937] shadow-lg animate-fadeIn">
                    <h2 className="text-lg sm:text-2xl font-bold text-[#059669] mb-4 sm:mb-6">ตัวอย่างการเคลมสินไหม</h2>

                    <div className="flex flex-col gap-3 sm:gap-6">
                        {['EX1.png', 'EX2.png', 'EX3.png'].map((img, index) => (
                            <div key={index} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                <Image
                                    src={`/ci123/Ex/${img}`}
                                    alt={`ตัวอย่างการเคลม ${index + 1}`}
                                    width={1000}
                                    height={800}
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
