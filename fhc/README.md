# FHC — แบบสอบถามคุณภาพชีวิต (เวอร์ชันวานิลลา)

แปลงจาก React (`app/fhc`) เป็น **static ไฟล์เดียว** — `index.html` (ฟอร์ม + คำนวณสด + บันทึก Supabase + แชร์ LINE) ใช้ CSS ธรรมดา ไม่ต้องใช้ Tailwind/CDN ใดๆ ยกเว้นฟอนต์ Sarabun จาก Google Fonts

## รัน / Deploy

```bash
cd vanilla/fhc
python3 -m http.server 8000   # เปิด http://localhost:8000
```

อัปโหลด `index.html` ไฟล์เดียวขึ้น host static ที่ไหนก็ได้

## บันทึกข้อมูล (ตั้งค่าแล้ว)

กดปุ่ม **"สรุปข้อมูลทั้งหมด"** จะบันทึกลง Supabase โปรเจกต์ AdvisorTool (`jkobdgurhxfmscloduhw`) ตาราง `fhc_responses` — ตั้งค่าใน `CONFIG` ให้แล้ว ใช้ publishable key + `Prefer: return=minimal` (สำคัญ: insert-only RLS ห้ามอ่านกลับ ดู [[../career-agent/README.md]])

ตารางที่ตั้งไว้ (เปิด RLS, policy `for insert to public`): คอลัมน์ interviewer, interview_date, cur_age, ret_age, exp_age, work_ability, work_years, money_years, income, expense, total_income, savings, debt, investment, net_asset, dependents

> ต้นฉบับ React ชี้ไปโปรเจกต์ Supabase อื่น (`pmrhwdheisqsfsntiufp`) — เวอร์ชันวานิลลานี้ย้ายมารวมที่โปรเจกต์ AdvisorTool เพื่อใช้ชุดเดียวกับ career-agent

## หมายเหตุการแปลง

- React `useState` หลายตัว → อ่านค่าจาก DOM ตรงๆ + ฟังก์ชัน `recalc()` อัปเดตเฉพาะ display node (ไม่ re-render input → ไม่เสีย focus)
- input ตัวเลขจัดรูปแบบ comma คั่นหลักพันด้วย `formatInput()` ขณะพิมพ์
- ปุ่ม "เฉลย" (ทรัพย์สิน / 5 เหตุการณ์) toggle ด้วย DOM ตรงๆ
- แชร์ LINE = `https://line.me/R/msg/text/?...` (ไม่ต้องใช้ token)
