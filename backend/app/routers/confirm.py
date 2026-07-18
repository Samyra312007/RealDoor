from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import FieldConfirmation, RenterProfile
from app.guardrails.session_store import session_store

router = APIRouter(prefix="/confirm", tags=["confirm"])


@router.post("/", response_model=dict)
def confirm_field(confirmation: FieldConfirmation):
    session = session_store.get_session(confirmation.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    session["confirmed_fields"].append(confirmation.model_dump())
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
