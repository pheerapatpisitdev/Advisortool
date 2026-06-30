# Advisortool — HTML + CSS + JS วานิลลา

เว็บ static ล้วน (เดิมเป็น Next.js/React — แปลงครบและลบ Next.js ออกแล้ว) ไม่ต้อง build / ไม่ต้องมี Node server — วางที่ไหนก็รันได้

## หน้า Hub

`index.html` (รากของ repo) = หน้ารวมเครื่องมือทั้ง 7 ตัว กดการ์ดเพื่อเข้าใช้งานแต่ละตัว

## รัน

เสิร์ฟ root ของ repo ด้วย static server แล้วเปิดหน้า Hub:

```bash
python3 -m http.server 8000
# เปิด http://localhost:8000  → กดการ์ดเข้าแต่ละเครื่องมือได้เลย
```

> ต้องเปิดผ่าน http (ไม่ใช่ `file://`) เพราะลิงก์/CDN/Supabase บางตัวต้องการ

## สถานะการแปลง — ครบทั้ง 7 เครื่องมือแล้ว ✅

| เครื่องมือ | โฟลเดอร์ | จุดเด่น | บันทึกข้อมูล |
|---|---|---|---|
| CI 123 | `ci123/` | ตารางผลประโยชน์ + เครื่องคำนวณเบี้ย | — |
| FHC | `fhc/` | ฟอร์มคำนวณสด + แชร์ LINE | Supabase `fhc_responses` |
| Career-Agent | `career-agent/` | แบบสอบถามให้คะแนน + จัดระดับ | Supabase `career_responses` |
| Global Saving | `global-saving/` | เครื่องคำนวณผลประโยชน์ + factsheet (กราฟ Chart.js) | — |
| iHealthy Ultra | `ihealthy/` | เปรียบเทียบ 3 แผน + premium calc + i18n 5 ภาษา | — |
| Group Insurance | `group-insurance/` | คำนวณเบี้ยกลุ่มหลายกลุ่ม + ใบเสนอราคา PDF + TH/EN | — |
| Agency Blueprint | `agency/` | 3 เครื่องมือ: ค่าบริหาร / รายได้ตัวแทน / แบบทดสอบผู้จัดการ | — |

แต่ละโฟลเดอร์ย่อยมี `README.md` อธิบายรายละเอียดของเครื่องมือนั้น

CDN ที่ใช้: Tailwind Play (ci123, ihealthy, agency, career-agent), Chart.js (global-saving), jsPDF + html2canvas (group-insurance, ihealthy), SweetAlert2 (career-agent), Supabase JS (career-agent, fhc) — ที่เหลือเป็น HTML/CSS/JS ล้วน

## Deploy

อัปโหลดทั้ง repo (root) ขึ้น host static ที่ไหนก็ได้ (Netlify, GitHub Pages, Cloudflare Pages, cPanel, S3) — หน้า Hub และเครื่องมือทั้งหมดทำงานได้ทันที ส่วนการบันทึกข้อมูลใช้ Supabase (publishable key ฝังในหน้าเว็บได้, ตารางเปิด RLS แบบ insert-only)
