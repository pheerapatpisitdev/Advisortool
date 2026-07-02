# Design — PIN Gate (ระบบปิดด้วยรหัสผ่าน 6 หลัก)

วันที่: 2026-07-02
สถานะ: อนุมัติดีไซน์แล้ว รอทำแผน implementation

## 1. เป้าหมาย

ทำให้ Advisortool เป็น "ระบบปิด" — ต้องใส่รหัสผ่าน (PIN) 6 หลักก่อนเข้าใช้งาน
ครอบคลุมทั้ง Hub และเครื่องมือย่อยทั้ง 10 ตัว เพื่อกันคนที่ไม่มีรหัสเข้าใช้งาน
รวมถึงกรณีเปิดลิงก์ตรงไปเครื่องมือย่อย (deep link) ก็ต้องติดรหัสด้วย

## 2. ขอบเขตการตัดสินใจ (สรุปจากการ brainstorm)

| หัวข้อ | ที่เลือก |
|---|---|
| ระดับความปิด | Shared team PIN — เช็คฝั่งเบราว์เซอร์ (soft gate) |
| ขอบเขต | **ทุกหน้า** — Hub (`index.html` ราก) + เครื่องย่อย 10 ตัว |
| การจำสถานะ | `localStorage` + หมดเวลาแบบ idle (sliding) ค่าเริ่มต้น 12 ชั่วโมง |
| การเก็บ PIN | ตัวเลขตรงๆ (plaintext) ในไฟล์ config เปลี่ยนง่าย |

### ข้อจำกัดที่ยอมรับร่วมกัน (ต้องรับรู้)

- **เป็น soft gate เท่านั้น** เว็บ static เปิดซอร์สได้ทั้งหมด PIN อ่านได้ในไฟล์ config
  → กันคนทั่วไป/คนที่ได้ลิงก์มาโดยไม่มีรหัส แต่ **ไม่กัน**คนที่เปิดดูโค้ด
- ถ้าต้องการ "ปิดจริง" กว่านี้ในอนาคต ต้องยกไประดับ backend (ตรวจ PIN ผ่าน Supabase)
  หรือระดับ host (Netlify password / Cloudflare Access) — ออกแบบครั้งนี้ไม่รวมส่วนนั้น

## 3. สถาปัตยกรรม

ทำเป็น **โมดูลกลางที่ inject ตัวเอง** ตามสไตล์ `assets/global-header.js` ที่โปรเจกต์ใช้อยู่
gate รันใน `<head>` ก่อนเนื้อหาหน้าจะแสดง เพื่อไม่ให้เห็นหน้าจริง "แว้บ" ก่อนถูกบัง

### ไฟล์ใหม่ (3 ไฟล์ ใน `assets/`)

| ไฟล์ | หน้าที่ |
|---|---|
| `assets/pin-gate.config.js` | ตั้งค่าเดียว: `pin`, storage key, จำนวนครั้งที่ผิดได้, เวลา lockout, idle timeout, ข้อความ — **แก้รหัส/ตั้งค่าที่นี่ที่เดียว** |
| `assets/pin-gate.js` | ตรรกะ gate ทั้งหมด: เช็คสถานะ → ถ้ายังไม่ปลด ล็อกหน้า + แสดง keypad เต็มจอ → ตรวจ PIN → ปลดล็อก → mount ปุ่มล็อกเอง |
| `assets/pin-gate.css` | สไตล์ฉากล็อก + keypad ให้เข้าธีม Navy & Gold (ใช้ตัวแปรจาก `assets/theme.css`) |

### ไฟล์เดิมที่แก้ (11 ไฟล์ — เพิ่ม include ใน `<head>`)

`index.html` (ราก) + `{lifeready,ihealthy,ci123,ishield,fhc,career-agent,agency,global-saving,pension-smart95,group-insurance}/index.html`

เพิ่ม 3 บรรทัดใกล้ต้น `<head>` (ก่อน stylesheet หลัก):

- Hub ราก:
  ```html
  <link rel="stylesheet" href="assets/pin-gate.css" />
  <script src="assets/pin-gate.config.js"></script>
  <script src="assets/pin-gate.js"></script>
  ```
- เครื่องย่อย (ลึกลงไป 1 ระดับ ใช้ `../`):
  ```html
  <link rel="stylesheet" href="../assets/pin-gate.css" />
  <script src="../assets/pin-gate.config.js"></script>
  <script src="../assets/pin-gate.js"></script>
  ```

> เครื่องย่อยทั้ง 10 ตัวอยู่ลึก 1 ระดับเท่ากันหมด (อ้าง `../assets/global-header.js` อยู่แล้ว) → path `../assets/` ใช้ได้เหมือนกันทุกตัว

### ตัวอย่าง config

```js
window.PIN_GATE_CONFIG = {
  pin: '123456',              // ← เปลี่ยนรหัสตรงนี้ (6 หลัก)
  storageKey: 'az_gate',      // key ใน localStorage
  idleTimeoutMs: 12 * 60 * 60 * 1000,  // idle 12 ชม. → ล็อกใหม่
  maxAttempts: 5,             // ผิดกี่ครั้งถึงล็อกชั่วคราว
  lockoutSeconds: 30,         // ล็อกนานเท่าไร (วินาที)
  title: 'กรุณาใส่รหัสผ่าน',
  subtitle: 'Advisortool'
};
```

## 4. Flow การทำงาน

1. เปิดหน้าใดก็ได้ → `pin-gate.js` รันใน `<head>` ทันที
2. อ่านสถานะจาก `localStorage[storageKey]` = `{ unlocked: true, ts: <เวลาปลดล่าสุด> }`
3. **ตรวจสถานะ:**
   - มี record, `unlocked === true`, และ `now - ts <= idleTimeoutMs` → **ปลดอยู่** → refresh `ts = now` (ต่ออายุ sliding) → ไม่ทำอะไรอื่น หน้าแสดงปกติ
   - นอกนั้น (ไม่มี record / หมดเวลา / ถูกล็อกเอง) → **ยังไม่ปลด**
4. **ยังไม่ปลด:** ใส่ class `az-locked` ที่ `document.documentElement` ทันที (CSS ซ่อนเนื้อหา + แสดงฉากล็อกเต็มจอ) → สร้าง overlay keypad แล้ว append เข้า `documentElement` เลย (ไม่รอ `body` เพื่อกัน FOUC)
5. ผู้ใช้กดรหัส 6 หลัก → ครบ auto-submit เทียบกับ `config.pin`
   - **ถูก:** เขียน `localStorage` = `{ unlocked:true, ts:now }` → overlay fade ออก → ลบ class `az-locked` → หน้าแสดง
   - **ผิด:** keypad สั่น (shake) + ล้าง 6 จุด + นับครั้ง; ครบ `maxAttempts` → ปิด keypad ชั่วคราว นับถอยหลัง `lockoutSeconds` แล้วปลดให้ลองใหม่

## 5. UI ของ keypad

- overlay เต็มจอ พื้นหลังธีม Navy & Gold + แบรนด์/ชื่อ + `subtitle`/`title`
- จุดแสดงความคืบหน้า ●●●●●● (6 จุด เติมทีละหลัก)
- ปุ่มเลข 0–9 + ⌫ ปุ่มใหญ่แตะง่ายบนมือถือ
- รองรับพิมพ์จากคีย์บอร์ดจริงบนคอม (keydown 0–9, Backspace, Enter)
- ปุ่ม **"ล็อก"** เล็กๆ (เช่น มุมบน/ในเมนู) กดเพื่อล้างสถานะ + ล็อกทันที (optional แต่รวมใน MVP)
- accessibility: focus, `aria-label` ปุ่ม, ป้องกัน scroll ทะลุ overlay

## 6. การจัดการเคสขอบ

| เคส | พฤติกรรม |
|---|---|
| `localStorage` ใช้ไม่ได้ (โหมดส่วนตัว/ปิดไว้) | fallback เป็นตัวแปรในหน่วยความจำ (in-memory) — gate ยังทำงานในหน้านั้น ไม่ crash แค่ไม่จำข้ามหน้า |
| `config` หาย / `pin` ว่างหรือไม่ใช่ 6 หลัก | fail-closed — คงล็อกไว้ + ข้อความแจ้งตั้งค่าผิด |
| ปิด JavaScript | หน้าไม่แสดง (แอปก็ทำงานไม่ได้อยู่แล้วเพราะต้องใช้ JS) — ยอมรับได้ |
| record ใน localStorage เพี้ยน/parse ไม่ได้ | ถือว่ายังไม่ปลด (ล็อก) |

## 7. พฤติกรรมที่คาดหวัง (สรุป)

| สถานการณ์ | ผลลัพธ์ |
|---|---|
| ใส่ PIN ที่หน้าใดก็ได้ แล้วเปิดเครื่องมืออื่น (แท็บเดิม/แท็บใหม่) บนเบราว์เซอร์เดิม | ผ่านหมด ไม่ถามซ้ำ |
| คนอื่นได้ลิงก์ตรง `/ihealthy/` เปิดบนเครื่อง/เบราว์เซอร์ที่ยังไม่เคยปลด | ติดรหัสก่อน |
| ทิ้งไว้ไม่ใช้งานเกิน 12 ชม. → กลับมา | ถามใหม่ |
| กดปุ่ม "ล็อก" เอง | ถามใหม่ทันที |
| กดรหัสผิดครบ `maxAttempts` ครั้ง | ล็อก keypad นับถอยหลัง `lockoutSeconds` |

## 8. การทดสอบ (manual — โปรเจกต์นี้ไม่มี test runner ตาม vanilla convention)

Checklist:
- [ ] เปิด Hub ครั้งแรก → เจอ keypad บังหน้า (ไม่เห็นเนื้อหาจริงแว้บ)
- [ ] ใส่ PIN ถูก → ปลด + หน้าแสดง; รีเฟรช → ยังปลดอยู่
- [ ] เปิดเครื่องมือย่อยแท็บใหม่บนเบราว์เซอร์เดิม → ผ่านเลย
- [ ] เปิดลิงก์ตรง `/ihealthy/` บนเบราว์เซอร์ที่ยังไม่ปลด (เช่น incognito) → ติดรหัส
- [ ] ใส่ PIN ผิด → สั่น + ล้างจุด + นับครั้ง; ครบ maxAttempts → lockout นับถอยหลัง
- [ ] กดปุ่ม "ล็อก" → ถามใหม่ทันที
- [ ] ปรับนาฬิกา/แก้ ts ให้เกิน idleTimeoutMs → กลับมาถามใหม่
- [ ] มือถือ: ปุ่ม keypad แตะได้ ขนาดพอเหมาะ; คอม: พิมพ์คีย์บอร์ดได้
- [ ] เปลี่ยน `pin` ใน config → รหัสใหม่ใช้ได้ รหัสเก่าใช้ไม่ได้

## 9. สิ่งที่ "ไม่" ทำในรอบนี้ (YAGNI)

- ไม่ทำ backend verification (Supabase Edge Function ตรวจ PIN)
- ไม่ทำ per-user login / หลายรหัส
- ไม่ทำ host-level protection
- ไม่ hash PIN (เลือกเก็บ plaintext ตามที่ตกลง)
- ไม่กันด้วย `<noscript>`
