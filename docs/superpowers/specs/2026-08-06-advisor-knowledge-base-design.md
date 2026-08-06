# Design: คลังความรู้ AI Advisor (Product Knowledge Base)

- วันที่: 2026-08-06
- สถานะ: อนุมัติ design แล้ว รอ implement
- ผู้เกี่ยวข้อง: AI Advisor (`advisor/`), เครื่องมือทั้ง 14 รายการในโปรเจค

## เป้าหมาย

ให้ AI Advisor ตอบคำถามรายละเอียดแบบประกันและเครื่องมือทั้งหมดในโปรเจคได้ลึกกว่า
สรุป 1 บรรทัดใน `catalog.mjs` โดยสร้างคลังความรู้ต่อผลิตภัณฑ์จากข้อมูลจริงในโปรเจค
และให้ LLM ดึงผ่าน function tool ใหม่ตามต้องการ (on-demand)

การตัดสินใจหลักที่ผู้ใช้เลือกแล้ว:

1. ขอบเขตเนื้อหา: รายละเอียดแบบประกันครบทั้ง 14 ผลิตภัณฑ์ — ตัวเลขเบี้ยยังบังคับผ่าน
   server calculator เหมือนเดิม ไม่ให้ LLM อ่านตารางเบี้ยเอง
2. แหล่งข้อมูล: เฉพาะข้อมูลที่มีในโปรเจคเท่านั้น (index.html, data files, README,
   CLAUDE.md ของแต่ละเครื่องมือ) ไม่เพิ่มเอกสารภายนอก
3. สถาปัตยกรรม: knowledge tool `get_product_knowledge(productId)` + ไฟล์ความรู้
   ต่อผลิตภัณฑ์ ไม่ฝังทุกอย่างใน system prompt และไม่ทำ vector DB

## สถาปัตยกรรม

```text
advisor/
├── knowledge/                  # ใหม่ — คลังความรู้ 14 ไฟล์ (markdown ภาษาไทย)
│   ├── life-treasure.md
│   ├── 12pl.md
│   ├── easy-protect6.md
│   ├── lifeready.md
│   ├── ismart80-6.md
│   ├── global-saving.md
│   ├── pension-smart95.md
│   ├── ihealthy.md
│   ├── ci123.md
│   ├── ishield.md
│   ├── group-insurance.md
│   ├── fhc.md
│   ├── career-agent.md
│   └── agency.md
└── lib/
    ├── knowledge.mjs           # ใหม่ — loader + cache + getProductKnowledge(id)
    ├── openai-advisor.mjs      # แก้ — เพิ่ม tool + ปรับ system prompt
    └── catalog.mjs             # คงเดิม — ยังเป็นแค็ตตาล็อกสรุปสำหรับ search/คัดกรอง
```

### หน่วยและหน้าที่

| หน่วย | หน้าที่ | อินเทอร์เฟซ | พึ่งพา |
| --- | --- | --- | --- |
| `advisor/knowledge/*.md` | เนื้อหาความรู้ต่อผลิตภัณฑ์ | ไฟล์ markdown โครงหัวข้อมาตรฐาน | — |
| `advisor/lib/knowledge.mjs` | อ่านไฟล์ + cache ในหน่วยความจำ | `getProductKnowledge(productId)` → `{ productId, content }` หรือ throw ถ้า id ไม่รู้จัก | `node:fs`, รายชื่อ id จาก `catalog.mjs` |
| tool `get_product_knowledge` | ให้ LLM ดึงความรู้ตามต้องการ | parameter `productId` เป็น enum จาก PRODUCTS ids (strict) | `knowledge.mjs` |
| system prompt | บังคับให้เรียก tool ก่อนตอบรายละเอียด | ข้อความกฎใน `systemInstructions()` | — |

### การไหลของข้อมูล

1. ผู้ใช้ถาม เช่น "iSmart 80/6 มีเงินคืนยังไง"
2. LLM เรียก `get_product_knowledge("ismart80-6")`
3. Server อ่าน `advisor/knowledge/ismart80-6.md` (cache หลังครั้งแรก) คืน content
4. ผลลัพธ์เข้า evidence array เดิมอัตโนมัติ (ตรวจย้อนกลับได้เหมือน calculator)
5. LLM ตอบจากเนื้อหาไฟล์ — ถ้าผู้ใช้ถามตัวเลขเบี้ย ต้องเรียก calculator tool ต่อ
   หรือส่งลิงก์เครื่องมือถ้าไม่มี server calculator (กฎเดิมคงไว้ทั้งหมด)

## โครงหัวข้อมาตรฐานของไฟล์ความรู้

ทุกไฟล์ใช้โครงเดียวกัน กติกา: ผลิตภัณฑ์ประกัน (11 ตัวแรก) คงครบทุกหัวข้อ —
หัวข้อที่ไม่มีจริงให้เขียนว่า "ไม่มี" พร้อมเหตุผลสั้น ๆ; เครื่องมือที่ไม่ใช่แบบประกัน
(fhc, career-agent, agency) ใช้เฉพาะหัวข้อ 1, 7, 8, 9 และเพิ่มหัวข้อ
"สิ่งที่เครื่องมือประเมิน/คำนวณ" แทนหัวข้อ 2–6:

1. **ภาพรวม** — ประเภทแบบประกัน จุดเด่น เหมาะกับเป้าหมายใด
2. **เงื่อนไขรับประกัน** — ช่วงอายุรับประกัน ทุนขั้นต่ำ–สูงสุด เงื่อนไขเฉพาะ
3. **ระยะเวลา** — ระยะชำระเบี้ย ระยะคุ้มครอง
4. **ผลประโยชน์** — กรณีเสียชีวิต เงินคืนรายปี เงินครบกำหนด มูลค่ากรมธรรม์
   (อธิบายโครงสร้าง/สูตร ไม่ใส่ตารางตัวเลขรายอายุ)
5. **สัญญาเพิ่มเติมที่เครื่องมือรองรับ** — รายชื่อ riders และเงื่อนไขที่ฝังในเครื่องมือ
6. **งวดชำระและตัวคูณ** — รายปี / 6 เดือน / 3 เดือน / รายเดือน พร้อมตัวคูณจริงจากโค้ด
7. **การใช้เครื่องมือ** — กรอกอะไรได้ ฟีเจอร์เด่น (เช่น two-way calc, ตารางมูลค่า, พิมพ์)
8. **ขอบเขตข้อมูล** — สิ่งที่ *ไม่มี* ในเครื่องมือ (ข้อยกเว้น ระยะรอคอย เงื่อนไขรับประกัน
   รายบุคคล ฯลฯ) เพื่อกันไม่ให้ LLM แต่งเติม ให้ชี้ไปเอกสารบริษัท
9. **ที่มา** — รายชื่อไฟล์ต้นทางที่ใช้สกัดข้อมูล (เช่น `ismart80-6/js/data.js`,
   `ismart80-6/groundtruth.json`) เพื่อ audit ย้อนกลับได้

ข้อกำหนดเนื้อหา:

- ภาษาไทย ตัวเลขมี comma ตาม convention ของโปรเจค (ยกเว้นอายุ/ปี/%)
- ห้ามใส่ข้อมูลที่ไม่มีแหล่งอ้างอิงในโปรเจค — ถ้าไม่พบให้เขียนว่าไม่มีข้อมูลในเครื่องมือ
- ขนาดต่อไฟล์โดยประมาณ 1,500–3,000 token เพื่อไม่ให้ context บวมเวลาเรียกหลายไฟล์

## การเปลี่ยนแปลงใน `openai-advisor.mjs`

1. เพิ่ม tool definition ใน `OPENAI_TOOLS`:
   - `name: 'get_product_knowledge'`, strict, parameter เดียว `productId`
     เป็น `enum` จาก `PRODUCTS.map(p => p.id)`
   - description: ใช้ดึงรายละเอียดผลิตภัณฑ์ก่อนตอบคำถามเชิงลึก
2. dispatch ใน `runAdvisor`: เพิ่ม branch สำหรับ `get_product_knowledge`
   (เรียก `getProductKnowledge(args.productId)`) — ยังอยู่ใต้ลิมิตเดิม
   (สูงสุด 4 calls/turn, 4 turns)
3. ปรับ `systemInstructions()`:
   - เพิ่มกฎ: ก่อนตอบรายละเอียดผลิตภัณฑ์ (ผลประโยชน์ เงื่อนไข ระยะเวลา riders)
     ต้องเรียก `get_product_knowledge` ของผลิตภัณฑ์นั้นก่อน ห้ามตอบจากความจำ
   - กฎเดิมคงไว้ทั้งหมด โดยเฉพาะ: ตัวเลขต้องมาจาก calculator tool เท่านั้น

## Deploy (Vercel)

- `vercel.json` → `functions["api/advisor.mjs"].includeFiles` เพิ่ม
  `advisor/knowledge/**` (รูปแบบ glob เดียวกับที่ Vercel รองรับใน pattern เดิม)
- local: ใช้ได้ทั้ง `npm run dev:ai` และ `npm start` โดยไม่ต้องตั้งค่าเพิ่ม
- หมายเหตุ: ไฟล์ความรู้เป็นข้อมูลผลิตภัณฑ์สาธารณะ ไม่ใช่ secret — ไม่จำเป็นต้อง
  block จาก static serving (ปัจจุบัน `server.mjs` block เฉพาะ `advisor/lib/`)

## Error handling

- `productId` นอก enum: OpenAI strict mode กันชั้นแรก; `knowledge.mjs` throw
  ข้อความไทยชั้นสอง → เข้า branch error เดิมของ tool loop (คืน `{ error }`)
- ไฟล์หาย/อ่านไม่ได้: throw ข้อความไทย `ไม่พบคลังความรู้ของ <id>` — LLM จะ
  fallback ไปตอบจาก catalog + ลิงก์เครื่องมือตามกฎเดิม
- cache: อ่านครั้งแรกแล้วเก็บใน module-level Map (แบบเดียวกับ `ci123Data ||= ...`
  ใน `calculators.mjs`)

## Testing

เพิ่มใน test suite เดิม (`npm test`, ไม่เรียก OpenAI จริง):

1. **ครบถ้วน**: ทุก id ใน `PRODUCTS` มีไฟล์ `advisor/knowledge/<id>.md` และไฟล์
   ไม่ว่าง + มีหัวข้อ "ที่มา"
2. **loader**: `getProductKnowledge` คืน content ถูกไฟล์, throw เมื่อ id ไม่รู้จัก
3. **tool loop**: mock ลำดับ `get_product_knowledge` → คำตอบ ตรวจว่า evidence
   บันทึกและ output ส่งกลับโมเดลถูกรูปแบบ
4. **tool definition**: enum ใน tool ตรงกับ `PRODUCTS` ids (กัน drift เมื่อเพิ่มผลิตภัณฑ์)

## กระบวนการสกัดความรู้ (ขั้น implement)

อ่านทุกเครื่องมือแบบละเอียด — `index.html`, `app.js`/`js/`, data files, README,
CLAUDE.md, `groundtruth.json` — สกัดเงื่อนไข ผลประโยชน์ สูตร และฟีเจอร์ที่ฝังใน
โค้ดจริง เขียนเป็นไฟล์ความรู้ตามโครงข้างบน ตรวจตัวเลขสำคัญ (เช่น ตัวคูณงวดชำระ
อัตราเงินคืน ช่วงอายุ) กับโค้ดต้นทางทุกค่า

## สิ่งที่ไม่ทำ (YAGNI)

- ไม่ทำ vector DB / embedding / semantic search
- ไม่ฝังตารางเบี้ยเต็มในไฟล์ความรู้ — ตัวเลขใช้ calculator หรือส่งลิงก์เครื่องมือ
- ไม่แต่งเติมข้อมูลนอกโปรเจค (ข้อยกเว้นกรมธรรม์ เงื่อนไขเคลม ฯลฯ)
- ไม่เพิ่ม server calculator ใหม่ในงานนี้ (แยกเป็นงานอนาคตได้)
- ไม่เปลี่ยน UI ของหน้า `/advisor/`
