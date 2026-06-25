import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { businessTypes } from '../data/businessTypes';

const LEVEL_LABELS = {
  1: { th: 'ขั้น 1 (ความเสี่ยงต่ำมาก)', en: 'Level 1 (Very Low Risk)' },
  2: { th: 'ขั้น 2 (ความเสี่ยงต่ำ)', en: 'Level 2 (Low Risk)' },
  3: { th: 'ขั้น 3 (ความเสี่ยงปานกลาง)', en: 'Level 3 (Medium Risk)' },
  4: { th: 'ขั้น 4 (ความเสี่ยงสูง/ไม่คุ้มครอง)', en: 'Level 4 (High Risk/Not Covered)' },
};

function BusinessType() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return businessTypes;
    const q = search.trim().toLowerCase();
    return businessTypes.filter(
      (b) =>
        b.code.includes(q) ||
        b.name.toLowerCase().includes(q) ||
        (b.note && b.note.toLowerCase().includes(q))
    );
  }, [search]);

  const getLevelLabel = (level) =>
    LEVEL_LABELS[level]?.[lang === 'en' ? 'en' : 'th'] ?? String(level);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6 animate-slide-up">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('bizTypePageTitle')}
          </h1>
          <p className="text-slate-500 mt-0.5">{t('bizTypePageSubtitle')}</p>
        </div>
      </header>

      <div className="mb-6 animate-slide-up">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchBizType')}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all"
            aria-label={t('searchBizType')}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2 text-center">
          {filtered.length.toLocaleString(lang === 'en' ? 'en-US' : 'th-TH')} / {businessTypes.length.toLocaleString(lang === 'en' ? 'en-US' : 'th-TH')} {t('bizTypeItems')}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                  {t('bizCode')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  {t('bizTypeName')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                  {t('bizLevel')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  {t('bizNote')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.code}
                  className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                    {b.code}
                  </td>
                  <td className="px-4 py-2.5 text-slate-800">{b.name}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        b.level === 1
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.level === 2
                          ? 'bg-teal-100 text-teal-800'
                          : b.level === 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getLevelLabel(b.level)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">
                    {b.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            {t('noSearchResults')}
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-500 text-center">
        {t('bizTypePageFooter')}
      </p>
    </div>
  );
}

export default BusinessType;
