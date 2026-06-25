import React, { useState } from 'react';
import { Users, Plus, Trash2, ChevronDown, FileText, Send, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import QuoteModal from './QuoteModal';
import MultiGroupQuoteDocument from './MultiGroupQuoteDocument';
import {
  healthBizTypes,
  healthBenefits,
  paBizTypes,
  paMainBenefits,
  paMeCoverLevels,
} from '../data/insuranceData';
import { computeMultiGroupQuote } from '../utils/multiGroupQuote';

const BIZ_LABELS = { biz1: 'biz1Label', biz2: 'biz2Label', biz3: 'biz3Label' };
const PA_BIZ_LABELS = { biz1: 'paBiz1Label', biz2: 'paBiz2Label', biz3: 'paBiz3Label' };

const GOLD = 'rgba(169, 145, 77, 1)';
const TEAL = 'rgba(96, 127, 116, 1)';
const NAVY = 'rgba(41, 45, 120, 1)';

let groupSeq = 0;
function makeGroup(product) {
  groupSeq += 1;
  return {
    id: `g${groupSeq}`,
    name: '',
    bizType: 'biz1',
    planIdx: 0,
    includeRider: true,
    riderIdx: 0,
    count: product === 'pa' ? '5' : '10',
  };
}

/**
 * เครื่องคิดเบี้ยแบบหลายกลุ่ม (ใช้ในหน้า Health และ PA)
 * @param {{ product: 'health' | 'pa' }} props
 */
function MultiGroupCalculator({ product }) {
  const { t, lang } = useLanguage();
  const isPa = product === 'pa';
  const locale = lang === 'en' ? 'en-US' : 'th-TH';
  const fmt = (n) => Number(n).toLocaleString(locale);

  const [groups, setGroups] = useState(() => [makeGroup(product)]);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const bizTypes = isPa ? paBizTypes : healthBizTypes;
  const bizLabels = isPa ? PA_BIZ_LABELS : BIZ_LABELS;

  const updateGroup = (id, patch) => {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const setPlanIdx = (id, planIdx) => {
    setGroups((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const riderIdx = g.riderIdx > planIdx + 1 ? planIdx + 1 : g.riderIdx;
        return { ...g, planIdx, riderIdx };
      })
    );
  };

  const addGroup = () => setGroups((gs) => [...gs, makeGroup(product)]);
  const removeGroup = (id) => setGroups((gs) => (gs.length > 1 ? gs.filter((g) => g.id !== id) : gs));

  const handleCountChange = (id, raw) => {
    if (raw === '' || /^\d+$/.test(raw)) updateGroup(id, { count: raw });
  };

  // ===== คำนวณ =====
  const result = computeMultiGroupQuote(product, groups);
  const computedById = Object.fromEntries(result.groups.map((g) => [g.id, g]));

  // ===== ป้าย/ข้อความ =====
  const planLabelOf = (g) => (isPa ? `P${g.planIdx + 1}` : `${t('plan')} ${g.planIdx + 1}`);
  const riderTextOf = (g) => {
    if (!g.includeRider) return '';
    return isPa ? `ME ${paMeCoverLevels[g.riderIdx]}` : `OPD ${t('plan')} ${g.riderIdx + 1}`;
  };
  const riderLevelLabel = (idx) => (isPa ? paMeCoverLevels[idx] : `${t('plan')} ${idx + 1}`);
  const mainLabel = isPa ? t('mainPremium') : t('ipdPremium');
  const riderLabel = isPa ? t('mePremium') : t('opdPremium');
  const riderToggleLabel = isPa ? t('mePlan') : t('opdPlan');
  const riderMaxNote = isPa ? t('meMaxOne') : t('opdMaxOne');

  // ===== ตารางผลประโยชน์รวม: 1 แถวต่อความคุ้มครอง, 1 คอลัมน์ตัวเลขต่อกลุ่ม =====
  const anyRider = result.groups.some((g) => g.includeRider);
  const buildBenefitMatrix = () => {
    const rows = [];
    if (isPa) {
      paMainBenefits.forEach((b) => {
        rows.push({ label: t(b.key), values: result.groups.map((g) => b.values[g.planIdx]) });
      });
      if (anyRider) {
        rows.push({
          label: t('meSelected'),
          values: result.groups.map((g) => (g.includeRider ? paMeCoverLevels[g.riderIdx] : '—')),
        });
      }
    } else {
      healthBenefits
        .filter((b) => b.key !== 'hOpdPerVisit')
        .forEach((b) => {
          rows.push({ label: t(b.key), values: result.groups.map((g) => b.values[g.planIdx]) });
        });
      if (anyRider) {
        const opd = healthBenefits.find((b) => b.key === 'hOpdPerVisit');
        rows.push({
          label: t('hOpdPerVisit'),
          values: result.groups.map((g) => (g.includeRider ? opd.values[g.riderIdx] : '—')),
        });
      }
    }
    return rows;
  };
  const benefitMatrix = buildBenefitMatrix();

  // ===== คอลัมน์กลุ่ม (ใช้ทั้งตาราง inline และส่งให้ PDF) =====
  const groupCols = result.groups.map((cg, i) => ({
    no: i + 1,
    name: cg.name,
    bizTypeLabel: t(bizLabels[cg.bizType]),
    planLabel: planLabelOf(cg),
    riderText: riderTextOf(cg),
    count: cg.count,
    includeRider: cg.includeRider,
    mainPremium: cg.mainPremium,
    riderPremium: cg.riderPremium,
    perPerson: cg.perPerson,
    subtotal: cg.subtotal,
  }));

  // ===== ข้อมูลสำหรับเอกสาร PDF =====
  const quoteData = {
    productLabel: t(isPa ? 'productPa' : 'productHealth'),
    band: result.band,
    totalCount: result.totalCount,
    grandTotal: result.grandTotal,
    mainLabel,
    riderLabel,
    anyRider,
    groups: groupCols,
    benefitMatrix,
  };

  const handleShareToLine = () => {
    const lines = [
      '💼 ' + t(isPa ? 'quoteTitleMultiPa' : 'quoteTitleMultiHealth'),
      '👥 ' + t('totalPeople') + ': ' + result.totalCount + ' ' + t('people') + ' (' + t('bandUsed') + ' ' + result.band + ')',
      '',
    ];
    result.groups.forEach((cg, i) => {
      lines.push(
        `▶ ${t('groupNo')} ${i + 1}${cg.name ? ' · ' + cg.name : ''}: ${t(bizLabels[cg.bizType])} · ${planLabelOf(cg)}${riderTextOf(cg) ? ' · ' + riderTextOf(cg) : ''}`,
        `   ${fmt(cg.perPerson)} × ${fmt(cg.count)} = ${fmt(cg.subtotal)} ${t('baht')}`
      );
    });
    lines.push('', '✅ ' + t('totalPremiumYear') + ': ' + result.grandTotal.toLocaleString(locale) + ' ' + t('baht'));
    const text = lines.join('\n');
    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* รายการกลุ่ม */}
      <div className="space-y-4">
        {groups.map((g, gi) => {
          const cg = computedById[g.id];
          return (
            <section key={g.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: GOLD }}>
                    {gi + 1}
                  </span>
                  <input
                    type="text"
                    value={g.name}
                    onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                    placeholder={t('groupNamePlaceholder')}
                    className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all"
                  />
                </div>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(g.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> {t('removeGroup')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* bizType */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{t('bizType')}</label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all"
                      value={g.bizType}
                      onChange={(e) => updateGroup(g.id, { bizType: e.target.value })}
                    >
                      {bizTypes.map((b) => (
                        <option key={b.value} value={b.value}>{t(bizLabels[b.value])}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* จำนวนคน */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{t('employeeCountShort')} ({t('people')})</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={g.count}
                    onChange={(e) => handleCountChange(g.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all"
                  />
                </div>
              </div>

              {/* แผนหลัก */}
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 block mb-2">{isPa ? t('mainPlan') : t('ipdPlan')}</label>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPlanIdx(g.id, idx)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        g.planIdx === idx ? 'text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                      }`}
                      style={g.planIdx === idx ? { backgroundColor: GOLD, borderColor: GOLD } : undefined}
                    >
                      {isPa ? `P${idx + 1}` : idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* rider (OPD/ME) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">{riderToggleLabel}</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={g.includeRider}
                      onChange={() => updateGroup(g.id, { includeRider: !g.includeRider })}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
                  </label>
                </div>
                {g.includeRider && (
                  <div className="grid grid-cols-6 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const disabled = idx > g.planIdx + 1;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={disabled}
                          onClick={() => updateGroup(g.id, { riderIdx: idx })}
                          className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            disabled
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-400'
                              : g.riderIdx === idx
                                ? 'text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                          style={!disabled && g.riderIdx === idx ? { backgroundColor: TEAL, borderColor: TEAL } : undefined}
                        >
                          {riderLevelLabel(idx)}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-2">{riderMaxNote}</p>
              </div>

              {/* สรุปกลุ่ม */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-sm">
                <span className="text-slate-500">
                  {t('totalPerPerson')}: <span className="font-bold text-slate-800 tabular-nums">{fmt(cg.perPerson)}</span> {t('baht')}
                </span>
                <span className="font-semibold" style={{ color: NAVY }}>
                  {t('groupSubtotal')}: <span className="font-bold tabular-nums">{fmt(cg.subtotal)}</span> {t('baht')}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addGroup}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 py-3 font-semibold hover:border-teal-400 hover:text-teal-700 transition-colors"
      >
        <Plus className="w-5 h-5" /> {t('addGroup')}
      </button>

      {/* ตารางผลประโยชน์เปรียบเทียบ (แยกคอลัมน์ตามกลุ่ม) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-6 animate-slide-up">
        <div className="px-6 py-4 flex items-center gap-2.5" style={{ backgroundColor: NAVY, color: 'rgba(148, 163, 184, 1)' }}>
          <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Info className="w-4 h-4 text-teal-100" />
          </span>
          <h2 className="font-bold text-white">{t('benefits')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[180px]">{t('coverage')}</th>
                {groupCols.map((g, i) => (
                  <th key={i} className="px-2.5 py-3 font-semibold text-slate-900 text-right align-bottom">
                    {g.name && <div>{g.name}</div>}
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {g.bizTypeLabel}<br />
                      {g.planLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {benefitMatrix.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="px-4 py-3 text-slate-600 font-medium sticky left-0 bg-inherit">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="px-2.5 py-3 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">{v}</td>
                  ))}
                </tr>
              ))}
              {/* แถวเบี้ยรวมต่อคน + ยอดรวมกลุ่ม */}
              <tr className="border-t-2" style={{ borderColor: GOLD }}>
                <td className="px-4 py-3 font-bold sticky left-0 bg-white" style={{ color: NAVY }}>{t('totalPerPerson')}</td>
                {groupCols.map((g, j) => (
                  <td key={j} className="px-2.5 py-3 text-right font-bold tabular-nums whitespace-nowrap" style={{ color: GOLD }}>{fmt(g.perPerson)}</td>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-3 font-bold sticky left-0 bg-slate-50" style={{ color: NAVY }}>{t('groupSubtotal')}</td>
                {groupCols.map((g, j) => (
                  <td key={j} className="px-2.5 py-3 text-right font-bold tabular-nums whitespace-nowrap" style={{ color: NAVY }}>{fmt(g.subtotal)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* สรุปยอดรวม */}
      <div className="relative rounded-lg overflow-hidden shadow-lg border border-slate-200 mt-6 animate-slide-up">
        <div className="relative p-6 md:p-8" style={{ color: '#fff', backgroundColor: NAVY }}>
          {!result.withinLimit && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-400/20 border border-amber-300/40 px-4 py-3 text-amber-100 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{t('limitWarningPrefix')} {result.min.toLocaleString(locale)}–{result.max.toLocaleString(locale)} {t('people')} ({t('totalPeople')}: {fmt(result.totalCount)})</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-teal-100 text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" /> {t('budgetSummary')}
              </p>
              <div className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                {fmt(result.grandTotal)}
                <span className="text-lg md:text-xl font-medium text-teal-100 ml-1">{t('perYear')}</span>
              </div>
              <p className="text-teal-200 text-sm">
                {t('totalPeople')} {fmt(result.totalCount)} {t('people')} · {t('bandUsed')} {result.band}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-teal-600/30 w-full md:w-64 shrink-0">
              <div className="space-y-1.5 text-sm">
                {result.groups.map((cg, i) => (
                  <div key={cg.id} className="flex justify-between gap-2">
                    <span className="text-teal-100 truncate">{t('groupNo')} {i + 1}{cg.name ? ` · ${cg.name}` : ''}</span>
                    <span className="text-right font-bold tabular-nums whitespace-nowrap">{fmt(cg.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
            <p className="text-xs text-slate-100">{t('premiumNote')}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!result.withinLimit}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: GOLD }}
                onClick={() => setQuoteOpen(true)}
              >
                <FileText className="w-4 h-4" />
                {t('quoteButton')}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: '#06C755' }}
                onClick={handleShareToLine}
              >
                <Send className="w-4 h-4" />
                {t('shareToLine')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        titleKey={isPa ? 'quoteTitleMultiPa' : 'quoteTitleMultiHealth'}
        filenamePrefix={isPa ? 'quote-group-pa' : 'quote-group-health'}
        quoteData={quoteData}
        DocumentComponent={MultiGroupQuoteDocument}
      />
    </div>
  );
}

export default MultiGroupCalculator;
