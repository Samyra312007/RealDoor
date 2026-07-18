import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _create_session() -> str:
    return client.post("/session/create").json()["session_token"]


def test_extract_from_pay_stub_text():
    token = _create_session()
    pay_stub_text = (
        "EMPLOYEE: Jane Doe\n"
        "Pay Period: 01/01/2026 - 01/15/2026\n"
        "Gross Pay: $2,500.00\n"
        "YTD Earnings: $65,000.00\n"
        "Net Pay: $1,875.00\n"
        "Employer: Acme Corp\n"
        "Address: 123 Oak Street, Springfield, IL 62701\n"
    )
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("paystub.pdf", pay_stub_text.encode(), "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "pay_stub"
    fields = {f["field_name"]: f for f in data["fields"]}

    assert "full_name" in fields
    assert fields["full_name"]["value"] == "Jane Doe"
    assert fields["full_name"]["confidence"] > 0.5

    assert "annual_income" in fields
    assert fields["annual_income"]["value"] == "65,000.00"
    assert fields["annual_income"]["confidence"] > 0.5

    assert "current_address" in fields
    assert "Oak" in fields["current_address"]["value"]


def test_extract_from_benefit_letter():
    token = _create_session()
    letter = (
        "AWARD LETTER\n"
        "Beneficiary: Robert Johnson\n"
        "Monthly Benefit: $1,850.00\n"
        "Household Size: 2\n"
        "Income Source: SSDI\n"
        "Current Address: 456 Pine Road, Chicago, IL 60614\n"
    )
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("benefits.pdf", letter.encode(), "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "benefit_letter"
    fields = {f["field_name"]: f for f in data["fields"]}

    assert fields["full_name"]["value"] == "Robert Johnson"
    assert fields["household_size"]["value"] == "2"
    assert fields["monthly_income"]["value"] == "1,850.00"

    assert "income_source" in fields
    assert "social" in fields["income_source"]["value"].lower() or "ssdi" in fields["income_source"]["value"].lower()


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


def test_missing_fields_show_abstention():
    token = _create_session()
    blank = b"No useful data here at all"
    resp = client.post(
        f"/extract/?session_token={token}",
        files={"file": ("blank.pdf", blank, "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    fields = {f["field_name"]: f for f in data["fields"]}
    for field_name in ("full_name", "annual_income", "current_address", "household_size"):
        assert fields[field_name]["needs_review"] is True
        assert fields[field_name]["confidence"] == 0.0
        assert fields[field_name]["value"] == ""
