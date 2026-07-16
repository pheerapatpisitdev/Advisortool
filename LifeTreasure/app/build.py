#!/usr/bin/env python3
"""ประกอบ template.html + rates.json + engine.js -> ไฟล์เดียว (ใช้เปิดได้เลย ไม่ต้องมีไฟล์อื่น)"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'ไลฟ์เทรเชอร์-คำนวณเบี้ย.html')

tpl = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
rates = open(os.path.join(HERE, 'rates.json'), encoding='utf-8').read()
engine = open(os.path.join(HERE, 'engine.js'), encoding='utf-8').read()

assert '/*__RATES__*/null' in tpl and '/*__ENGINE__*/' in tpl
out = tpl.replace('/*__RATES__*/null', rates).replace('/*__ENGINE__*/', engine)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out)
print(f'wrote {OUT} ({os.path.getsize(OUT)/1e6:.2f} MB)')
