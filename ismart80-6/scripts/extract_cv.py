import json, openpyxl, pathlib
SRC = pathlib.Path(__file__).parent.parent / "source" / "ไอสมาร์ท 80-6_A2026-1.xlsx"
OUT = pathlib.Path(__file__).parent.parent / "data" / "cashvalue.json"
wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)

# TABCV row: A=Key, B=CVPLAN, C=CVSEX, D=CVAGE, E..=surrender factor per 1,000 at policy year 1,2,3...
# Benefit sheet: VLOOKUP('06'+sex+age, TABCV, policyYear+4) => factor for policyYear at column (year+4).
def grab(sheet):
    ws = wb[sheet]
    out = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        key = row[0]
        if not key or not str(key).startswith("06"):
            continue
        age = row[3]  # CVAGE
        n_years = 80 - int(age)    # last policy year -> attained age 79 (maturity), factor 2000
        factors = []
        for v in row[4:4 + n_years]:   # policy year 1..(80-age); trailing cols are 0-padding
            factors.append(v if isinstance(v, (int, float)) else 0)
        out[str(age)] = factors
    return out

data = {"M": grab("TABCV(Male)"), "F": grab("TABCV(Female)")}
OUT.write_text(json.dumps(data, ensure_ascii=False))
f44 = data["F"]["44"]
print("F ages:", sorted(int(a) for a in data["F"]))
print("F age44 len:", len(f44), "year1:", f44[0], "year7:", f44[6], "maturity(last):", f44[-1])
print("M age44 year1:", data["M"]["44"][0])
