#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract all premium rate tables for iSmart 80/6 (W80F06) -> data/premium.json.

Mirrors the lifeready extractor (identical rider rate ecosystem, same A2026-1
workbook family and sheet ranges) but the MAIN plan is W80F06 only: keys '06M'/'06F',
age rows 6+age, no high-SA discount applied to the main premium.

Usage:  python3 scripts/extract.py    (requires openpyxl)
"""
import openpyxl, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'source', 'ไอสมาร์ท 80-6_A2026-1.xlsx')
OUT = os.path.join(ROOT, 'data', 'premium.json')
wb = openpyxl.load_workbook(SRC, data_only=True)
def cell(ws, r, c): return ws.cell(r, c).value
data = {}

# --- Main plan W80F06: Premium&Maturity row2 = ['Key','06M','06F']; rate for age a at row 6+a ---
pm = wb['Premium&Maturity']
hdr = [cell(pm, 2, c) for c in range(2, 4)]                 # ['06M','06F']
data['mainRate'] = {h: [cell(pm, 6 + a, 2 + i) for a in range(0, 81)] for i, h in enumerate(hdr)}

cal = wb['Cal']
# high-SA discount tiers kept for reference/riders (NOT applied to main; Cal!F13 = 0)
data['highSADiscount'] = [{'sa': cell(cal, r, 1), '06': cell(cal, r, 2), '12': cell(cal, r, 3),
                           '18': cell(cal, r, 4), '99': cell(cal, r, 5)} for r in range(28, 34)]
data['modes'] = [{'th': cell(cal, r, 9), 'factor': cell(cal, r, 10), 'periods': cell(cal, r, 11)} for r in range(2, 6)]

# --- Riders (identical sheets/ranges to lifeready) ---
rr = wb['Rate Rider']
data['apRate'] = {str(cell(rr, r, 28)): cell(rr, r, 29) for r in range(3, 7)}
data['ecareRate'] = {str(cell(rr, r, 28)): cell(rr, r, 30) for r in range(3, 7)}
meb_plans = [cell(rr, 4, c) for c in range(2, 8)]
data['mebRate'] = {int(cell(rr, r, 1)): {str(meb_plans[i]): cell(rr, r, 2 + i) for i in range(6)}
                   for r in range(5, 74) if cell(rr, r, 1) is not None}
data['mebPlans'] = [int(x) for x in meb_plans]
def kv(r1, r2):
    return {str(cell(rr, r, 24)).strip(): {'M': cell(rr, r, 25), 'F': cell(rr, r, 26)}
            for r in range(r1, r2 + 1) if cell(rr, r, 24) is not None}
data['dciPlsRate'] = kv(43, 257); data['cprRate'] = kv(258, 342); data['hicRate'] = kv(343, 427)

mx = wb['Rate rider_MEX']; mex_hdr = [cell(mx, 5, c) for c in range(2, 12)]
data['mexRate'] = {int(cell(mx, r, 1)): {str(mex_hdr[i]): cell(mx, r, 2 + i) for i in range(10)}
                   for r in range(6, 96) if cell(mx, r, 1) is not None}
ih = wb['iHealthy Ultra Rate']; mhp_keys = [cell(ih, 9, c) for c in range(2, 73)]
data['mhpRate'] = {str(k).strip(): [cell(ih, 13 + a, 2 + i) for a in range(0, 99)] for i, k in enumerate(mhp_keys) if k}
mc = wb['CI MED EX RATE']; mci_keys = [cell(mc, 9, c) for c in range(2, 10)]
data['mciRate'] = {str(k).strip(): [cell(mc, 13 + a, 2 + i) for a in range(0, 99)] for i, k in enumerate(mci_keys) if k}
ci = wb['Rate CI 123']
data['ci123Rate'] = {str(cell(ci, r, 6)).strip(): [cell(ci, r, 7 + a) for a in range(0, 76)]
                     for r in range(2, 16) if cell(ci, r, 6)}
wp = wb['Rate WP']
def wpb(kcol, dcol):
    d = {}
    for r in range(5, 120):
        k = cell(wp, r, kcol)
        if not k: continue
        d[str(k).strip()] = {str(j + 3): cell(wp, r, dcol + j) for j in range(82) if cell(wp, r, dcol + j) is not None}
    return d
data['wpRateM'] = wpb(1, 4); data['wpRateF'] = wpb(86, 89)
pb = wb['Rate PB']
def pbb(r1, r2, dcol):
    d = {}
    for r in range(r1, r2 + 1):
        k = cell(pb, r, 3)
        if not k: continue
        d[str(k).strip()] = {str(j + 3): cell(pb, r, dcol + j) for j in range(82) if cell(pb, r, dcol + j) is not None}
    return d
data['pbRateParent'] = pbb(5, 227, 6); data['pbRateSpouse'] = pbb(231, 437, 6)

json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('wrote', OUT, round(os.path.getsize(OUT) / 1024, 1), 'KB')
print('mainRate 06F age44:', data['mainRate']['06F'][44], '| 06M age44:', data['mainRate']['06M'][44])
print('apRate:', data['apRate'], '| mebPlans:', data['mebPlans'])
print('dciPls keys sample:', [k for k in list(data['dciPlsRate'])[:4]])
print('modes:', data['modes'])
