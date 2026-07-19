"""Update tests and gold_qa.json to match the new full dataset."""
import json
import csv
from pathlib import Path

DATA_DIR = Path("backend/app/data")
MTSP_FILE = DATA_DIR / "mtsp" / "mtsp_2026.json"
GOLD_QA_FILE = DATA_DIR / "gold_qa.json"

# Load MTSP data
with open(MTSP_FILE) as f:
    mtsp = json.load(f)

regions = {r["cbsa_code"]: r for r in mtsp["regions"]}

# Print key values for updating gold_qa.json
lookups = {
    "Atlanta": ("12060", 3),
    "New York": ("35620", 2),
    "Los Angeles": ("31080", 4),
    "Los Angeles 1": ("31080", 1),
    "Los Angeles 8": ("31080", 8),
    "Dallas": ("19100", 3),
    "Chicago": ("16980", 6),
    "Orange County": ("31080", 1),
    "Fulton": ("12060", 5),
    "Cook": ("16980", 6),
}

print("=== Gold QA value lookup ===")
for name, (cbsa, hh) in lookups.items():
    r = regions.get(cbsa)
    if r:
        for limit in r["income_limits"]:
            if limit["household_size"] == hh:
                print(f"{name} (CBSA {cbsa}, hh{hh}): 30%={limit['ami_30']}, 50%={limit['ami_50']}, 60%={limit['ami_60']}")
    else:
        print(f"{name}: CBSA {cbsa} not found!")

# Print MTSP stats
print(f"\nTotal regions: {len(mtsp['regions'])}")
print(f"Total chunks: {sum(len(r['income_limits']) for r in mtsp['regions'])}")

# Check what region "default" should be - use national average
# Find regions with most counties or non-metro
non_metro = [r for r in mtsp["regions"] if len(r["counties"]) <= 2]
if non_metro:
    avg_region = non_metro[len(non_metro)//2]
    print(f"\nSample non-metro region for 'default': {avg_region['cbsa_code']} - {avg_region['cbsa_name']}")
    for lim in avg_region["income_limits"][:3]:
        print(f"  hh{lim['household_size']}: 30%={lim['ami_30']}, 50%={lim['ami_50']}, 60%={lim['ami_60']}")

# Check FMR data for CBSA codes
print(f"\n=== FMR CBSA codes ===")
fmr_codes = set()
with open(DATA_DIR / "fmr_2026.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        fmr_codes.add(row["cbsa_code"])
print(f"Total FMR codes: {len(fmr_codes)}")

# Check LIHTC data
with open(DATA_DIR / "lihtc_2024_filtered.csv") as f:
    reader = csv.DictReader(f)
    lihtc_rows = list(reader)
    cbsa_codes = set(r["cbsa_code"] for r in lihtc_rows if r["cbsa_code"])
print(f"\nLIHTC properties: {len(lihtc_rows)}")
print(f"LIHTC CBSA codes: {len(cbsa_codes)}")

# Find sample properties for common CBSA codes
for code in ["12060", "19100", "35620", "31080", "16980"]:
    count = sum(1 for r in lihtc_rows if r["cbsa_code"] == code)
    print(f"  CBSA {code}: {count} properties")
