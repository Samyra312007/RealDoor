import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_discover_list_properties():
    resp = client.get("/discover/properties?cbsa=12060")
    assert resp.status_code == 200
    data = resp.json()
    assert "properties" in data
    assert data["total_count"] > 0
    assert data["disclaimer"]
    assert data["staleness_note"]
    assert "HUD LIHTC" in data["staleness_note"]
    for p in data["properties"]:
        assert p["cbsa_code"] == "12060"
        assert "bedroom_mix" in p
        assert isinstance(p["bedroom_mix"], dict)
        assert "0" in p["bedroom_mix"]
        assert "1" in p["bedroom_mix"]
        assert "2" in p["bedroom_mix"]
        assert "3" in p["bedroom_mix"]
        assert p["data_coverage_note"]
        assert "HUD LIHTC" in p["data_coverage_note"]


def test_discover_filter_min_units():
    resp = client.get("/discover/properties?cbsa=12060&min_units=100")
    assert resp.status_code == 200
    data = resp.json()
    for p in data["properties"]:
        assert p["total_units"] >= 100


def test_discover_filter_min_bedrooms():
    resp = client.get("/discover/properties?cbsa=12060&min_bedrooms=2")
    assert resp.status_code == 200
    data = resp.json()
    for p in data["properties"]:
        bm = p["bedroom_mix"]
        has_2plus = (bm.get("2", 0) > 0) or (bm.get("3", 0) > 0)
        assert has_2plus, f"{p['property_name']} has no 2BR+ units"


def test_discover_filter_max_bedrooms():
    resp = client.get("/discover/properties?cbsa=12060&max_bedrooms=1")
    assert resp.status_code == 200
    data = resp.json()
    for p in data["properties"]:
        bm = p["bedroom_mix"]
        has_0or1 = (bm.get("0", 0) > 0) or (bm.get("1", 0) > 0)
        assert has_0or1, f"{p['property_name']} has no studio or 1BR units"


def test_discover_filter_bedroom_range():
    resp = client.get("/discover/properties?cbsa=12060&min_bedrooms=1&max_bedrooms=2")
    assert resp.status_code == 200
    data = resp.json()
    for p in data["properties"]:
        bm = p["bedroom_mix"]
        has_1or2 = (bm.get("1", 0) > 0) or (bm.get("2", 0) > 0)
        assert has_1or2


def test_discover_empty_cbsa():
    resp = client.get("/discover/properties?cbsa=99999")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] == 0
    assert data["properties"] == []


def test_discover_codes_endpoint():
    resp = client.get("/discover/codes")
    assert resp.status_code == 200
    data = resp.json()
    assert "codes" in data
    assert len(data["codes"]) > 0
    assert "12060" in data["codes"]
    assert "16980" in data["codes"]
    assert "31080" in data["codes"]


def test_discover_filters_applied_in_response():
    resp = client.get("/discover/properties?cbsa=12060&min_bedrooms=2&min_units=80")
    assert resp.status_code == 200
    data = resp.json()
    assert "filters_applied" in data
    fa = data["filters_applied"]
    assert fa["cbsa"] == "12060"
    assert fa["min_bedrooms"] == 2
    assert fa["min_units"] == 80


def test_fmr_context():
    resp = client.get("/fmr/?cbsa=12060")
    assert resp.status_code == 200
    data = resp.json()
    assert data["cbsa_code"] == "12060"
    assert "fair_market_rents" in data
    fmr = data["fair_market_rents"]
    assert fmr["studio"] > 0
    assert fmr["two_bedroom"] > 0
    assert "context_note" in data
    assert "not asking rents" in data["context_note"]


def test_fmr_not_found():
    resp = client.get("/fmr/?cbsa=00000")
    assert resp.status_code == 404


def test_health_includes_new_modules():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["guardrails"]["discover_stretch"] == "active"
    assert data["guardrails"]["fmr_context"] == "active"
