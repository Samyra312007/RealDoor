from fastapi import APIRouter
from app.schemas.allowlist import CalculationRequest, CalculationResult
from app.guardrails.session_store import session_store

router = APIRouter(prefix="/calc", tags=["calc"])


@router.post("/", response_model=CalculationResult)
def calculate(calc_req: CalculationRequest):
    income = calc_req.annual_income
    hh_size = calc_req.household_size

    income_limit_50 = _lookup_limit(calc_req.county_or_cbsa, hh_size, 50)
    income_limit_60 = _lookup_limit(calc_req.county_or_cbsa, hh_size, 60)
    income_limit_30 = _lookup_limit(calc_req.county_or_cbsa, hh_size, 30)

    ami = None
    ami_pct = None
    if income_limit_50:
        ami = income_limit_50 / 0.5
        ami_pct = round((income / ami) * 100, 1) if ami > 0 else None

    steps = [
        f"1. Confirmed annual income: ${income:,.2f}",
        f"2. Household size: {hh_size}",
        f"3. Area Median Income (AMI): ${ami:,.2f}" if ami else "3. AMI data pending county configuration",
        f"4. Your income as % of AMI: {ami_pct}%" if ami_pct else "4. Income threshold comparison requires configured county data",
        f"5. 30% income limit: ${income_limit_30:,.2f}" if income_limit_30 else "5. 30% limit: data not yet loaded",
        f"6. 50% income limit: ${income_limit_50:,.2f}" if income_limit_50 else "6. 50% limit: data not yet loaded",
        f"7. 60% income limit: ${income_limit_60:,.2f}" if income_limit_60 else "7. 60% limit: data not yet loaded",
        "---",
        "This is a calculation trace. It does not determine eligibility.",
        "A qualified human reviews all information before any decision.",
    ]

    session_store.log_action("anonymous", "calculation_run", "annual_income")

    return CalculationResult(
        annual_income=income,
        household_size=hh_size,
        area_median_income=ami,
        income_limit_30=income_limit_30,
        income_limit_50=income_limit_50,
        income_limit_60=income_limit_60,
        ami_percentage=ami_pct,
        formula_steps=steps,
        source_url="https://www.huduser.gov/portal/datasets/mtsp.html",
        effective_date="2026-05-01",
    )


def _lookup_limit(county_or_cbsa: str, hh_size: int, pct: int) -> float | None:
    try:
        limit_map = {
            "12086": {1: 62700, 2: 71600, 3: 80500, 4: 89400},
            "default": {1: 55000, 2: 62900, 3: 70700, 4: 78500},
        }
        entry = limit_map.get(county_or_cbsa, limit_map["default"])
        val = entry.get(hh_size, entry[4])
        return round(val * (pct / 60.0), 2)
    except Exception:
        return None
