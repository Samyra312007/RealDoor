from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.schemas.allowlist import ExtractionResult, ExtractedField, RenterProfile
from app.guardrails.injection_defense import InjectionDefense
from app.guardrails.session_store import session_store
from app.extraction.extractor import process_document
from app.config import settings
import hashlib

ALLOWLIST_FIELDS = {
    "full_name", "household_size", "annual_income", "monthly_income",
    "income_source", "has_voucher", "voucher_type", "current_address",
    "has_government_id", "is_veteran", "is_senior", "has_disability",
    "property_county", "property_cbsa",
}

router = APIRouter(prefix="/extract", tags=["extract"])


def _filter_allowlist(fields: list[ExtractedField]) -> list[ExtractedField]:
    return [f for f in fields if f.field_name in ALLOWLIST_FIELDS]


@router.post("/", response_model=ExtractionResult)
async def extract_document(
    file: UploadFile = File(...),
    session_token: str = "",
    injection_defense: InjectionDefense = Depends(lambda: InjectionDefense()),
):
    session = session_store.get_session(session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    contents = await file.read()

    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds maximum upload size")

    name_lower = (file.filename or "document").lower()
    allowed = settings.ALLOWED_DOCUMENT_TYPES
    if not any(name_lower.endswith(ext.split("/")[-1]) for ext in allowed):
        if not any(name_lower.endswith(ext) for ext in (".pdf", ".png", ".jpg", ".jpeg")):
            raise HTTPException(status_code=415, detail="Unsupported file type")

    raw_text = contents.decode("latin-1", errors="replace")[:10000]

    scan = injection_defense.scan_document_text(raw_text)
    if scan["is_suspicious"]:
        session_store.log_action(session_token, "injection_attempt_sanitized", "document_text")
        raw_text = injection_defense.sanitize_for_model(raw_text)
        contents = raw_text.encode("latin-1", errors="replace")

    result = process_document(contents, file.filename or "document.pdf")
    result.fields = _filter_allowlist(result.fields)

    text_hash = hashlib.sha256(raw_text.encode()).hexdigest()
    result.raw_text_hash = text_hash

    session["extracted_fields"] = [f.model_dump() for f in result.fields]

    session_store.add_document(
        session_token,
        result.document_type.value,
        [f.field_name for f in result.fields],
    )

    session_store.log_action(session_token, "document_uploaded", file.filename)

    return result
