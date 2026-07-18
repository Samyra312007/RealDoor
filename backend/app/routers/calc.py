from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import CalculationRequest, CalculationResult, SessionCalcRequest
from app.guardrails.session_store import session_store
from app.retrieval.corpus import corpus

router = APIRouter(prefix="/calc", tags=["calc"])


@router.post("/", response_model=CalculationResult)
def calculate(calc_req: CalculationRequest):
    return _run_calculation(
        calc_req.annual_income,
        calc_req.household_size,
        calc_req.county_or_cbsa,
    )


@router.post("/from-profile", response_model=CalculationResult)
def calculate_from_profile(req: SessionCalcRequest):
    session = session_store.get_session(req.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    profile = session_store.get_decrypted_profile(req.session_token)
    if profile is None:
        raise HTTPException(status_code=400, detail="No profile found. Complete Stage 1 first.")
    annual_income = profile.get("annual_income")
    household_size = profile.get("household_size")
    county = profile.get("property_cbsa") or profile.get("property_county") or "default"
    if not annual_income or not household_size:
        raise HTTPException(
            status_code=400,
            detail="Profile missing annual_income or household_size. Please confirm these fields.",
        )
    return _run_calculation(float(annual_income), int(household_size), county, req.session_token)


def _run_calculation(
    income: float, hh_size: int, county_or_cbsa: str, session_token: str = "anonymous"
) -> CalculationResult:
    limits = corpus.get_limits(county_or_cbsa, hh_size)

    ami = None
    ami_pct = None
    income_limit_30 = None
    income_limit_50 = None
    income_limit_60 = None
    source_url = corpus.meta.get("source_url", "https://www.huduser.gov/portal/datasets/mtsp.html")
    effective_date = corpus.meta.get("effective_date", "2026-05-01")

    if limits:
        income_limit_30 = float(limits["ami_30"])
        income_limit_50 = float(limits["ami_50"])
        income_limit_60 = float(limits["ami_60"])
        ami = income_limit_50 / 0.5
        ami_pct = round((income / ami) * 100, 1) if ami > 0 else None
        region_name = limits["cbsa_name"]
    else:
        region_name = county_or_cbsa

    steps = [
        f"Confirmed annual income: ${income:,.2f}",
        f"Household size: {hh_size} persons",
        f"Metro area: {region_name}",
        "",
    ]

    if ami and ami_pct is not None:
        steps.append(f"Area Median Income (AMI): ${ami:,.2f}")
        steps.append(
            f"Your income ÷ AMI × 100 = ${income:,.2f} ÷ ${ami:,.2f} × 100 = {ami_pct}% of AMI"
        )
        steps.append("")
    else:
        steps.append("AMI data pending county configuration.")
        steps.append("")

    if income_limit_30:
        steps.append(f"30% AMI income limit: ${income_limit_30:,.2f}/year")
    if income_limit_50:
        steps.append(f"50% AMI income limit: ${income_limit_50:,.2f}/year")
    if income_limit_60:
        steps.append(f"60% AMI income limit: ${income_limit_60:,.2f}/year")

    steps.append("")
    steps.append("This is a calculation trace. It does not determine eligibility.")
    steps.append("A qualified human reviews all information before any decision.")

    session_store.log_action(session_token, "calculation_run", "annual_income")

    return CalculationResult(
        annual_income=income,
        household_size=hh_size,
        area_median_income=ami,
        income_limit_30=income_limit_30,
        income_limit_50=income_limit_50,
        income_limit_60=income_limit_60,
        ami_percentage=ami_pct,
        formula_steps=steps,
        source_url=source_url,
        effective_date=effective_date,
    )
