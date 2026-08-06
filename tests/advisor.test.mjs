import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCI123, calculateIHealthy, calculatePension } from '../advisor/lib/calculators.mjs';
import { searchProducts } from '../advisor/lib/catalog.mjs';
import { runAdvisor } from '../advisor/lib/openai-advisor.mjs';
import { validateAdvisorRequest } from '../advisor/lib/validation.mjs';

test('request validation accepts a minimal Thai conversation and normalizes profile', () => {
  const result = validateAdvisorRequest({ messages: [{ role: 'user', content: ' ช่วยวางแผนเกษียณ ' }], profile: { age: '35', gender: 'female', budgetMonthly: '5000', goals: ['retirement'] } });
  assert.equal(result.messages[0].content, 'ช่วยวางแผนเกษียณ');
  assert.deepEqual(result.profile, { age: 35, gender: 'female', budgetMonthly: 5000, goals: ['retirement'] });
});

test('request validation rejects oversized or malformed input', () => {
  assert.throws(() => validateAdvisorRequest({ messages: [{ role: 'user', content: 'x'.repeat(2401) }] }), /2400/);
  assert.throws(() => validateAdvisorRequest({ messages: [{ role: 'assistant', content: 'สวัสดี' }] }), /สุดท้าย/);
});

test('product search returns retirement and tax products from controlled catalog', () => {
  const result = searchProducts({ goals: ['retirement', 'tax'], query: '' });
  assert.equal(result.matches[0].id, 'pension-smart95');
  assert.match(result.caveat, /ไม่ใช่คำรับรอง/);
});

test('CI 123 adapter uses existing table and mode formulas', () => {
  const quote = calculateCI123({ age: 35, gender: 'male', sumAssured: 500000 });
  assert.ok(quote.result.annual > 0);
  assert.equal(quote.result.semiannual, Math.round(quote.result.annual * 0.52));
  assert.equal(quote.result.monthly, Math.round(quote.result.annual * 0.09));
  assert.match(quote.source, /ci123\/data\.js/);
});

test('iHealthy adapter matches the existing age 35 Smart male table', () => {
  const quote = calculateIHealthy({ age: 35, gender: 'male', plan: 'smart', frequency: 'monthly' });
  assert.equal(quote.result.annual, 17975);
  assert.equal(quote.result.premium, Math.round(17975 * 0.09));
});

test('pension adapter executes the verified A2026-1 engine', () => {
  const quote = calculatePension({ age: 35, gender: 'female', annuityAge: 60, payOption: 'six_years', mode: 'annual', inputType: 'sum_assured', amount: 1000000 });
  assert.equal(quote.result.sumAssured, 1000000);
  assert.ok(quote.result.annualPremium > 0);
  assert.equal(quote.result.payYears, 6);
  assert.match(quote.source, /engine\.js/);
});

test('Responses tool loop executes only registered deterministic tools', async () => {
  const replies = [
    { output: [{ type: 'function_call', name: 'search_products', arguments: JSON.stringify({ goals: ['health'], query: 'สุขภาพ' }), call_id: 'call_1' }] },
    { output_text: 'แนวทางที่พบคือ iHealthy Ultra โดยต้องตรวจเงื่อนไขฉบับจริง', output: [] }
  ];
  const seen = [];
  const fetchImpl = async (_url, options) => { seen.push(JSON.parse(options.body)); return { ok: true, async json() { return replies.shift(); } }; };
  const result = await runAdvisor({ messages: [{ role: 'user', content: 'มีแผนสุขภาพอะไรบ้าง' }], profile: {}, model: 'test-model', apiKey: 'test-only-not-a-real-key', fetchImpl });
  assert.match(result.answer, /iHealthy/);
  assert.equal(result.evidence[0].tool, 'search_products');
  assert.ok(seen[1].input.some((item) => item.type === 'function_call_output'));
});
