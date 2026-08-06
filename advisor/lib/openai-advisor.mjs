import { PRODUCTS, searchProducts } from './catalog.mjs';
import { TOOL_HANDLERS } from './calculators.mjs';

const GOALS = ['legacy', 'life', 'saving', 'tax', 'short_pay', 'retirement', 'health', 'critical_illness', 'employee_benefits', 'financial_health', 'career', 'agency'];

export const OPENAI_TOOLS = [
  {
    type: 'function', name: 'search_products', strict: true,
    description: 'ค้นหาผลิตภัณฑ์จากแค็ตตาล็อก Advisortool ตามเป้าหมาย ใช้ก่อนแนะนำหรือเปรียบเทียบแผน',
    parameters: { type: 'object', additionalProperties: false, properties: {
      goals: { type: 'array', maxItems: 5, items: { type: 'string', enum: GOALS } },
      query: { type: 'string', maxLength: 300 }
    }, required: ['goals', 'query'] }
  },
  {
    type: 'function', name: 'calculate_ci123', strict: true,
    description: 'คำนวณเบี้ย CI 123 จากตารางจริง ห้ามคำนวณตัวเลข CI 123 เอง',
    parameters: { type: 'object', additionalProperties: false, properties: {
      age: { type: 'integer', minimum: 0, maximum: 70 }, gender: { type: 'string', enum: ['male', 'female'] },
      sumAssured: { type: 'integer', minimum: 100000, maximum: 10000000 }
    }, required: ['age', 'gender', 'sumAssured'] }
  },
  {
    type: 'function', name: 'calculate_ihealthy', strict: true,
    description: 'คำนวณเบี้ย iHealthy Ultra จากตารางจริง ห้ามคำนวณตัวเลข iHealthy เอง',
    parameters: { type: 'object', additionalProperties: false, properties: {
      age: { type: 'integer', minimum: 6, maximum: 80 }, gender: { type: 'string', enum: ['male', 'female'] },
      plan: { type: 'string', enum: ['smart', 'bronze', 'silver', 'gold'] },
      frequency: { type: 'string', enum: ['yearly', 'six-monthly', 'monthly'] }
    }, required: ['age', 'gender', 'plan', 'frequency'] }
  },
  {
    type: 'function', name: 'calculate_pension', strict: true,
    description: 'คำนวณบำนาญ สมาร์ท 95 ด้วย engine และตาราง A2026-1 จริง โดยยังไม่รวม riders',
    parameters: { type: 'object', additionalProperties: false, properties: {
      age: { type: 'integer', minimum: 20, maximum: 64 }, gender: { type: 'string', enum: ['male', 'female'] },
      annuityAge: { type: 'integer', enum: [55, 60, 65, 70] }, payOption: { type: 'string', enum: ['six_years', 'to_annuity'] },
      mode: { type: 'string', enum: ['annual', 'semiannual', 'quarterly', 'monthly'] },
      inputType: { type: 'string', enum: ['sum_assured', 'premium', 'monthly_pension'] },
      amount: { type: 'number', exclusiveMinimum: 0, maximum: 100000000 }
    }, required: ['age', 'gender', 'annuityAge', 'payOption', 'mode', 'inputType', 'amount'] }
  }
];

function systemInstructions() {
  const catalog = PRODUCTS.map(({ id, name, category, goals, summary, version, calculatorUrl, serverCalculator }) => ({ id, name, category, goals, summary, version, calculatorUrl, serverCalculator: serverCalculator || null }));
  return `คุณคือ AI Advisor ภาษาไทยของ Advisortool สำหรับช่วยที่ปรึกษาสำรวจผลิตภัณฑ์ ไม่ใช่ผู้รับประกันภัยและไม่ใช่ผู้ให้คำแนะนำการลงทุนส่วนบุคคลที่มีใบอนุญาต

ขอบเขต:
- ตอบข้อเท็จจริงเฉพาะจาก PRODUCT_CATALOG และผลลัพธ์ tool ในคำขอนี้ หากข้อมูลไม่พอให้บอกว่าไม่พบและชี้ไปเครื่องมือเฉพาะ
- ก่อนแนะนำ/เปรียบเทียบ ต้องเรียก search_products และอธิบายเหตุผลกับข้อจำกัด ห้ามบอกว่าแผนใด “ดีที่สุด” หรือ “รับประกันว่าเหมาะ”
- ก่อนตอบตัวเลขเบี้ย ทุน บำนาญ หรือผลตอบแทน ต้องเรียก calculator tool ที่ตรงผลิตภัณฑ์ ห้ามคำนวณหรือประมาณเอง ถ้าไม่มี server calculator ให้ส่งลิงก์ calculatorUrl และระบุว่าต้องกรอกในเครื่องมือเฉพาะ
- ห้ามอ้างว่าผลตอบแทนอิงดัชนีได้รับการรับประกัน ห้ามรับรองการอนุมัติรับประกัน ภาษี หรือการเคลม
- อย่าขอเลขบัตรประชาชน เวชระเบียน เลขกรมธรรม์ หรือข้อมูลอ่อนไหว ระบุให้ผู้ใช้ไม่ส่งข้อมูลดังกล่าว
- ตอบกระชับ เป็นหัวข้ออ่านง่าย และลงท้ายด้วยข้อจำกัดที่เกี่ยวข้อง
- หากผู้ใช้ขอใบเสนอราคา ให้เรียกว่า “ร่างสรุปประกอบการสนทนา” และย้ำว่าไม่ใช่ใบเสนอราคา/สัญญา/เงื่อนไขฉบับจริง ตัวเลขทุกตัวต้องมาจาก tool ในคำขอนี้เท่านั้น

PRODUCT_CATALOG=${JSON.stringify(catalog)}`;
}

function parseArguments(item) {
  try { return JSON.parse(item.arguments || '{}'); }
  catch { throw new Error(`รูปแบบ arguments ของ ${item.name} ไม่ถูกต้อง`); }
}

function extractText(response) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();
  return (response.output || []).flatMap((item) => item.type === 'message' ? (item.content || []) : [])
    .filter((content) => content.type === 'output_text').map((content) => content.text).join('\n').trim();
}

function safeEvidence(name, args, result) {
  return { tool: name, inputs: args, result, verified: true, timestamp: new Date().toISOString() };
}

async function postResponse({ apiKey, baseUrl, payload, fetchImpl }) {
  const response = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}/responses`, {
    method: 'POST', signal: AbortSignal.timeout(45_000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || `OpenAI API ตอบกลับ HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function runAdvisor({ messages, profile = {}, model, apiKey, baseUrl = 'https://api.openai.com/v1', fetchImpl = fetch }) {
  const evidence = [];
  const history = messages.slice(-10).map((message, index, all) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: index === all.length - 1 && message.role !== 'assistant'
      ? `${message.content}\n\nข้อมูลที่ผู้ใช้เลือกกรอก (อาจไม่ครบ): ${JSON.stringify(profile)}`
      : message.content
  }));
  let input = history;
  for (let turn = 0; turn < 4; turn += 1) {
    const response = await postResponse({ apiKey, baseUrl, fetchImpl, payload: {
      model, instructions: systemInstructions(), input, tools: OPENAI_TOOLS,
      tool_choice: 'auto', reasoning: { effort: 'low' }, text: { verbosity: 'medium' },
      max_output_tokens: 1800, store: false
    } });
    const calls = (response.output || []).filter((item) => item.type === 'function_call');
    if (!calls.length) {
      const answer = extractText(response);
      if (!answer) throw new Error('โมเดลไม่ส่งข้อความตอบกลับ');
      return { answer, evidence, model };
    }
    const outputs = [];
    for (const call of calls.slice(0, 4)) {
      let result;
      let args = {};
      try {
        args = parseArguments(call);
        if (call.name === 'search_products') result = searchProducts(args);
        else if (TOOL_HANDLERS[call.name]) result = TOOL_HANDLERS[call.name](args);
        else throw new Error('ไม่อนุญาตให้เรียกเครื่องมือนี้');
        evidence.push(safeEvidence(call.name, args, result));
      } catch (error) {
        result = { error: error instanceof Error ? error.message : 'เครื่องมือทำงานไม่สำเร็จ' };
      }
      outputs.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
    }
    input = [...input, ...(response.output || []), ...outputs];
  }
  throw new Error('การเรียกเครื่องมือเกินขีดจำกัด กรุณาลดคำถามให้เฉพาะเจาะจงขึ้น');
}
