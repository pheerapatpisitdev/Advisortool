# Career-Agent (เวอร์ชันวานิลลา HTML + CSS + JS)

แบบสอบถามความถนัดในอาชีพ (CAQ) แปลงจาก React/Next.js เป็น **static ล้วน** — ไม่ต้อง build, ไม่ต้องมี Node server, วางที่ไหนก็รันได้

## ไฟล์

- `index.html` — ทั้งแอปอยู่ในไฟล์เดียว (HTML + CSS + JS + ข้อมูลคำถาม 30 ข้อ + ระบบคิดคะแนน)
- `logo.png` — โลโก้ CAQ

สไตล์ Tailwind ถูก compile ไว้ใน `styles.css`; ไม่มี SweetAlert2, Supabase JS หรือการบันทึก backend ใน runtime ปัจจุบัน

## รันในเครื่อง

เปิดผ่าน static server จาก root ของ repo:

```bash
python3 -m http.server 8080
# เปิด http://localhost:8080/career-agent/
```

## Deploy

อัปโหลดทั้ง repo หรืออย่างน้อยโฟลเดอร์นี้พร้อม shared `assets/` ขึ้น static host

## การจัดเก็บและแชร์ผล

คำตอบอยู่ใน state ของหน้าเว็บและ **ไม่ถูกบันทึกหรือส่งอัตโนมัติ** เมื่อทำแบบสอบถามเสร็จ หน้าผลลัพธ์จะแสดงคะแนน/รายละเอียดบนเครื่อง และมีปุ่มเปิด LINE ให้ผู้ใช้เลือกผู้รับและยืนยันการส่งสรุปเอง

หากต้องการเก็บข้อมูลในอนาคต ต้องออกแบบ consent, retention, access control และ backend endpoint เพิ่มเติมก่อน ห้ามฝัง service-role key, token หรือ secret ใด ๆ ในหน้า static

## หมายเหตุการแปลง

- ตรรกะคิดคะแนน, คำถาม 30 ข้อ, 7 กลุ่มย่อย, เกณฑ์สี (เขียว ≥118 / ส้ม ≥80 / แดง) — คัดลอกมาตรงจากต้นฉบับ React
- React state → ตัวแปร `state` + ฟังก์ชัน `render()` (re-render ทั้งหน้าเมื่อกดเลือก)
- ไอคอน lucide-react → inline SVG, สี/แอนิเมชัน → คงจาก tailwind.config + career.css เดิม
