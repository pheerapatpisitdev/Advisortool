import React, { forwardRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = 'rgba(41, 45, 120, 1)';
const TEAL = 'rgba(96, 127, 116, 1)';
const GOLD = 'rgba(169, 145, 77, 1)';

/**
 * เลย์เอาต์ใบเสนอราคา (A4 width 794px @96dpi) สำหรับ capture เป็น PDF
 * รับข้อมูลที่ประกอบไว้แล้วจากหน้าเครื่องคำนวณ
 */
const QuoteDocument = forwardRef(function QuoteDocument(props, ref) {
  const {
    titleKey,
    customerName,
    quoteNo,
    quoteDate,
    bizTypeLabel,
    employeeCount,
    benefitRows = [],
    premiumRows = [],
    totalPerPerson = 0,
    grandTotal = 0,
  } = props;

  const { t, lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'th-TH';
  const fmt = (n) => Number(n).toLocaleString(locale);

  const labelCell = { padding: '8px 14px', color: '#334155', fontSize: '13px' };
  const valueCell = { padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' };

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
        <InfoRow label={t('employeeCountShort')} value={`${fmt(employeeCount)} ${t('people')}`} />
        <InfoRow label={t('bizType')} value={bizTypeLabel} full />
      </div>

      {/* ตารางผลประโยชน์ */}
      <SectionTitle>{t('benefits')}</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ ...labelCell, textAlign: 'left', fontWeight: 700, color: '#475569' }}>{t('coverage')}</th>
            <th style={{ ...valueCell, color: '#0f172a' }}>{t('limit')}</th>
          </tr>
        </thead>
        <tbody>
          {benefitRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderTop: '1px solid #eef2f6' }}>
              <td style={labelCell}>{row.label}</td>
              <td style={valueCell}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ตารางสรุปเบี้ย */}
      <SectionTitle>{t('premiumSummary')}</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
        <tbody>
          {premiumRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderTop: i === 0 ? 'none' : '1px solid #eef2f6' }}>
              <td style={labelCell}>{row.label}</td>
              <td style={valueCell}>{fmt(row.value)} {t('baht')}</td>
            </tr>
          ))}
          <tr style={{ background: '#eef2f6', borderTop: `2px solid ${GOLD}` }}>
            <td style={{ ...labelCell, fontWeight: 700 }}>{t('totalPerPerson')}</td>
            <td style={{ ...valueCell, color: GOLD }}>{fmt(totalPerPerson)} {t('baht')}</td>
          </tr>
        </tbody>
      </table>

      {/* ยอดรวมทั้งปี */}
      <div style={{ marginTop: '18px', background: NAVY, color: '#ffffff', borderRadius: '10px', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(204, 214, 235, 1)' }}>{t('totalPremiumYear')}</div>
        <div style={{ fontSize: '26px', fontWeight: 800 }}>
          {fmt(grandTotal)} <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(204, 214, 235, 1)' }}>{t('perYear')}</span>
        </div>
      </div>

      {/* หมายเหตุ */}
      <div style={{ marginTop: '20px', fontSize: '11px', color: '#64748b', lineHeight: 1.7 }}>
        <div>{t('premiumNote')}</div>
        <div>* {t('minPremium')}: {t('minPremiumDetail')}</div>
      </div>
    </div>
  );
});

function InfoRow({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', display: 'flex', gap: '8px', fontSize: '13px' }}>
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

export default QuoteDocument;
