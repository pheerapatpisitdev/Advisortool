import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runAdvisor } from './advisor/lib/openai-advisor.mjs';
import { validateAdvisorRequest } from './advisor/lib/validation.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

async function loadEnvFile(filePath) {
  let text;
  try { text = await readFile(filePath, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

await loadEnvFile(path.join(root, '.env.local'));

const PORT = Number(process.env.PORT || 8080);
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-terra';
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = process.env.OPENAI_API_KEY || '';
const BODY_LIMIT = 48 * 1024;
const buckets = new Map();

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };

function securityHeaders(extra = {}) {
  return { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', ...extra };
}

function json(res, status, body, extra = {}) {
  res.writeHead(status, securityHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }));
  res.end(JSON.stringify(body));
}

function clientId(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim(); }

function allowRequest(req) {
  const now = Date.now();
  const key = clientId(req);
  const active = (buckets.get(key) || []).filter((time) => now - time < 60_000);
  if (active.length >= 12) return false;
  active.push(now); buckets.set(key, active);
  if (buckets.size > 2000) for (const [id, times] of buckets) if (!times.some((time) => now - time < 60_000)) buckets.delete(id);
  return true;
}

async function readJson(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > BODY_LIMIT) throw Object.assign(new Error('คำขอมีขนาดใหญ่เกินไป'), { status: 413 }); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('JSON ไม่ถูกต้อง'), { status: 400 }); }
}

async function handleAdvisor(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return json(res, 415, { error: 'content_type_must_be_json' });
  const origin = req.headers.origin;
  if (origin) {
    const expected = `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
    if (origin !== expected) return json(res, 403, { error: 'cross_origin_request_rejected' });
  }
  if (!allowRequest(req)) return json(res, 429, { error: 'rate_limit', message: 'ส่งคำขอถี่เกินไป กรุณารอสักครู่' }, { 'Retry-After': '60' });
  if (!API_KEY) return json(res, 503, { error: 'advisor_not_configured', message: 'AI Advisor ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์' });
  try {
    const request = validateAdvisorRequest(await readJson(req));
    const result = await runAdvisor({ ...request, model: MODEL, apiKey: API_KEY, baseUrl: BASE_URL });
    return json(res, 200, result);
  } catch (error) {
    const safeStatus = Number(error.status) >= 400 && Number(error.status) < 500 ? Number(error.status) : (error instanceof RangeError || error instanceof TypeError ? 400 : 502);
    const upstreamMessage = Number(error.status) ? {
      400: 'การตั้งค่า AI หรือคำขอไปยังโมเดลไม่ถูกต้อง กรุณาให้ผู้ดูแลตรวจ OPENAI_MODEL',
      401: 'เซิร์ฟเวอร์ยืนยันสิทธิ์ OpenAI API ไม่สำเร็จ กรุณาให้ผู้ดูแลตรวจคีย์',
      403: 'บัญชี OpenAI API ไม่มีสิทธิ์ใช้โมเดลที่ตั้งค่าไว้',
      429: 'โควตา OpenAI API ไม่พร้อมใช้งานหรือส่งคำขอถี่เกินไป กรุณาตรวจเครดิตแล้วลองใหม่',
    }[safeStatus] : null;
    const message = upstreamMessage || (safeStatus === 502 ? 'AI Advisor ติดต่อบริการไม่สำเร็จ กรุณาลองใหม่' : error.message);
    console.error(`[advisor] ${new Date().toISOString()} ${error.name || 'Error'} status=${error.status || safeStatus}`);
    return json(res, safeStatus, { error: 'advisor_request_failed', message });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return json(res, 400, { error: 'bad_path' }); }
  if (pathname === '/api/advisor') return handleAdvisor(req, res);
  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'method_not_allowed' });
  const segments = pathname.split('/').filter(Boolean);
  if (segments.some((segment) => segment.startsWith('.')) || pathname === '/server.mjs' || pathname.startsWith('/advisor/lib/')) return json(res, 404, { error: 'not_found' });
  let filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) return json(res, 403, { error: 'forbidden' });
  try { if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, 'index.html'); } catch {}
  try {
    const data = await readFile(filePath);
    res.writeHead(200, securityHeaders({ 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' }));
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  } catch (error) { return json(res, error.code === 'ENOENT' ? 404 : 500, { error: error.code === 'ENOENT' ? 'not_found' : 'server_error' }); }
}

export const server = createServer((req, res) => { serveStatic(req, res).catch((error) => { console.error(error); if (!res.headersSent) json(res, 500, { error: 'server_error' }); else res.end(); }); });

if (process.env.NODE_ENV !== 'test') server.listen(PORT, () => console.log(`Advisortool AI server: http://localhost:${PORT} · model=${MODEL}`));
