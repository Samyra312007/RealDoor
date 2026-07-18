import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app
from app.guardrails.session_store import session_store
import time

client = TestClient(app)


def _create_session() -> str:
    return client.post("/session/create").json()["session_token"]


def _confirm_profile(token: str):
    client.put("/confirm/profile", json={
        "session_token": token,
        "full_name": "Jane Doe",
        "annual_income": 60000,
        "household_size": 2,
        "has_government_id": True,
        "is_veteran": True,
        "property_cbsa": "12086",
    })


def test_checklist_no_profile():
    token = _create_session()
    resp = client.get(f"/checklist/?program=LIHTC&session_token={token}")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 8
    statuses = [i["status"] for i in items]
    assert all(s == "missing" for s in statuses)


def test_checklist_with_profile():
    token = _create_session()
    _confirm_profile(token)
    resp = client.get(f"/checklist/?program=LIHTC&session_token={token}")
    assert resp.status_code == 200
    items = resp.json()
    by_name = {i["item_name"]: i for i in items}

    # has_government_id confirmed → ID should be present
    assert by_name["Government-issued photo ID"]["status"] == "present"
    # is_veteran confirmed → veteran docs should be present
    assert by_name["Veteran status documentation"]["status"] == "present"
    # no pay stub doc uploaded → pay stubs missing
    assert by_name["Last 4 pay stubs (consecutive)"]["status"] == "missing"


def test_checklist_with_document():
    token = _create_session()
    _confirm_profile(token)
    # Simulate a pay stub upload via document tracking
    session_store.add_document(token, "pay_stub", ["annual_income", "employer"])
    resp = client.get(f"/checklist/?program=LIHTC&session_token={token}")
    assert resp.status_code == 200
    items = resp.json()
    by_name = {i["item_name"]: i for i in items}
    assert by_name["Last 4 pay stubs (consecutive)"]["status"] == "present"


def test_checklist_expiry():
    token = _create_session()
    _confirm_profile(token)
    # Simulate an old document upload (200 days ago, exceeds 90-day pay stub limit)
    raw = session_store.get_session(token)
    raw["documents"].append({
        "doc_type": "pay_stub",
        "uploaded_at": time.time() - 200 * 86400,
        "field_names": ["annual_income"],
    })
    resp = client.get(f"/checklist/?program=LIHTC&session_token={token}")
    assert resp.status_code == 200
    items = resp.json()
    by_name = {i["item_name"]: i for i in items}
    assert by_name["Last 4 pay stubs (consecutive)"]["status"] == "expired"


def test_packet_assemble_no_profile():
    token = _create_session()
    resp = client.post("/packet/assemble", json={
        "session_token": token,
        "include_fields": [],
        "export_format": "pdf",
    })
    assert resp.status_code == 400
    assert "No profile found" in resp.json()["detail"]


def test_packet_assemble_and_download():
    token = _create_session()
    _confirm_profile(token)
    resp = client.post("/packet/assemble", json={
        "session_token": token,
        "include_fields": ["full_name", "annual_income"],
        "export_format": "pdf",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["packet_id"] is not None
    assert data["fields_included"] == 2
    assert data["download_url"].startswith("/packet/download/")

    pid = data["packet_id"]
    # Download the PDF
    resp2 = client.get(f"/packet/download/{pid}?session_token={token}")
    assert resp2.status_code == 200
    assert resp2.headers["Content-Type"] == "application/pdf"
    assert len(resp2.content) > 0

    # Delete the packet
    resp3 = client.delete(f"/packet/{pid}?session_token={token}")
    assert resp3.status_code == 200
    assert resp3.json()["message"] == "Packet deleted."


def test_packet_download_nonexistent():
    token = _create_session()
    _confirm_profile(token)
    resp = client.get(f"/packet/download/nonexistent?session_token={token}")
    assert resp.status_code == 404


def test_session_packets_endpoint():
    token = _create_session()
    _confirm_profile(token)
    # Check no packets initially
    resp = client.get(f"/session/{token}/packets")
    assert resp.status_code == 200
    assert len(resp.json()["packets"]) == 0

    # Assemble a packet
    client.post("/packet/assemble", json={
        "session_token": token,
        "include_fields": ["full_name"],
    })

    # Check packet appears
    resp2 = client.get(f"/session/{token}/packets")
    assert resp2.status_code == 200
    packets = resp2.json()["packets"]
    assert len(packets) == 1
    assert packets[0]["fields_included"] == 1


def test_packet_delete_removes_from_session():
    token = _create_session()
    _confirm_profile(token)
    resp = client.post("/packet/assemble", json={
        "session_token": token,
        "include_fields": ["full_name"],
    })
    pid = resp.json()["packet_id"]
    client.delete(f"/packet/{pid}?session_token={token}")
    resp2 = client.get(f"/session/{token}/packets")
    assert len(resp2.json()["packets"]) == 0
