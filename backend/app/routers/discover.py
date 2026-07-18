from fastapi import APIRouter, Query
from app.discover.service import lihtc_service

router = APIRouter(prefix="/discover", tags=["discover"])

DISCLAIMER = (
    "Location only — contact property for current availability. "
    "Data from HUD LIHTC database — projects through 2024 only. "
    "No vacancy or rent data is displayed."
)

STALENESS_NOTE = (
    "HUD LIHTC database — projects through 2024 only. "
    "Contact properties for current availability and income limits."
)


@router.get("/properties")
def list_properties(
    cbsa: str = Query(..., description="CBSA code for metro area"),
    min_bedrooms: int = Query(None, description="Minimum bedrooms (0=studio, 1, 2, 3)"),
    max_bedrooms: int = Query(None, description="Maximum bedrooms (0=studio, 1, 2, 3)"),
    min_units: int = Query(None, description="Minimum total units"),
):
    results = lihtc_service.get_by_cbsa(
        cbsa_code=cbsa,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        min_units=min_units,
    )
    return {
        "properties": results,
        "total_count": len(results),
        "staleness_note": STALENESS_NOTE,
        "disclaimer": DISCLAIMER,
        "filters_applied": {
            "cbsa": cbsa,
            "min_bedrooms": min_bedrooms,
            "max_bedrooms": max_bedrooms,
            "min_units": min_units,
        },
    }


@router.get("/codes")
def list_cbsa_codes():
    codes = lihtc_service.get_cbsa_codes()
    return {
        "codes": codes,
    }
