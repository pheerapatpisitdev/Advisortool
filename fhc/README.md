# FHC — แบบสอบถามคุณภาพชีวิต (เวอร์ชันวานิลลา)

แปลงจาก React (`app/fhc`) เป็น **static ไฟล์เดียว** — `index.html` (ฟอร์ม + คำนวณสด + พิมพ์/PDF + แชร์ LINE) ใช้ CSS ธรรมดา ไม่ต้องใช้ Tailwind; โหลดฟอนต์ Sarabun จาก Google Fonts

## รัน / Deploy

```bash
python3 -m http.server 8080   # เปิด http://localhost:8080/fhc/
```

เวลา deploy ต้องอัปโหลด shared assets จาก root ด้วย เพราะหน้าใช้ PIN gate และ global header ร่วมกัน

## การจัดเก็บและแชร์ผล

ปุ่ม **"สรุปข้อมูลทั้งหมด"** แสดงข้อความสรุปในหน้าเท่านั้น เวอร์ชันปัจจุบันไม่มี `fetch` หรือ Supabase สำหรับบันทึกคำตอบ ปุ่ม LINE เปิดหน้าต่างแชร์ให้ผู้ใช้เลือกผู้รับและยืนยันเอง ส่วนปุ่มพิมพ์ใช้ print dialog ของ browser

## หมายเหตุการแปลง

- React `useState` หลายตัว → อ่านค่าจาก DOM ตรงๆ + ฟังก์ชัน `recalc()` อัปเดตเฉพาะ display node (ไม่ re-render input → ไม่เสีย focus)
- input ตัวเลขจัดรูปแบบ comma คั่นหลักพันด้วย `formatInput()` ขณะพิมพ์
- ปุ่ม "เฉลย" (ทรัพย์สิน / 5 เหตุการณ์) toggle ด้วย DOM ตรงๆ
- แชร์ LINE = `https://line.me/R/msg/text/?...` (ไม่ต้องใช้ token)
