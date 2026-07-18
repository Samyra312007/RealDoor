from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import ChecklistItem
from app.guardrails.session_store import session_store

GOLD_CHECKLIST = {
    "LIHTC": [
        {"item": "Government-issued photo ID", "required": True},
        {"item": "Social Security card or ITIN", "required": True},
        {"item": "Last 4 pay stubs (consecutive)", "required": False},
        {"item": "Bank statements (last 3 months)", "required": False},
        {"item": "Tax returns (last 2 years)", "required": False},
        {"item": "Benefit award letter (SSI/SSDI)", "required": False},
        {"item": "Child support documentation", "required": False},
        {"item": "Veteran status documentation", "required": False},
    ]
}

router = APIRouter(prefix="/checklist", tags=["checklist"])


@router.get("/", response_model=list[ChecklistItem])
def get_checklist(program: str = "LIHTC", session_token: str = ""):
    session = session_store.get_session(session_token)
    items = GOLD_CHECKLIST.get(program, GOLD_CHECKLIST["LIHTC"])
    result = []
    for item in items:
        has_doc = False
        if session and session.get("extracted_fields"):
            has_doc = any(
                item["item"].lower() in (f.get("field_name", "") or "").lower()
                for f in session["extracted_fields"]
            )
        status = "present" if has_doc else "missing"
        result.append(
            ChecklistItem(
                item_name=item["item"],
                status=status,
                document_supported=has_doc,
                notes="Upload documentation for this item" if not has_doc else None,
            )
        )
    return result
