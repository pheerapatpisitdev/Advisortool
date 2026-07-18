import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  calculateQuote,
  calculateSumAssuredFromPremium,
  defaultRiders,
  formatNumber,
  formatPercent,
  genderLabels,
  healthCoverageLabels,
  healthPlanLabels,
  healthRegionLabels,
  paymentModeLabels,
  rateData,
  type BenefitRow,
  type Gender,
  type HealthPlan,
  type PaymentMode,
  type Quote,
  type RiderInput,
} from "./calculator";

const modes: PaymentMode[] = ["monthly", "quarterly", "semiannual", "annual"];
const healthPlans: Exclude<HealthPlan, "">[] = ["SMART", "BRONZE", "SILVER", "GOLD", "DIAMOND", "PLATINUM"];
const quickAmounts = [500_000, 1_000_000, 2_000_000, 5_000_000];

function numericValue(value: string | number) {
  return Number(String(value).replace(/,/g, "")) || 0;
}

function moneyText(value: string) {
  const clean = value.replace(/[^0-9]/g, "");
  return clean ? Number(clean).toLocaleString("en-US") : "";
}

function premiumText(value: string) {
  const clean = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...decimals] = clean.split(".");
  const formatted = whole ? Number(whole).toLocaleString("en-US") : "";
  return decimals.length ? `${formatted}.${decimals.join("").slice(0, 2)}` : formatted;
}

function money(value: number, digits = 2) {
  return formatNumber(value, digits);
}

function signedMoney(value: number) {
  return value > 0 ? `+${money(value, 0)}` : money(value, 0);
}

function quickAmountLabel(amount: number) {
  return amount >= 1_000_000 ? `${amount / 1_000_000} ล้าน` : `${amount / 100_000} แสน`;
}

export function App() {
  const [screen, setScreen] = useState<"input" | "result">("input");
  const [customerName, setCustomerName] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<Gender>("M");
  const [mode, setMode] = useState<PaymentMode>("annual");
  const [sumText, setSumText] = useState("500,000");
  const [premiumInput, setPremiumInput] = useState("");
  const [basis, setBasis] = useState<"sum" | "premium">("sum");
  const [riders, setRiders] = useState<RiderInput>({ ...defaultRiders, payorAge: 40 });
  const [submittedQuote, setSubmittedQuote] = useState<Quote | null>(null);

  const sumAssured = numericValue(sumText);
  const liveQuote = useMemo(
    () => calculateQuote({ customerName, age, gender, mode, sumAssured, riders }),
    [customerName, age, gender, mode, sumAssured, riders],
  );

  useEffect(() => {
    if (basis !== "premium" || !numericValue(premiumInput)) return;
    const reversed = calculateSumAssuredFromPremium({ age, gender, mode, premium: numericValue(premiumInput) });
    setSumText(reversed.toLocaleString("en-US"));
  }, [age, gender, mode, basis, premiumInput]);

  const setRider = <K extends keyof RiderInput>(key: K, value: RiderInput[K]) => {
    setRiders((current) => ({ ...current, [key]: value }));
  };

  const changeSum = (value: string) => {
    setBasis("sum");
    setSumText(moneyText(value));
    setPremiumInput("");
  };

  const changePremium = (value: string) => {
    const next = premiumText(value);
    setBasis("premium");
    setPremiumInput(next);
    const amount = numericValue(next);
    if (amount > 0) {
      const reversed = calculateSumAssuredFromPremium({ age, gender, mode, premium: amount });
      setSumText(reversed.toLocaleString("en-US"));
    }
  };

  const submit = () => {
    if (liveQuote.validationErrors.length) {
      document.getElementById("validation")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmittedQuote(liveQuote);
    setScreen("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (screen === "result" && submittedQuote) {
    return <Results quote={submittedQuote} onBack={() => { setScreen("input"); window.scrollTo({ top: 0 }); }} />;
  }

  const shownPremium = basis === "premium" ? premiumInput : money(liveQuote.installmentPremium);
  const caseName = customerName.trim() ? `คุณ${customerName.trim()}` : "ผู้เอาประกันภัย";

  return (
    <main className="ep-app">
      <header className="product-head">
        <div>
          <span className="product-kicker">Life Insurance Proposal Program</span>
          <h1>Easy Protect 6</h1>
          <p>เครื่องมือคำนวณแบบประกันอีซี่ โพรเทค 6</p>
        </div>
        <div className="version"><b>A2026-1</b><span>ชำระเบี้ย 6 ปี · คุ้มครองถึงอายุ 99 ปี</span></div>
      </header>

      <div className="stepbar" aria-label="ขั้นตอนการใช้งาน">
        <span className="active"><b>1</b> คำนวณเบี้ย</span>
        <i />
        <span><b>2</b> ตารางผลลัพธ์</span>
      </div>

      <section className="calculator-shell">
        <p className="case-line">Easy Protect 6 / {genderLabels[gender]} / {age} ปี / {caseName}</p>

        <section className="form-section payment-section">
          <h2>งวดการชำระเบี้ยประกันภัย</h2>
          <div className="mode-grid" role="radiogroup" aria-label="งวดการชำระเบี้ย">
            {modes.map((item) => (
              <button
                type="button"
                role="radio"
                aria-checked={mode === item}
                className={mode === item ? "active" : ""}
                onClick={() => setMode(item)}
                key={item}
              >
                {paymentModeLabels[item]}
              </button>
            ))}
          </div>
        </section>

        <section className="form-section base-section">
          <h2>สัญญาหลัก</h2>
          <div className="premium-pair">
            <label>
              <span>จำนวนเงินเอาประกันภัย</span>
              <span className="input-unit"><input inputMode="numeric" value={sumText} onChange={(event) => changeSum(event.target.value)} aria-label="จำนวนเงินเอาประกันภัย" /><small>บาท</small></span>
            </label>
            <span className="pair-arrow" aria-hidden="true">→</span>
            <label>
              <span>เบี้ยสัญญาหลัก</span>
              <span className="input-unit"><input inputMode="decimal" value={shownPremium} onChange={(event) => changePremium(event.target.value)} aria-label="เบี้ยสัญญาหลัก" /><small>บาท</small></span>
            </label>
          </div>
          <div className="quick-row" aria-label="จำนวนเงินเอาประกันภัยแนะนำ">
            {quickAmounts.map((amount) => <button type="button" className={sumAssured === amount ? "active" : ""} onClick={() => changeSum(String(amount))} key={amount}>{quickAmountLabel(amount)}</button>)}
          </div>
          <div className="total-premium">
            <span>เบี้ยรวมสัญญาหลัก + สัญญาเพิ่มเติม</span>
            <strong>{money(liveQuote.totalInstallmentPremium)} <small>บาท / {paymentModeLabels[mode]}</small></strong>
          </div>
        </section>

        <details className="insured-details" open>
          <summary>ข้อมูลผู้เอาประกันภัย</summary>
          <div className="insured-grid">
            <label className="full"><span>ชื่อผู้เอาประกันภัย <small>ไม่บังคับ</small></span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="เช่น คุณสมชาย ใจดี" /></label>
            <label><span>อายุผู้เอาประกันภัย</span><span className="input-unit"><input type="number" min="0" max="80" value={age} onChange={(event) => setAge(Math.min(80, Math.max(0, Number(event.target.value))))} /><small>ปี</small></span></label>
            <fieldset>
              <legend>เพศ</legend>
              <div className="two-segment">
                {(["M", "F"] as Gender[]).map((item) => <button type="button" className={gender === item ? "active" : ""} onClick={() => setGender(item)} key={item}>{genderLabels[item]}</button>)}
              </div>
            </fieldset>
          </div>
        </details>

        <section className="rider-section">
          <div className="section-title"><h2>สัญญาเพิ่มเติม</h2><span>เลือกเฉพาะความคุ้มครองที่ต้องการ</span></div>
          <div className="rider-table" role="table" aria-label="สัญญาเพิ่มเติม">
            <div className="rider-head" role="row"><span>เลือก</span><span>สัญญาเพิ่มเติม</span><span>จำนวนเงิน / แผน</span></div>

            <RiderRow checked={riders.pb} onToggle={(checked) => setRider("pb", checked)} title="PB Fit" description="ยกเว้นเบี้ยกรณีผู้ชำระเบี้ยเสียชีวิตหรือทุพพลภาพ" eligibility="อายุผู้ชำระเบี้ย 20–70 ปี">
              <div className="triple-control">
                <select aria-label="จำนวนเท่าความคุ้มครอง PB Fit" value={riders.pbMultiplier} onChange={(event) => setRider("pbMultiplier", Number(event.target.value))}><option value="1">1 เท่า</option><option value="1.5">1.5 เท่า</option><option value="2">2 เท่า</option></select>
                <input aria-label="อายุผู้ชำระเบี้ย" type="number" min="20" max="70" value={riders.payorAge} onChange={(event) => setRider("payorAge", Number(event.target.value))} />
                <select aria-label="เพศผู้ชำระเบี้ย" value={riders.payorGender} onChange={(event) => setRider("payorGender", event.target.value as Gender)}><option value="M">ชาย</option><option value="F">หญิง</option></select>
              </div>
            </RiderRow>

            <RiderRow checked={riders.wp} onToggle={(checked) => setRider("wp", checked)} title="WP Fit" description="ยกเว้นเบี้ยเมื่อผู้เอาประกันภัยทุพพลภาพตามเงื่อนไข" eligibility="ผู้เอาประกันภัยอายุ 16–70 ปี">
              <select value={riders.wpMultiplier} onChange={(event) => setRider("wpMultiplier", Number(event.target.value))}><option value="1">1 เท่า</option><option value="1.5">1.5 เท่า</option><option value="2">2 เท่า</option></select>
            </RiderRow>

            <RiderRow checked={riders.meb > 0} onToggle={(checked) => setRider("meb", checked ? 1000 : 0)} title="MEB" description="ค่ารักษาพยาบาลจากอุบัติเหตุ" eligibility="อายุ 6–65 ปี">
              <div className="double-control"><select value={riders.meb || ""} onChange={(event) => setRider("meb", Number(event.target.value))}><option value="">เลือกผลประโยชน์</option>{[500, 1000, 2000, 3000, 4000, 5000].map((value) => <option value={value} key={value}>{formatNumber(value)} บาท</option>)}</select><OccupationSelect value={riders.mebClass} onChange={(value) => setRider("mebClass", value)} /></div>
            </RiderRow>

            <RiderRow checked={riders.dci > 0} onToggle={(checked) => setRider("dci", checked ? 500_000 : 0)} title="DCI" description="ความคุ้มครองโรคร้ายแรง" eligibility="อายุ 20–65 ปี · ทุนเริ่ม 200,000 บาท">
              <AmountInput value={riders.dci} onChange={(value) => setRider("dci", value)} />
            </RiderRow>

            <RiderRow checked={riders.pls10 > 0} onToggle={(checked) => setRider("pls10", checked ? 500_000 : 0)} title="PLS10" description="ความคุ้มครองชีวิตเพิ่มเติม" eligibility="อายุ 20–59 ปี · ทุนเริ่ม 300,000 บาท">
              <AmountInput value={riders.pls10} onChange={(value) => setRider("pls10", value)} />
            </RiderRow>

            <RiderRow checked={Boolean(riders.ihealthyPlan)} onToggle={(checked) => setRider("ihealthyPlan", checked ? "SMART" : "")} title="iHealthy Ultra" description="ประกันสุขภาพเหมาจ่าย" eligibility="อายุ 6–80 ปี">
              <div className="health-controls">
                <select value={riders.ihealthyPlan} onChange={(event) => setRider("ihealthyPlan", event.target.value as HealthPlan)}><option value="">เลือกแผน</option>{healthPlans.map((plan) => <option value={plan} key={plan}>{healthPlanLabels[plan]}</option>)}</select>
                <select value={riders.ihealthyCoverage} onChange={(event) => setRider("ihealthyCoverage", event.target.value as RiderInput["ihealthyCoverage"])}>{Object.entries(healthCoverageLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select>
                <select value={riders.ihealthyRegion} onChange={(event) => setRider("ihealthyRegion", event.target.value as RiderInput["ihealthyRegion"])}>{Object.entries(healthRegionLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select>
                <OccupationSelect value={riders.ihealthyClass} onChange={(value) => setRider("ihealthyClass", value)} />
              </div>
            </RiderRow>

            <RiderRow checked={riders.ci123 > 0} onToggle={(checked) => setRider("ci123", checked ? 500_000 : 0)} title="CI 123" description="ความคุ้มครองโรคร้ายแรงหลายระยะ" eligibility="อายุไม่เกิน 75 ปี · ทุนเริ่ม 100,000 บาท">
              <AmountInput value={riders.ci123} onChange={(value) => setRider("ci123", value)} />
            </RiderRow>
          </div>
        </section>

        {liveQuote.validationErrors.length > 0 && <div id="validation" className="validation" role="alert"><strong>กรุณาตรวจสอบข้อมูล</strong><ul>{liveQuote.validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

        <div className="action-bar">
          <div><span>เบี้ยรวมต่องวด</span><strong>{money(liveQuote.totalInstallmentPremium)}</strong><small>บาท / {paymentModeLabels[mode]}</small></div>
          <button type="button" onClick={submit}>คำนวณและดูผลประโยชน์</button>
        </div>
      </section>
    </main>
  );
}

function RiderRow({ checked, onToggle, title, description, eligibility, children }: { checked: boolean; onToggle: (checked: boolean) => void; title: string; description: string; eligibility: string; children: React.ReactNode }) {
  return (
    <div className={`rider-row${checked ? " selected" : ""}`} role="row">
      <label className="check-cell"><input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} aria-label={`เลือก ${title}`} /></label>
      <div className="rider-copy"><strong>{title}</strong><span>{description}</span><small>{eligibility}</small></div>
      <div className="rider-control">{children}</div>
    </div>
  );
}

function AmountInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <span className="input-unit"><input inputMode="numeric" value={value ? value.toLocaleString("en-US") : ""} placeholder="จำนวนเงิน" onChange={(event) => onChange(numericValue(event.target.value))} /><small>บาท</small></span>;
}

function OccupationSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <select aria-label="ชั้นอาชีพ" value={value} onChange={(event) => onChange(Number(event.target.value))}>{[1, 2, 3, 4].map((item) => <option value={item} key={item}>อาชีพชั้น {item}</option>)}</select>;
}

const chartSeries = [
  { key: "accumulatedPremium", label: "เบี้ยสะสม", color: "#f59e0b" },
  { key: "cashSurrenderValue", label: "มูลค่าเวนคืนเงินสด", color: "#2563eb" },
  { key: "deathBenefit", label: "ความคุ้มครองเสียชีวิต", color: "#111827" },
] as const;

function niceChartMaximum(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const normalized = value / power;
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * power;
}

function compactChartNumber(value: number) {
  if (Math.abs(value) >= 1000) return `${formatNumber(value / 1000, Number.isInteger(value / 1000) ? 0 : 1)}k`;
  return formatNumber(value, 0);
}

function chartGeometry(width: number, height: number) {
  const margin = { top: 56, right: 18, bottom: 67, left: width < 560 ? 52 : 68 };
  return {
    margin,
    right: width - margin.right,
    bottom: height - margin.bottom,
    plotWidth: width - margin.left - margin.right,
    plotHeight: height - margin.top - margin.bottom,
  };
}

export function BenefitCanvasChart({ rows }: { rows: BenefitRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => Math.floor(rows.length / 2));
  const selectedRow = rows[selectedIndex] ?? rows[0];
  const breakEvenIndex = rows.findIndex((row) => row.cashSurrenderValue >= row.accumulatedPremium && row.accumulatedPremium > 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rows.length === 0) return;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(320, bounds.width);
      const height = Math.max(300, bounds.height);
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const geometry = chartGeometry(width, height);
      const maximum = niceChartMaximum(Math.max(...rows.flatMap((row) => [row.accumulatedPremium, row.cashSurrenderValue, row.deathBenefit])));
      const x = (index: number) => geometry.margin.left + (rows.length === 1 ? geometry.plotWidth / 2 : (index / (rows.length - 1)) * geometry.plotWidth);
      const y = (value: number) => geometry.margin.top + geometry.plotHeight - (value / maximum) * geometry.plotHeight;
      const tickCount = 6;

      context.textBaseline = "middle";
      context.font = '12px "IBM Plex Sans Thai", sans-serif';
      for (let index = 0; index <= tickCount; index += 1) {
        const value = maximum - (maximum / tickCount) * index;
        const yPosition = y(value);
        context.beginPath();
        context.strokeStyle = value === 0 ? "#aeb7c2" : "#edf0f4";
        context.lineWidth = value === 0 ? 1.3 : 1;
        context.moveTo(geometry.margin.left, yPosition);
        context.lineTo(geometry.right, yPosition);
        context.stroke();
        context.fillStyle = "#7d8794";
        context.textAlign = "right";
        context.fillText(compactChartNumber(value), geometry.margin.left - 10, yPosition);
      }

      const tickTotal = Math.min(8, rows.length);
      const xTickIndexes = Array.from(new Set(Array.from({ length: tickTotal }, (_, index) => Math.round((index * (rows.length - 1)) / Math.max(1, tickTotal - 1)))));
      xTickIndexes.forEach((rowIndex) => {
        const xPosition = x(rowIndex);
        context.beginPath();
        context.strokeStyle = "#f0f2f5";
        context.lineWidth = 1;
        context.moveTo(xPosition, geometry.margin.top);
        context.lineTo(xPosition, geometry.bottom);
        context.stroke();
        context.textAlign = "center";
        context.fillStyle = "#7d8794";
        context.font = '12px "IBM Plex Sans Thai", sans-serif';
        context.fillText(String(rows[rowIndex].policyYear), xPosition, geometry.bottom + 22);
        context.fillStyle = "#a1a9b4";
        context.font = '11px "IBM Plex Sans Thai", sans-serif';
        context.fillText(`${rows[rowIndex].age}ปี`, xPosition, geometry.bottom + 41);
      });

      if (breakEvenIndex >= 0) {
        const breakEvenX = x(breakEvenIndex);
        context.save();
        context.setLineDash([6, 5]);
        context.strokeStyle = "#159454";
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(breakEvenX, geometry.margin.top);
        context.lineTo(breakEvenX, geometry.bottom);
        context.stroke();
        context.restore();
        context.fillStyle = "#16803c";
        context.font = '700 13px "IBM Plex Sans Thai", sans-serif';
        context.textAlign = "center";
        context.fillText(`จุดคุ้มทุน · อายุ ${rows[breakEvenIndex].age}`, Math.max(105, Math.min(width - 105, breakEvenX)), geometry.margin.top - 18);
      }

      chartSeries.forEach((series) => {
        context.beginPath();
        rows.forEach((row, index) => {
          const xPosition = x(index);
          const yPosition = y(row[series.key]);
          if (index === 0) context.moveTo(xPosition, yPosition);
          else context.lineTo(xPosition, yPosition);
        });
        context.strokeStyle = series.color;
        context.lineWidth = 3;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.stroke();
      });

      const activeIndex = Math.max(0, Math.min(rows.length - 1, selectedIndex));
      const activeRow = rows[activeIndex];
      const activeX = x(activeIndex);
      context.save();
      context.setLineDash([6, 5]);
      context.strokeStyle = "#9cafc1";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(activeX, geometry.margin.top);
      context.lineTo(activeX, geometry.bottom);
      context.stroke();
      context.restore();
      chartSeries.forEach((series) => {
        context.beginPath();
        context.fillStyle = series.color;
        context.strokeStyle = "#fff";
        context.lineWidth = 2;
        context.arc(activeX, y(activeRow[series.key]), 5.5, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      });

      context.fillStyle = "#646d78";
      context.font = '700 13px "IBM Plex Sans Thai", sans-serif';
      context.textAlign = "center";
      context.fillText("สิ้นปีกรมธรรม์ที่ (อายุ)", geometry.margin.left + geometry.plotWidth / 2, height - 10);
    };

    draw();
    window.addEventListener("resize", draw);
    window.addEventListener("beforeprint", draw);
    window.addEventListener("afterprint", draw);
    if (document.fonts?.ready) document.fonts.ready.then(draw).catch(() => undefined);
    return () => {
      window.removeEventListener("resize", draw);
      window.removeEventListener("beforeprint", draw);
      window.removeEventListener("afterprint", draw);
    };
  }, [rows, selectedIndex, breakEvenIndex]);

  if (rows.length === 0 || !selectedRow) return null;

  const selectPoint = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const geometry = chartGeometry(bounds.width, bounds.height);
    const relativeX = Math.max(geometry.margin.left, Math.min(geometry.right, clientX - bounds.left));
    const index = Math.round(((relativeX - geometry.margin.left) / geometry.plotWidth) * (rows.length - 1));
    setSelectedIndex(Math.max(0, Math.min(rows.length - 1, index)));
  };

  const selectedPercent = rows.length === 1 ? 50 : 7 + (selectedIndex / (rows.length - 1)) * 88;
  const tooltipShift = selectedPercent > 70 ? "translateX(-100%)" : "translateX(0)";

  return (
    <section className="benefit-chart-section" aria-labelledby="benefit-chart-title">
      <h2 id="benefit-chart-title">กราฟเปรียบเทียบเบี้ยสะสม มูลค่าเวนคืน และความคุ้มครอง</h2>
      <div className="benefit-chart-card">
        <div className="benefit-chart-legend" aria-label="คำอธิบายกราฟ">
          {chartSeries.map((series) => <span className="chart-legend-item" key={series.key}><i style={{ backgroundColor: series.color }} />{series.label} <strong>{money(selectedRow[series.key], 0)}</strong></span>)}
        </div>
        <p className="benefit-chart-hint">เลื่อนเมาส์หรือนิ้วบนกราฟเพื่อดูตัวเลขแต่ละปี</p>
        <div className="benefit-chart-plot">
          <canvas
            ref={canvasRef}
            className="benefit-chart-canvas"
            role="img"
            tabIndex={0}
            aria-label="กราฟแสดงเบี้ยสะสม มูลค่าเวนคืน และความคุ้มครองเสียชีวิตตามปีกรมธรรม์"
            onMouseMove={(event) => selectPoint(event.clientX)}
            onTouchStart={(event) => selectPoint(event.touches[0]?.clientX ?? 0)}
            onTouchMove={(event) => { event.preventDefault(); selectPoint(event.touches[0]?.clientX ?? 0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") setSelectedIndex((index) => Math.max(0, index - 1));
              if (event.key === "ArrowRight") setSelectedIndex((index) => Math.min(rows.length - 1, index + 1));
            }}
          />
          <div className="chart-tooltip" style={{ left: `${selectedPercent}%`, transform: tooltipShift }} aria-live="polite">
            <strong>อายุ {selectedRow.age} ปี · สิ้นปีที่ {selectedRow.policyYear}</strong>
            {chartSeries.map((series) => <span key={series.key}><i style={{ backgroundColor: series.color }} />{series.label}<b style={{ color: series.color }}>{money(selectedRow[series.key], 0)}</b></span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Results({ quote, onBack }: { quote: Quote; onBack: () => void }) {
  const { input } = quote;
  const customer = input.customerName || "ไม่ระบุชื่อ";
  const irrCopy = quote.irr === null ? "ไม่สามารถคำนวณ IRR ได้" : `อัตราผลตอบแทนเฉลี่ยต่อปี (IRR) ของผลประโยชน์ตามกรมธรรม์หลัก กรณีผู้เอาประกันภัยมีชีวิตอยู่ ณ วันครบกำหนดสัญญา ${formatPercent(quote.irr)}`;
  const breakEvenPolicyYear = quote.rows.find((row) => row.cashSurrenderValue >= row.accumulatedPremium && row.accumulatedPremium > 0)?.policyYear;

  return (
    <main className="result-page">
      <div className="result-actions no-print"><button type="button" onClick={onBack}>กลับไปแก้ไขข้อมูล</button><button type="button" onClick={() => window.azPrint ? window.azPrint() : window.print()}>พิมพ์ / บันทึก PDF</button></div>
      <header className="result-product-head"><div><b>Easy Protect 6</b><span>เครื่องมือคำนวณแบบประกัน</span></div><span className="result-version">A2026-1</span></header>
      <p className="result-case">Easy Protect 6 / {genderLabels[input.gender]} / {input.age} ปี / {customer} / ชำระเบี้ย 6 ปี</p>

      <section className="result-summary">
        <h1>สรุปผลการคำนวณแบบประกัน อีซี่ โพรเทค 6</h1>
        <p>{paymentModeLabels[input.mode]} · คุ้มครองถึงอายุ 99 ปี</p>
        <div className="summary-grid">
          <article className="primary"><span>เบี้ยประกันภัยรวมต่องวด</span><strong>{money(quote.totalInstallmentPremium)}</strong><small>บาท / {paymentModeLabels[input.mode]}</small></article>
          <article><span>จำนวนเงินเอาประกันภัย</span><strong>{money(input.sumAssured, 0)}</strong><small>บาท</small></article>
          <article><span>เบี้ยสัญญาหลักต่อปี</span><strong>{money(quote.annualizedPremium)}</strong><small>บาท</small></article>
          <article><span>เงินครบกำหนดสัญญา</span><strong>{money(quote.maturityBenefit, 0)}</strong><small>บาท</small></article>
        </div>
      </section>

      <section className="result-section">
        <h2>สรุปเบี้ยประกันภัย</h2>
        <div className="document-table-wrap">
          <table className="premium-table">
            <thead><tr><th>รายการ</th><th>ความคุ้มครอง / แผน</th><th>เบี้ยต่องวด</th><th>เบี้ยรวมต่อปี</th></tr></thead>
            <tbody>
              <tr><td><b>สัญญาหลัก Easy Protect 6</b></td><td>{money(input.sumAssured, 0)} บาท</td><td>{money(quote.installmentPremium, 0)}</td><td>{money(quote.annualizedPremium, 0)}</td></tr>
              {quote.selectedRiders.map((rider) => <tr key={rider.code}><td>{rider.label}</td><td>{rider.coverage}</td><td>{money(rider.installmentPremium, 0)}</td><td>{money(rider.annualizedPremium, 0)}</td></tr>)}
              {quote.selectedRiders.length === 0 && <tr className="empty-row"><td colSpan={4}>ไม่ได้เลือกสัญญาเพิ่มเติม</td></tr>}
            </tbody>
            <tfoot><tr><th colSpan={2}>เบี้ยประกันภัยรวม</th><th>{money(quote.totalInstallmentPremium, 0)}</th><th>{money(quote.totalAnnualizedPremium, 0)}</th></tr></tfoot>
          </table>
        </div>
      </section>

      <BenefitCanvasChart rows={quote.rows} />

      <section className="benefit-document">
        <div className="benefit-title">
          <h2>ตัวอย่าง ตารางแสดงผลประโยชน์ที่ได้รับจากแบบประกัน อีซี่ โพรเทค 6</h2>
          <p>{irrCopy}</p>
        </div>
        <div className="benefit-meta"><span>ผู้เอาประกันภัย: <b>{customer}</b></span><span>เพศ: <b>{genderLabels[input.gender]}</b></span><span>อายุ: <b>{input.age} ปี</b></span><span>ทุนประกัน: <b>{money(input.sumAssured, 0)} บาท</b></span></div>
        <div className="document-table-wrap benefit-scroll">
          <table className="benefit-table">
            <colgroup><col /><col /><col /><col /><col /><col /><col /></colgroup>
            <thead>
              <tr><th rowSpan={2}>อายุ</th><th rowSpan={2}>ปี<br />กรมธรรม์ที่</th><th colSpan={2}>เบี้ยประกันภัยสัญญาหลัก</th><th rowSpan={2}>ความคุ้มครองกรณีเสียชีวิต<br /><small>(ณ สิ้นปีกรมธรรม์)</small></th><th rowSpan={2}>เงินค่าเวนคืนกรมธรรม์ประกันภัย<br /><small>(ณ สิ้นปีกรมธรรม์)</small></th><th rowSpan={2}>กำไร<br /><small>(เงินค่าเวนคืนกรมธรรม์ − เบี้ยประกันภัยสะสม)</small></th></tr>
              <tr><th>ต่อปี</th><th>สะสม</th></tr>
            </thead>
            <tbody>
              {quote.rows.map((row) => {
                const policyGain = row.cashSurrenderValue - row.accumulatedPremium;
                const isBreakEven = row.policyYear === breakEvenPolicyYear;
                return <tr className={`${row.isMaturity ? "maturity " : ""}${isBreakEven ? "break-even" : ""}`} key={row.policyYear}><td>{row.age}</td><td>{row.policyYear}</td><td>{row.annualPremium ? money(row.annualPremium, 0) : "–"}</td><td>{money(row.accumulatedPremium, 0)}</td><td>{money(row.deathBenefit, 0)}</td><td>{row.cashSurrenderValue ? money(row.cashSurrenderValue, 0) : "–"}</td><td className={isBreakEven ? "break-even-cell" : policyGain > 0 ? "positive" : policyGain < 0 ? "negative" : "neutral"}>{isBreakEven ? <span className="break-even-badge">จุดคุ้มทุน</span> : signedMoney(policyGain)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="disclaimer">เอกสารนี้เป็นเพียงตัวอย่างเพื่อประกอบการเสนอขาย ผลประโยชน์ ความคุ้มครอง เงื่อนไข และข้อยกเว้นเป็นไปตามที่กำหนดในกรมธรรม์ ผู้ซื้อควรทำความเข้าใจรายละเอียดก่อนตัดสินใจทำประกันภัยทุกครั้ง</footer>
    </main>
  );
}

declare global {
  interface Window {
    EasyProtect6?: { calculateQuote: typeof calculateQuote; calculateSumAssuredFromPremium: typeof calculateSumAssuredFromPremium };
    azPrint?: () => void;
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.EasyProtect6 = { calculateQuote, calculateSumAssuredFromPremium };
  createRoot(document.getElementById("app")!).render(<App />);
}
