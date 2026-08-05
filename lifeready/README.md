# โปรแกรมคำนวณเบี้ยประกันภัย ไลฟ์เรดดี้ (LifeReady) — Vanilla

เว็บแอปคำนวณเบี้ยประกัน **ไลฟ์เรดดี้ (ไม่มีเงินปันผล)** เวอร์ชัน A2026-1 พร้อมสัญญาเพิ่มเติม 13 ตัว
ตารางผลประโยชน์ และตารางมูลค่ากรมธรรม์ — เขียนด้วย **HTML + CSS + JavaScript ล้วน ไม่มี build tool / ไม่มี dependency**

อัตราเบี้ยทั้งหมดถอดมาจากไฟล์ Excel ต้นฉบับ (`source/ไลฟ์เรดดี้_A2026-1.xlsx`) และตรวจสอบให้ตรงกับ Excel แล้ว

## วิธีใช้งาน

ตัวคำนวณและตารางเรตไม่ต้อง build และเก็บใน repo แต่ชุด Advisortool ใช้ PIN gate ที่ต้องต่อ server เมื่อยืนยันการเข้าใช้งานครั้งใหม่ จึงแนะนำให้เปิดผ่าน static server

ถ้าต้องการรันผ่านเซิร์ฟเวอร์ (เช่นกัน CORS เวลาแก้ไข):
```bash
python3 -m http.server 8000   # แล้วเปิด http://localhost:8000
```

## โครงสร้างไฟล์

```
index.html            หน้าเว็บ (โหลด css + js ตามลำดับ)
css/styles.css        สไตล์ทั้งหมด
js/data.js            อัตราเบี้ย (window.DATA / window.CV) — สร้างจาก data/*.json
js/engine.js          เครื่องคำนวณเบี้ย (window.LR) — ตรงกับ Excel
js/config.js          นิยามสัญญาเพิ่มเติม + ตัวเลือกแผน + ตัวช่วยจัดรูปแบบ
js/app.js             ลอจิก UI: สร้างฟอร์ม, คำนวณ, แสดงผล, สลับ 2 หน้า
data/premium.json     ตารางเรต (ต้นฉบับ canonical)
data/cashvalue.json   ตารางมูลค่ากรมธรรม์
scripts/              สคริปต์ Python: ดึงเรตจาก xlsx + สร้าง data.js + validate
source/               ไฟล์ Excel ต้นฉบับ
```

ลำดับการโหลดสคริปต์ใน `index.html`: `data.js → engine.js → config.js → app.js` (เป็น classic script แชร์ตัวแปร global ร่วมกัน)

## อัปเดตอัตราเบี้ย (เมื่อมีไฟล์ Excel ใหม่)

ต้องมี Python + `openpyxl` (`pip install openpyxl`)
```bash
# 1) วางไฟล์ใหม่ทับ source/ไลฟ์เรดดี้_A2026-1.xlsx (โครงสร้างชีตต้องเหมือนเดิม)
python3 scripts/extract.py        # → data/premium.json
python3 scripts/extract_cv.py     # → data/cashvalue.json
python3 scripts/build-data.py     # → js/data.js (สำคัญ! เว็บอ่านจากไฟล์นี้)
```

> รายละเอียดสถาปัตยกรรมและสูตรคำนวณแต่ละสัญญา อยู่ใน [`CLAUDE.md`](./CLAUDE.md)

## หมายเหตุ

เป็นเครื่องมือช่วยคำนวณเบี้ยเบื้องต้น ผลประโยชน์/ความคุ้มครอง/ข้อยกเว้นเป็นไปตามที่กำหนดในกรมธรรม์

## เริ่มใช้ Git

ไฟล์ `lifeready-vanilla.bundle` (อยู่โฟลเดอร์ LifeReady) คือ git repository ฉบับสมบูรณ์พร้อม commit แล้ว:
```bash
cd ~/Desktop/LifeReady
git clone lifeready-vanilla.bundle lifeready
cd lifeready    # เปิด index.html ได้เลย
```
> หรือถ้าจะเริ่ม git เองในโฟลเดอร์นี้: `git init && git add -A && git commit -m "init"` (บนเครื่อง Mac ทำได้ปกติ)
