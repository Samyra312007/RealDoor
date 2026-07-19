"""Ingest all raw dataset files and generate app-usable data files."""
import json
import csv
import re
import sys
from pathlib import Path

import pandas as pd

DATASET_DIR = Path(__file__).parent.parent.parent / "dataset"
DATA_DIR = Path(__file__).parent.parent / "app" / "data"

MTSP_SOURCE = DATASET_DIR / "MTSP-Data-FY26.xlsx"
FMR_SOURCE = DATASET_DIR / "FY26_FMRs_revised_fixed.xlsx"
LIHTC_SOURCES = sorted(DATASET_DIR.glob("*-LIHTC-Tenant-Tables.xlsx"))
LIHTC_2016_SOURCE = DATASET_DIR / "2016 LIHTC Tenant Data by Property - PIN.xlsx"
QCT_CSV = DATASET_DIR / "QCT2026.csv"
QCT_EXCEL = DATASET_DIR / "qct_data_2026.xlsx"
DDA_SOURCE = DATASET_DIR / "2026-DDAs-Data-Used-to-Designate.xlsx"
TENANT_CSVS = sorted(DATASET_DIR.glob("Table *_2019.csv"))
TENANT_2016_XLSX = sorted(DATASET_DIR.glob("Table *_2016.xlsx"))
TENANT_YEAR_WORKBOOKS = {
    2021: DATASET_DIR / "2021-LIHTC-Tenant-Tables.xlsx",
    2022: DATASET_DIR / "2022-LIHTC-Tenant-Tables.xlsx",
    2023: DATASET_DIR / "2023-LIHTC-Tenant-Tables.xlsx",
}


def _extract_cbsa(hud_code: str) -> str | None:
    m = re.search(r"METRO(\d{5})M", hud_code)
    if m:
        return m.group(1)
    return None


def ingest_mtsp():
    """Ingest MTSP-Data-FY26.xlsx → app/data/mtsp/mtsp_2026.json"""
    print("Ingesting MTSP data...")
    df = pd.read_excel(MTSP_SOURCE, sheet_name="MTSP2026")

    regions: dict[str, dict] = {}

    for _, row in df.iterrows():
        hud_code = str(row["hud_area_code"])
        cbsa = _extract_cbsa(hud_code)
        if cbsa is None:
            continue

        cbsa_name = str(row["hud_area_name"]).strip()
        state = str(row["stusps"])
        county = str(row["County_Name"]).strip() if pd.notna(row.get("County_Name")) else ""

        if cbsa not in regions:
            regions[cbsa] = {
                "cbsa_code": cbsa,
                "cbsa_name": cbsa_name,
                "state": state,
                "counties": [],
                "income_limits": [],
            }

        if county and county not in regions[cbsa]["counties"]:
            regions[cbsa]["counties"].append(county)

        for hh_size in range(1, 9):
            lim50_col = f"lim50_26p{hh_size}"
            lim60_col = f"Lim60_26p{hh_size}"
            median_col = "median2026"

            lim50 = row.get(lim50_col)
            lim60 = row.get(lim60_col)
            median = row.get(median_col)

            if pd.notna(lim50) and pd.notna(lim60):
                ami_30 = int(round(float(lim50) * 30 / 50)) if pd.notna(lim50) else 0
                regions[cbsa]["income_limits"].append({
                    "household_size": hh_size,
                    "ami_30": ami_30,
                    "ami_50": int(float(lim50)),
                    "ami_60": int(float(lim60)),
                })

    output = {
        "meta": {
            "program": "MTSP",
            "year": 2026,
            "effective_date": "2026-05-01",
            "source_url": "https://www.huduser.gov/portal/datasets/mtsp.html",
            "description": "HUD Metropolitan Statistical Area (MSA) income limits for the Section 8 Housing Choice Voucher program",
            "region_count": len(regions),
        },
        "regions": list(regions.values()),
    }

    out_file = DATA_DIR / "mtsp" / "mtsp_2026.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"  Wrote {len(regions)} regions ({sum(len(r['income_limits']) for r in regions.values())} limits) to {out_file}")

    # Add default fallback region with national median limits
    if not any(r["cbsa_code"] == "default" for r in output["regions"]):
        import statistics
        by_hh = {}
        for region in output["regions"]:
            for limit in region["income_limits"]:
                hh = limit["household_size"]
                by_hh.setdefault(hh, {"ami_30": [], "ami_50": [], "ami_60": []})
                by_hh[hh]["ami_30"].append(limit["ami_30"])
                by_hh[hh]["ami_50"].append(limit["ami_50"])
                by_hh[hh]["ami_60"].append(limit["ami_60"])

        default_limits = []
        for hh in sorted(by_hh.keys()):
            default_limits.append({
                "household_size": hh,
                "ami_30": int(statistics.median(by_hh[hh]["ami_30"])),
                "ami_50": int(statistics.median(by_hh[hh]["ami_50"])),
                "ami_60": int(statistics.median(by_hh[hh]["ami_60"])),
            })

        output["regions"].insert(0, {
            "cbsa_code": "default",
            "cbsa_name": "National default (non-metro average)",
            "state": "US",
            "counties": ["National"],
            "income_limits": default_limits,
        })
        output["meta"]["region_count"] = len(output["regions"])
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
        print(f"  Added default region ({len(default_limits)} household sizes)")


def ingest_fmr():
    """Ingest FY26_FMRs_revised.xlsx → app/data/fmr_2026.csv"""
    print("Ingesting FMR data...")
    df = pd.read_excel(FMR_SOURCE, sheet_name="FY26_FMRs_revised")

    rows = []
    for _, row in df.iterrows():
        hud_code = str(row["hud_area_code"])
        cbsa = _extract_cbsa(hud_code)
        if cbsa is None:
            continue

        rows.append({
            "cbsa_code": cbsa,
            "cbsa_name": str(row["hud_area_name"]).strip(),
            "bedroom_0": int(float(row["fmr_0"])) if pd.notna(row.get("fmr_0")) else 0,
            "bedroom_1": int(float(row["fmr_1"])) if pd.notna(row.get("fmr_1")) else 0,
            "bedroom_2": int(float(row["fmr_2"])) if pd.notna(row.get("fmr_2")) else 0,
            "bedroom_3": int(float(row["fmr_3"])) if pd.notna(row.get("fmr_3")) else 0,
            "bedroom_4": int(float(row["fmr_4"])) if pd.notna(row.get("fmr_4")) else 0,
            "effective_date": "2026-10-01",
            "source_url": "https://www.huduser.gov/portal/datasets/fmr.html",
        })

    # Deduplicate by cbsa_code (keep first)
    seen = set()
    deduped = []
    for r in rows:
        if r["cbsa_code"] not in seen:
            seen.add(r["cbsa_code"])
            deduped.append(r)

    out_file = DATA_DIR / "fmr_2026.csv"
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "cbsa_code", "cbsa_name", "bedroom_0", "bedroom_1",
            "bedroom_2", "bedroom_3", "bedroom_4", "effective_date", "source_url",
        ])
        writer.writeheader()
        writer.writerows(deduped)
    print(f"  Wrote {len(deduped)} CBSA areas to {out_file}")


def _build_fips_to_cbsa() -> dict[str, str]:
    """Build FIPS county → CBSA mapping from MTSP source Excel."""
    mtsp_df = pd.read_excel(MTSP_SOURCE, sheet_name="MTSP2026", dtype={"fips": str, "county": str})
    mtsp_df["county_code"] = mtsp_df["county"].str.zfill(3)
    mtsp_df["state_code"] = mtsp_df["fips"].str[:2]
    mtsp_df["fips_key"] = mtsp_df["state_code"] + mtsp_df["county_code"]

    def _extract_cbsa_from_hud(code: str) -> str | None:
        m = re.search(r"METRO(\d{5})", str(code))
        return m.group(1) if m else None

    mtsp_df["cbsa"] = mtsp_df["hud_area_code"].apply(_extract_cbsa_from_hud)
    mtsp_df = mtsp_df.dropna(subset=["cbsa"])
    return dict(zip(mtsp_df["fips_key"], mtsp_df["cbsa"]))


def ingest_lihtc():
    """Ingest LIHTCPUB_fixed.xlsx → app/data/lihtc_2024_filtered.csv using FIPS→CBSA crosswalk."""
    print("Ingesting LIHTC data...")

    lihtc_fixed = DATASET_DIR / "LIHTCPUB_fixed.xlsx"
    if not lihtc_fixed.exists():
        print("  SKIP - LIHTCPUB_fixed.xlsx not found")
        return

    fips_to_cbsa = _build_fips_to_cbsa()
    print(f"  Built FIPS->CBSA mapping: {len(fips_to_cbsa)} counties")

    df = pd.read_excel(lihtc_fixed, sheet_name="Data")

    out_rows = []
    matched = 0
    unmatched = 0
    for _, row in df.iterrows():
        hud_id = str(row.get("hud_id", "")).strip()
        if not hud_id:
            continue

        st = str(row.get("st2020", "") or "").zfill(2)
        cnty = str(row.get("cnty2020", "") or "").strip(". ").zfill(3)
        fips_key = st + cnty
        cbsa_code = fips_to_cbsa.get(fips_key, "")
        if cbsa_code:
            matched += 1
        else:
            unmatched += 1
            cbsa_code = "FIPS_" + fips_key

        def safe_int(val, default=0):
            try:
                return int(float(val)) if pd.notna(val) and val != "" else default
            except (ValueError, TypeError):
                return default

        proj_name = str(row.get("project", "")).strip()
        proj_addr = str(row.get("proj_add", "")).strip()
        proj_city = str(row.get("proj_cty", "")).strip()
        proj_st = str(row.get("proj_st", "")).strip()
        address = ", ".join(filter(None, [proj_addr, proj_city, proj_st]))
        yr_pis = safe_int(row.get("yr_pis"))
        if yr_pis < 1980 or yr_pis > 2026:
            yr_pis = 0

        out_rows.append({
            "property_name": proj_name or f"HUD-{hud_id}",
            "address": address or f"{proj_city}, {proj_st}",
            "cbsa_code": cbsa_code,
            "total_units": safe_int(row.get("n_units")),
            "low_income_units": safe_int(row.get("li_units")),
            "bedroom_studio": safe_int(row.get("n_0br")),
            "bedroom_1br": safe_int(row.get("n_1br")),
            "bedroom_2br": safe_int(row.get("n_2br")),
            "bedroom_3br": safe_int(row.get("n_3br")) + safe_int(row.get("n_4br")),
            "year_placed_in_service": yr_pis,
        })

    out_file = DATA_DIR / "lihtc_2024_filtered.csv"
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "property_name", "address", "cbsa_code", "total_units", "low_income_units",
            "bedroom_studio", "bedroom_1br", "bedroom_2br", "bedroom_3br", "year_placed_in_service",
        ])
        writer.writeheader()
        writer.writerows(out_rows)
    print(f"  Wrote {len(out_rows)} properties ({matched} matched, {unmatched} unmatched) to {out_file}")


def ingest_qct():
    """Ingest QCT2026.csv → app/data/qct_2026.csv"""
    print("Ingesting QCT data...")
    df = pd.read_csv(QCT_CSV)

    out_file = DATA_DIR / "qct_2026.csv"
    df.to_csv(out_file, index=False)
    print(f"  Wrote {len(df)} QCT records to {out_file}")


def ingest_dda():
    """Ingest DDA data → app/data/dda_2026.csv"""
    print("Ingesting DDA data...")
    try:
        xls = pd.ExcelFile(DDA_SOURCE)
        all_rows = []
        for sheet in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet)
            df["dda_type"] = sheet
            all_rows.append(df)
        combined = pd.concat(all_rows, ignore_index=True)
        out_file = DATA_DIR / "dda_2026.csv"
        combined.to_csv(out_file, index=False)
        print(f"  Wrote {len(combined)} DDA records to {out_file}")
    except Exception as e:
        print(f"  SKIP: {e}")


def _parse_table_id(filename: str) -> str:
    """Extract table ID like 'Table_3', 'Table_10' from filename."""
    m = re.search(r"(Table\s*\d+)", filename, re.IGNORECASE)
    return m.group(1).replace(" ", "_") if m else "unknown"


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names to uppercase, strip whitespace."""
    df.columns = [str(c).strip().upper().replace(" ", "_") for c in df.columns]
    # Drop unnamed/empty columns
    return df.loc[:, ~df.columns.str.contains("^UNNAMED", na=False)]


def ingest_tenant_tables():
    """Ingest tenant demographic tables for all available years."""
    print("Ingesting tenant demographic tables...")
    tenant_dir = DATA_DIR / "tenant"
    tenant_dir.mkdir(exist_ok=True)

    # 2019 CSVs (already ingested, but re-run for completeness)
    for csv_file in TENANT_CSVS:
        df = pd.read_csv(csv_file)
        df = _normalize_columns(df)
        year = "2019"
        table_id = _parse_table_id(csv_file.stem)
        out_file = tenant_dir / f"{table_id}_{year}.csv"
        df.to_csv(out_file, index=False)
        print(f"  Wrote {len(df)} rows to {out_file}")

    # 2016 individual Excel files
    for xlsx_file in TENANT_2016_XLSX:
        try:
            df = pd.read_excel(xlsx_file)
            df = _normalize_columns(df)
            year = "2016"
            table_id = _parse_table_id(xlsx_file.stem)
            out_file = tenant_dir / f"{table_id}_{year}.csv"
            df.to_csv(out_file, index=False)
            print(f"  Wrote {len(df)} rows to {out_file}")
        except Exception as e:
            print(f"  SKIP {xlsx_file.name}: {e}")

    # 2021-2023 combined workbooks
    for year, wb_path in TENANT_YEAR_WORKBOOKS.items():
        if not wb_path.exists():
            print(f"  SKIP {wb_path.name} - not found")
            continue
        try:
            xls = pd.ExcelFile(wb_path)
            for sheet in xls.sheet_names:
                if sheet.lower().startswith("table"):
                    try:
                        df = pd.read_excel(xls, sheet_name=sheet, header=None)
                        # Skip single-row/title-only sheets
                        if len(df) < 3:
                            continue
                        # Try to find the actual header row (skip title rows)
                        header_row = None
                        for i in range(min(5, len(df))):
                            row_vals = [str(v).strip() for v in df.iloc[i].tolist() if pd.notna(v)]
                            if any(kw in " ".join(row_vals).lower() for kw in
                                   ["state", "property", "id", "units", "household", "income", "rent"]):
                                header_row = i
                                break
                        if header_row is None:
                            header_row = 2  # default: skip 2 title rows

                        # Re-read with correct header row
                        df = pd.read_excel(xls, sheet_name=sheet, header=header_row)
                        df = _normalize_columns(df)
                        sheet_clean = re.sub(r"^Table\s*", "", sheet, flags=re.IGNORECASE).strip()
                        table_id = f"Table_{sheet_clean.replace(' ', '_')}"
                        out_file = tenant_dir / f"{table_id}_{year}.csv"
                        df.to_csv(out_file, index=False)
                        print(f"  Wrote {len(df)} rows to {out_file}")
                    except Exception as e:
                        print(f"  SKIP sheet {sheet}: {e}")
        except Exception as e:
            print(f"  SKIP {wb_path.name}: {e}")


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "mtsp").mkdir(parents=True, exist_ok=True)

    ingest_mtsp()
    ingest_fmr()
    ingest_lihtc()
    ingest_qct()
    ingest_dda()
    ingest_tenant_tables()

    print("\nDone! All datasets ingested.")


if __name__ == "__main__":
    main()
