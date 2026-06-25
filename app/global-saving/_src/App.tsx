"use client";
import './index.css';
import { useEffect, useState } from 'react';
import Calculator from './components/Calculator';
import Documents from './components/Documents';

type View = 'calc' | 'docs';

const viewFromHash = (): View =>
  window.location.hash.replace('#', '') === 'docs' ? 'docs' : 'calc';

export default function App() {
  const [view, setView] = useState<View>(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const go = (v: View) => {
    window.location.hash = v; // อัปเดต hash → เก็บ history ให้ปุ่ม back ทำงาน
    setView(v);
  };

  return (
    <>
      <nav className="tabbar noprint">
        <div className="tabbar-inner">
          <img
            className="brand-logo"
            src="/global-saving/logo.png"
            alt="Global Savings Plus 15/8"
            width={36}
            height={36}
          />
          <button className={view === 'calc' ? 'tab on' : 'tab'} onClick={() => go('calc')}>
            เครื่องคำนวณ
          </button>
          <button className={view === 'docs' ? 'tab on' : 'tab'} onClick={() => go('docs')}>
            เอกสารการลงทุน
          </button>
        </div>
      </nav>

      {view === 'calc' ? <Calculator productId="15-8" /> : <Documents />}
    </>
  );
}
