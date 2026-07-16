import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = '/Users/pheerapatpisit/Desktop/life';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/ไลฟ์เทรเชอร์-คำนวณเบี้ย.html';
    const buf = await readFile(join(ROOT, p));
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch (e) {
    res.writeHead(404); res.end('not found');
  }
}).listen(8899, () => console.log('serving on 8899'));
