from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import FieldConfirmation, RenterProfile
from app.guardrails.session_store import session_store

router = APIRouter(prefix="/confirm", tags=["confirm"])

ALLOWLIST_FIELDS = {
    "full_name", "household_size", "annual_income", "monthly_income",
    "income_source", "has_voucher", "voucher_type", "current_address",
    "has_government_id", "is_veteran", "is_senior", "has_disability",
    "property_county", "property_cbsa",
}


@router.post("/", response_model=dict)
def confirm_field(confirmation: FieldConfirmation):
    session = session_store.get_session(confirmation.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    session["confirmed_fields"].append(confirmation.model_dump())

    profile = session_store.get_decrypted_profile(confirmation.session_token) or {}
    if confirmation.field_name in ALLOWLIST_FIELDS:
        profile[confirmation.field_name] = (
            confirmation.corrected_value if confirmation.corrected_value
            else profile.get(confirmation.field_name)
        )
    profile["session_token"] = confirmation.session_token
    profile_model = RenterProfile(**profile)
    session_store.set_profile(confirmation.session_token, profile_model.model_dump(exclude_none=True))

    session_store.log_action(
        confirmation.session_token,
        "field_confirmed",
        confirmation.field_name,
    )
    return {
        "status": "confirmed",
        "field": confirmation.field_name,
        "corrected": confirmation.corrected_value is not None,
    }


@router.put("/profile", response_model=dict)
def update_profile(profile: RenterProfile):
    session = session_store.get_session(profile.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    session_store.set_profile(profile.session_token, profile.model_dump())
    session_store.log_action(profile.session_token, "profile_updated", "profile")
    return {"status": "profile_updated", "fields": len(profile.model_dump(exclude_none=True))}
