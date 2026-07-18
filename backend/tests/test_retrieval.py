import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.retrieval.corpus import corpus
from app.retrieval.retriever import search, search_by_household_size, search_by_cbsa
from app.retrieval.qa import answer_question


def test_corpus_loads():
    assert corpus._data is not None
    assert len(corpus._data.get("regions", [])) == 11
    meta = corpus.meta
    assert meta["year"] == 2026
    assert meta["effective_date"] == "2026-05-01"


def test_get_limits_known():
    limits = corpus.get_limits("12086", 3)
    assert limits is not None
    assert limits["ami_30"] == 43350
    assert limits["ami_50"] == 72250
    assert limits["ami_60"] == 80500
    assert limits["cbsa_name"] == "Atlanta-Sandy Springs-Alpharetta, GA"


def test_get_limits_unknown_cbsa():
    limits = corpus.get_limits("99999", 1)
    assert limits is not None
    assert limits["cbsa_code"] == "default"


def test_search_by_household_size():
    assert search_by_household_size("family of 4") == 4
    assert search_by_household_size("3 person") == 3
    assert search_by_household_size("what is the weather") is None


def test_search_by_cbsa():
    code = search_by_cbsa("Atlanta")
    assert code == "12086"
    code = search_by_cbsa("Chicago")
    assert code == "16980"
    assert search_by_cbsa("unknown place") == "default"


def test_search():
    results = search("income limit for Atlanta", top_k=3, threshold=0.5)
    assert len(results) > 0
    assert any("Atlanta" in r["content"] for r in results)


def test_search_empty():
    results = search("completely unrelated query xyzzy", top_k=3, threshold=0.5)
    assert len(results) == 0


def test_answer_question_income_limit():
    result = answer_question("What is the income limit for a 3 person household in Atlanta?")
    assert not result.abstained
    assert "Atlanta" in result.answer
    assert "30%" in result.answer or "3-person" in result.answer
    assert len(result.citations) > 0
    assert result.citations[0]["source_url"] == "https://www.huduser.gov/portal/datasets/mtsp.html"


def test_answer_question_abstained():
    result = answer_question("What is the weather today?")
    assert result.abstained is True
    assert "don't have enough information" in result.answer.lower()
    assert len(result.citations) == 0
