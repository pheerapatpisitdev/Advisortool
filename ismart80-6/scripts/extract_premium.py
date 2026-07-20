import json, openpyxl, pathlib
SRC = pathlib.Path(__file__).parent.parent / "source" / "ไอสมาร์ท 80-6_A2026-1.xlsx"
OUT = pathlib.Path(__file__).parent.parent / "data" / "premium.json"

wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
ws = wb["Premium&Maturity"]
# Row 2 = key ('06M','06F') in cols B,C. Cal: HLOOKUP(key, A2:C86, age+5) where the row index
# is 1-based within the range starting at row 2 => actual sheet row = age + 6.
rows = list(ws.iter_rows(min_row=1, max_row=86, max_col=3, values_only=True))
key_m, key_f = rows[1][1], rows[1][2]      # '06M', '06F'
rate = {"M": {}, "F": {}}
for age in range(0, 81):
    r = age + 6
    if r - 1 < len(rows):
        vm, vf = rows[r-1][1], rows[r-1][2]
        if isinstance(vm, (int, float)): rate["M"][str(age)] = vm
        if isinstance(vf, (int, float)): rate["F"][str(age)] = vf
data = {"keyM": key_m, "keyF": key_f, "rate": rate,
        "highSaDiscountUnusedOnMain": True}
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1))
print("keys:", key_m, key_f)
print("ages M:", sorted(int(a) for a in rate["M"]))
print("rate F age44:", rate["F"].get("44"))
print("rate M age44:", rate["M"].get("44"))
