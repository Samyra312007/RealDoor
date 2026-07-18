import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_calculator_basic():
    resp = client.post("/calc/", json={
        "annual_income": 50000,
        "household_size": 3,
        "county_or_cbsa": "12086",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["annual_income"] == 50000
    assert data["household_size"] == 3
    assert data["income_limit_30"] == 43350
    assert data["income_limit_50"] == 72250
    assert data["income_limit_60"] == 80500
    # AMI = 72250 / 0.5 = 144500; income 50000 / 144500 * 100 = 34.6%
    assert data["ami_percentage"] == 34.6
    assert data["source_url"] == "https://www.huduser.gov/portal/datasets/mtsp.html"
    assert data["effective_date"] == "2026-05-01"
    steps = "\n".join(data["formula_steps"])
    assert "does not determine eligibility" in steps.lower()
    assert "Atlanta" in steps


def test_calculator_no_decision_words():
    resp = client.post("/calc/", json={
        "annual_income": 30000,
        "household_size": 1,
        "county_or_cbsa": "16980",
    })
    data = resp.json()
    steps = "\n".join(data["formula_steps"]).lower()
    for word in ["eligible", "qualifies", "approved", "likely"]:
        assert word not in steps, f"Decision word '{word}' found in calculator output"


def test_calculator_formula_trace():
    resp = client.post("/calc/", json={
        "annual_income": 45000,
        "household_size": 2,
        "county_or_cbsa": "31080",
    })
    assert resp.status_code == 200
    data = resp.json()
    steps = data["formula_steps"]
    assert len(steps) > 3
    assert "Confirmed annual income" in steps[0]
    assert "Household size" in steps[1]
    assert any("AMI" in s for s in steps)
    assert any("\u00f7" in s for s in steps)


def test_calculator_default_limits():
    resp = client.post("/calc/", json={
        "annual_income": 40000,
        "household_size": 2,
        "county_or_cbsa": "99999",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["income_limit_30"] is not None
    assert data["ami_percentage"] is not None
