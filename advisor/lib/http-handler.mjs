import { runAdvisor } from './openai-advisor.mjs';
import { validateAdvisorRequest } from './validation.mjs';

const BODY_LIMIT = 48 * 1024;
const buckets = new Map();

function securityHeaders(extra = {}) {
  return { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', ...extra };
}

function json(res, status, body, extra = {}) {
  res.writeHead(status, securityHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }));
  res.end(JSON.stringify(body));
}

function clientId(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function allowRequest(req) {
  const now = Date.now();
  const key = clientId(req);
  const active = (buckets.get(key) || []).filter((time) => now - time < 60_000);
  if (active.length >= 12) return false;
  active.push(now);
  buckets.set(key, active);
  if (buckets.size > 2000) for (const [id, times] of buckets) if (!times.some((time) => now - time < 60_000)) buckets.delete(id);
  return true;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    if (Buffer.byteLength(JSON.stringify(req.body)) > BODY_LIMIT) throw Object.assign(new Error('คำขอมีขนาดใหญ่เกินไป'), { status: 413 });
    return req.body;
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw Object.assign(new Error('คำขอมีขนาดใหญ่เกินไป'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('JSON ไม่ถูกต้อง'), { status: 400 }); }
}

function expectedOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || (req.socket?.encrypted ? 'https' : 'http');
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || req.headers.host;
  return host ? `${protocol}://${host}` : '';
}

function upstreamMessage(error, status) {
  if (!Number(error.status)) return status === 502 ? 'AI Advisor ติดต่อบริการไม่สำเร็จ กรุณาลองใหม่' : error.message;
  return {
    400: 'การตั้งค่า AI หรือคำขอไปยังโมเดลไม่ถูกต้อง กรุณาให้ผู้ดูแลตรวจ OPENAI_MODEL',
    401: 'เซิร์ฟเวอร์ยืนยันสิทธิ์ OpenAI API ไม่สำเร็จ กรุณาให้ผู้ดูแลตรวจคีย์',
    403: 'บัญชี OpenAI API ไม่มีสิทธิ์ใช้โมเดลที่ตั้งค่าไว้',
    429: 'โควตา OpenAI API ไม่พร้อมใช้งานหรือส่งคำขอถี่เกินไป กรุณาตรวจเครดิตแล้วลองใหม่'
  }[status] || 'AI Advisor ติดต่อบริการไม่สำเร็จ กรุณาลองใหม่';
}

export async function handleAdvisor(req, res, options = {}) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return json(res, 415, { error: 'content_type_must_be_json' });
  const origin = req.headers.origin;
  if (origin && origin !== expectedOrigin(req)) return json(res, 403, { error: 'cross_origin_request_rejected' });
  if (!allowRequest(req)) return json(res, 429, { error: 'rate_limit', message: 'ส่งคำขอถี่เกินไป กรุณารอสักครู่' }, { 'Retry-After': '60' });

  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? '';
  const model = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-5.6-terra';
  const baseUrl = options.baseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  if (!apiKey) return json(res, 503, { error: 'advisor_not_configured', message: 'AI Advisor ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์' });

  try {
    const request = validateAdvisorRequest(await readJson(req));
    const result = await runAdvisor({ ...request, model, apiKey, baseUrl, fetchImpl: options.fetchImpl });
    return json(res, 200, result);
  } catch (error) {
    const status = Number(error.status) >= 400 && Number(error.status) < 500 ? Number(error.status) : (error instanceof RangeError || error instanceof TypeError ? 400 : 502);
    console.error(`[advisor] ${new Date().toISOString()} ${error.name || 'Error'} status=${error.status || status}`);
    return json(res, status, { error: 'advisor_request_failed', message: upstreamMessage(error, status) });
  }
}

export const _testing = Object.freeze({ expectedOrigin });
