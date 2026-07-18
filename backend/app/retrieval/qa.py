from app.retrieval.corpus import corpus
from app.retrieval.retriever import search, search_by_household_size, search_by_cbsa
from app.schemas.allowlist import RuleAnswer


def answer_question(question: str) -> RuleAnswer:
    hh_size = search_by_household_size(question)
    cbsa = search_by_cbsa(question)

    results = search(question, top_k=3, threshold=0.5)
    limits = corpus.get_limits(cbsa or "default", hh_size or 4)

    citations = []
    for r in results:
        m = r["metadata"]
        citations.append({
            "source_url": m["source_url"],
            "effective_date": m["effective_date"],
            "snippet": r["content"][:200],
        })

    if limits and hh_size:
        answer = (
            f"For the {limits['cbsa_name']} area (CBSA {limits['cbsa_code']}), "
            f"the {corpus.meta.get('year', 2026)} income limits for a "
            f"{hh_size}-person household are:\n\n"
            f"• 30% of AMI: ${limits['ami_30']:,}/year\n"
            f"• 50% of AMI: ${limits['ami_50']:,}/year\n"
            f"• 60% of AMI: ${limits['ami_60']:,}/year\n\n"
            f"These limits are effective {limits['effective_date']}. "
            f"To see how your income compares, use the Calculator below."
        )
        if not any("income" in q for q in [question.lower()]):
            pass
        citations.append({
            "source_url": limits["source_url"],
            "effective_date": limits["effective_date"],
            "snippet": f"{hh_size}-person household limits for {limits['cbsa_name']}: "
                       f"30% ${limits['ami_30']:,}, 50% ${limits['ami_50']:,}, 60% ${limits['ami_60']:,}",
        })
    elif results:
        answer = "Based on the MTSP 2026 rules, here is what I found:"
        for r in results[:2]:
            answer += f"\n\n• {r['content'][:300]}"
        answer += "\n\nFor a more precise answer, please specify your household size and county."
    else:
        return RuleAnswer(
            answer="I don't have enough information to answer that. "
                   "Try asking about income limits for a specific household size and area.",
            citations=[],
            abstained=True,
        )

    meta = corpus.meta
    return RuleAnswer(
        answer=answer,
        citations=citations,
        abstained=False,
    )
