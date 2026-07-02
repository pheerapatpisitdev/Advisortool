# Unified Theme "Navy & Gold" — LifeReady · บำนาญ สมาร์ท 95 · iShield

วันที่: 2026-07-02
สถานะ: รออนุมัติ spec

## เป้าหมาย

ทำให้เครื่องมือคำนวณเบี้ยประกัน 3 ตัว — **LifeReady**, **บำนาญ สมาร์ท 95**, **iShield** —
มีธีมหน้าตาเหมือนกันทั้งหมด (สี ฟอนต์ และ UI pattern หลัก) ให้ดูเป็นชุดผลิตภัณฑ์เดียวกัน
และวางรากฐานให้เครื่องมือถัดไป (ihealthy, ci123, fhc, group-insurance ฯลฯ) หยิบไปใช้ต่อได้ทันที

**ขอบเขต:** ปรับทั้งสี/ฟอนต์ และ layout/UI pattern ให้เหมือนกัน (ไม่ใช่แค่เปลี่ยนสี)

**นอกขอบเขต (ห้ามแตะ):** ตรรกะการคำนวณเบี้ย/ผลประโยชน์ทั้งหมด — `js/engine.js` ของ LifeReady,
`src/engine.js` ของบำนาญ 95, และ logic คำนวณของ iShield ต้องไม่ถูกแก้แม้แต่บรรทัดเดียว
ค่าที่แสดงต้องตรงกับก่อนทำธีมทุกกรณี (บำนาญ 95: `npm run verify` ต้องเขียวเหมือนเดิม)

## การตัดสินใจที่ผู้ใช้อนุมัติแล้ว

- **โทนสีหลัก:** Navy + Gold (accent teal สำหรับ action)
- **ฟอนต์:** IBM Plex Sans Thai ทั้งระบบ (ให้กลืนกับ global header + Hub) fallback Sarabun → system
- **ขอบเขต:** Theme + UI patterns เหมือนกัน

## สถาปัตยกรรม

**แนวทางที่เลือก: Shared design system ที่ `assets/theme.css`** (แนวทาง A)

สร้างไฟล์ CSS กลางไฟล์เดียว วางคู่กับ `assets/global-header.css` ที่ทั้งสามตัวแชร์กันอยู่แล้ว
ทุกเครื่องมือ `<link>` ไฟล์นี้ แล้วเหลือ CSS เฉพาะตัวไว้ในไฟล์เล็กของแต่ละเครื่องมือ

```
assets/
  theme.css          ← ใหม่: design tokens + component classes (แหล่งความจริงเดียว)
  theme.css (fonts)  ← import IBM Plex Sans Thai
  global-header.css  ← เดิม (ไม่แตะ)
  global-header.js   ← เดิม (ไม่แตะ)

lifeready/css/styles.css        ← เหลือเฉพาะ layout/ตาราง/กราฟเฉพาะตัว
pension-smart95/src/styles.css  ← เหลือเฉพาะ steps/collapse/tax-grid เฉพาะตัว
ishield/css/styles.css          ← ใหม่: ดึง CSS ที่ฝังใน index.html ออกมา
```

เหตุผล: แก้ที่เดียวเปลี่ยนทั้งสามตัว, สอดคล้องกับ pattern แชร์ไฟล์ที่มีอยู่, เครื่องมือใหม่นำไปใช้ต่อได้

ข้อแลกเปลี่ยนที่ยอมรับ: ต้องแตะ markup ทั้งสามตัว และต้องแก้ build script ของบำนาญ 95 ให้ inline
`theme.css` ตอน build `dist/`

## Design tokens (`assets/theme.css`)

ตั้ง prefix `--az-*` ให้เข้าชุดกับ global header (ซึ่งใช้ `--az-header-h`) และกันชนกับตัวแปรเดิมของแต่ละไฟล์

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--az-navy` / `--az-navy-2` | `#0D2C54` / `#143B6E` | Header gradient, หัวข้อ, ตัวเลขเด่น |
| `--az-gold` / `--az-gold-l` | `#C79A3A` / `#F7EFDD` | Badge เวอร์ชัน, ชิปเลขข้อ, ไฮไลต์ KPI, เส้นคั่นหัวการ์ด |
| `--az-teal` / `--az-teal-l` | `#0A7D8C` / `#E6F4F6` | ปุ่มคำนวณ (CTA), focus ring, ลิงก์ |
| `--az-bg` / `--az-card` / `--az-line` | `#F4F6F9` / `#FFFFFF` / `#E2E8F0` | พื้นหลัง, การ์ด, เส้นขอบ |
| `--az-ink` / `--az-muted` | `#1F2937` / `#64748B` | ตัวอักษรหลัก / label รอง |
| `--az-good` / `--az-good-l` | `#0F8A4D` / `#E7F6EE` | ผ่านเกณฑ์, ประหยัดภาษี |
| `--az-bad` / `--az-bad-l` | `#C0392B` / `#FDECEA` | คำเตือน, error |
| `--az-radius` / `--az-radius-s` | `14px` / `9px` | การ์ด / input, ปุ่ม, ชิป |
| `--az-shadow` | `0 1px 3px rgba(16,42,76,.08), 0 1px 2px rgba(16,42,76,.06)` | เงาการ์ด |

**Typography:** IBM Plex Sans Thai ทั้งระบบ, หัวข้อ weight 600–700, เนื้อหา 400,
ตัวเลขในตารางเปิด `font-variant-numeric: tabular-nums`

## UI patterns มาตรฐาน (component classes ใน theme.css)

ใช้ต้นแบบจากบำนาญ 95 ซึ่งมี pattern ครบสุดอยู่แล้ว แล้วยกระดับให้อีกสองตัวตาม

1. **Product header** (`.az-hero`) — แถบ gradient navy เต็มความกว้าง **ไม่ sticky**
   (ตัด hack ซ้อน sticky ของบำนาญ 95 ทิ้ง): โลโก้สี่เหลี่ยมมุมมนสีทอง + ชื่อโปรแกรม + คำโปรย,
   badge เวอร์ชันขอบทองด้านขวา
2. **Steps indicator** (`.az-steps`) — `① กรอกข้อมูล ─── ② ผลการคำนวณ`
   ยกของบำนาญ 95 มาเป็นมาตรฐาน เพิ่มให้ LifeReady และ iShield (ทั้งคู่เป็น flow 2 หน้าอยู่แล้ว)
3. **การ์ดมาตรฐาน** (`.az-card` > `.az-card-h` + `.az-card-b`) — หัวการ์ดมีชิปเลขข้อพื้นทองอ่อน
   แทน emoji (👤📋💰) และจุด teal เดิม เพื่อความสม่ำเสมอและพิมพ์สวย, เงา/มุมโค้งเดียวกัน
4. **ฟอร์ม** — label, input, select, segmented control (`.az-seg` เพศ/งวดชำระ) หน้าตาเดียวกัน,
   focus ring teal, ข้อความ error/hint รูปแบบเดียว
5. **ปุ่ม** — CTA คำนวณ (`.az-btn-calc`) ปุ่มใหญ่ teal, ปุ่มกลับ (`.az-btn-back`) navy ghost,
   ปุ่มพิมพ์ (`.az-btn-ghost`) ghost ขอบเทา — ตำแหน่งเดียวกันทุกตัว
6. **KPI summary** (`.az-kpi` > `.az-box`) — กล่องสรุปตัวเลขเด่น (เบี้ยรวม / ทุนประกัน / ผลประโยชน์หลัก)
   แบบบำนาญ 95 เพิ่มให้อีกสองตัวในหน้าผลลัพธ์
7. **ตาราง** (`.az-table`) — thead พื้นอ่อนตัวอักษร navy, แถวสลับสี, ตัวเลขชิดขวา + comma,
   แถวรวมตัวหนามีเส้นทองด้านบน
8. **หน้าพิมพ์ / PDF** (`@media print` กลาง) — ซ่อน global header/ปุ่ม/steps, พื้นขาว, กันการ์ดขาดหน้า
   **คง** print fix ของ iOS (`azPrint`) และ page-break เฉพาะของ iShield ไว้

## งานต่อเครื่องมือ

### บำนาญ สมาร์ท 95 (pilot — งานน้อยสุด, ต้นแบบ pattern)
- สลับ token teal→navy, ทอง `#E09F3E`→`#C79A3A`
- เปลี่ยนฟอนต์ Prompt/Sarabun → IBM Plex Sans Thai
- ตัด sticky header + ลบ `<style>` hack ที่ offset sticky ใน `index.html`
- ย้าย CSS ส่วนกลางออกไป `theme.css`, `src/styles.css` เหลือเฉพาะ steps/collapse/tax-grid
- **แก้ `scripts/build.mjs` และ `scripts/build_web.mjs`** ให้ inline/คัดลอก `../assets/theme.css`
  ตอน build (เดิม inline แต่ global-header + styles ของตัวเอง)
- ยืนยัน: `npm run verify` เขียว, `npm run build:all` สำเร็จ, ตัวเลขในผลลัพธ์ไม่เปลี่ยน

### LifeReady
- เปลี่ยน header เป็นโครง `.az-hero` ใหม่
- แปลงการ์ด `h2 + <span class="n">` → `.az-card-h`/`.az-card-b`
- เพิ่ม `.az-steps` + KPI boxes ในหน้าผลลัพธ์
- ปรับสีกราฟมูลค่ากรมธรรม์ (`cvChart`) เป็น navy/gold
- ต้องไล่แก้ class ที่ generate ใน `js/app.js` ด้วย (engine ไม่แตะ)

### iShield (งานมากสุด)
- ดึง CSS ที่ฝังใน `index.html` (~655 บรรทัด) ออกมาเป็น `ishield/css/styles.css`
- ลบ inline `style=` 18 จุด → แทนด้วย class
- เปลี่ยน header การ์ดมุมมน → `.az-hero` มาตรฐาน
- เพิ่ม `.az-steps`, จัดการ์ด/ตารางเข้า `.az-card`/`.az-table`
- คง page-break print (`.vtsection`, `ol.dzlist`) ไว้

## ลำดับการทำ

1. สร้าง `assets/theme.css` (tokens + components + print) และ import ฟอนต์
2. บำนาญ 95 (pilot) → verify + build เขียว
3. LifeReady
4. iShield
5. QA รวม: มือถือ 2 คอลัมน์, iPad, print/PDF ทั้ง 3 ตัว, cache-bust `?v=` ของไฟล์ CSS
6. อัปเดตหมายเหตุ brand ใน `pension-smart95/CLAUDE.md` (teal `#0f4c5c`+gold `#e09f3e` → navy+gold; Prompt/Sarabun → IBM Plex Sans Thai)

## ความเสี่ยง / จุดที่ต้องระวัง

1. HTML จำนวนมากถูก generate จาก `app.js` ของแต่ละตัว — ต้อง sweep ทุกไฟล์ ไม่ใช่แค่ `index.html`
2. Build script ของบำนาญ 95 ต้อง inline ไฟล์จาก `../assets` ให้ครบ ไม่งั้น `dist/` จะไม่มีธีม
3. ห้ามกระทบ `azPrint` / iOS print fix (มีอยู่ข้ามเครื่องมือ)
4. ไม่แตะ engine/สูตร/rounding — ค่าที่แสดงต้องเท่าเดิมทุกกรณี
5. ตัวแปร CSS เดิมของแต่ละไฟล์ (`--navy`, `--primary`, `--teal` …) ชื่อชนกัน — ใช้ prefix `--az-*`
   ในไฟล์กลาง และค่อยๆ เลิกใช้ตัวแปรเดิม เพื่อไม่ให้ค่าคาบเกี่ยวกันระหว่างทาง

## เกณฑ์ว่าเสร็จ

- ทั้งสามตัวใช้ header, การ์ด, steps, ปุ่ม, ตาราง, KPI, สี และฟอนต์ชุดเดียวกัน
- วางหน้าจอสามตัวข้างกันแล้วดูเป็นแอปเดียวกัน
- บำนาญ 95 `npm run verify` เขียว + `dist/` มีธีมครบ
- พิมพ์ PDF ทั้งสามตัวออกมาหน้าตาสอดคล้องกันและไม่พัง
- responsive: มือถือ 2 คอลัมน์ / iPad ตามพฤติกรรมเดิมของ Hub
