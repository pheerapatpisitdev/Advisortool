import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function DonateFooter({ showHealthFooter = false }) {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-amber-100/60 bg-gradient-to-b from-amber-50/40 via-white to-white">
      <div className="container mx-auto max-w-lg px-4 sm:px-6 py-6 sm:py-10 text-center">
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-left">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            ข้อมูลนี้จัดทำขึ้นเพื่อให้ความรู้ทั่วไปเท่านั้น ไม่ถือเป็นคำแนะนำทางการเงินหรือการประกันภัยเฉพาะบุคคล
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            เงื่อนไขความคุ้มครองเป็นไปตามที่ระบุในกรมธรรม์ของบริษัทประกันภัย
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            ผู้สนใจควรศึกษารายละเอียดเพิ่มเติมหรือปรึกษาตัวแทนก่อนตัดสินใจ
          </p>
        </div>
        {showHealthFooter ? (
          <div className="mt-8 text-center text-blue-600 text-xs pb-2">
            <p>{t('healthFooter')}</p>
            <p className="mt-2 text-slate-500">{t('appBy')}</p>
          </div>
        ) : null}
      </div>
    </footer>
  );
}
