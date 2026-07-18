from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.schemas.allowlist import ExtractionResult, ExtractedField
from app.guardrails.injection_defense import InjectionDefense
from app.guardrails.session_store import session_store
from app.extraction.extractor import process_document
from app.config import settings
import hashlib

router = APIRouter(prefix="/extract", tags=["extract"])


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
        session_store.log_action(session_token, "injection_attempt_blocked", "document_text")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "suspicious_document_content",
                "message": "Document contains content that may attempt to override system instructions.",
                "findings": scan["findings"],
            },
        )

    result = process_document(contents, file.filename or "document.pdf")

    text_hash = hashlib.sha256(raw_text.encode()).hexdigest()
    result.raw_text_hash = text_hash

    session["extracted_fields"] = [f.model_dump() for f in result.fields]

    session_store.log_action(session_token, "document_uploaded", file.filename)

    return result
