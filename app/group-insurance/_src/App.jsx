"use client";
import "./index.css";
import React, { useState } from 'react';
import { Building2, ShieldAlert, Briefcase, ExternalLink, Menu, X } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import HealthInsurance from './pages/HealthInsurance';
import AccidentInsurance from './pages/AccidentInsurance';
import BusinessType from './pages/BusinessType';
import DonateFooter from './components/DonateFooter';

const PAGES = {
  health: {
    key: 'health',
    titleKey: 'pageHealth',
    breadcrumbKey: 'pageHealth',
    icon: Building2,
    descKey: 'pageHealthDesc',
    component: HealthInsurance,
  },
  accident: {
    key: 'accident',
    titleKey: 'pageAccident',
    breadcrumbKey: 'pageAccident',
    icon: ShieldAlert,
    descKey: 'pageAccidentDesc',
    component: AccidentInsurance,
  },
  businessType: {
    key: 'businessType',
    titleKey: 'pageBusinessType',
    breadcrumbKey: 'pageBusinessType',
    icon: Briefcase,
    descKey: 'pageBusinessTypeDesc',
    component: BusinessType,
  },
};

const EXTERNAL_LINKS = [
  {
    key: 'dbd',
    titleKey: 'linkDbd',
    descKey: 'linkDbdDesc',
    icon: ExternalLink,
    href: 'https://datawarehouse.dbd.go.th/',
  },
];

function App() {
  const { t, lang, setLang } = useLanguage();
  const [currentPage, setCurrentPage] = useState('health');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageConfig = PAGES[currentPage];
  const PageComponent = pageConfig.component;

  return (
    <div className="min-h-screen w-full flex">
      {/* ปุ่มเปิดเมนูมือถือ (โชว์เฉพาะตอนเมนูปิด เพื่อไม่ให้ทับโลโก้) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[200] w-12 h-12 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-lg border border-teal-600"
          aria-label={t('openMenu')}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
        className={`lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden
      />

      {/* Sidebar - ธีม Dark Green/Teal */}
      <aside
        className={`fixed top-0 left-0 w-72 h-screen flex flex-col z-[100] transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col bg-teal-800 text-white shadow-xl">
          {/* Logo */}
          <div className="relative p-6 border-b" style={{ borderBottomColor: 'rgba(95, 127, 116, 0.8)', backgroundColor: 'rgba(42, 71, 61, 1)' }}>
            <div className="flex items-center gap-3 pr-10">
              <img src="/group-insurance/logo.png" alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white">{t('groupInsurance')}</h1>
                <p className="text-xs text-teal-200">{t('groupInsuranceSystem')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-1/2 right-4 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 py-3 pl-3 pr-5 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: 'rgba(96, 127, 116, 1)', scrollbarGutter: 'stable' }}>
            {Object.values(PAGES).map((page) => {
              const Icon = page.icon;
              const isActive = currentPage === page.key;
              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => { setCurrentPage(page.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-all duration-200 mb-1.5 ${
                    isActive
                      ? 'bg-teal-600/80 text-white border-l-4 border-teal-400'
                      : 'text-teal-100 hover:bg-teal-700/50 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-teal-500 text-white' : 'bg-teal-700/60 text-teal-200'}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-semibold text-[15px] break-words">{t(page.titleKey)}</span>
                    <span className={`text-xs break-words ${isActive ? 'text-teal-100' : 'text-teal-300'}`}>{t(page.descKey)}</span>
                  </div>
                </button>
              );
            })}
            {EXTERNAL_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-all duration-200 mb-1.5 text-teal-100 hover:bg-teal-700/50 hover:text-white border-l-4 border-transparent"
                >
                  <span className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-700/60 text-teal-200">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-semibold text-[15px] break-words">{t(link.titleKey)}</span>
                    <span className="text-xs break-words text-teal-300">{t(link.descKey)}</span>
                  </div>
                </a>
              );
            })}
          </nav>

          <div className="p-4 border-t border-teal-700/80">
            <p className="text-[11px] text-teal-400 text-center">{t('copyright')}</p>
          </div>
        </div>
      </aside>

      {/* เนื้อหาหลัก */}
      <main className="flex-1 min-w-0 lg:ml-72 min-h-screen flex flex-col bg-[#fafbfc]">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 pl-20 pr-4 lg:pl-8 lg:pr-8 py-4 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">{t(pageConfig.titleKey)}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{t('home')} / {t(pageConfig.breadcrumbKey)}</p>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex justify-end mb-4">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setLang('th')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'th' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                EN
              </button>
            </div>
          </div>
          <PageComponent />
        </div>
        <DonateFooter showHealthFooter={currentPage === 'health'} />
      </main>
    </div>
  );
}

export default App;
