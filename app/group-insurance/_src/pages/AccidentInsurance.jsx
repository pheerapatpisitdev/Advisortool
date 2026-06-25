import React from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import MultiGroupCalculator from '../components/MultiGroupCalculator';

function AccidentInsurance() {
  const { t, lang } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 animate-slide-up">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-4xl flex justify-center mb-4">
            <img
              src={lang === 'en' ? '/PA%20%20EN.png' : '/PA.png'}
              alt={lang === 'en' ? 'Group PA Package' : 'ประกันอุบัติเหตุ Group PA Package'}
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('paTitle')}
            </h1>
            <p className="text-slate-500 mt-0.5">{t('paSubtitle')}</p>
          </div>
        </div>
      </header>

      <MultiGroupCalculator product="pa" />

      {/* เงื่อนไขการรับประกัน (ข้อมูลคงที่) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-6 animate-slide-up">
        <h2 className="px-6 py-4 font-bold text-slate-900 border-b border-slate-200 bg-slate-50">{t('conditions')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3.5 font-semibold text-slate-600 w-48">{t('item')}</th>
                <th className="px-6 py-3.5 font-semibold text-slate-600">{t('detail')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="bg-white hover:bg-slate-50">
                <td className="px-6 py-3.5 text-slate-600 font-medium">{t('ageRange')}</td>
                <td className="px-6 py-3.5 text-slate-700">{t('ageDetail')}</td>
              </tr>
              <tr className="bg-slate-50/60 hover:bg-slate-50">
                <td className="px-6 py-3.5 text-slate-600 font-medium">{t('applicantCount')}</td>
                <td className="px-6 py-3.5 text-slate-700">{t('applicantDetail')}</td>
              </tr>
              <tr className="bg-white hover:bg-slate-50">
                <td className="px-6 py-3.5 text-slate-600 font-medium">{t('coverageStart')}</td>
                <td className="px-6 py-3.5 text-slate-700">{t('coverageStartDetail')}</td>
              </tr>
              <tr className="bg-slate-50/60 hover:bg-slate-50">
                <td className="px-6 py-3.5 text-slate-600 font-medium">{t('minPremium')}</td>
                <td className="px-6 py-3.5 text-slate-700">{t('minPremiumDetail')}</td>
              </tr>
              <tr className="bg-white hover:bg-slate-50">
                <td className="px-6 py-3.5 text-slate-600 font-medium">{t('paymentMethod')}</td>
                <td className="px-6 py-3.5 text-slate-700">{t('paymentDetail')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <a
            href="https://drive.google.com/drive/folders/1L0lJevyKS-iui0ELeYdD_nwt92stqNqF?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white bg-teal-600 shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            {t('downloadDocuments')}
          </a>
        </div>
      </div>

      <footer className="mt-12 text-center text-blue-600 text-xs pb-8">
        <p>{t('paFooter')}</p>
        <p className="mt-2 text-slate-500">{t('appBy')}</p>
      </footer>
    </div>
  );
}

export default AccidentInsurance;
