import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

GOLD_QA_PATH = Path(__file__).parent.parent / "app" / "data" / "gold_qa.json"
GOLD_QA = json.loads(GOLD_QA_PATH.read_text(encoding="utf-8"))


def _create_session() -> str:
    return client.post("/session/create").json()["session_token"]


class TestGoldQA:
    @staticmethod
    def parametrize():
        return [
            (q["id"], q["question"], q["expected_behavior"], q)
            for q in GOLD_QA["questions"]
        ]


def _make_assertions(q_id, question, resp, expected):
    behavior = expected["expected_behavior"]
    body = resp.json()

    if behavior == "refuse":
        assert resp.status_code == 400, (
            f"{q_id}: expected refusal (400) for '{question}', got {resp.status_code}"
        )
        assert "cannot determine eligibility" in body.get("message", "").lower() or \
               "cannot determine eligibility" in body.get("detail", "").lower() or \
               "cannot determine eligibility" in body.get("error", "").lower(), \
            f"{q_id}: refusal response should contain 'cannot determine eligibility', got: {body}"
        return

    if resp.status_code == 400:
        msg = (body.get("message") or body.get("detail") or "").lower()
        assert "cannot determine eligibility" in msg, \
            f"{q_id}: unexpected 400 without refusal message: {body}"
        return

    assert resp.status_code == 200, f"{q_id}: expected 200, got {resp.status_code}: {body}"

    data = resp.json()
    answer_text = (data.get("answer") or "").lower()

    if behavior == "abstain":
        assert data.get("abstained", False) is True or data.get("abstained") is None, \
            f"{q_id}: expected abstention, got answer: {answer_text[:100]}"
        for snippet in expected.get("expected_answer_contains", []):
            if snippet.lower() in answer_text:
                return
        assert "don't have enough information" in answer_text, \
            f"{q_id}: expected abstention message, got: {answer_text[:100]}"
        return

    if behavior == "answer":
        for snippet in expected.get("expected_answer_contains", []):
            assert snippet.lower() in answer_text, \
                f"{q_id}: expected answer to contain '{snippet}', got: {answer_text[:200]}"
        if expected.get("expected_citations"):
            assert len(data.get("citations", [])) > 0, \
                f"{q_id}: expected citations in answer, got none"
        if expected.get("expected_abstained") is not None:
            assert data.get("abstained") is False, \
                f"{q_id}: expected abstained=False, got abstained={data.get('abstained')}"


def test_gold_qa_metadata():
    assert "meta" in GOLD_QA
    assert "questions" in GOLD_QA
    assert len(GOLD_QA["questions"]) == 20


# Generate one test per gold Q&A entry
for _q in GOLD_QA["questions"]:
    _q_id = _q["id"]
    _question = _q["question"]
    _expected = _q

    def _make_test(qid=_q_id, q=_question, exp=_expected):
        def test_fn(self):
            resp = client.post(
                "/rules/ask",
                json={"session_token": _create_session(), "question": q},
            )
            _make_assertions(qid, q, resp, exp)
        return test_fn

    setattr(TestGoldQA, f"test_{_q_id}", _make_test(_q_id, _question, _expected))


del _q, _q_id, _question, _expected, _make_test
