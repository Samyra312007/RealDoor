import csv
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/fmr", tags=["fmr"])

DATA_DIR = Path(__file__).parent.parent / "data"
FMR_FILE = DATA_DIR / "fmr_2026.csv"


def _load_fmr() -> list[dict]:
    if not FMR_FILE.exists():
        return []
    with open(FMR_FILE, encoding="utf-8") as f:
        return list(csv.DictReader(f))


@router.get("/")
def get_fmr(cbsa: str = Query(..., description="CBSA code for metro area")):
    records = _load_fmr()
    for rec in records:
        if rec["cbsa_code"] == cbsa:
            return {
                "cbsa_code": rec["cbsa_code"],
                "cbsa_name": rec["cbsa_name"],
                "fair_market_rents": {
                    "studio": int(rec["bedroom_0"]),
                    "one_bedroom": int(rec["bedroom_1"]),
                    "two_bedroom": int(rec["bedroom_2"]),
                    "three_bedroom": int(rec["bedroom_3"]),
                    "four_bedroom": int(rec["bedroom_4"]),
                },
                "effective_date": rec["effective_date"],
                "source_url": rec["source_url"],
                "context_note": (
                    "Fair Market Rents are HUD estimates of local rent costs. "
                    "They are not asking rents, eligibility criteria, or rental guarantees."
                ),
            }
    raise HTTPException(
        status_code=404,
        detail=f"No FMR data found for CBSA {cbsa}",
    )
