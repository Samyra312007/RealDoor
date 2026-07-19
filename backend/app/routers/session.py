from fastapi import APIRouter, HTTPException, Response, Query
from app.config import settings
from app.schemas.allowlist import SessionInfo
from app.guardrails.session_store import session_store

router = APIRouter(prefix="/session", tags=["session"])


def _validate_token(token: str) -> None:
    if not token or not token.strip():
        raise HTTPException(status_code=400, detail="Session token is required.")


@router.post("/create", response_model=dict)
def create_session():
    token = session_store.create_session()
    return {"session_token": token, "message": "Session created"}


@router.get("/info", response_model=SessionInfo)
def get_session_info(token: str = Query(..., description="Session token")):
    _validate_token(token)
    session = session_store.get_session(token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    profile = session.get("profile")
    return SessionInfo(
        session_token=token,
        created_at=str(session["created_at"]),
        ttl_seconds=settings.SESSION_TTL_SECONDS,
        has_profile=profile is not None,
        fields_confirmed=len(session.get("confirmed_fields", [])),
        rule_queries_made=len(session.get("rule_queries", [])),
        calculations_run=len(session.get("calculations", [])),
    )


@router.get("/profile", response_model=dict)
def get_session_profile(token: str = Query(..., description="Session token")):
    _validate_token(token)
    session = session_store.get_session(token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    profile = session_store.get_decrypted_profile(token)
    if profile is None:
        raise HTTPException(status_code=404, detail="No profile found")
    profile.pop("session_token", None)
    return {"session_token": token[:16] + "...", "profile": profile}


@router.delete("/delete")
def delete_session(token: str = Query(..., description="Session token")):
    _validate_token(token)
    if not session_store.delete_session(token):
        raise HTTPException(status_code=404, detail="Session not found")
    return Response(status_code=200)


@router.delete("/{token}")
def delete_session_by_id(token: str):
    _validate_token(token)
    if not session_store.delete_session(token):
        raise HTTPException(status_code=404, detail="Session not found")
    return Response(status_code=200)


@router.get("/{token}/log", response_model=dict)
def get_session_log(token: str):
    session = session_store.get_session(token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return {
        "session_token": token[:16] + "...",
        "consent_log": session.get("consent_log", []),
        "total_actions": len(session.get("consent_log", [])),
    }


@router.get("/{token}/packets", response_model=dict)
def get_session_packets(token: str):
    session = session_store.get_session(token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    packets = [
        {
            "packet_id": p["packet_id"],
            "created_at": p["created_at"],
            "fields_included": len(p.get("include_fields", [])),
        }
        for p in session.get("packets", [])
    ]
    return {
        "session_token": token[:16] + "...",
        "packets": packets,
    }
