from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import RuleQuery, RuleAnswer
from app.guardrails.session_store import session_store
from app.middleware.refusal import DECISION_VERBS
from app.retrieval.qa import answer_question
from app.retrieval.corpus import corpus

router = APIRouter(prefix="/rules", tags=["rules"])


@router.post("/ask", response_model=RuleAnswer)
def ask_rule(query: RuleQuery):
    question_lower = query.question.lower()
    for verb in DECISION_VERBS:
        if verb in question_lower:
            session_store.log_action(query.session_token or "anonymous", "rule_refused", query.question[:80])
            return RuleAnswer(
                answer="RealDoor does not make eligibility decisions. "
                       "I can show you the income limits and explain how they work. "
                       "Would you like me to calculate your income against the threshold?",
                citations=[
                    {
                        "source_url": corpus.meta.get("source_url", ""),
                        "effective_date": corpus.meta.get("effective_date", "2026-05-01"),
                        "snippet": "RealDoor abstains from decisioning by design.",
                    }
                ],
                abstained=True,
            )

    session_store.log_action(query.session_token or "anonymous", "rule_query", query.question[:80])

    return answer_question(query.question)
