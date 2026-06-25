import React, { forwardRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = 'rgba(41, 45, 120, 1)';
const TEAL = 'rgba(96, 127, 116, 1)';
const GOLD = 'rgba(169, 145, 77, 1)';

/**
 * เลย์เอาต์ใบเสนอราคาแบบหลายกลุ่ม (A4 width 794px @96dpi) สำหรับ capture เป็น PDF
 * แสดงตารางผลประโยชน์ตารางเดียว แยกคอลัมน์ตัวเลขตามแต่ละกลุ่ม (เปรียบเทียบในตารางเดียว)
 */
const MultiGroupQuoteDocument = forwardRef(function MultiGroupQuoteDocument(props, ref) {
  const {
    titleKey,
    customerName,
    quoteNo,
    quoteDate,
    productLabel,
    band,
    totalCount,
    grandTotal = 0,
    mainLabel,
    riderLabel,
    anyRider = false,
    groups = [],
    benefitMatrix = [],
  } = props;

  const { t, lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'th-TH';
  const fmt = (n) => Number(n).toLocaleString(locale);

  const colCount = groups.length;
  const labelCell = { padding: '7px 12px', color: '#334155', fontSize: '12px', textAlign: 'left' };
  const numCell = { padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '12px', whiteSpace: 'nowrap' };

  // แถวสรุปเบี้ย(เปรียบเทียบรายกลุ่มในตารางเดียว)
  const premiumRows = [
    { label: mainLabel, get: (g) => `${fmt(g.mainPremium)}` },
    ...(anyRider
      ? [{ label: riderLabel, get: (g) => (g.includeRider ? `${fmt(g.riderPremium)}` : '—') }]
      : []),
    { label: t('totalPerPerson'), get: (g) => `${fmt(g.perPerson)}`, accent: GOLD },
    { label: `${t('employeeCountShort')} (${t('people')})`, get: (g) => `${fmt(g.count)}` },
    { label: t('groupSubtotal'), get: (g) => `${fmt(g.subtotal)}`, accent: NAVY, strong: true },
  ];

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        boxSizing: 'border-box',
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif",
        padding: '40px 44px',
      }}
    >
      {/* หัวกระดาษ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px solid ${NAVY}`, paddingBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/group-insurance/logo.png" alt="" crossOrigin="anonymous" style={{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>{t('groupInsurance')}</div>
            <div style={{ fontSize: '12px', color: TEAL, marginTop: '2px' }}>{t('groupInsuranceSystem')}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
          <div style={{ fontWeight: 700 }}>{t('quoteNoLabel')}: {quoteNo}</div>
          <div style={{ marginTop: '2px' }}>{t('quoteDateLabel')}: {quoteDate}</div>
        </div>
      </div>

      {/* ชื่อเอกสาร */}
      <div style={{ marginTop: '18px', fontSize: '17px', fontWeight: 800, color: NAVY }}>{t(titleKey)}</div>

      {/* ข้อมูลลูกค้า/องค์กร */}
      <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
        <InfoRow label={t('customerName')} value={customerName || '—'} />
        <InfoRow label={t('selectProduct')} value={productLabel} />
        <InfoRow label={t('totalPeople')} value={`${fmt(totalCount)} ${t('people')}`} />
        <InfoRow label={t('bandUsed')} value={band} />
      </div>

      {/* ตารางผลประโยชน์ — แยกคอลัมน์ตามกลุ่ม */}
      <SectionTitle>{t('benefits')}</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: `${Math.max(34, 60 - colCount * 6)}%` }} />
          {groups.map((_, i) => <col key={i} />)}
        </colgroup>
        <thead>
          <tr style={{ background: NAVY, color: '#fff' }}>
            <th style={{ ...labelCell, color: '#fff', fontWeight: 700, verticalAlign: 'bottom' }}>{t('coverage')}</th>
            {groups.map((g, i) => (
              <th key={i} style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'bottom', borderLeft: '1px solid rgba(255,255,255,0.18)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                  {t('groupNo')} {g.no}{g.name ? ` · ${g.name}` : ''}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(204, 214, 235, 1)', marginTop: '2px', lineHeight: 1.35 }}>
                  {g.bizTypeLabel}<br />
                  {g.planLabel}{g.riderText ? ` + ${g.riderText}` : ''}<br />
                  {fmt(g.count)} {t('people')}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {benefitMatrix.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderTop: '1px solid #eef2f6' }}>
              <td style={labelCell}>{row.label}</td>
              {row.values.map((v, j) => (
                <td key={j} style={{ ...numCell, borderLeft: '1px solid #eef2f6' }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ตารางสรุปเบี้ย — แยกคอลัมน์ตามกลุ่ม */}
      <SectionTitle>{t('premiumSummary')}</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: `${Math.max(34, 60 - colCount * 6)}%` }} />
          {groups.map((_, i) => <col key={i} />)}
        </colgroup>
        <tbody>
          {premiumRows.map((row, i) => (
            <tr
              key={i}
              style={{
                background: row.strong ? '#eef2f6' : i % 2 === 0 ? '#ffffff' : '#f8fafc',
                borderTop: row.strong ? `1px solid ${GOLD}` : '1px solid #eef2f6',
              }}
            >
              <td style={{ ...labelCell, fontWeight: row.accent ? 700 : 400 }}>{row.label}</td>
              {groups.map((g, j) => (
                <td key={j} style={{ ...numCell, borderLeft: '1px solid #eef2f6', color: row.accent || '#0f172a' }}>
                  {row.get(g)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ยอดรวมทั้งใบ */}
      <div style={{ marginTop: '18px', background: NAVY, color: '#ffffff', borderRadius: '10px', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(204, 214, 235, 1)' }}>
          {t('totalPremiumYear')} · {fmt(totalCount)} {t('people')}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800 }}>
          {fmt(grandTotal)} <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(204, 214, 235, 1)' }}>{t('perYear')}</span>
        </div>
      </div>

      {/* หมายเหตุ */}
      <div style={{ marginTop: '20px', fontSize: '11px', color: '#64748b', lineHeight: 1.7 }}>
        <div>{t('premiumNote')}</div>
        <div>* {t('bandUsed')}: {band} ({t('totalPeople')} {fmt(totalCount)} {t('people')})</div>
        <div>* {t('minPremium')}: {t('minPremiumDetail')}</div>
      </div>
    </div>
  );
});

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
      <span style={{ color: '#64748b', minWidth: '90px' }}>{label}:</span>
      <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ margin: '20px 0 8px', fontSize: '14px', fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '4px', height: '16px', background: GOLD, borderRadius: '2px', display: 'inline-block' }} />
      {children}
    </div>
  );
}

export default MultiGroupQuoteDocument;
