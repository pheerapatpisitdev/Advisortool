# บำนาญ สมาร์ท 95 — โปรแกรมคำนวณเบี้ย & ผลประโยชน์

เว็บแอป **vanilla (HTML + CSS + JS ล้วน ไม่มี framework)** สำหรับคำนวณเบี้ยประกันและผลประโยชน์ของแบบประกันบำนาญ **บำนาญ สมาร์ท 95 (เวอร์ชั่น A2026-1)** — อัตราเบี้ยและสูตรทั้งหมดดึงจากไฟล์ Excel ทางการ และตรวจสอบความถูกต้องแบบ value-by-value แล้ว

เปิดได้ทั้งแบบ **ไฟล์เดียว** (ดับเบิลคลิกเปิดในเครื่อง) และ **โฮสต์เป็นเว็บไซต์** (deploy ขึ้น Netlify / Cloudflare Pages / GitHub Pages ได้เลย)

## ฟีเจอร์

- เบี้ยสัญญาหลัก 8 แบบ (รับบำนาญอายุ 55/60/65/70 และแบบชำระ 6 ปี) × เพศ × อายุ
- 3 โหมดอินพุต (กำหนดจากทุน / เบี้ย / บำนาญรายเดือน) · 4 งวดชำระ
- สัญญาเพิ่มเติม 12 ตัว พร้อมกฎอายุ + เงื่อนไขซื้อคู่
- ตารางผลประโยชน์บำนาญ + ตารางรายปีตลอดสัญญา (มูลค่าเวนคืน, คุ้มครองชีวิต, IRR)
- เครื่องคำนวณสิทธิลดหย่อนภาษี · UI 2 หน้า (กรอกข้อมูล → ผลลัพธ์) · พิมพ์/บันทึก PDF

## โครงสร้าง

```
pension-smart95/
├── index.html          # หน้าเว็บ (entry) — โหลด src/ + data/
├── src/
│   ├── styles.css      # สไตล์ทั้งหมด
│   ├── engine.js       # เครื่องคำนวณ (port จาก Excel) — pure logic ไม่ผูก UI
│   └── app.js          # ตรรกะ UI (ฟอร์ม, สลับ 2 หน้า, render ตาราง)
├── data/
│   ├── db.js           # window.DB = {…ตารางอัตราทั้งหมด…}  (โหลดในหน้าเว็บ)
│   ├── db.json         # ข้อมูลชุดเดียวกันแบบ JSON (ใช้โดย verify/extract)
│   └── tables/*.json   # ตารางแยกรายตัว 15 ไฟล์ (อ้างอิง/ตรวจสอบ)
├── scripts/
│   ├── verify.mjs      # ทดสอบ engine เทียบ "เฉลย" จาก Excel (ไม่ต้อง npm install)
│   ├── build.mjs       # รวมเป็น HTML ไฟล์เดียว → dist/
│   ├── build_web.mjs   # สร้างเว็บ static → dist/web/ (สำหรับ deploy)
│   └── extract_tables.py  # ดึงตารางใหม่จาก reference/*.xlsm
├── test/oracle/        # ค่าเฉลยที่คำนวณใหม่ด้วย LibreOffice
├── reference/          # ไฟล์ Excel ต้นฉบับ (แหล่งความจริงของอัตราเบี้ย)
└── dist/
    ├── โปรแกรมคำนวณเบี้ย-บำนาญสมาร์ท95.html   # ไฟล์เดียว
    └── web/            # เว็บ static (index.html + assets/) ← deploy โฟลเดอร์นี้
```

## เริ่มใช้งาน

ต้องมี **Node.js** (สำหรับ verify/build — ไม่ต้อง `npm install`, ใช้ built-in ล้วน)
และ **Python 3** (มากับ macOS อยู่แล้ว — สำหรับ dev server และตอนดึงตารางใหม่)

```bash
# พัฒนา: เปิดเซิร์ฟเวอร์ที่ root แล้วเปิด http://localhost:8080/
npm run dev

# ตรวจความถูกต้อง (engine เทียบเฉลยจาก Excel — 339 เคส)
npm run verify

# build เป็นไฟล์เดียว → dist/  (verify ก่อนอัตโนมัติ)
npm run build

# build เว็บ static → dist/web/  (เอาไป deploy)
npm run build:web

# ทั้งสองแบบในคำสั่งเดียว
npm run build:all

# ดึงตารางอัตราใหม่จาก Excel (เมื่อมีเวอร์ชันใหม่)
pip install openpyxl && npm run extract
```

> ไม่จำเป็นต้อง `npm install` เลย — ทั้ง verify และ build ใช้เฉพาะ Node built-in

## Deploy ขึ้นเว็บ

รัน `npm run build:web` แล้วเอาโฟลเดอร์ `dist/web/` ไปวางบนโฮสต์ static ตัวใดก็ได้:

- **Netlify / Cloudflare Pages** — ลาก `dist/web/` วางในหน้า deploy (drag & drop) เสร็จใน 1 นาที
- **GitHub Pages** — push โปรเจคขึ้น repo แล้วตั้ง Pages ให้ชี้ที่โฟลเดอร์ที่มี index.html
- **โฮสติ้งทั่วไป / S3** — อัปโหลดไฟล์ในโฟลเดอร์ทั้งหมด

ไม่ต้องมี backend (เป็น static ล้วน) — เชื่อมเน็ตเฉพาะโหลดฟอนต์ Google Fonts

## ความถูกต้อง

`npm run verify` ตรวจ engine เทียบค่าที่คำนวณใหม่จาก Excel ต้นฉบับ (LibreOffice เป็น "เฉลย"):
เบี้ยสัญญาหลัก 51/51 · สัญญาเพิ่มเติม 10 ตัว · ตารางรายปี 275/275 ค่า · IRR · ลดหย่อนภาษี · กวาด 1,212 ชุดอินพุต — รวม **339 การตรวจ ผ่านหมด**

รายละเอียดสถาปัตยกรรม สูตร และที่มาของตาราง ดูใน [`CLAUDE.md`](./CLAUDE.md)
