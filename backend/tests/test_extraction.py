import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
DATA_DIR = Path(__file__).parent.parent / "data" / "synthetic"


def _create_session() -> str:
    return client.post("/session/create").json()["session_token"]


def _load_manifest() -> dict:
    manifest_path = DATA_DIR / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path) as f:
            return json.load(f)
    return {}


def _find_synthetic_by_type(doc_type: str) -> Path | None:
    for f in DATA_DIR.iterdir():
        if f.suffix == ".pdf" and doc_type in f.name:
            return f
    return None


def test_extract_from_real_pay_stub_pdf():
    pdf_path = _find_synthetic_by_type("pay_stub")
    assert pdf_path is not None, "No synthetic pay stub PDF found. Run scripts/generate_synthetic_docs.py first."
    token = _create_session()
    with open(pdf_path, "rb") as f:
        resp = client.post(
            f"/extract/?session_token={token}",
            files={"file": (pdf_path.name, f, "application/pdf")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "pay_stub"
    fields = {f["field_name"]: f for f in data["fields"]}
    assert "full_name" in fields
    assert fields["full_name"]["value"]
    assert fields["full_name"]["confidence"] > 0
    assert "annual_income" in fields
    assert fields["annual_income"]["value"]
    assert "current_address" in fields
    assert fields["current_address"]["value"]


def test_extract_from_real_tax_return_pdf():
    pdf_path = _find_synthetic_by_type("tax_return")
    assert pdf_path is not None, "No synthetic tax return PDF found."
    token = _create_session()
    with open(pdf_path, "rb") as f:
        resp = client.post(
            f"/extract/?session_token={token}",
            files={"file": (pdf_path.name, f, "application/pdf")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "tax_return"
    fields = {f["field_name"]: f for f in data["fields"]}
    assert "full_name" in fields
    assert fields["full_name"]["value"]


def test_extract_from_real_bank_statement_pdf():
    pdf_path = _find_synthetic_by_type("bank_statement")
    assert pdf_path is not None, "No synthetic bank statement PDF found."
    token = _create_session()
    with open(pdf_path, "rb") as f:
        resp = client.post(
            f"/extract/?session_token={token}",
            files={"file": (pdf_path.name, f, "application/pdf")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "bank_statement"
    fields = {f["field_name"]: f for f in data["fields"]}
    assert "full_name" in fields
    assert fields["full_name"]["value"]


def test_upload_unsupported_type():
    token = _create_session()
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("doc.txt", b"plain text file", "text/plain")},
    )
    assert resp.status_code == 415


def test_upload_exceeding_size():
    token = _create_session()
    large = b"x" * (11 * 1024 * 1024)
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("large.pdf", large, "application/pdf")},
    )
    assert resp.status_code == 413


def test_invalid_pdf_returns_clear_message():
    token = _create_session()
    blank = b"Not a real PDF file content"
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("invalid.pdf", blank, "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "other"
    fields = {f["field_name"]: f for f in data["fields"]}
    for field_name in ("full_name", "annual_income", "current_address", "household_size"):
        assert fields[field_name]["needs_review"] is True
        assert fields[field_name]["confidence"] == 0.0
        assert fields[field_name]["value"] == ""


def test_all_fields_returned_even_when_empty():
    token = _create_session()
    blank = b"Completely unusable content here"
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("nonsense.pdf", blank, "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    field_names = [f["field_name"] for f in data["fields"]]
    expected = [
        "full_name", "current_address", "household_size",
        "annual_income", "monthly_income", "income_source",
        "has_voucher", "voucher_type", "has_government_id",
        "is_veteran", "is_senior", "has_disability",
        "property_county", "property_cbsa",
    ]
    for name in expected:
        assert name in field_names, f"Missing field: {name}"