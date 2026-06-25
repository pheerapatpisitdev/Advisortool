"use client";
import { useRef, useState } from "react";
import "./fhc.css";

// Supabase REST endpoint + anon (publishable) key — same as the original static page.
const SUPA_URL = "https://pmrhwdheisqsfsntiufp.supabase.co/rest/v1/responses";
const SUPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcmh3ZGhlaXNxc2ZzbnRpdWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTQ2NDYsImV4cCI6MjA5MjM5MDY0Nn0.-k-tyUpznR_QISERuMmEaW5NB1UI7evMpxPsXObOgI0";

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const num = (s: string) => parseFloat((s || "").replace(/,/g, "")) || 0;
const formatInput = (s: string) => {
  const raw = s.replace(/,/g, "").replace(/[^0-9]/g, "");
  return raw ? Number(raw).toLocaleString("th-TH") : "";
};
const fmt = (v: number) => (!v && v !== 0 ? "—" : Math.round(v).toLocaleString("th-TH"));
const fmtM = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(0) + "K";
  return Math.round(v).toLocaleString("th-TH");
};
const todayStr = () => {
  const d = new Date();
  const p = (n: number) => (n < 10 ? "0" : "") + n;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const WA_LABELS: Record<string, string> = {
  full: "ทำงานได้เต็มที่",
  partial: "ทำงานได้บางส่วน",
  none: "ทำงานไม่ได้",
};
const EVENTS = ["การเจ็บป่วย", "อุบัติเหตุ", "ทุพพลภาพถาวร", "การจากไปโดยไม่ทันตั้งตัว", "การตกงาน"];

function Money({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="fg">
      <label>{label}</label>
      <input type="text" inputMode="numeric" placeholder={placeholder} value={value} onChange={(e) => onChange(formatInput(e.target.value))} />
    </div>
  );
}

export default function FhcQuestionnaire() {
  const [ac, setAc] = useState("");
  const [ar, setAr] = useState("");
  const [ae, setAe] = useState("");
  const [wa, setWa] = useState("");
  const [exp, setExp] = useState("");
  const [im, setIm] = useState("");
  const [s1, setS1] = useState(""); const [s2, setS2] = useState(""); const [s3, setS3] = useState("");
  const [d1, setD1] = useState(""); const [d2, setD2] = useState(""); const [d3, setD3] = useState("");
  const [f1, setF1] = useState(""); const [f2, setF2] = useState("");
  const [persons, setPersons] = useState(["", "", "", ""]);
  const [assetRevealed, setAssetRevealed] = useState(false);
  const [evRevealed, setEvRevealed] = useState([false, false, false, false, false]);
  const [interviewer, setInterviewer] = useState("");
  const [idate, setIdate] = useState(todayStr());
  const [result, setResult] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // --- live calculations ---
  const cur = num(ac), ret = num(ar), expAge = num(ae);
  const wy = ret > cur ? ret - cur : 0;
  const my = expAge > ret ? expAge - ret : 0;
  const imN = num(im), exN = num(exp);
  const iy = imN * 12;
  const ti = iy * wy;
  const sav = num(s1) + num(s2) + num(s3);
  const dbt = num(d1) + num(d2) + num(d3);
  const inv = num(f1) + num(f2);
  const net = sav + inv - dbt;

  function buildSummary() {
    const waVal = WA_LABELS[wa] || "";
    const lines: string[] = [];
    lines.push("📋 สรุปข้อมูลคุณภาพชีวิต");
    if (interviewer) lines.push("👤 " + interviewer + (idate ? "  |  " + idate : ""));
    lines.push("");
    lines.push("━━ ข้อมูลอายุ ━━");
    lines.push("• อายุปัจจุบัน: " + (ac || "—") + " ปี");
    lines.push("• อายุเกษียณ: " + (ar || "—") + " ปี  |  ปีที่ทำงาน: " + (wy || "—") + " ปี");
    lines.push("• อายุเฉลี่ย: " + (ae || "—") + " ปี  |  ปีที่ต้องใช้เงิน: " + (my || "—") + " ปี");
    lines.push("• ความสามารถทำงาน: " + (waVal || "—"));
    lines.push("");
    lines.push("━━ รายได้ & ค่าใช้จ่าย ━━");
    lines.push("• รายได้/เดือน: " + fmt(imN) + " บาท");
    lines.push("• ค่าใช้จ่าย/เดือน: " + fmt(exN) + " บาท");
    lines.push("• เงินเหลือสุทธิ/เดือน: " + fmt(imN - exN) + " บาท");
    lines.push("• รายได้รวมตลอดชีวิต: " + fmt(ti) + " บาท");
    lines.push("");
    lines.push("━━ การเงิน ━━");
    lines.push("• เงินเก็บรวม: " + fmt(sav) + " บาท");
    lines.push("• หนี้สินรวม: " + fmt(dbt) + " บาท");
    lines.push("• การลงทุน: " + fmt(inv) + " บาท");
    lines.push("• สินทรัพย์สุทธิ: " + fmt(net) + " บาท");
    lines.push("");
    lines.push("━━ ทรัพย์สิน ━━");
    lines.push("• ที่มองเห็น: บ้าน, รถ, ที่ดิน");
    lines.push("• ค่าความสามารถ: " + fmt(ti) + " บาท");
    const ps = persons.map((p) => p.trim()).filter(Boolean);
    if (ps.length) {
      lines.push("");
      lines.push("━━ บุคคลในการดูแล ━━");
      ps.forEach((p, i) => lines.push(i + 1 + ". " + p));
    }
    lines.push("");
    lines.push("━━ 5 เหตุการณ์ควบคุมไม่ได้ ━━");
    EVENTS.forEach((e, i) => lines.push(i + 1 + ". " + e));
    return lines.join("\n");
  }

  function saveToSupabase(text: string) {
    const ps = persons.map((p) => p.trim()).filter(Boolean);
    const payload = {
      interviewer: interviewer || null,
      interview_date: idate || null,
      cur_age: ac ? parseInt(ac) : null,
      ret_age: ar ? parseInt(ar) : null,
      exp_age: ae ? parseInt(ae) : null,
      work_ability: WA_LABELS[wa] || null,
      work_years: wy || null,
      money_years: my || null,
      income: imN || null,
      expense: exN || null,
      total_income: ti || null,
      savings: sav || null,
      debt: dbt || null,
      investment: inv || null,
      net_asset: net || null,
      dependents: ps.length ? ps.join(", ") : null,
    };
    fetch(SUPA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) setResult((p) => p + "\n\n✅ บันทึกข้อมูลลง Supabase เรียบร้อยแล้ว");
        else res.text().then((t) => setResult((p) => p + "\n\n⚠️ บันทึกไม่สำเร็จ: " + t));
      })
      .catch((err) => setResult((p) => p + "\n\n⚠️ เชื่อมต่อ Supabase ไม่ได้: " + err.message));
  }

  function doAnalyze() {
    const text = buildSummary();
    setResult(text);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    saveToSupabase(text);
  }

  function shareToLine() {
    const text = result.trim() || buildSummary();
    window.open("https://line.me/R/msg/text/?" + encodeURIComponent(text), "_blank");
  }

  const setPerson = (i: number, v: string) => setPersons((arr) => arr.map((p, j) => (j === i ? v : p)));
  const revealEv = (i: number) => setEvRevealed((arr) => arr.map((b, j) => (j === i ? true : b)));

  return (
    <div className="fhc-scope">
      <div className="wrap">
        <div className="page-title"><span>แบบสอบถามคุณภาพชีวิต (ที่ดี)</span></div>

        <div className="row2">
          {/* LEFT */}
          <div>
            {/* Age */}
            <div className="card">
              <span className="badge bg-yellow">ข้อมูลอายุ</span>
              <div className="age-grid">
                <div className="av-lbl" style={{ marginBottom: 6 }}>อายุปัจจุบัน</div>
                <div />
                <div className="av-lbl" style={{ marginBottom: 6 }}>อายุเกษียณ</div>
                <div />
                <div className="av-lbl" style={{ marginBottom: 6 }}>อายุเฉลี่ย</div>

                <div className="age-center"><div className="circ lg"><span>{cur || "?"}</span></div></div>
                <div className="age-connector"><div className="hline" style={{ width: "100%" }} /></div>
                <div className="age-center"><div className="circ lg filled"><span>{ret || "?"}</span></div></div>
                <div className="age-connector"><div className="hline" style={{ width: "100%" }} /></div>
                <div className="age-center"><div className="circ lg"><span>{expAge || "?"}</span></div></div>

                <div /><div />
                <div className="age-center"><div className="vline" /></div>
                <div />
                <div className="age-center"><div className="vline" /></div>

                <div /><div />
                <div className="age-center"><div className="circ md"><span>{wy || "?"}</span></div></div>
                <div />
                <div className="age-center"><div className="circ md"><span>{my || "?"}</span></div></div>

                <div /><div />
                <div className="av-lbl" style={{ marginTop: 6 }}>จำนวนปีที่ทำงาน</div>
                <div />
                <div className="av-lbl" style={{ marginTop: 6 }}>อายุที่ต้องใช้เงิน</div>
              </div>
              <div className="row2">
                <div className="fg"><label>อายุปัจจุบัน (ปี)</label>
                  <select value={ac} onChange={(e) => setAc(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {range(20, 55).map((i) => <option key={i} value={i}>{i} ปี</option>)}
                  </select>
                </div>
                <div className="fg"><label>อายุเกษียณ (ปี)</label>
                  <select value={ar} onChange={(e) => setAr(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {[45, 50, 55, 60, 65].map((i) => <option key={i} value={i}>{i} ปี</option>)}
                  </select>
                </div>
                <div className="fg"><label>อายุเฉลี่ย (ปี)</label>
                  <select value={ae} onChange={(e) => setAe(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {range(80, 100).map((i) => <option key={i} value={i}>{i} ปี</option>)}
                  </select>
                </div>
                <div className="fg"><label>ความสามารถทำงาน</label>
                  <select value={wa} onChange={(e) => setWa(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    <option value="full">ทำงานได้เต็มที่</option>
                    <option value="partial">ทำงานได้บางส่วน</option>
                    <option value="none">ทำงานไม่ได้</option>
                  </select>
                </div>
              </div>
              <div className="calc"><span className="calc-lbl">จำนวนปีที่ทำงาน</span><span className="calc-val">{wy || "—"}</span><span className="calc-unit">ปี</span></div>
              <div className="calc" style={{ marginTop: 4 }}><span className="calc-lbl">ปีที่ต้องใช้เงิน</span><span className="calc-val">{my || "—"}</span><span className="calc-unit">ปี</span></div>
            </div>

            {/* Expenses & Income */}
            <div className="card">
              <span className="badge bg-pink">ค่าใช้จ่าย &amp; รายได้</span>
              <Money label="ค่าใช้จ่ายต่อเดือน (บาท)" value={exp} onChange={setExp} placeholder="20,000" />
              <Money label="รายได้ต่อเดือน (บาท)" value={im} onChange={setIm} placeholder="50,000" />
              <div className="calc"><span className="calc-lbl">รายได้ต่อปี</span><span className="calc-val">{fmt(iy)}</span><span className="calc-unit">บาท</span></div>
              <div className="calc" style={{ marginTop: 4 }}><span className="calc-lbl">รายได้รวมตลอดชีวิตการทำงาน</span><span className="calc-val">{fmt(ti)}</span><span className="calc-unit">บาท</span></div>
              <div className="calc" style={{ marginTop: 4 }}><span className="calc-lbl">เงินเหลือสุทธิต่อเดือน</span><span className="calc-val">{imN > 0 ? fmt(imN - exN) : "—"}</span><span className="calc-unit">บาท</span></div>
            </div>

            {/* Work ability value */}
            <div className="card">
              <span className="badge bg-teal">ค่าความสามารถในการทำงาน</span>
              <div className="calc"><span className="calc-lbl">= รายได้รวมตลอดชีวิตการทำงาน</span><span className="calc-val">{ti ? fmt(ti) : "—"}</span><span className="calc-unit">บาท</span></div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            {/* Savings & Debt */}
            <div className="card">
              <div className="row2">
                <div>
                  <span className="badge bg-blue">เงินเก็บ</span>
                  <Money label="เงินสด / ออมทรัพย์ (บาท)" value={s1} onChange={setS1} placeholder="0" />
                  <Money label="เงินฝากประจำ (บาท)" value={s2} onChange={setS2} placeholder="0" />
                  <Money label="อื่นๆ (บาท)" value={s3} onChange={setS3} placeholder="0" />
                  <div className="calc"><span className="calc-lbl">รวม</span><span className="calc-val">{fmt(sav)}</span><span className="calc-unit">บาท</span></div>
                </div>
                <div>
                  <span className="badge bg-pink">หนี้สิน</span>
                  <Money label="สินเชื่อบ้าน (บาท)" value={d1} onChange={setD1} placeholder="0" />
                  <Money label="สินเชื่อรถ (บาท)" value={d2} onChange={setD2} placeholder="0" />
                  <Money label="บัตรเครดิต / อื่นๆ (บาท)" value={d3} onChange={setD3} placeholder="0" />
                  <div className="calc"><span className="calc-lbl">รวม</span><span className="calc-val">{fmt(dbt)}</span><span className="calc-unit">บาท</span></div>
                </div>
              </div>
            </div>

            {/* Investment */}
            <div className="card">
              <span className="badge bg-purple">กองทุน / การลงทุน</span>
              <div className="row2">
                <Money label="กองทุน LTF/RMF (บาท)" value={f1} onChange={setF1} placeholder="0" />
                <Money label="หุ้น / สินทรัพย์อื่นๆ (บาท)" value={f2} onChange={setF2} placeholder="0" />
              </div>
              <div className="calc"><span className="calc-lbl">รวมการลงทุน</span><span className="calc-val">{fmt(inv)}</span><span className="calc-unit">บาท</span></div>
            </div>

            {/* Assets */}
            <div className="card">
              <span className="badge bg-green">ทรัพย์สินมี 2 ประเภท</span>
              {!assetRevealed && <button className="ev-btn" style={{ display: "block", marginTop: 6 }} onClick={() => setAssetRevealed(true)}>เฉลย</button>}
              {assetRevealed && (
                <div className="row2">
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2E7D32", marginBottom: 6 }}>ทรัพย์สินที่มองเห็น</div>
                    <div style={{ fontSize: 13, color: "#2E7D32", padding: "8px 0", lineHeight: 1.8 }}>บ้าน<br />รถ<br />ที่ดิน</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6A1B9A", marginBottom: 6 }}>ทรัพย์สินที่มองไม่เห็น</div>
                    <div style={{ fontSize: 13, color: "#6A1B9A", padding: "4px 0" }}>ค่าความสามารถ</div>
                    <div className="calc" style={{ marginTop: 4 }}><span className="calc-val" style={{ color: "#6A1B9A" }}>{ti ? fmt(ti) : "—"}</span><span className="calc-unit">บาท</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dependents & Events */}
        <div className="row2">
          <div className="card">
            <span className="badge bg-orange">บุคคลที่อยู่ภายใต้การดูแล</span>
            <div>
              {persons.map((p, i) => (
                <div className="person-row" key={i}>
                  <div className="pnum">{i + 1}</div>
                  <input type="text" placeholder="ชื่อ - ความสัมพันธ์ - อายุ" value={p} onChange={(e) => setPerson(i, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <span className="badge bg-red">5 เหตุการณ์ควบคุมไม่ได้</span>
            {EVENTS.map((e, i) => (
              <div className="event-row" style={{ alignItems: "center" }} key={i}>
                <div className="enum">{i + 1}</div>
                <div style={{ flex: 1 }}>
                  {evRevealed[i] ? (
                    <div style={{ fontSize: 13, color: "#212121", padding: "4px 0" }}>{e}</div>
                  ) : (
                    <button className="ev-btn" onClick={() => revealEv(i)}>เฉลย</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <span className="badge bg-teal">สรุปภาพรวม</span>
          <div className="sum-grid">
            <div className="sum-card"><div className="sum-lbl">ปีที่ทำงาน</div><div className="sum-val">{wy ? wy + " ปี" : "—"}</div></div>
            <div className="sum-card"><div className="sum-lbl">ปีที่ต้องใช้เงิน</div><div className="sum-val">{my ? my + " ปี" : "—"}</div></div>
            <div className="sum-card"><div className="sum-lbl">รายได้รวม (ประมาณ)</div><div className="sum-val">{ti ? fmtM(ti) + " บาท" : "—"}</div></div>
            <div className="sum-card"><div className="sum-lbl">เงินเก็บ</div><div className="sum-val">{fmtM(sav)} บาท</div></div>
            <div className="sum-card"><div className="sum-lbl">หนี้สิน</div><div className="sum-val">{fmtM(dbt)} บาท</div></div>
            <div className="sum-card"><div className="sum-lbl">สินทรัพย์สุทธิ</div><div className="sum-val">{fmtM(net)} บาท</div></div>
          </div>
          <div className="footer-row">
            <div className="footer-field"><label>ผู้ทำแบบสอบถาม</label><input type="text" placeholder="ชื่อ-นามสกุล" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} /></div>
            <div className="footer-field"><label>วันที่</label><input type="date" value={idate} onChange={(e) => setIdate(e.target.value)} /></div>
          </div>
          <div className="btn-row">
            <button className="analyze-btn" onClick={doAnalyze}>สรุปข้อมูลทั้งหมด</button>
            <button className="line-btn" onClick={shareToLine}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.131.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
              ส่งไป LINE
            </button>
          </div>
          {result && <div className="result-box" ref={resultRef}>{result}</div>}
        </div>
      </div>
    </div>
  );
}
