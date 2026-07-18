from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.schemas.allowlist import ExtractionResult, ExtractedField, DocumentType
from app.guardrails.injection_defense import InjectionDefense
from app.guardrails.session_store import session_store
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

    text_hash = hashlib.sha256(raw_text.encode()).hexdigest()

    session_store.log_action(session_token, "document_uploaded", "document")

    return ExtractionResult(
        document_type=DocumentType.OTHER,
        fields=[
            ExtractedField(
                field_name="document_text",
                value="[placeholder - real extraction uses VLM/OCR]",
                confidence=0.0,
                source_snippet=raw_text[:200],
                page_number=1,
                requires_confirmation=True,
            )
        ],
        raw_text_hash=text_hash,
    )
