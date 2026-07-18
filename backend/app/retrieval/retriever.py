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


def _match_score(question_tokens: set[str], chunk: dict) -> float:
    content = chunk["content"].lower()
    meta = chunk["metadata"]
    score = 0.0
    for token in question_tokens:
        if token in content:
            score += 1.0
        if token in str(meta.get("cbsa_name", "")).lower():
            score += 1.5
        if token in str(meta.get("counties", "")).lower():
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
    numbers = re.findall(r"\b(\d+)\b", question.lower())
    for n in numbers:
        val = int(n)
        if 1 <= val <= 12:
            return val
    return None


def search_by_cbsa(question: str) -> Optional[str]:
    for region in corpus._data.get("regions", []):
        name = region["cbsa_name"].lower()
        counties = ", ".join(region["counties"]).lower()
        code = region["cbsa_code"]
        for token in re.findall(r"[a-z0-9]+", question.lower()):
            if token in name or token in counties:
                return code
            if re.search(rf"\b{re.escape(code)}\b", question):
                return code
    return "default"
