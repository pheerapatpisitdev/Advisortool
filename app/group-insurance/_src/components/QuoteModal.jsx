import React, { useEffect, useRef, useState } from 'react';
import { X, Eye, Download, Printer, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import QuoteDocument from './QuoteDocument';
import { viewPdf, downloadPdf, printPdf } from '../utils/quotePdf';

function pad(n) {
  return String(n).padStart(2, '0');
}

/** สร้างเลขที่ใบเสนอราคา QT-YYYYMMDD-XXX (XXX จากวินาทีในวัน) */
function makeQuoteNo(now) {
  const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const secOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const seq = String(secOfDay % 1000).padStart(3, '0');
  return `QT-${ymd}-${seq}`;
}

/**
 * โมดัลใบเสนอราคา: กรอกชื่อลูกค้า + พรีวิว + ปุ่ม ดู/ดาวน์โหลด/ปริ้น
 */
function QuoteModal({ open, onClose, titleKey, quoteData, filenamePrefix, DocumentComponent = QuoteDocument }) {
  const { t, lang } = useLanguage();
  const docRef = useRef(null);
  const [customerName, setCustomerName] = useState('');
  const [quoteNo, setQuoteNo] = useState('');
  const [quoteDate, setQuoteDate] = useState('');
  const [busy, setBusy] = useState(null); // 'view' | 'download' | 'print' | null

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setQuoteNo(makeQuoteNo(now));
    setQuoteDate(now.toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH'));
  }, [open, lang]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filename = `${filenamePrefix}-${quoteNo}.pdf`;

  const run = async (kind, fn) => {
    if (busy) return;
    setBusy(kind);
    try {
      await fn(docRef.current);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setBusy(null);
    }
  };

  const ActionBtn = ({ kind, onClick, icon: Icon, label, primary }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm transition-all disabled:opacity-60 ${
        primary ? 'text-white shadow-sm hover:opacity-90' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
      style={primary ? { backgroundColor: 'rgba(41, 45, 120, 1)' } : undefined}
    >
      {busy === kind ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        role="button"
        tabIndex={0}
        aria-label={t('close')}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* หัวโมดัล */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200" style={{ backgroundColor: 'rgba(41, 45, 120, 1)' }}>
          <h3 className="font-bold text-white">{t('quotePreview')}</h3>
          <button type="button" onClick={onClose} aria-label={t('close')} className="w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ช่องกรอกชื่อลูกค้า */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <label className="text-sm font-medium text-slate-700 block mb-1.5">{t('customerName')}</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t('customerNamePlaceholder')}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all"
          />
        </div>

        {/* พรีวิว (เลื่อนได้) */}
        <div className="flex-1 overflow-auto bg-slate-200 p-4">
          <div className="mx-auto bg-white shadow-md" style={{ width: '794px' }}>
            <DocumentComponent
              ref={docRef}
              titleKey={titleKey}
              customerName={customerName}
              quoteNo={quoteNo}
              quoteDate={quoteDate}
              {...quoteData}
            />
          </div>
        </div>

        {/* ปุ่มจัดการ */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex flex-wrap justify-end gap-3">
          <ActionBtn kind="view" onClick={() => run('view', viewPdf)} icon={Eye} label={t('quoteViewBtn')} />
          <ActionBtn kind="print" onClick={() => run('print', printPdf)} icon={Printer} label={t('quotePrintBtn')} />
          <ActionBtn kind="download" onClick={() => run('download', (el) => downloadPdf(el, filename))} icon={Download} label={t('quoteDownloadBtn')} primary />
        </div>
      </div>
    </div>
  );
}

export default QuoteModal;
