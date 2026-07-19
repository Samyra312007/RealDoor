import json

with open("backend/app/data/mtsp/mtsp_2026.json") as f:
    data = json.load(f)

targets = ["atlanta", "dallas", "new york", "los angeles", "chicago", "orange", "fulton", "cook"]
for r in data["regions"]:
    name = r["cbsa_name"].lower()
    for t in targets:
        if t in name:
            hh = r["income_limits"]
            if t == "atlanta":
                print(f"Atlanta: {r['cbsa_code']} - hh1 60%: {hh[0]['ami_60']}")
            if t == "dallas" and "fort" in name:
                print(f"Dallas: {r['cbsa_code']} - hh3 50%: {hh[2]['ami_50']}")
            if t == "new york":
                print(f"NY: {r['cbsa_code']} - hh2 60%: {hh[1]['ami_60']}")
            if "los angeles" in name:
                print(f"LA: {r['cbsa_code']} - hh1 60%: {hh[0]['ami_60']}, hh4 50%: {hh[3]['ami_50']}, hh8 50%: {hh[7]['ami_50']}")
            if t == "chicago":
                print(f"Chicago: {r['cbsa_code']} - hh6 50%: {hh[5]['ami_50']}")
            if t == "orange" and "orange" in name:
                print(f"Orange: {r['cbsa_code']} - {r['cbsa_name']}")
            if t in ("fulton", "cook"):
                print(f"{t.title()} in: {r['cbsa_code']} - {r['cbsa_name']}")
            break

# Also check what CBSA codes are in the FMR data
import csv
fmr_codes = set()
with open("backend/app/data/fmr_2026.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        fmr_codes.add(row["cbsa_code"])
print(f"\nFMR has {len(fmr_codes)} CBSA codes")
for code in ["12060", "19100", "35620", "31080", "16980", "33100", "12086", "19124", "35644", "31084", "16974"]:
    if code in fmr_codes:
        print(f"  CBSA {code} found in FMR")
    else:
        print(f"  CBSA {code} NOT in FMR")
