import { useMemo, useState } from 'react';
import { PRODUCTS, SCEN, calc, fmt, bankCompare, BANK_RATE, type ProductId } from '../engine';

const numVal = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

function fmtDecimal(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '');
  const i = v.indexOf('.');
  if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2);
  let [a, b] = v.split('.');
  a = (a || '').replace(/^0+(?=\d)/, '');
  const ip = a ? Number(a).toLocaleString('en-US') : (i >= 0 ? '0' : '');
  return i >= 0 ? ip + '.' + (b || '') : ip;
}
function fmtInt(raw: string): string {
  const v = raw.split('.')[0].replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
  return v ? Number(v).toLocaleString('en-US') : '';
}
// เบี้ยประกันภัยต่อปีสูงสุด 20 ล้านบาท
const MAX_PREM = 20_000_000;
const capPrem = (formatted: string): string =>
  numVal(formatted) > MAX_PREM ? MAX_PREM.toLocaleString('en-US') : formatted;
const label = (r: number) => { const p = +(r * 100).toFixed(2); return (p >= 0 ? '+' : '') + p + '%'; };

const PrinterIcon = () => (
  <svg className="bicon" viewBox="0 0 24 24" width="16" height="16" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </svg>
);

const WarnIcon = () => (
  <svg className="wicon" viewBox="0 0 24 24" width="16" height="16" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function Calculator({ productId }: { productId: ProductId }) {
  const prod = PRODUCTS[productId];
  const [src, setSrc] = useState<'prem' | 'sa'>('prem');
  const [prem, setPrem] = useState(prod.defPrem);
  const [sa, setSa] = useState('');
  const [age, setAge] = useState(35);
  const [rates, setRates] = useState<string[]>(SCEN.map((s) => String(s.r)));

  const { SA, P } = useMemo(() => {
    if (src === 'prem') { const p = numVal(prem); return { SA: Math.ceil(prod.saFromPrem(p, age)), P: p }; }
    const s = numVal(sa); return { SA: s, P: s * prod.premRate(s, age) / 1000 };
  }, [src, prem, sa, age, prod]);

  const R = useMemo(() => rates.map((rt) => calc(prod, SA, P, (parseFloat(rt) || 0) / 100, age)), [rates, SA, P, age, prod]);
  const labels = rates.map((rt) => label((parseFloat(rt) || 0) / 100));
  const minSA = prod.minSA ? prod.minSA(age) : 0;
  const belowMin = minSA > 0 && SA > 0 && SA < minSA;
  const minPrem = minSA ? minSA * prod.premRate(minSA, age) / 1000 : 0;
  const premFloor = prod.minPrem || 0;
  const belowMinPrem = premFloor > 0 && P > 0 && P < premFloor;
  const overMaxPrem = P > MAX_PREM;
  const N = SCEN.length, PY = prod.premYears, T = prod.term;

  const premValue = src === 'prem' ? prem : (P ? P.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '');
  const saValue = src === 'sa' ? sa : (SA ? SA.toLocaleString('en-US') : '');

  const banks = [BANK_RATE, 0.015].map((rt) => ({
    pct: +(rt * 100).toFixed(2) + '%',
    res: bankCompare(prod, P, rt),
  }));

  const gnt = R[0].payTot + R[0].mat;
  const mx = Math.max(...R.map((x) => x.total));
  const H = 150;
  const ev = (v: number) => (v <= 0 ? '—' : fmt(v));

  return (
    <div className="wrap">
      <div className="header">
        <div className="header-main">
          <span className="badge">เครื่องคำนวณผลประโยชน์</span>
          <h1 className="h1">Global Savings Plus 15/8 <span className="lk">(Index Linked)</span></h1>
          <div className="hsub">คุ้มครอง {T} ปี · จ่ายเบี้ย {PY} ปี · รหัส {prod.code} · กรุงไทย-แอกซา</div>
        </div>
        <img className="header-logo" src="/global-saving/logo.png" alt="Global Savings Plus 15/8" width={78} height={78} />
      </div>

      {/* INPUT */}
      <div className="panel noprint">
        <div className="prow">
          <div className="field">
            <label className="flabel" htmlFor="f-sa">จำนวนเงินเอาประกันภัย / ทุนประกัน (บาท)
              {src === 'prem' && <span className="autotag">คำนวณให้</span>}</label>
            <div className={src === 'prem' ? 'amtbox computed' : 'amtbox'}>
              <input id="f-sa" type="text" inputMode="numeric" value={saValue}
                onChange={(e) => { setSrc('sa'); setSa(fmtInt(e.target.value)); }} />
              <span className="unit">บาท</span>
            </div>
          </div>
          <div className="field">
            <label className="flabel" htmlFor="f-prem">เบี้ยประกันภัยต่อปี (บาท)
              {src === 'sa' && <span className="autotag">คำนวณให้</span>}</label>
            <div className={src === 'sa' ? 'amtbox computed' : 'amtbox'}>
              <input id="f-prem" type="text" inputMode="decimal" value={premValue}
                onChange={(e) => { setSrc('prem'); setPrem(capPrem(fmtDecimal(e.target.value))); }} />
              <span className="unit">บาท</span>
            </div>
          </div>
          <div className="field" style={{ flex: '0 0 150px' }}>
            <label className="flabel" htmlFor="f-age">อายุลูกค้า (ปี)</label>
            <select id="f-age" className="agesel" value={age} onChange={(e) => setAge(parseInt(e.target.value))}>
              {Array.from({ length: 76 }, (_, a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="hint">{prod.ageDep ? 'มีผลกับเบี้ย+มูลค่าเวนคืน' : 'ไม่กระทบเบี้ย/ผลประโยชน์'}</div>
          </div>
        </div>
        {belowMinPrem && (
          <div className="warn" role="alert"><WarnIcon />
            <span><b>เบี้ยประกันภัยขั้นต่ำ {fmt(premFloor)} บาท/ปี</b> · เบี้ยปัจจุบัน {fmt(P)} บาท ต่ำกว่าขั้นต่ำ — กรุณาเพิ่มเบี้ยเป็นอย่างน้อย {fmt(premFloor)} บาท/ปี</span>
          </div>
        )}

        {overMaxPrem && (
          <div className="warn" role="alert"><WarnIcon />
            <span><b>เบี้ยประกันภัยต่อปีสูงสุด {fmt(MAX_PREM)} บาท</b> · เบี้ยที่คำนวณได้ {fmt(P)} บาท เกินกำหนด — กรุณาลดจำนวนเงินเอาประกันภัย</span>
          </div>
        )}

        {belowMin && (
          <div className="warn" role="alert"><WarnIcon />
            <span><b>อายุ 71 ปีขึ้นไป ทุนประกันขั้นต่ำ 200,000 บาท</b> · ทุนปัจจุบัน {fmt(SA)} บาท ต่ำกว่าขั้นต่ำ — เพิ่มเบี้ยเป็นอย่างน้อย {fmt(minPrem)} บาท/ปี</span>
          </div>
        )}

        <div className="actions">
          <button className="btn print" onClick={() => window.print()}><PrinterIcon /> พิมพ์ / บันทึก PDF</button>
          <button className="btn reset" onClick={() => { setSrc('prem'); setPrem(prod.defPrem); setSa(''); setAge(35); setRates(SCEN.map((s) => String(s.r))); }}>ตั้งค่าเริ่มต้น</button>
        </div>
      </div>

      {/* KPI */}
      <div className="cards">
        <div className="kpi"><div className="kl">ทุนประกัน</div><div className="kv">{fmt(SA)}</div><div className="ks">บาท</div></div>
        <div className="kpi"><div className="kl">เบี้ย/ปี × {PY} ปี</div><div className="kv">{fmt(P)}</div><div className="ks">รวม {fmt(PY * P)} บาท</div></div>
        <div className="kpi hl"><div className="kl">เงินการันตีรวม</div><div className="kv">{fmt(R[0].payTot + R[0].mat)}</div><div className="ks">เงินคืน+ครบสัญญา</div></div>
        <div className="kpi"><div className="kl">ความคุ้มครองชีวิต</div><div className="kv">{fmt(R[0].rows[0].death)}</div><div className="ks">ขั้นต่ำปีแรก → สูงสุด {fmt((PY + 0.35) * SA)}</div></div>
      </div>

      {/* TABLE A */}
      <div className="sect"><span className="bar"></span><h2>ตารางที่ 1 · ภาพรวมผลประโยชน์</h2><span className="tagm">เมื่ออยู่ครบสัญญา {T} ปี</span></div>
      <div className="tblwrap"><div className="scroll"><table className="ta">
        <thead><tr><th>รายการผลประโยชน์</th>{SCEN.map((s, i) => <th key={i} style={{ color: s.t, background: s.bg }}>ดัชนี {labels[i]}/ปี</th>)}{banks.map((b, i) => <th key={i} className="bankcol">ฝากธนาคาร<br />{b.pct}/ปี</th>)}</tr></thead>
        <tbody>
          <tr><td>เงินคืนรายปี (สิ้นปี 1–{T - 1})<span className="gtag tg-g">การันตี</span></td>{R.map((x, i) => <td key={i} style={{ color: SCEN[i].t }}>{fmt(x.payTot)}</td>)}{banks.map((_, i) => <td key={i} className="bankcol">—</td>)}</tr>
          <tr><td>เงินครบสัญญา (สิ้นปี {T})<span className="gtag tg-g">การันตี</span></td>{R.map((x, i) => <td key={i} style={{ color: SCEN[i].t }}>{fmt(x.mat)}</td>)}{banks.map((b, i) => <td key={i} className="bankcol">{fmt(b.res.total)}</td>)}</tr>
          {prod.alive.map((m, bi) => (
            <tr key={bi}><td>โบนัสดัชนี · {m[0] === T ? 'ครบสัญญา' : 'ปี ' + m[0]}<span className="gtag tg-n">ไม่การันตี</span></td>
              {R.map((x, i) => <td key={i} style={{ color: SCEN[i].t }}>{fmt(x.bonuses[bi].val)}</td>)}{banks.map((_, i) => <td key={i} className="bankcol">—</td>)}</tr>
          ))}
          <tr className="rowtot"><td>รวมรับทั้งหมดตลอดสัญญา</td>{R.map((x, i) => <td key={i}>{fmt(x.total)}</td>)}{banks.map((b, i) => <td key={i} className="bankcol bankcoltot">{fmt(b.res.total)}</td>)}</tr>
          <tr className="rowirr"><td>ผลตอบแทนเฉลี่ยต่อปี (IRR)</td>{R.map((x, i) => <td key={i} style={{ color: SCEN[i].t }}>{x.irr.toFixed(2)}%</td>)}{banks.map((b, i) => <td key={i} className="bankcol">{b.pct}</td>)}</tr>
        </tbody>
      </table></div></div>

      {/* CHART */}
      <div className="sect"><span className="bar"></span><h2>เปรียบเทียบเงินรับรวม</h2></div>
      <div className="tblwrap">
        <div className="chartwrap">
          {R.map((x, i) => {
            const gH = gnt / mx * H, bH = (x.total - gnt) / mx * H;
            return (
              <div key={i} className="chcol">
                <div className="chbar">
                  {bH > 2 && <div className="seg" style={{ height: bH, background: SCEN[i].bar, borderRadius: '5px 5px 0 0' }}><div className="segtxt" style={{ color: SCEN[i].barTx }}>+{fmt(x.total - gnt)}</div></div>}
                  <div className="seg g" style={{ height: gH }}>{i === 0 && <div className="segtxt seg-on-navy">การันตี</div>}</div>
                </div>
                <div className="chtot">{fmt(x.total)}</div>
                <div className="chlbl">ดัชนี {labels[i]}/ปี</div>
              </div>
            );
          })}
        </div>
        <div className="leg"><span><span className="sw" style={{ background: '#0C1E30' }}></span>เงินการันตี (ฐานสีน้ำเงิน)</span><span>ส่วนบนของแต่ละแท่ง = โบนัสตามดัชนี (ไม่การันตี · สีตามสถานการณ์)</span></div>
      </div>

      {/* TABLE B */}
      <div className="sect pgbreak"><span className="bar"></span><h2>ตารางที่ 2 · ผลประโยชน์รายปี (ปีที่ 1–{T})</h2></div>
      <div className="tblwrap"><div className="scroll"><table className="tb">
        <thead>
          <tr>
            <th rowSpan={2} style={{ verticalAlign: 'middle' }}>สิ้น<br />ปีที่</th>
            <th rowSpan={2} className="agehdr" style={{ verticalAlign: 'middle' }}>อายุ</th>
            <th colSpan={4} className="ghg">ส่วนการันตี · รับรองการจ่าย</th>
            <th colSpan={N} className="ghn">มูลค่ารับหากเวนคืน/ครบสัญญา · รวมโบนัสดัชนี (ไม่การันตี)</th>
            <th rowSpan={2} className="ghtax" style={{ verticalAlign: 'middle' }}>ลดหย่อน<br />ภาษี</th>
          </tr>
          <tr className="subhead">
            <th>เบี้ย<br />ต่อปี</th><th>เบี้ย<br />สะสม</th><th>เงินจ่ายคืน<br />{+(prod.paybackPct * 100).toFixed(2)}%</th><th>คุ้มครอง<br />ชีวิต</th>
            {SCEN.map((s, i) => <th key={i} className={i === 0 ? 'dv' : ''} style={{ color: s.t, background: s.bg }}>ดัชนี<br />{labels[i]}/ปี</th>)}
          </tr>
        </thead>
        <tbody>
          {R[0].rows.map((a, i) => {
            const y = i + 1;
            const cls = y === PY ? 'rpaid' : '';
            return (
              <tr key={y} className={cls}>
                <td className="yr">{y}</td>
                <td className="age">{age ? age + y - 1 : '—'}</td>
                <td className="prem">{a.prem ? fmt(a.prem) : '—'}</td>
                <td className="prem">{fmt(a.cum)}</td>
                <td className="pay">{fmt(a.pay)}</td>
                <td className="dth">{fmt(a.death)}</td>
                {R.map((x, j) => <td key={j} className={j === 0 ? 'dv' : ''} style={{ color: SCEN[j].t }}>{ev(x.rows[i].exit)}</td>)}
                <td className="taxcol">{a.prem ? fmt(Math.min(a.prem, 100000)) : '—'}</td>
              </tr>
            );
          })}
          <tr className="rtot">
            <td className="yr" colSpan={2}>รวมทั้งสิ้น</td>
            <td>{fmt(PY * P)}</td><td>—</td><td className="pay">{fmt(R[0].payTot + R[0].mat)}</td><td>—</td>
            {SCEN.map((_, j) => <td key={j} className={j === 0 ? 'dv' : ''}>—</td>)}
            <td className="taxcol">{fmt(PY * Math.min(P, 100000))}</td>
          </tr>
        </tbody>
      </table></div></div>

      <div className="disc"><div className="dh">หมายเหตุสำคัญ</div>
        <ul>{prod.notes.map((n, i) => <li key={i} dangerouslySetInnerHTML={{ __html: n }} />)}</ul>
      </div>
      <div className="foot">“{prod.name} (อินเด็กซ์ ลิงค์)” เป็นชื่อทางการตลาดของแบบ {prod.name} แบบมีผลตอบแทนตามดัชนีอ้างอิง · เครื่องคำนวณนี้จัดทำเพื่อประกอบการนำเสนอ</div>
    </div>
  );
}
