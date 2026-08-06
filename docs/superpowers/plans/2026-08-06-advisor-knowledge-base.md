# AI Advisor Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ AI Advisor ตอบรายละเอียดผลิตภัณฑ์ทั้ง 14 รายการได้จากคลังความรู้จริงในโปรเจค ผ่าน function tool ใหม่ `get_product_knowledge`

**Architecture:** ไฟล์ความรู้ markdown ต่อผลิตภัณฑ์ใน `advisor/knowledge/` + loader (`advisor/lib/knowledge.mjs`) ที่ cache ในหน่วยความจำ + tool definition/dispatch ใน `advisor/lib/openai-advisor.mjs` — ตัวเลขเบี้ยยังบังคับผ่าน calculator เดิม

**Tech Stack:** Node.js 20+ (ESM), `node:test`, OpenAI Responses API (mock ใน test), Vercel Functions

**Spec:** `docs/superpowers/specs/2026-08-06-advisor-knowledge-base-design.md`

---

## File Structure

| ไฟล์ | สถานะ | หน้าที่ |
| --- | --- | --- |
| `advisor/knowledge/<id>.md` (14 ไฟล์) | สร้างใหม่ | เนื้อหาความรู้ต่อผลิตภัณฑ์ ภาษาไทย โครงหัวข้อมาตรฐาน |
| `advisor/lib/knowledge.mjs` | สร้างใหม่ | `getProductKnowledge({ productId })` → `{ kind, productId, content, source, disclaimer }` + cache |
| `advisor/lib/openai-advisor.mjs` | แก้ไข | เพิ่ม tool `get_product_knowledge`, dispatch branch, กฎใน system prompt |
| `tests/knowledge.test.mjs` | สร้างใหม่ | loader, tool enum, tool loop (mock), completeness |
| `vercel.json` | แก้ไข | เพิ่ม `advisor/knowledge/*.md` ใน `includeFiles` |
| `advisor/README.md` | แก้ไข | บันทึกสถาปัตยกรรมคลังความรู้ |

## กติกาการเขียนไฟล์ความรู้ (ใช้ทุก task ที่เขียน .md)

1. **ห้ามใส่ข้อมูลที่ไม่มีในโปรเจค** — ทุกข้อเท็จจริงต้องชี้ได้ว่ามาจากไฟล์ไหน ถ้าเครื่องมือไม่มีข้อมูล ให้เขียนตรง ๆ ว่า "เครื่องมือไม่ระบุ ต้องดูเอกสารบริษัท"
2. **ห้ามใส่ตารางเบี้ยรายอายุ** — บอกได้แค่โครงสร้าง (ช่วงอายุ, ระดับทุน, ตัวคูณงวด) ตัวเลขจริงชี้ไป calculator tool หรือลิงก์เครื่องมือ
3. จำนวนเงินใส่ comma (เช่น 100,000 บาท) — อายุ/ปี/% ไม่ใส่
4. หัวข้อ "ที่มา" ต้องมีเสมอ และระบุ path ไฟล์ต้นทางจริงทุกไฟล์ที่ใช้
5. ยาวประมาณ 40–120 บรรทัดต่อไฟล์ (~1,500–3,000 token)

**โครงหัวข้อผลิตภัณฑ์ประกัน (11 ไฟล์):**

```markdown
# <ชื่อผลิตภัณฑ์>

## ภาพรวม
## เงื่อนไขรับประกัน
## ระยะเวลา
## ผลประโยชน์
## สัญญาเพิ่มเติมที่เครื่องมือรองรับ
## งวดชำระและตัวคูณ
## การใช้เครื่องมือ
## ขอบเขตข้อมูล
## ที่มา
```

หัวข้อที่ผลิตภัณฑ์นั้นไม่มีจริง ให้คงหัวข้อไว้แล้วเขียน "ไม่มี" พร้อมเหตุผลสั้น ๆ

**โครงหัวข้อเครื่องมือที่ไม่ใช่แบบประกัน (fhc, career-agent, agency):**

```markdown
# <ชื่อเครื่องมือ>

## ภาพรวม
## สิ่งที่เครื่องมือประเมิน/คำนวณ
## การใช้เครื่องมือ
## ขอบเขตข้อมูล
## ที่มา
```

---

### Task 1: Loader `knowledge.mjs` + ไฟล์นำร่อง `ci123.md`

**Files:**

- Create: `advisor/knowledge/ci123.md`
- Create: `advisor/lib/knowledge.mjs`
- Test: `tests/knowledge.test.mjs`

- [ ] **Step 1: เขียน failing test**

สร้าง `tests/knowledge.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductKnowledge } from '../advisor/lib/knowledge.mjs';

test('loader คืนคลังความรู้ ci123 พร้อม metadata', () => {
  const knowledge = getProductKnowledge({ productId: 'ci123' });
  assert.equal(knowledge.kind, 'product_knowledge');
  assert.equal(knowledge.productId, 'ci123');
  assert.equal(knowledge.source, 'advisor/knowledge/ci123.md');
  assert.ok(knowledge.content.length > 200);
  assert.match(knowledge.content, /ที่มา/);
  assert.match(knowledge.disclaimer, /ไม่ใช่เอกสารเสนอขาย/);
});

test('loader ปฏิเสธ productId ที่ไม่รู้จัก', () => {
  assert.throws(() => getProductKnowledge({ productId: 'unknown-product' }), /ไม่รู้จักผลิตภัณฑ์/);
});

test('loader แจ้งเมื่อยังไม่มีไฟล์ความรู้ของผลิตภัณฑ์ที่รู้จัก', () => {
  assert.throws(() => getProductKnowledge({ productId: 'ishield' }), /ไม่พบคลังความรู้/);
});
```

หมายเหตุ: test ที่สามใช้ `ishield` เพราะเป็น id จริงที่ยังไม่มีไฟล์ใน task นี้ — เมื่อไฟล์ถูกทยอยสร้าง ให้สลับ id ตามลำดับ: Task 5 เปลี่ยนเป็น `group-insurance`, Task 6 เปลี่ยนเป็น `fhc`, และ**ลบ test นี้ทิ้งใน Task 7** เมื่อไฟล์ครบทั้ง 14 (แต่ละ task มี step บอกไว้แล้ว)

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `node --test tests/knowledge.test.mjs`
Expected: FAIL — `Cannot find module '.../advisor/lib/knowledge.mjs'`

- [ ] **Step 3: เขียนไฟล์นำร่อง `advisor/knowledge/ci123.md`**

ก่อนเขียน อ่านต้นทางให้ครบ: `ci123/index.html` (ตารางผลประโยชน์, เงื่อนไข, waiting period, ข้อยกเว้น), `ci123/data.js` (โครงตาราง), `ci123/README.md` (ตัวคูณงวด) แล้วเขียนตามข้อมูลจริง เนื้อหาต่อไปนี้คือฉบับร่างจากข้อมูลที่ตรวจแล้ว — **ต้องตรวจหัวข้อ "ระยะเวลา" และรายละเอียดเงื่อนไขกับ index.html อีกครั้ง แล้วแก้ให้ตรงจริงก่อน commit**:

```markdown
# CI 123 — ประกันโรคร้ายแรงหลายระยะ

## ภาพรวม

สัญญาคุ้มครองโรคร้ายแรงที่แบ่งผลประโยชน์ตามระยะความรุนแรงของโรค จ่ายเป็นเปอร์เซ็นต์
ของจำนวนเงินเอาประกันภัย ครอบคลุมตั้งแต่ระยะก่อนเริ่มต้นจนถึงระยะรุนแรง รวมถึงหมวด
โรคร้ายแรงสำหรับเด็ก เหมาะกับเป้าหมายความคุ้มครองโรคร้ายแรง (critical_illness)

## เงื่อนไขรับประกัน

- ตารางเบี้ยครอบคลุมอายุ 0–70 ปี แยกเพศชาย/หญิง
- ทุนประกันที่มีในตาราง 7 ระดับ: 500,000 / 1,000,000 / 2,000,000 / 3,000,000 /
  4,000,000 / 5,000,000 / 10,000,000 บาท

## ระยะเวลา

เครื่องมือไม่ระบุระยะเวลาคุ้มครอง/ระยะชำระเบี้ยโดยตรง ต้องตรวจจากเอกสารบริษัท

## ผลประโยชน์

จ่ายตามระยะของโรค (เปอร์เซ็นต์ของจำนวนเงินเอาประกันภัยเริ่มต้น):

- โรคร้ายแรงระยะรุนแรง: 100% (53 โรค)
- โรคร้ายแรงระยะเริ่มต้นถึงปานกลาง: 25% (42 โรค)
- โรคร้ายแรงระยะก่อนเริ่มต้น: 20% จ่ายสูงสุดไม่เกิน 100,000 บาท (6 โรค)
- โรคร้ายแรงภายใต้เงื่อนไขพิเศษ: 10% (4 โรค)
- โรคร้ายแรงสำหรับเด็ก: 25% (ผู้เอาประกันภัยอายุ 1 เดือน – 18 ปี)
- ความคุ้มครองกรณีภาวะวิกฤต: 25%

รายชื่อโรคทั้งหมดดูได้ในหน้าเครื่องมือ (รายการแบบพับได้)

## สัญญาเพิ่มเติมที่เครื่องมือรองรับ

ไม่มี — CI 123 เป็นหน้าข้อมูล + เครื่องคำนวณเบี้ยเดี่ยว ไม่มีการเลือก riders ในเครื่องมือ

## งวดชำระและตัวคูณ

- รายปี = ค่าในตาราง
- ราย 6 เดือน = ปัดเศษ(รายปี × 0.52)
- รายเดือน = ปัดเศษ(รายปี × 0.09)

## การใช้เครื่องมือ

- หน้าเดียวประกอบด้วย ตารางผลประโยชน์, รายชื่อโรคแบบพับได้, เงื่อนไข/ตัวอย่างเคลม
  และเครื่องคำนวณเบี้ย เลือกอายุ เพศ ทุน และงวดชำระได้
- AI Advisor คำนวณเบี้ยจริงได้ผ่าน tool `calculate_ci123` (อายุ 0–70, ทุนตามตาราง)
- แชร์ผลทาง LINE ได้จากหน้าเครื่องมือ

## ขอบเขตข้อมูล

- หน้าเครื่องมือมีสรุปเงื่อนไข ระยะเวลาที่ไม่คุ้มครอง (waiting period) และข้อยกเว้น
  แต่รายละเอียดฉบับเต็มต้องดูเอกสารเสนอขายและกรมธรรม์จริงของบริษัท
- เบี้ยจากตารางไม่รวมผลการพิจารณารับประกันรายบุคคล

## ที่มา

- `ci123/index.html` — ตารางผลประโยชน์ เงื่อนไข ข้อยกเว้น ตัวอย่างเคลม
- `ci123/data.js` — โครงตารางเบี้ย (`CI123_PREMIUMS`) และรายชื่อโรค (`CI123_DISEASES`)
- `ci123/README.md` — สูตรตัวคูณงวดชำระ
```

- [ ] **Step 4: เขียน `advisor/lib/knowledge.mjs`**

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from './catalog.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const knowledgeDir = path.resolve(here, '../knowledge');
const cache = new Map();

export function getProductKnowledge(input) {
  const productId = String(input?.productId || '');
  if (!PRODUCTS.some((product) => product.id === productId)) throw new RangeError(`ไม่รู้จักผลิตภัณฑ์ ${productId}`);
  if (!cache.has(productId)) {
    let content = '';
    try { content = readFileSync(path.join(knowledgeDir, `${productId}.md`), 'utf8').trim(); }
    catch { throw new Error(`ไม่พบคลังความรู้ของ ${productId}`); }
    if (!content) throw new Error(`ไม่พบคลังความรู้ของ ${productId}`);
    cache.set(productId, content);
  }
  return {
    kind: 'product_knowledge', productId, content: cache.get(productId),
    source: `advisor/knowledge/${productId}.md`,
    disclaimer: 'ข้อมูลสรุปจากเครื่องมือในโปรเจค ไม่ใช่เอกสารเสนอขาย ต้องตรวจเงื่อนไขฉบับจริงของบริษัทก่อนเสนอขาย'
  };
}
```

- [ ] **Step 5: รัน test ให้ผ่าน**

Run: `node --test tests/knowledge.test.mjs`
Expected: PASS ทั้ง 3 ข้อ

- [ ] **Step 6: รัน test ทั้งชุดกัน regression**

Run: `npm test`
Expected: PASS ทุกไฟล์ (advisor, pin-gate, static-smoke, knowledge)

- [ ] **Step 7: Commit**

```bash
git add advisor/knowledge/ci123.md advisor/lib/knowledge.mjs tests/knowledge.test.mjs
git commit -m "feat(advisor): add product knowledge loader with ci123 pilot"
```

---

### Task 2: Tool `get_product_knowledge` + dispatch + system prompt

**Files:**

- Modify: `advisor/lib/openai-advisor.mjs` (import บรรทัด 1–2, `OPENAI_TOOLS`, `systemInstructions()`, dispatch ใน `runAdvisor`)
- Test: `tests/knowledge.test.mjs`

- [ ] **Step 1: เขียน failing tests เพิ่มใน `tests/knowledge.test.mjs`**

เพิ่ม imports บนหัวไฟล์:

```js
import { PRODUCTS } from '../advisor/lib/catalog.mjs';
import { OPENAI_TOOLS, runAdvisor } from '../advisor/lib/openai-advisor.mjs';
```

เพิ่ม tests:

```js
test('tool enum ของ get_product_knowledge ตรงกับแค็ตตาล็อก', () => {
  const tool = OPENAI_TOOLS.find((item) => item.name === 'get_product_knowledge');
  assert.ok(tool, 'ต้องมี tool get_product_knowledge');
  assert.deepEqual(tool.parameters.properties.productId.enum, PRODUCTS.map((product) => product.id));
});

test('tool loop เรียก get_product_knowledge และบันทึก evidence', async () => {
  const replies = [
    { output: [{ type: 'function_call', name: 'get_product_knowledge', arguments: JSON.stringify({ productId: 'ci123' }), call_id: 'call_1' }] },
    { output_text: 'CI 123 จ่ายผลประโยชน์ตามระยะของโรคตามคลังความรู้', output: [] }
  ];
  const fetchImpl = async (_url, options) => ({ ok: true, async json() { return replies.shift(); } });
  const result = await runAdvisor({ messages: [{ role: 'user', content: 'CI 123 คุ้มครองอะไรบ้าง' }], profile: {}, model: 'test-model', apiKey: 'test-only-not-a-real-key', fetchImpl });
  assert.equal(result.evidence[0].tool, 'get_product_knowledge');
  assert.equal(result.evidence[0].result.productId, 'ci123');
  assert.match(result.evidence[0].result.content, /โรคร้ายแรง/);
});

test('system prompt บังคับเรียกคลังความรู้ก่อนตอบรายละเอียด', async () => {
  const replies = [{ output_text: 'ทดสอบ', output: [] }];
  const seen = [];
  const fetchImpl = async (_url, options) => { seen.push(JSON.parse(options.body)); return { ok: true, async json() { return replies.shift(); } }; };
  await runAdvisor({ messages: [{ role: 'user', content: 'สวัสดี' }], profile: {}, model: 'test-model', apiKey: 'test-only-not-a-real-key', fetchImpl });
  assert.match(seen[0].instructions, /get_product_knowledge/);
});
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `node --test tests/knowledge.test.mjs`
Expected: FAIL — tool ไม่พบใน `OPENAI_TOOLS` (`assert.ok(tool)` ล้ม) และ evidence เป็น error `ไม่อนุญาตให้เรียกเครื่องมือนี้`

- [ ] **Step 3: แก้ `advisor/lib/openai-advisor.mjs`**

3.1 — เพิ่ม import (บรรทัดบนสุด ต่อจาก import เดิม):

```js
import { getProductKnowledge } from './knowledge.mjs';
```

3.2 — เพิ่ม tool definition เป็นสมาชิกตัวที่สองใน `OPENAI_TOOLS` (ถัดจาก `search_products` เพื่อให้อ่านเป็นกลุ่ม discovery ก่อน calculators):

```js
  {
    type: 'function', name: 'get_product_knowledge', strict: true,
    description: 'ดึงคลังความรู้ละเอียดของผลิตภัณฑ์ (เงื่อนไข ผลประโยชน์ ระยะเวลา สัญญาเพิ่มเติม การใช้เครื่องมือ) ต้องเรียกก่อนตอบรายละเอียดผลิตภัณฑ์ทุกครั้ง',
    parameters: { type: 'object', additionalProperties: false, properties: {
      productId: { type: 'string', enum: ['life-treasure', '12pl', 'easy-protect6', 'lifeready', 'ismart80-6', 'global-saving', 'pension-smart95', 'ihealthy', 'ci123', 'ishield', 'group-insurance', 'fhc', 'career-agent', 'agency'] }
    }, required: ['productId'] }
  },
```

หมายเหตุ: เขียน enum เป็น literal array (ไม่ใช่ `PRODUCTS.map(...)`) เพื่อให้ `OPENAI_TOOLS` เป็นค่าคงที่อ่านง่าย — test ใน Step 1 เป็นตัวกันไม่ให้ enum กับแค็ตตาล็อก drift กัน

3.3 — เพิ่มกฎใน `systemInstructions()` แทรกเป็น bullet ที่สองของ "ขอบเขต:" (ถัดจากบรรทัด "ตอบข้อเท็จจริงเฉพาะจาก..."):

```text
- ก่อนตอบรายละเอียดผลิตภัณฑ์ (ความคุ้มครอง เงื่อนไข ระยะเวลา เงินคืน สัญญาเพิ่มเติม วิธีใช้เครื่องมือ) ต้องเรียก get_product_knowledge ของผลิตภัณฑ์นั้นก่อน ห้ามตอบรายละเอียดจากความจำ หากคลังความรู้ระบุว่าไม่มีข้อมูล ให้บอกตรง ๆ และชี้ไปเครื่องมือหรือเอกสารบริษัท
```

3.4 — เพิ่ม dispatch branch ใน `runAdvisor` (ใน for-loop ของ calls ก่อน branch `TOOL_HANDLERS`):

```js
        if (call.name === 'search_products') result = searchProducts(args);
        else if (call.name === 'get_product_knowledge') result = getProductKnowledge(args);
        else if (TOOL_HANDLERS[call.name]) result = TOOL_HANDLERS[call.name](args);
        else throw new Error('ไม่อนุญาตให้เรียกเครื่องมือนี้');
```

- [ ] **Step 4: รัน test ให้ผ่านทั้งชุด**

Run: `npm test`
Expected: PASS ทุกไฟล์ — โดยเฉพาะ `advisor.test.mjs` เดิมต้องไม่พัง (mock loop เดิมไม่เรียก tool ใหม่ จึงไม่กระทบ)

- [ ] **Step 5: Commit**

```bash
git add advisor/lib/openai-advisor.mjs tests/knowledge.test.mjs
git commit -m "feat(advisor): add get_product_knowledge tool + prompt rule"
```

---

### Task 3: ไฟล์ความรู้ ihealthy + pension-smart95

**Files:**

- Create: `advisor/knowledge/ihealthy.md`
- Create: `advisor/knowledge/pension-smart95.md`

- [ ] **Step 1: อ่านต้นทาง iHealthy Ultra**

อ่าน: `ihealthy/README.md`, `ihealthy/index.html`, `ihealthy/data.js` (โครง `IH_PREMIUM`), และ `advisor/lib/calculators.mjs:61-81`

ข้อเท็จจริงขั้นต่ำที่ต้องสกัดและตรวจกับโค้ด:

- แผน 4 ระดับ: Smart, Bronze, Silver, Gold — ผลประโยชน์เด่นของแต่ละแผนตาม index.html
- ช่วงอายุตาราง 6–80 ปี แยกเพศ; อายุ 6–10 ปีเลือกได้เฉพาะ Smart/Bronze
- ตัวคูณงวด: ราย 6 เดือน × 0.52, รายเดือน × 0.09
- วงเงินเหมาจ่าย/ความคุ้มครองหลักของแต่ละแผนตามที่หน้าเครื่องมือแสดง
- AI Advisor คำนวณเบี้ยจริงผ่าน tool `calculate_ihealthy`

- [ ] **Step 2: เขียน `advisor/knowledge/ihealthy.md`**

ใช้โครงหัวข้อผลิตภัณฑ์ประกัน 9 หัวข้อ (ดู "กติกาการเขียนไฟล์ความรู้" ต้นไฟล์):
ภาพรวม / เงื่อนไขรับประกัน / ระยะเวลา / ผลประโยชน์ / สัญญาเพิ่มเติมที่เครื่องมือรองรับ /
งวดชำระและตัวคูณ / การใช้เครื่องมือ / ขอบเขตข้อมูล / ที่มา — เนื้อหาจาก Step 1 เท่านั้น
หัวข้อที่เครื่องมือไม่มีข้อมูลเขียน "เครื่องมือไม่ระบุ ต้องดูเอกสารบริษัท"

- [ ] **Step 3: อ่านต้นทาง บำนาญ สมาร์ท 95**

อ่าน: `pension-smart95/README.md`, `pension-smart95/CLAUDE.md`, `pension-smart95/index.html`,
`pension-smart95/src/engine.js`, `pension-smart95/data/tables/plans.json`,
`pension-smart95/data/tables/modes.json`, `pension-smart95/data/tables/annuity_benefit.json`
และรายชื่อ rider tables ใน `pension-smart95/data/tables/` (rate_wp, rate_pb, rate_dci_pls,
rate_meb, rate_mex, rate_mci, rate_cancer, rate_ap_ecare, rate_ihealthy)

ข้อเท็จจริงขั้นต่ำ:

- อายุรับประกัน 20–64 ปี, อายุเริ่มรับบำนาญ 55 / 60 / 65 / 70, บำนาญถึงอายุ 95
- ทางเลือกชำระ: "ชำระเบี้ย 6 ปี" กับ "ชำระเบี้ย จนรับเงินบำนาญ" + เกณฑ์อายุของแต่ละแผนจาก plans.json
- งวดชำระ 4 แบบ + ตัวคูณจริงจาก modes.json
- อัตราเงินบำนาญต่อทุนจาก annuity_benefit.json (อธิบายโครงสร้าง ไม่ลอกตาราง)
- input ได้ 3 ทาง: ทุน / เบี้ย / เงินบำนาญรายเดือน (two-way ใน engine)
- riders ที่เครื่องมือรองรับ (ตามรายชื่อ rate tables) — ระบุว่า tool `calculate_pension` ของ AI ยังไม่รวม riders
- แสดง IRR และตารางบำนาญรายปีในเครื่องมือ; เวอร์ชันข้อมูล A2026-1

- [ ] **Step 4: เขียน `advisor/knowledge/pension-smart95.md`** — โครง 9 หัวข้อเดียวกัน

- [ ] **Step 5: ตรวจว่า loader อ่านได้จริง**

Run: `node -e "import('./advisor/lib/knowledge.mjs').then((m) => ['ihealthy', 'pension-smart95'].forEach((id) => console.log(id, m.getProductKnowledge({ productId: id }).content.length)))"`
Expected: พิมพ์ id + ความยาว content (> 500) ทั้งสองรายการ ไม่ throw

- [ ] **Step 6: รัน `npm test`** — Expected: PASS ทุกไฟล์

- [ ] **Step 7: Commit**

```bash
git add advisor/knowledge/ihealthy.md advisor/knowledge/pension-smart95.md
git commit -m "docs(advisor): add ihealthy + pension-smart95 knowledge"
```

---

### Task 4: ไฟล์ความรู้ ismart80-6 + lifeready

**Files:**

- Create: `advisor/knowledge/ismart80-6.md`
- Create: `advisor/knowledge/lifeready.md`

- [ ] **Step 1: อ่านต้นทาง iSmart 80/6**

อ่าน: `ismart80-6/CLAUDE.md`, `ismart80-6/index.html`, `ismart80-6/js/data.js`,
`ismart80-6/data/premium.json` (โครง), `ismart80-6/data/cashvalue.json` (โครง),
`ismart80-6/groundtruth.json`

ข้อเท็จจริงขั้นต่ำ:

- ชำระเบี้ย 6 ปี คุ้มครองถึงอายุ 80
- เงินจ่ายคืนรายปี: อัตรา % และปีที่จ่าย ตามที่ฝังในเครื่องมือ + เงินครบกำหนด
- two-way calc: กรอกทุนหาเบี้ย หรือกรอกเบี้ยหาทุน
- riders ที่รองรับ: WP, DCI, iHealthy, CI123 (ตาม commit ล่าสุด — ตรวจกับ index.html)
- คอลัมน์ "เบี้ยสุขภาพหลังหักเงินคืน" (iHealthy net-after-cashback)
- ตารางมูลค่ากรมธรรม์ (เวนคืน/ใช้เงินสำเร็จ/ขยายเวลา) ตาม cashvalue.json

- [ ] **Step 2: เขียน `advisor/knowledge/ismart80-6.md`** — โครง 9 หัวข้อ

- [ ] **Step 3: อ่านต้นทาง Life Ready**

อ่าน: `lifeready/README.md`, `lifeready/CLAUDE.md`, `lifeready/index.html`,
`lifeready/js/data.js`, `lifeready/data/premium.json` (โครง), `lifeready/data/cashvalue.json` (โครง)

ข้อเท็จจริงขั้นต่ำ:

- แบบตลอดชีพไม่มีเงินปันผล — ระยะชำระเบี้ย/ระยะคุ้มครองตามที่เครื่องมือระบุ
- ช่วงอายุรับประกันและเพศตามโครง premium.json
- ตารางมูลค่ากรมธรรม์ที่เครื่องมือแสดง
- riders ที่เครื่องมือรองรับ (ตรวจจาก index.html)

- [ ] **Step 4: เขียน `advisor/knowledge/lifeready.md`** — โครง 9 หัวข้อ

- [ ] **Step 5: ตรวจ loader**

Run: `node -e "import('./advisor/lib/knowledge.mjs').then((m) => ['ismart80-6', 'lifeready'].forEach((id) => console.log(id, m.getProductKnowledge({ productId: id }).content.length)))"`
Expected: สอง id ผ่าน ไม่ throw

- [ ] **Step 6: รัน `npm test`** — Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add advisor/knowledge/ismart80-6.md advisor/knowledge/lifeready.md
git commit -m "docs(advisor): add ismart80-6 + lifeready knowledge"
```

---

### Task 5: ไฟล์ความรู้ life-treasure + 12pl + easy-protect6 + ishield

**Files:**

- Create: `advisor/knowledge/life-treasure.md`
- Create: `advisor/knowledge/12pl.md`
- Create: `advisor/knowledge/easy-protect6.md`
- Create: `advisor/knowledge/ishield.md`

- [ ] **Step 1: อ่านต้นทาง (เครื่องมือไฟล์เดียว)**

- LifeTreasure: `life-treasure/index.html` ทั้งไฟล์ (ตลอดชีพถึง 99, ชำระ 12 หรือ 18 ปี — สกัดช่วงอายุ อัตรา เงื่อนไข ผลประโยชน์ที่ฝังใน JS/HTML)
- 12PL: `12pl/index.html` ทั้งไฟล์ (ชำระ 12 ปี คุ้มครองถึง 85 + เงินครบกำหนด)

- [ ] **Step 2: เขียน `advisor/knowledge/life-treasure.md` และ `advisor/knowledge/12pl.md`** — โครง 9 หัวข้อ

- [ ] **Step 3: อ่านต้นทาง Easy Protect 6 + iShield**

- Easy Protect 6: `easy-protect6/index.html`, `easy-protect6/app.js`,
  `easy-protect6/source/data/easy-protect-rates.json` (โครง), `easy-protect6/source/data/rider-rates.json` (รายชื่อ riders)
  — ชำระ 6 ปี คุ้มครองถึง 99, riders ที่เลือกได้
- iShield: `ishield/index.html` ทั้งไฟล์ — ชีวิตควบโรคร้ายแรงถึงอายุ 85, ระยะชำระเบี้ยหลายแบบ (สกัดรายการจริง)

- [ ] **Step 4: เขียน `advisor/knowledge/easy-protect6.md` และ `advisor/knowledge/ishield.md`** — โครง 9 หัวข้อ

- [ ] **Step 5: ตรวจ loader — หมายเหตุ: test "ไม่พบคลังความรู้" ใน `tests/knowledge.test.mjs` จะเริ่ม fail ตั้งแต่ step นี้เพราะ `ishield.md` ถูกสร้างแล้ว ให้แก้ test นั้นในไฟล์ test ให้ใช้ id `group-insurance` แทน `ishield` (ยังไม่มีไฟล์จนถึง Task 6) แล้วรันใหม่**

Run: `node -e "import('./advisor/lib/knowledge.mjs').then((m) => ['life-treasure', '12pl', 'easy-protect6', 'ishield'].forEach((id) => console.log(id, m.getProductKnowledge({ productId: id }).content.length)))"`
Expected: สี่ id ผ่าน

Run: `npm test`
Expected: PASS (หลังแก้ test ตามหมายเหตุ)

- [ ] **Step 6: Commit**

```bash
git add advisor/knowledge/life-treasure.md advisor/knowledge/12pl.md advisor/knowledge/easy-protect6.md advisor/knowledge/ishield.md tests/knowledge.test.mjs
git commit -m "docs(advisor): add life-treasure, 12pl, easy-protect6, ishield knowledge"
```

---

### Task 6: ไฟล์ความรู้ global-saving + group-insurance

**Files:**

- Create: `advisor/knowledge/global-saving.md`
- Create: `advisor/knowledge/group-insurance.md`

- [ ] **Step 1: อ่านต้นทาง Global Saving Plus 15/8**

อ่าน: `global-saving/README.md`, `global-saving/index.html`, `global-saving/data.js`

ข้อเท็จจริงขั้นต่ำ: ชำระ 8 ปี คุ้มครอง 15 ปี, โครงสร้างผลประโยชน์ส่วนที่อ้างอิงดัชนี,
ดัชนี/เงื่อนไขที่เครื่องมือแสดง, กราฟที่เครื่องมือวาด — **หัวข้อขอบเขตข้อมูลต้องย้ำว่า
ผลตอบแทนอ้างอิงดัชนีไม่ได้รับการรับประกัน** (สอดคล้อง system prompt)

- [ ] **Step 2: เขียน `advisor/knowledge/global-saving.md`** — โครง 9 หัวข้อ

- [ ] **Step 3: อ่านต้นทาง Group Insurance**

อ่าน: `group-insurance/README.md`, `group-insurance/index.html`, `group-insurance/app.js`,
`group-insurance/data.js`, `group-insurance/translations.js`

ข้อเท็จจริงขั้นต่ำ: ประเภทแผน (สุขภาพกลุ่ม, อุบัติเหตุกลุ่ม), โครงสร้างแผน/ระดับความคุ้มครอง
ใน data.js, เงื่อนไขจำนวนพนักงานขั้นต่ำถ้ามี, ฟีเจอร์ใบเสนอราคา (PDF) และสองภาษา

- [ ] **Step 4: เขียน `advisor/knowledge/group-insurance.md`** — โครง 9 หัวข้อ

- [ ] **Step 5: ตรวจ loader — test "ไม่พบคลังความรู้" fail อีกครั้งเพราะ `group-insurance.md` ถูกสร้างแล้ว ให้แก้ให้ใช้ id `fhc` แทน (ยังไม่มีไฟล์จนถึง Task 7) แล้วรันใหม่**

Run: `node -e "import('./advisor/lib/knowledge.mjs').then((m) => ['global-saving', 'group-insurance'].forEach((id) => console.log(id, m.getProductKnowledge({ productId: id }).content.length)))"`
Expected: สอง id ผ่าน

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add advisor/knowledge/global-saving.md advisor/knowledge/group-insurance.md tests/knowledge.test.mjs
git commit -m "docs(advisor): add global-saving + group-insurance knowledge"
```

---

### Task 7: ไฟล์ความรู้ fhc + career-agent + agency (เครื่องมือไม่ใช่แบบประกัน)

**Files:**

- Create: `advisor/knowledge/fhc.md`
- Create: `advisor/knowledge/career-agent.md`
- Create: `advisor/knowledge/agency.md`

- [ ] **Step 1: อ่านต้นทาง**

- FHC: `fhc/README.md`, `fhc/index.html` — หมวดที่ประเมิน (รายได้ เงินเก็บ หนี้สิน สินทรัพย์สุทธิ) เกณฑ์/สูตรที่ฝังใน JS
- Career-Agent: `career-agent/README.md`, `career-agent/index.html` — โครงแบบประเมิน จำนวนข้อ เกณฑ์คะแนน ผลลัพธ์ที่แสดง
- Agency Blueprint: `agency/README.md`, `agency/index.html`, `agency/calculator.html`,
  `agency/bonus-calculator.html`, `agency/manager-test.html`, `agency/agency.js`
  — **เครื่องมือนี้มี 4 หน้า** (หน้า hub, คำนวณค่าบริหาร, คำนวณโบนัส, แบบทดสอบผู้จัดการ) ต้องอธิบายครบทุกหน้า

- [ ] **Step 2: เขียนทั้ง 3 ไฟล์** — ใช้โครงเครื่องมือไม่ใช่แบบประกัน 5 หัวข้อ:
ภาพรวม / สิ่งที่เครื่องมือประเมิน-คำนวณ / การใช้เครื่องมือ / ขอบเขตข้อมูล / ที่มา

- [ ] **Step 3: ตรวจ loader — test "ไม่พบคลังความรู้" fail รอบสุดท้าย (fhc.md สร้างแล้ว) — คราวนี้ให้ลบ test นั้นทิ้งเลย เพราะไฟล์ครบทั้ง 14 แล้ว ไม่มี id ที่ยังไม่มีไฟล์เหลืออยู่**

Run: `node -e "import('./advisor/lib/knowledge.mjs').then((m) => ['fhc', 'career-agent', 'agency'].forEach((id) => console.log(id, m.getProductKnowledge({ productId: id }).content.length)))"`
Expected: สาม id ผ่าน

Run: `npm test`
Expected: PASS (หลังลบ test ที่หมดหน้าที่)

- [ ] **Step 4: Commit**

```bash
git add advisor/knowledge/fhc.md advisor/knowledge/career-agent.md advisor/knowledge/agency.md tests/knowledge.test.mjs
git commit -m "docs(advisor): add fhc, career-agent, agency knowledge"
```

---

### Task 8: Completeness test + Vercel + README + ตรวจปิดงาน

**Files:**

- Modify: `tests/knowledge.test.mjs`
- Modify: `vercel.json:6`
- Modify: `advisor/README.md` (หัวข้อ "สถาปัตยกรรมและ guardrails")

- [ ] **Step 1: เพิ่ม completeness test ใน `tests/knowledge.test.mjs`**

```js
test('ทุกผลิตภัณฑ์ในแค็ตตาล็อกมีไฟล์คลังความรู้ครบและมีหัวข้อบังคับ', () => {
  for (const product of PRODUCTS) {
    const knowledge = getProductKnowledge({ productId: product.id });
    assert.ok(knowledge.content.length > 500, `${product.id}: เนื้อหาสั้นผิดปกติ (${knowledge.content.length})`);
    assert.match(knowledge.content, /## ที่มา/, `${product.id}: ไม่มีหัวข้อที่มา`);
    assert.match(knowledge.content, /## ขอบเขตข้อมูล/, `${product.id}: ไม่มีหัวข้อขอบเขตข้อมูล`);
  }
});
```

- [ ] **Step 2: รัน test** — Run: `node --test tests/knowledge.test.mjs` — Expected: PASS (ไฟล์ครบจาก Task 3–7 แล้ว ข้อนี้เป็น guard กัน regression และกันลืมเมื่อเพิ่มผลิตภัณฑ์ใหม่)

- [ ] **Step 3: แก้ `vercel.json` ให้ Function เห็นไฟล์ความรู้**

แก้บรรทัด `includeFiles` เป็น:

```json
      "includeFiles": "{ci123/data.js,ihealthy/data.js,pension-smart95/data/db.json,pension-smart95/src/engine.js,advisor/knowledge/*.md}"
```

- [ ] **Step 4: เพิ่มบรรทัดใน `advisor/README.md`** ใต้ bullet ของ `lib/catalog.mjs` ในหัวข้อ "สถาปัตยกรรมและ guardrails":

```markdown
- `knowledge/*.md` + `lib/knowledge.mjs` เป็นคลังความรู้ต่อผลิตภัณฑ์ที่โมเดลดึงผ่าน tool `get_product_knowledge` ก่อนตอบรายละเอียด เนื้อหาสกัดจากเครื่องมือในโปรเจคเท่านั้นและระบุที่มาในไฟล์
```

- [ ] **Step 5: ตรวจปิดงานทั้งระบบ**

Run: `npm test`
Expected: PASS ทุกไฟล์

Run: `npm run dev:ai` แล้วเปิด `http://localhost:8080/advisor/` ทดสอบถาม เช่น
"iSmart 80/6 ชำระเบี้ยกี่ปี คุ้มครองถึงอายุเท่าไหร่ มีเงินคืนยังไง" — คำตอบต้องอ้างข้อมูล
จากคลังความรู้ และ evidence panel แสดง `get_product_knowledge`
(ข้ามได้ถ้าไม่มี `OPENAI_API_KEY` ในเครื่อง — mock test ครอบคลุม loop แล้ว)

- [ ] **Step 6: Commit**

```bash
git add tests/knowledge.test.mjs vercel.json advisor/README.md
git commit -m "feat(advisor): knowledge completeness guard + vercel includeFiles + docs"
```

---

## หมายเหตุการตรวจรับ (ทั้งแผน)

- ทุกไฟล์ความรู้ต้องผ่านกติกา 5 ข้อต้นไฟล์ — โดยเฉพาะ "ห้ามใส่ข้อมูลที่ไม่มีในโปรเจค"
- ตัวเลขสำคัญ (ช่วงอายุ, ตัวคูณงวด, % เงินคืน, จำนวนปี) ต้องตรวจกับไฟล์ต้นทางทีละค่า
  ก่อน commit ของแต่ละ task
- ไม่แตะ `advisor/lib/catalog.mjs`, `advisor/lib/calculators.mjs`, UI `/advisor/`,
  และ server calculators — นอกขอบเขตงานนี้
