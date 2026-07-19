import csv
import os
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/tenant", tags=["tenant"])

DATA_DIR = Path(__file__).parent.parent / "data" / "tenant"

TABLE_DESCRIPTIONS = {
    "Table_1": "Tenant demographics overview",
    "Table_2": "Unit distribution by bedroom count",
    "Table_3": "Household size at certification vs. reported household members",
    "Table_4": "Race/ethnicity of heads of household",
    "Table_4b": "Race/ethnicity of heads of household (alternate)",
    "Table_5": "Reporting rates for disability status",
    "Table_6": "Disability status of tenants",
    "Table_7": "Family composition — households with children and elderly members",
    "Table_8": "Distribution of annual household income",
    "Table_9": "Total annual household income relative to area median gross income (AMGI)",
    "Table_10": "Gross rent as percentage of annual household income",
    "Table_11": "Reporting rates for rental assistance",
    "Table_12": "Use of federal rental assistance",
    "Table_12b": "Use of federal rental assistance (alternate)",
}


def _scan_files() -> dict[str, list[str]]:
    """Scan tenant directory and return {table_id: [years]}."""
    by_table: dict[str, list[str]] = defaultdict(list)
    if not DATA_DIR.exists():
        return {}
    for f in sorted(os.listdir(DATA_DIR)):
        if not f.endswith(".csv"):
            continue
        m = re.match(r"(Table_\d+b?)_(\d{4})\.csv", f)
        if m:
            by_table[m.group(1)].append(m.group(2))
    return dict(by_table)


def _load_table(table_id: str, year: str) -> list[dict]:
    path = DATA_DIR / f"{table_id}_{year}.csv"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Table '{table_id}' for year {year} not found. Available: {_available_years(table_id)}",
        )
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _available_years(table_id: str) -> list[str]:
    tables = _scan_files()
    return tables.get(table_id, [])


@router.get("/tables")
def list_tables():
    """List all available tenant tables and their years."""
    tables = _scan_files()
    result = []
    for tid in sorted(tables):
        result.append({
            "table_id": tid,
            "description": TABLE_DESCRIPTIONS.get(tid, "LIHTC tenant demographic table"),
            "available_years": sorted(tables[tid]),
            "latest_year": max(tables[tid]),
        })
    return {"tables": result, "total_tables": len(result)}


@router.get("/table/{table_id}")
def get_table(
    table_id: str,
    year: Optional[str] = Query(None, description="Data year (defaults to latest)"),
    state: Optional[str] = Query(None, description="Two-letter state code filter"),
    limit: int = Query(50, description="Max rows to return", ge=1, le=1000),
    offset: int = Query(0, description="Row offset for pagination", ge=0),
):
    """Get tenant table data for a given table and year."""
    tables = _scan_files()
    if table_id not in tables:
        raise HTTPException(status_code=404, detail=f"Table '{table_id}' not found")

    if year is None:
        year = max(tables[table_id])
    elif year not in tables[table_id]:
        raise HTTPException(
            status_code=404,
            detail=f"Year {year} not available for {table_id}. Available: {tables[table_id]}",
        )

    rows = _load_table(table_id, year)

    if state:
        state_upper = state.upper()
        rows = [r for r in rows if r.get("STATE", "").upper() == state_upper]

    total = len(rows)
    page = rows[offset:offset + limit]

    return {
        "table_id": table_id,
        "year": year,
        "description": TABLE_DESCRIPTIONS.get(table_id, ""),
        "total_rows": total,
        "offset": offset,
        "limit": limit,
        "rows": page,
    }
