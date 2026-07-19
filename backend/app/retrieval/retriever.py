import re
from typing import Optional
from app.retrieval.corpus import corpus

STOP_WORDS = {
    "a", "an", "the", "this", "that", "is", "it", "for", "of", "to", "in",
    "and", "or", "on", "at", "by", "with", "as", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "can", "could", "shall", "should", "may", "might",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "his", "her",
    "they", "them", "their", "what", "which", "who", "when", "where", "why",
    "how", "all", "each", "every", "both", "few", "more", "most", "some",
    "any", "no", "not", "only", "just", "so", "than", "too", "very",
    "about", "above", "after", "again", "against", "before", "between",
    "during", "into", "out", "over", "through", "under", "up", "down",
}


def _tokenize(text: str) -> set[str]:
    tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
    return tokens - STOP_WORDS


def _is_generic_token(token: str) -> bool:
    return token in GENERIC_TOKENS or token.isdigit()


def _word_in_content(word: str, content: str) -> bool:
    return bool(re.search(rf"\b{re.escape(word)}\b", content))


def _match_score(question_tokens: set[str], chunk: dict) -> float:
    content = chunk["content"].lower()
    meta = chunk["metadata"]
    cbsa_name = str(meta.get("cbsa_name", "")).lower()
    counties = str(meta.get("counties", "")).lower()
    score = 0.0
    for token in question_tokens:
        if _word_in_content(token, content):
            score += 1.0
        if not _is_generic_token(token):
            if _word_in_content(token, cbsa_name):
                score += 1.5
            if _word_in_content(token, counties):
                score += 1.0
        if token == str(meta.get("household_size", "")):
            score += 2.0
        if token in ("income", "limit", "ami"):
            score += 0.5
    return score


def search(question: str, top_k: int = 3, threshold: float = 1.0) -> list[dict]:
    tokens = _tokenize(question)
    scored = []
    for chunk in corpus.chunks:
        score = _match_score(tokens, chunk)
        if score >= threshold:
            scored.append((score, chunk))
    scored.sort(key=lambda x: -x[0])
    return [chunk for _, chunk in scored[:top_k]]


def search_by_household_size(question: str) -> Optional[int]:
    patterns = [
        r"(\d+)[-\s]person\b",
        r"(\d+)[-\s]household\b",
        r"(\d+)[-\s]member\b",
        r"family\s+of\s+(\d+)",
        r"household\s+of\s+(\d+)",
        r"member\s+of\s+(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, question.lower())
        if match:
            val = int(match.group(1))
            if 1 <= val <= 12:
                return val
    return None


GENERIC_TOKENS = {
    "income", "limit", "limits", "ami", "household", "person", "people",
    "family", "county", "counties", "assistance", "rental", "program",
    "programs", "tell", "show", "explain", "what", "how", "apply",
    "applied", "approve", "approved", "approval", "qualify", "qualified",
    "eligible", "eligibility", "maximum", "minimum", "threshold",
    "thresholds", "studio", "bedroom", "apartment", "unit", "units",
    "section", "voucher", "benefit", "benefits", "year", "monthly",
    "annual", "rate", "rates", "market", "housing", "affordable",
    "low", "income", "search", "find", "looking", "want", "need",
    "help", "information", "question", "answer", "does", "would",
    "will", "can", "could", "should", "may", "might", "must",
}

LOCATION_STOP_WORDS = {
    "metro", "area", "hud", "fmr", "msa", "city", "town",
    "urban", "rural", "county", "counties",
}


def _is_location_token(token: str) -> bool:
    return (
        len(token) >= 3
        and token not in GENERIC_TOKENS
        and token not in LOCATION_STOP_WORDS
        and not token.isdigit()
    )


def _count_location_matches(tokens: set[str], name: str, counties: str) -> int:
    score = 0
    for token in tokens:
        if not _is_location_token(token):
            continue
        if re.search(rf"\b{re.escape(token)}\b", name):
            score += 3
        if re.search(rf"\b{re.escape(token)}\b", counties):
            score += 2
    return score


def search_by_cbsa(question: str) -> Optional[str]:
    tokens = _tokenize(question)
    best_code = "default"
    best_score = 0
    for region in corpus._data.get("regions", []):
        name = region["cbsa_name"].lower()
        counties = ", ".join(region["counties"]).lower()
        code = region["cbsa_code"]
        if re.search(rf"\b{re.escape(code)}\b", question):
            return code
        score = _count_location_matches(tokens, name, counties)
        if score > best_score:
            best_score = score
            best_code = code
    return best_code if best_score > 0 else "default"
