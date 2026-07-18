import re

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system:\s*",
    r"forget\s+(everything|all\s+previous)",
    r"you\s+are\s+(now|not)\s+",
    r"act\s+as\s+if",
    r"mark\s+(as\s+)?eligible",
    r"approve\s+(this\s+)?application",
    r"override\s+(all\s+)?(rules|checks|protocols)",
    r"this\s+is\s+(an?\s+)?(urgent|emergency|special\s+case)",
]


class InjectionDefense:
    @staticmethod
    def scan_document_text(text: str) -> dict:
        findings = []
        for pattern in INJECTION_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                findings.append(
                    {
                        "pattern": pattern,
                        "match": match.group(),
                        "position": match.start(),
                    }
                )
        return {
            "is_suspicious": len(findings) > 0,
            "findings": findings,
            "document_text_must_be_data": True,
        }

    @staticmethod
    def sanitize_for_model(text: str) -> str:
        return text[:10000]
