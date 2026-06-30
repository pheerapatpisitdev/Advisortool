# Advisortool — HTML + CSS + JS วานิลลา

เว็บ static ล้วน (เดิมเป็น Next.js/React — แปลงครบและลบ Next.js ออกแล้ว) ไม่ต้อง build / ไม่ต้องมี Node server — วางที่ไหนก็รันได้

## หน้า Hub

`index.html` (รากของ repo) = หน้ารวมเครื่องมือทั้ง 9 ตัว กดการ์ดเพื่อเข้าใช้งานแต่ละตัว

> Header แถบบน (โลโก้ + เมนู "เครื่องมือ") ของทุกหน้าใช้ไฟล์กลางร่วมกันที่ `assets/global-header.css` + `assets/global-header.js` — แก้เมนู/สไตล์ที่เดียว มีผลทุกเครื่องมือ

## รัน

เสิร์ฟ root ของ repo ด้วย static server แล้วเปิดหน้า Hub:

```bash
python3 -m http.server 8000
# เปิด http://localhost:8000  → กดการ์ดเข้าแต่ละเครื่องมือได้เลย
```

> ต้องเปิดผ่าน http (ไม่ใช่ `file://`) เพราะลิงก์/CDN/Supabase บางตัวต้องการ

## สถานะการแปลง — ครบทั้ง 9 เครื่องมือแล้ว ✅

| เครื่องมือ | โฟลเดอร์ | จุดเด่น | บันทึกข้อมูล |
|---|---|---|---|
| Life Ready | `lifeready/` | ประกันชีวิตตลอดชีพ คำนวณเบี้ยสองทาง + ตารางมูลค่ากรมธรรม์ + PDF | — |
| Global Saving | `global-saving/` | เครื่องคำนวณผลประโยชน์ + factsheet (กราฟ Chart.js) | — |
| iHealthy Ultra | `ihealthy/` | เปรียบเทียบ 3 แผน + premium calc + i18n 5 ภาษา | — |
| CI 123 | `ci123/` | ตารางผลประโยชน์ + เครื่องคำนวณเบี้ย | — |
| iShield | `ishield/` | ประกันโรคร้ายแรงตลอดชีพ คำนวณเบี้ยสองทาง + ตารางมูลค่ากรมธรรม์ + PDF | — |
| Group Insurance | `group-insurance/` | คำนวณเบี้ยกลุ่มหลายกลุ่ม + ใบเสนอราคา PDF + TH/EN | — |
| FHC | `fhc/` | ฟอร์มคำนวณสด + แชร์ LINE | Supabase `fhc_responses` |
| Career-Agent | `career-agent/` | แบบสอบถามให้คะแนน + จัดระดับ | Supabase `career_responses` |
| Agency Blueprint | `agency/` | 3 เครื่องมือ: ค่าบริหาร / รายได้ตัวแทน / แบบทดสอบผู้จัดการ | — |

แต่ละโฟลเดอร์ย่อยมี `README.md` อธิบายรายละเอียดของเครื่องมือนั้น

ไลบรารีทั้งหมด (Tailwind compile แล้วเป็น `styles.css`, Chart.js, jsPDF, html2canvas, SweetAlert2, Supabase JS) **bundle ไว้ในเครื่องทุกตัว** ไม่ได้โหลดจาก CDN ตอน runtime — เปิดออฟไลน์ก็ได้ ยกเว้นเว็บฟอนต์ (Google Fonts) และการบันทึกข้อมูลขึ้น Supabase

## Deploy

อัปโหลดทั้ง repo (root) ขึ้น host static ที่ไหนก็ได้ (Netlify, GitHub Pages, Cloudflare Pages, cPanel, S3) — หน้า Hub และเครื่องมือทั้งหมดทำงานได้ทันที ส่วนการบันทึกข้อมูลใช้ Supabase (publishable key ฝังในหน้าเว็บได้, ตารางเปิด RLS แบบ insert-only)
