// รันเอนจินด้วย input JSON (argv[2] = path) แล้วพิมพ์ผลรูปแบบเทียบกับเซลล์ Excel
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);
const Engine = require('./engine.js');
const R = require('./rates.json');

const inp = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = Engine.calc(inp, R);
const get = id => out.items.find(i => i.id === id);
const val = it => (it.premium === null || it.premium === undefined) ? (it.status || 0) : it.premium;

const res = {
  F19: out.main.status ? out.main.status : out.main.premium,
  F20: val(get('pb')),
  F21: val(get('wp')),
  F22: val(get('ap')),
  F23: val(get('ecare')),
  F24: val(get('mex')),
  F25: val(get('meb')),
  F26: val(get('dci')),
  F27: val(get('pls')),
  F28: val(get('cpr')),
  F29: val(get('hic')),
  F30: get('ihu').premium === null ? (get('ihu').status || 0) : get('ihu').premium,
  F32: get('roke').premium === null ? '-' : get('roke').premium,
  F33: val(get('ci123')),
  F34: val(get('ci123_pre')),
  F35: val(get('ci123_ei')),
  F36: val(get('ci123_sp')),
  F37: out.totalPerPeriod,
  C40: out.displaySa,
  C41: out.firstPaymentStatus ? out.firstPaymentStatus : out.firstPayment,
  ill: out.illustration.map(r => [r.year, r.age, r.premium, r.cumPremium, r.cv, r.death]),
};
console.log(JSON.stringify(res));
