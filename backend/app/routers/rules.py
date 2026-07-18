from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import RuleQuery, RuleAnswer
from app.guardrails.session_store import session_store
from app.middleware.refusal import DECISION_VERBS

router = APIRouter(prefix="/rules", tags=["rules"])


@router.post("/ask", response_model=RuleAnswer)
def ask_rule(query: RuleQuery):
    question_lower = query.question.lower()
    for verb in DECISION_VERBS:
        if verb in question_lower:
            return RuleAnswer(
                answer="RealDoor does not make eligibility decisions. "
                       "I can show you the income limits and explain how they work. "
                       "Would you like me to calculate your income against the threshold?",
                citations=[
                    {
                        "source_url": "https://www.huduser.gov/portal/datasets/mtsp.html",
                        "effective_date": "2026-05-01",
                        "snippet": "RealDoor abstains from decisioning by design.",
                    }
                ],
                abstained=True,
            )

    if not query.context or not query.context.annual_income:
        return RuleAnswer(
            answer="To give you a precise answer, I need your confirmed income and household size. "
                   "Please complete Stage 1 (Profile) first, then ask again.",
            citations=[],
            abstained=True,
        )

    session_store.log_action(
        "anonymous",
        "rule_query",
        query.question[:80],
    )

    return RuleAnswer(
        answer="[Placeholder] The applicable income limit for your area and household size is shown below. "
               "Based on the confirmed profile, this is a calculation, not a determination.",
        citations=[
            {
                "source_url": "https://www.huduser.gov/portal/datasets/mtsp.html",
                "effective_date": "2026-05-01",
                "snippet": "MTSP Income Limits for 2026. Effective May 1, 2026.",
            }
        ],
        abstained=False,
    )
