import csv
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(tags=["designations"])

DATA_DIR = Path(__file__).parent.parent / "data"
QCT_FILE = DATA_DIR / "qct_2026.csv"
DDA_FILE = DATA_DIR / "dda_2026.csv"


def _load_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _extract_cbsa_from_dda(cbsasub: str) -> str:
    m = re.search(r"METRO(\d{5})", str(cbsasub))
    return m.group(1) if m else ""


@router.get("/qct/")
def get_qct(
    cbsa: str = Query(..., description="CBSA code (e.g. 12060)"),
    limit: int = Query(100, ge=1, le=5000),
    offset: int = Query(0, ge=0),
):
    """List Qualified Census Tracts for a CBSA metro area."""
    records = _load_csv(QCT_FILE)
    cbsa_int = int(cbsa)
    matched = [r for r in records if int(r.get("cbsa", 0)) == cbsa_int]
    total = len(matched)
    page = matched[offset:offset + limit]
    return {
        "cbsa": cbsa,
        "total_qct_tracts": total,
        "offset": offset,
        "limit": limit,
        "tracts": page,
        "source_url": "https://www.huduser.gov/portal/datasets/qct.html",
        "context_note": "Qualified Census Tracts are designated by HUD for certain tax incentives under the Low-Income Housing Tax Credit program.",
    }


@router.get("/dda/")
def get_dda(
    cbsa: str = Query(..., description="CBSA code (e.g. 12060)"),
    limit: int = Query(100, ge=1, le=5000),
    offset: int = Query(0, ge=0),
):
    """List Difficult Development Areas and Small DDAs for a CBSA metro area."""
    records = _load_csv(DDA_FILE)
    matched = [
        r for r in records
        if _extract_cbsa_from_dda(r.get("CBSAsub", "")) == cbsa
    ]
    total = len(matched)
    page = matched[offset:offset + limit]

    stripped = []
    for r in page:
        stripped.append({
            "zcta": r.get("ZIP Code Tabulation Area (ZCTA)", ""),
            "area_name": r.get("Area Name", ""),
            "population": _safe_int(r.get("2020 Decennial Census ZCTA Population")),
            "pop_in_qct": _safe_int(r.get("ZCTA Population also in 2025 QCT")),
            "fmr_2br": _safe_int(r.get("FY2025 Final 40th Percentile 2-Bedroom FMR")),
            "vli_4person": _safe_int(r.get("2025 4-Person Very Low Income Limit (VLIL)")),
            "max_lihtc_rent": _safe_float(r.get("LIHTC Maximum Rent (1/12 of 30% of 120% of VLIL)")),
            "dda_flag": _safe_int(r.get("2026 SDDA (1=SDDA)")),
            "dda_type": r.get("dda_type", ""),
        })

    return {
        "cbsa": cbsa,
        "total_dda_zones": total,
        "offset": offset,
        "limit": limit,
        "zones": stripped,
        "source_url": "https://www.huduser.gov/portal/datasets/qct.html",
        "context_note": "Difficult Development Areas are designated by HUD where rents are high relative to incomes, qualifying them for enhanced LIHTC incentives.",
    }


def _safe_int(val) -> Optional[int]:
    try:
        v = float(str(val).strip())
        return int(v) if not __import__("math").isnan(v) else None
    except (ValueError, TypeError):
        return None


def _safe_float(val) -> Optional[float]:
    try:
        v = float(str(val).strip())
        return v if not __import__("math").isnan(v) else None
    except (ValueError, TypeError):
        return None
