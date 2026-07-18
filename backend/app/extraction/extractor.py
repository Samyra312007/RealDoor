import io
import re
from typing import Optional
from app.extraction.field_parser import extract_all_fields
from app.schemas.allowlist import ExtractionResult, ExtractedField, DocumentType


def detect_document_type(text: str) -> DocumentType:
    text_lower = text.lower()
    if re.search(r"pay.?stub|earnings|statement|wages|gross.?pay|net.?pay|ytd|year.to.date", text_lower):
        return DocumentType.PAY_STUB
    if re.search(r"social.security|ssi|ssdi|tanf|snap|benefit|award.?letter", text_lower):
        return DocumentType.BENEFIT_LETTER
    if re.search(r"tax.?return|form\s+w-?2|1040|1099|irs", text_lower):
        return DocumentType.TAX_RETURN
    if re.search(r"bank.?statement|account.?number|deposit|withdrawal|balance", text_lower):
        return DocumentType.BANK_STATEMENT
    if re.search(r"driver.?s.?license|passport|state.?id|identification", text_lower):
        return DocumentType.ID_DOCUMENT
    return DocumentType.OTHER


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    name_lower = filename.lower()
    if name_lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                pages.append(f"--- Page {i + 1} ---\n{page_text}")
            return "\n\n".join(pages)
        except Exception:
            return content.decode("latin-1", errors="replace")
    elif any(name_lower.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp")):
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(content))
            return f"[Image file: {filename}, dimensions: {img.size[0]}x{img.size[1]}, mode: {img.mode}]"
        except Exception:
            return f"[Unprocessable image: {filename}]"
    else:
        return content.decode("latin-1", errors="replace")


def get_page_number(text: str, snippet: str) -> Optional[int]:
    if not snippet:
        return None
    for match in re.finditer(r"--- Page (\d+) ---", text):
        page_header_pos = match.start()
        snippet_pos = text.find(snippet[:50])
        if snippet_pos >= page_header_pos:
            return int(match.group(1))
    return 1


def process_document(content: bytes, filename: str) -> ExtractionResult:
    raw_text = extract_text_from_bytes(content, filename)
    doc_type = detect_document_type(raw_text)
    parsed = extract_all_fields(raw_text)

    fields = []
    for p in parsed:
        snippet = p["source_snippet"]
        page_num = get_page_number(raw_text, snippet) if snippet else 1
        fields.append(ExtractedField(
            field_name=p["field_name"],
            value=p["value"],
            confidence=p["confidence"],
            source_snippet=snippet or "(no source text available)",
            page_number=page_num,
            needs_review=p["needs_review"],
        ))

    return ExtractionResult(
        document_type=doc_type,
        fields=fields,
        raw_text_hash="",
    )
