import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _create_session() -> str:
    return client.post("/session/create").json()["session_token"]


def test_rules_ask_income_limit():
    resp = client.post(
        "/rules/ask",
        json={"question": "What is the income limit for a 3 person household in Atlanta?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert not data["abstained"]
    assert "Atlanta" in data["answer"]
    assert "30%" in data["answer"] or "3-person" in data["answer"]
    assert len(data["citations"]) > 0
    assert data["citations"][0]["source_url"] == "https://www.huduser.gov/portal/datasets/mtsp.html"


def test_rules_ask_refusal():
    resp = client.post(
        "/rules/ask",
        json={"question": "Am I eligible for section 8?"},
    )
    assert resp.status_code == 400


def test_rules_ask_abstention():
    resp = client.post(
        "/rules/ask",
        json={"question": "What is the weather today?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["abstained"] is True
    assert "don't have enough information" in data["answer"].lower()


def test_calculator_with_mtsp_corpus():
    resp = client.post(
        "/calc/",
        json={
            "annual_income": 55000,
            "household_size": 3,
            "county_or_cbsa": "12060",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["annual_income"] == 55000
    assert data["household_size"] == 3
    assert data["income_limit_30"] == 31830
    assert data["income_limit_50"] == 53050
    assert data["income_limit_60"] == 63660
    assert data["ami_percentage"] is not None
    assert data["source_url"] == "https://www.huduser.gov/portal/datasets/mtsp.html"
    assert data["effective_date"] == "2026-05-01"
    steps_text = "\n".join(data["formula_steps"])
    assert "does not determine eligibility" in steps_text.lower()
    assert "Atlanta" in steps_text


def test_calculator_from_profile():
    token = _create_session()
    client.put("/confirm/profile", json={
        "session_token": token,
        "annual_income": 60000,
        "household_size": 2,
        "property_cbsa": "16980",
    })
    resp = client.post("/calc/from-profile", json={"session_token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["annual_income"] == 60000
    assert data["household_size"] == 2
    assert data["income_limit_30"] == 29160
    assert "Chicago" in "\n".join(data["formula_steps"])


def test_calculator_from_profile_no_profile():
    token = _create_session()
    resp = client.post("/calc/from-profile", json={"session_token": token})
    assert resp.status_code == 400
    assert "No profile" in resp.json()["detail"]


def test_calculator_default_limits():
    resp = client.post(
        "/calc/",
        json={
            "annual_income": 30000,
            "household_size": 1,
            "county_or_cbsa": "99999",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ami_percentage"] is not None
    steps_text = "\n".join(data["formula_steps"])
    assert "does not determine eligibility" in steps_text.lower()
