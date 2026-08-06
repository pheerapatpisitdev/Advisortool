# AI Advisor

AI Advisor เป็นหน้าแชตภาษาไทยสำหรับช่วยที่ปรึกษา 4 งาน: ตอบข้อมูลผลิตภัณฑ์จากแค็ตตาล็อกที่ควบคุมได้, คัดกรองแนวทางตามเป้าหมาย, เรียกเครื่องคำนวณจริง และจัดหน้าร่างสรุปสำหรับพิมพ์/PDF

## รันในเครื่อง

ต้องใช้ Node.js 20+ และ OpenAI API key ฝั่งเซิร์ฟเวอร์เท่านั้น

```bash
cp .env.example .env.local
# ใส่ OPENAI_API_KEY ใน .env.local ด้วยตัวเอง
npm run dev:ai
# http://localhost:8080/advisor/
```

`npm run dev` เดิมยังเป็น static server สำหรับเครื่องมือเดิม แต่ endpoint `/api/advisor` จะไม่ทำงาน ต้องใช้ `npm run dev:ai` หรือ `npm start`

ตัวแปรที่รองรับ:

- `OPENAI_API_KEY` — จำเป็นและต้องอยู่บน server
- `OPENAI_MODEL` — ค่าเริ่มต้น `gpt-5.6-terra`
- `OPENAI_BASE_URL` — ค่าเริ่มต้น `https://api.openai.com/v1`
- `PORT` — ค่าเริ่มต้น `8080`

## สถาปัตยกรรมและ guardrails

- `server.mjs` เสิร์ฟ static files และ same-origin `POST /api/advisor`; ปฏิเสธ cross-origin, จำกัด body 48 KB, จำกัด 12 คำขอ/นาที/IP และไม่เสิร์ฟ hidden files, `server.mjs` หรือโมดูลฝั่ง server ใน `advisor/lib/`
- `lib/openai-advisor.mjs` ใช้ OpenAI Responses API และ function tools; เก็บ API key ใน Authorization header ฝั่ง server เท่านั้น
- `lib/catalog.mjs` เป็นขอบเขตข้อมูลผลิตภัณฑ์ที่โมเดลใช้ตอบ/คัดกรอง
- `lib/calculators.mjs` เรียกข้อมูลหรือ engine เดิมโดยตรง ปัจจุบันรองรับตัวเลขตรวจสอบได้สำหรับ CI 123, iHealthy Ultra และบำนาญ สมาร์ท 95
- ผลิตภัณฑ์อื่นจะให้ลิงก์เข้า calculator เดิมแทนการประมาณตัวเลข
- ระบบไม่บันทึกบทสนทนาลงฐานข้อมูล หน้าเว็บเก็บ state ในหน่วยความจำของ tab เท่านั้น แต่ข้อมูลที่ส่งจะถูกส่งไปยัง OpenAI API ตามนโยบายของบัญชี API ที่ใช้งาน
- UI เตือนผู้ใช้ไม่ให้ส่งเลขบัตรประชาชน เวชระเบียน เลขกรมธรรม์ หรือข้อมูลอ่อนไหว

คำตอบและเอกสารที่พิมพ์มีสถานะเป็น “ร่างสรุปประกอบการสนทนา” ไม่ใช่ใบเสนอราคา สัญญา คำแนะนำทางการเงิน/ภาษี หรือการรับรองผลพิจารณารับประกัน

## Deploy

ต้อง deploy บน runtime ที่รัน Node server ได้ หรือแปลง handler `/api/advisor` เป็น serverless function ที่คง validation, rate limit และ same-origin policy เดิม Static hosting อย่างเดียวไม่สามารถเก็บ API key หรือให้ AI Advisor ทำงานได้

ใน production ควรใช้ rate limit แบบ shared store ที่ข้ามหลาย instance, ตั้ง secret ผ่านระบบ environment ของผู้ให้บริการ, จำกัด access ที่ CDN/identity layer และเก็บ application logs โดยไม่บันทึก prompt หรือ API key

## Tests

```bash
npm test
```

tests ครอบคลุม validation, product search, calculator adapters, tool-call loop แบบ mock และ static references โดยไม่เรียก OpenAI API จริงและไม่อ่านค่า secret
