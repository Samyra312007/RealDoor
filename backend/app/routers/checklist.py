from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import ChecklistItem
from app.guardrails.session_store import session_store
import time

GOLD_CHECKLIST = {
    "LIHTC": [
        {
            "item": "Government-issued photo ID",
            "required": True,
            "profile_fields": ["has_government_id", "full_name"],
            "doc_types": ["id_document"],
            "max_age_days": None,
            "description": "Driver's license, passport, or other government-issued photo ID",
        },
        {
            "item": "Social Security card or ITIN",
            "required": True,
            "profile_fields": [],
            "doc_types": ["id_document"],
            "max_age_days": None,
            "description": "Social Security card or IRS-issued ITIN document",
        },
        {
            "item": "Last 4 pay stubs (consecutive)",
            "required": False,
            "profile_fields": [],
            "doc_types": ["pay_stub"],
            "max_age_days": 90,
            "description": "Most recent 4 consecutive pay stubs showing year-to-date income",
        },
        {
            "item": "Bank statements (last 3 months)",
            "required": False,
            "profile_fields": [],
            "doc_types": ["bank_statement"],
            "max_age_days": 180,
            "description": "All pages of the most recent 3 months of bank statements",
        },
        {
            "item": "Tax returns (last 2 years)",
            "required": False,
            "profile_fields": [],
            "doc_types": ["tax_return"],
            "max_age_days": 730,
            "description": "Signed federal tax returns for the last 2 filing years",
        },
        {
            "item": "Benefit award letter (SSI/SSDI)",
            "required": False,
            "profile_fields": ["income_source"],
            "doc_types": ["benefit_letter"],
            "max_age_days": 365,
            "description": "Current Social Security/SSI/SSDI benefit award letter",
        },
        {
            "item": "Child support documentation",
            "required": False,
            "profile_fields": ["income_source"],
            "doc_types": ["benefit_letter"],
            "max_age_days": 365,
            "description": "Child support order, payment history, or agreement",
        },
        {
            "item": "Veteran status documentation",
            "required": False,
            "profile_fields": ["is_veteran"],
            "doc_types": [],
            "max_age_days": None,
            "description": "DD-214, VA benefits letter, or other proof of veteran status",
        },
    ]
}

router = APIRouter(prefix="/checklist", tags=["checklist"])


def _check_doc_support(doc_type: str, documents: list[dict]) -> bool:
    return any(d["doc_type"] == doc_type for d in documents)


def _get_upload_timestamps(doc_type: str, documents: list[dict]) -> list[float]:
    return [d["uploaded_at"] for d in documents if d["doc_type"] == doc_type]


@router.get("/", response_model=list[ChecklistItem])
def get_checklist(program: str = "LIHTC", session_token: str = ""):
    session = session_store.get_session(session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    profile = session_store.get_decrypted_profile(session_token)
    documents = session_store.get_documents(session_token)
    items = GOLD_CHECKLIST.get(program, GOLD_CHECKLIST["LIHTC"])

    result = []
    for item in items:
        doc_supported = any(
            _check_doc_support(dt, documents) for dt in item["doc_types"]
        )
        profile_supported = False
        if profile:
            profile_supported = any(
                profile.get(f) for f in item["profile_fields"] if profile.get(f)
            )

        is_present = doc_supported or profile_supported
        is_expired = False
        notes = None

        if item["max_age_days"] and doc_supported:
            for dt in item["doc_types"]:
                timestamps = _get_upload_timestamps(dt, documents)
                for ts in timestamps:
                    age_days = (time.time() - ts) / 86400
                    if age_days > item["max_age_days"]:
                        is_expired = True
                        notes = f"Uploaded {int(age_days)} days ago — may exceed {item['max_age_days']}-day guideline"
                        break

        if not doc_supported and not profile_supported:
            status = "missing"
            notes = item.get("description", "Upload documentation for this item")
        elif is_expired:
            status = "expired"
        else:
            status = "present"

        result.append(
            ChecklistItem(
                item_name=item["item"],
                status=status,
                document_supported=doc_supported,
                expiry_date=None,
                notes=notes,
            )
        )

    return result
