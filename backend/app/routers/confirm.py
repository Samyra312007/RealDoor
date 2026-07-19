from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import FieldConfirmation, RenterProfile, IncomeSource
from app.guardrails.session_store import session_store

router = APIRouter(prefix="/confirm", tags=["confirm"])

ALLOWLIST_FIELDS = {
    "full_name", "household_size", "annual_income", "monthly_income",
    "income_source", "has_voucher", "voucher_type", "current_address",
    "has_government_id", "is_veteran", "is_senior", "has_disability",
    "property_county", "property_cbsa",
}


def _normalize_value(field_name: str, value: str) -> str:
    if value == "(skipped)":
        return value
    if field_name == "income_source":
        lower = value.lower().replace(" ", "_")
        for member in IncomeSource:
            if member.value == lower:
                return member.value
        return IncomeSource.OTHER.value
    if field_name in ("has_voucher", "has_government_id", "is_veteran", "is_senior", "has_disability"):
        if value.lower() in ("yes", "true", "x"):
            return "true"
        if value.lower() in ("no", "false", "n/a"):
            return "false"
    if field_name == "voucher_type":
        norm = value.lower().replace(" ", "")
        if norm in ("section8", "section_8"):
            return "section8"
        if norm == "portable":
            return "portable"
        if norm in ("other", "none", "n/a", ""):
            return "other"
    return value


@router.post("/", response_model=dict)
def confirm_field(confirmation: FieldConfirmation):
    session = session_store.get_session(confirmation.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    session["confirmed_fields"].append(confirmation.model_dump())

    profile = session_store.get_decrypted_profile(confirmation.session_token) or {}
    if confirmation.field_name in ALLOWLIST_FIELDS:
        raw_value = confirmation.corrected_value if confirmation.corrected_value else profile.get(confirmation.field_name)
        if raw_value and raw_value != "(skipped)":
            profile[confirmation.field_name] = _normalize_value(confirmation.field_name, str(raw_value))
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


@router.delete("/field/{field_name}", response_model=dict)
def delete_field(session_token: str, field_name: str):
    session = session_store.get_session(session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    if field_name not in ALLOWLIST_FIELDS:
        raise HTTPException(status_code=400, detail="Unknown field name")

    session["extracted_fields"] = [f for f in session.get("extracted_fields", []) if f.get("field_name") != field_name]
    session["confirmed_fields"] = [f for f in session.get("confirmed_fields", []) if f.get("field_name") != field_name]

    profile = session_store.get_decrypted_profile(session_token) or {}
    profile.pop(field_name, None)
    profile["session_token"] = session_token
    session_store.set_profile(session_token, profile)

    session_store.log_action(session_token, "field_deleted", field_name)
    return {"status": "deleted", "field": field_name}
