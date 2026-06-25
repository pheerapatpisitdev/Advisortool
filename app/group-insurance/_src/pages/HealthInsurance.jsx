import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import MultiGroupCalculator from '../components/MultiGroupCalculator';
import imgHealth from '../assets/health.png';
import imgHealthEn from '../assets/health-en.png';

function HealthInsurance() {
  const { t, lang } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 animate-slide-up">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-4xl flex justify-center mb-4">
            <img
              src={lang === 'en' ? imgHealthEn : imgHealth}
              alt={lang === 'en' ? 'Group Health Insurance' : 'ประกันสุขภาพกลุ่ม'}
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('healthTitle')}
            </h1>
            <p className="text-slate-500 mt-0.5">{t('healthSubtitle')}</p>
          </div>
        </div>
      </header>

      <MultiGroupCalculator product="health" />

      <footer className="mt-12 text-center text-xs pb-8 text-slate-500">
        <p>{t('healthFooter')}</p>
      </footer>
    </div>
  );
}

export default HealthInsurance;
