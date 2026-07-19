import io
import re
import logging
from typing import Optional

from app.extraction.field_parser import extract_all_fields
from app.schemas.allowlist import ExtractionResult, ExtractedField, DocumentType

logger = logging.getLogger(__name__)


def detect_document_type(text: str) -> DocumentType:
    text_lower = text.lower()
    if re.search(r"bank.?statement|account.?number|deposit|withdrawal|balance", text_lower):
        return DocumentType.BANK_STATEMENT
    if re.search(r"pay.?stub|earnings|wages|gross.?pay|net.?pay|ytd|year.to.date", text_lower):
        return DocumentType.PAY_STUB
    if re.search(r"social.security|ssi|ssdi|tanf|snap|benefit|award.?letter", text_lower):
        return DocumentType.BENEFIT_LETTER
    if re.search(r"tax.?return|form\s+w-?2|1040|1099|irs", text_lower):
        return DocumentType.TAX_RETURN
    if re.search(r"driver.?s.?license|passport|state.?id|identification", text_lower):
        return DocumentType.ID_DOCUMENT
    return DocumentType.OTHER


def _normalize_pdf_text(text: str) -> str:
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_pdf_pypdf(content: bytes) -> Optional[str]:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        pages = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            pages.append(f"--- Page {i + 1} ---\n{page_text}")
        raw = "\n\n".join(pages)
        if raw.strip():
            return _normalize_pdf_text(raw)
        return None
    except Exception as e:
        logger.warning("PyPDF extraction failed: %s", e)
        return None


def _extract_pdf_pdfminer(content: bytes) -> Optional[str]:
    try:
        from pdfminer.high_level import extract_text
        from pdfminer.pdfparser import PDFSyntaxError
        text = extract_text(io.BytesIO(content))
        if text and text.strip():
            return _normalize_pdf_text(text)
        return None
    except Exception as e:
        logger.warning("pdfminer extraction failed: %s", e)
        return None


def _ocr_image_bytes(content: bytes) -> Optional[str]:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(img)
        if text and text.strip():
            return text.strip()
        return None
    except ImportError:
        return None
    except Exception as e:
        logger.warning("OCR failed: %s", e)
        return None


def _ocr_pdf_via_images(content: bytes) -> Optional[str]:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        images = convert_from_bytes(content)
        texts = []
        for i, img in enumerate(images):
            page_text = pytesseract.image_to_string(img)
            texts.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
        result = "\n\n".join(texts)
        if result.strip():
            return result
        return None
    except ImportError:
        return None
    except Exception as e:
        logger.warning("PDF OCR failed: %s", e)
        return None


def _extract_docx_text(content: bytes) -> Optional[str]:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        if paragraphs:
            return "\n\n".join(paragraphs)
        return None
    except Exception as e:
        logger.warning("DOCX extraction failed: %s", e)
        return None


def _extract_doc_olefile(content: bytes) -> Optional[str]:
    try:
        import olefile
        ole = olefile.OleFileIO(io.BytesIO(content))
        result = []

        if ole.exists("WordDocument"):
            data = ole.openstream("WordDocument").read()
            ole.close()

            buf = []
            for i in range(0, len(data) - 1, 2):
                char_code = data[i] | (data[i + 1] << 8)
                if 0x20 <= char_code <= 0x7E or char_code in (0x0A, 0x0D, 0x09):
                    buf.append(chr(char_code))
                elif 0xA0 <= char_code <= 0xFF:
                    buf.append(chr(char_code))
                else:
                    if len(buf) > 3:
                        result.append("".join(buf))
                    buf = []

            if len(buf) > 3:
                result.append("".join(buf))

            text = "\n".join(result)
            if text.strip():
                return text.strip()

        return None
    except Exception as e:
        logger.warning("Legacy .doc extraction failed: %s", e)
        return None


def _is_tesseract_available() -> bool:
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    name_lower = filename.lower()

    if name_lower.endswith(".pdf"):
        text = _extract_pdf_pypdf(content)
        if text:
            return text

        text = _extract_pdf_pdfminer(content)
        if text:
            return text

        if _is_tesseract_available():
            text = _ocr_pdf_via_images(content)
            if text:
                return text
            return "[Could not extract text from this PDF. It may be a scanned document with no OCR system available.]"

        return "[Could not extract text from this PDF. Try uploading a text-based PDF (not a scanned document).]"

    elif name_lower.endswith(".docx"):
        text = _extract_docx_text(content)
        if text:
            return text
        return f"[Could not read text from {filename}. The document may be empty or corrupted.]"

    elif name_lower.endswith(".doc"):
        text = _extract_doc_olefile(content)
        if text:
            return text
        return f"[Could not read text from {filename}. The legacy .doc file may be corrupted or in an unsupported format.]"

    elif any(name_lower.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp")):
        if _is_tesseract_available():
            text = _ocr_image_bytes(content)
            if text:
                return text
            return f"[Could not read text from {filename}. The image may be too blurry or low-quality.]"

        from PIL import Image
        try:
            img = Image.open(io.BytesIO(content))
            return f"[Image file: {filename}, dimensions: {img.size[0]}x{img.size[1]}, mode: {img.mode}. OCR is not available - try uploading a PDF with selectable text instead.]"
        except Exception:
            return f"[Unprocessable image: {filename}. Try a PDF with selectable text instead.]"

    else:
        try:
            return content.decode("utf-8", errors="replace")
        except Exception:
            return content.decode("latin-1", errors="replace")


def get_page_number(text: str, snippet: str) -> Optional[int]:
    if not snippet:
        return None
    snippet_pos = text.find(snippet[:50])
    if snippet_pos == -1:
        return None
    last_page = None
    for match in re.finditer(r"--- Page (\d+) ---", text):
        if match.start() <= snippet_pos:
            last_page = int(match.group(1))
        else:
            break
    return last_page or 1


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