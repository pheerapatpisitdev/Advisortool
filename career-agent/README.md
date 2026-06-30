# Career-Agent (เวอร์ชันวานิลลา HTML + CSS + JS)

แบบสอบถามความถนัดในอาชีพ (CAQ) แปลงจาก React/Next.js เป็น **static ล้วน** — ไม่ต้อง build, ไม่ต้องมี Node server, วางที่ไหนก็รันได้

## ไฟล์

- `index.html` — ทั้งแอปอยู่ในไฟล์เดียว (HTML + CSS + JS + ข้อมูลคำถาม 30 ข้อ + ระบบคิดคะแนน)
- `logo.png` — โลโก้ CAQ

ใช้ผ่าน CDN: Tailwind (จัดสไตล์), SweetAlert2 (popup), Supabase JS (บันทึกข้อมูล)

## รันในเครื่อง

เปิดผ่าน static server (อย่าเปิดด้วย `file://` เพราะ CDN/Supabase บางตัวต้องการ http):

```bash
cd vanilla/career-agent
python3 -m http.server 8000
# เปิด http://localhost:8000
```

## Deploy

อัปโหลด 2 ไฟล์นี้ขึ้นที่ไหนก็ได้ที่เสิร์ฟไฟล์ static: Netlify, GitHub Pages, Cloudflare Pages, cPanel/shared hosting, S3 ฯลฯ

## บันทึกคำตอบด้วย Supabase

**ตั้งค่าให้เรียบร้อยแล้ว** เชื่อมกับโปรเจกต์ `AdvisorTool` (`jkobdgurhxfmscloduhw`) — กรอก `CONFIG` ใน `index.html` ให้แล้ว และสร้างตาราง `career_responses` + RLS ไว้แล้ว ใช้งานได้ทันที

> ถ้าลบค่า `CONFIG.SUPABASE_*` ออก แบบสอบถามยังทำงานครบ แค่ "ไม่บันทึก" (ข้ามแบบ graceful)

### โครงสร้างที่ตั้งไว้

```sql
create table public.career_responses (
  id          bigint generated always as identity primary key,
  created_at  timestamptz default now(),
  form_data   jsonb,
  score       jsonb,
  total       int,
  category    text
);

alter table public.career_responses enable row level security;

-- อนุญาตเฉพาะ INSERT (เพิ่มได้อย่างเดียว) — read/update/delete ไม่มี policy → RLS บล็อกหมด
create policy "public_insert_only"
  on public.career_responses for insert
  to public
  with check (true);
```

> **สำคัญ:** หน้าเว็บใช้ `.insert()` เฉยๆ ห้ามต่อ `.select()` ท้าย insert — เพราะการขออ่านแถวที่เพิ่งเพิ่มกลับมา ต้องใช้สิทธิ์ SELECT ที่เราตั้งใจบล็อกไว้ จะทำให้ insert ล้มเหลวด้วย error RLS (42501)
>
> ดูข้อมูลที่เก็บได้ใน Supabase → Table Editor (ฝั่ง dashboard มีสิทธิ์อ่านเสมอ)

### ค่าใน `index.html` (ตั้งไว้แล้ว)

```js
const CONFIG = {
  SUPABASE_URL: "https://jkobdgurhxfmscloduhw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_ACfHyPhgcrKCM72m4bkv3A_--cEb0yV", // publishable key
  SUPABASE_TABLE: "career_responses",
  SEND_RESULTS_URL: "",   // (ทางเลือก) ดูด้านล่าง
  LOGO_URL: "logo.png",
};
```

⚠️ ใส่ได้แค่ **publishable / anon key** เท่านั้น — `service_role` / `secret` key ห้ามใส่ในหน้าเว็บเด็ดขาด

## ส่งผลเข้าอีเมล / LINE อัตโนมัติ (ทางเลือก)

ส่วนนี้ถือความลับ (SMTP password / LINE token) จึง **ทำในหน้าเว็บวานิลลาตรงๆ ไม่ได้** ต้องย้ายไป **Supabase Edge Function**:

1. เขียน Edge Function ที่รับ payload แล้วส่งอีเมล (เช่นผ่าน Resend) และ/หรือ push LINE Messaging API
2. ใส่ token เป็น secret ใน Supabase (`supabase secrets set ...`)
3. เอา URL ของ function มาใส่ใน `CONFIG.SEND_RESULTS_URL`

ส่วน **"แชร์ไป LINE"** (ปุ่มในหน้าผลลัพธ์) ทำงานได้เลยโดยไม่ต้องตั้งค่าอะไร — เปิดแอป LINE ให้ผู้ใช้เลือกผู้รับเอง

## หมายเหตุการแปลง

- ตรรกะคิดคะแนน, คำถาม 30 ข้อ, 7 กลุ่มย่อย, เกณฑ์สี (เขียว ≥118 / ส้ม ≥80 / แดง) — คัดลอกมาตรงจากต้นฉบับ React
- React state → ตัวแปร `state` + ฟังก์ชัน `render()` (re-render ทั้งหน้าเมื่อกดเลือก)
- ไอคอน lucide-react → inline SVG, สี/แอนิเมชัน → คงจาก tailwind.config + career.css เดิม
