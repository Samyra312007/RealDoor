import re
from typing import Optional


def _first_group_or_full(match: re.Match) -> str:
    try:
        return match.group(1).strip()
    except IndexError:
        return match.group(0).strip()


FIELD_PATTERNS: dict[str, list[tuple[str, str, float]]] = {
    "full_name": [
        (r"(?:name|full.name|employee|applicant|tenant|resident|beneficiary)[:\s]+([A-Z][a-z]+(?:[^\S\n]+[A-Z][a-z]+){1,3})", "name_label", 0.85),
        (r"(?:prepared\s+for|issued\s+to)[:\s]+([A-Z][a-z]+(?:[^\S\n]+[A-Z][a-z]+){1,3})", "prepared_for", 0.8),
    ],
    "annual_income": [
        (r"(?:annual|yearly)\s+(?:gross\s+)?income[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "annual_salary", 0.9),
        (r"(?:salary|wages|pay)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)\s*(?:per|/)?\s*(?:year|annum)", "salary_line", 0.85),
        (r"(?:YTD|year.to.date|ytd\s+earnings)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "ytd", 0.75),
        (r"(?:gross\s+pay)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "gross_pay", 0.7),
        (r"(?:total\s+income)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "total_income", 0.8),
    ],
    "monthly_income": [
        (r"(?:monthly|month)\s+(?:gross\s+)?(?:benefit|income)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "monthly_benefit", 0.9),
        (r"(?:net\s+pay)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "net_pay", 0.75),
        (r"(?:gross\s+pay)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)\s*(?:per|/)?\s*(?:month|mo)", "gross_monthly", 0.85),
        (r"(?:monthly\s+benefit)[:\s$]*([0-9,]+(?:\.[0-9]{2})?)", "benefit_amount", 0.85),
    ],
    "household_size": [
        (r"(?:household|family)\s+(?:size|members?)[:\s]*(\d+)", "hh_label", 0.9),
        (r"(?:number\s+of\s+(?:dependents|occupants|people))[:\s]*(\d+)", "dependents_count", 0.8),
        (r"(?:size)[:\s]*(\d+)\s*(?:person|member)", "size_statement", 0.7),
    ],
    "income_source": [
        (r"(?:income\s+source|source\s+of\s+income)[:\s]*([A-Za-z][A-Za-z\s]+)", "source_label", 0.85),
        (r"(?:employer)[:\s]*([A-Za-z][A-Za-z\s]+)", "employer_name", 0.7),
        (r"(?:^|\n)(SSI|SSDI|TANF|SNAP|social.security|unemployment|pension|veterans|employment)", "benefit_type", 0.8),
    ],
    "current_address": [
        (r"(?:address|current\s+address|residence)[:\s]+(\d+\s+[A-Za-z0-9\s,]+(?:Avenue|Street|Road|Drive|Lane|Court|Way|Place|Boulevard|Circle)[A-Za-z\s,]+(?:[A-Z]{2})\s+\d{5})", "full_address", 0.9),
        (r"(?:address|current\s+address|residence)[:\s]+(\d+\s+[A-Za-z0-9\s,]+(?:Ave|St|Rd|Dr|Ln|Ct|Way|Pl|Blvd|Cir)[A-Za-z\s,]+(?:[A-Z]{2})\s+\d{5})", "full_address_abbr", 0.85),
        (r"(\d+\s+[A-Za-z0-9\s,]+(?:Avenue|Street|Road|Drive|Lane)[,\s]+[A-Za-z\s]+(?:[A-Z]{2})\s+\d{5})", "street_address", 0.8),
    ],
    "has_voucher": [
        (r"(?:voucher|section\s*8|housing\s+choice)[:\s]*(yes|true|x|\u2713)", "voucher_present", 0.85),
        (r"(?:voucher|section\s*8|housing\s+choice)[:\s]*(no|false|n/a)", "voucher_absent", 0.85),
    ],
    "voucher_type": [
        (r"(?:voucher\s+type|type\s+of\s+voucher)[:\s]*(section\s*8|other|portable)", "voucher_type_label", 0.9),
    ],
    "has_government_id": [
        (r"(?:ID|identification|driver[`']?s\s+license|passport|state\s+id)[:\s]*(yes|true|x|\u2713)", "id_present", 0.85),
        (r"(SSN|social.security|ITIN)[:\s]*[\d]{3}[\s-]?[\d]{2}[\s-]?[\d]{4}", "ssn_found", 0.9),
    ],
    "is_veteran": [
        (r"(?:veteran|military\s+service)[:\s]*(yes|true|x|\u2713)", "veteran_yes", 0.9),
        (r"(DD214|discharge)", "dd214_found", 0.85),
    ],
    "is_senior": [
        (r"(?:senior|age\s+6[2-9]|age\s+[7-9]\d)[:\s]*(yes|true|x|\u2713)", "senior_yes", 0.85),
        (r"(?:date\s+of\s+birth|DOB|birth\s+date)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", "dob_found", 0.7),
    ],
    "has_disability": [
        (r"(?:disability|disabled)[:\s]*(yes|true|x|\u2713)", "disability_yes", 0.9),
    ],
    "property_county": [
        (r"(?:county|property\s+county)[:\s]*([A-Za-z\s]+(?:County|Parish))", "county_name", 0.85),
    ],
    "property_cbsa": [
        (r"(?:CBSA|MSA|metro\s+area)[:\s]*(\d{5})", "cbsa_code", 0.9),
    ],
}


def parse_field(text: str, field_name: str) -> Optional[dict]:
    patterns = FIELD_PATTERNS.get(field_name)
    if not patterns:
        return None

    best: Optional[dict] = None
    for pattern, tag, base_conf in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            value = _first_group_or_full(match)
            context_before = text[max(0, match.start() - 40):match.start()]
            source_snippet = (context_before + match.group(0)).strip()

            confidence = base_conf
            if len(value) < 2:
                confidence *= 0.5

            if field_name in ("annual_income", "monthly_income"):
                try:
                    num = float(value.replace(",", ""))
                    if num > 500000 or num < 100:
                        confidence *= 0.6
                    if 5000 < num < 200000:
                        confidence = min(confidence * 1.1, 1.0)
                except ValueError:
                    confidence *= 0.5

            if field_name == "household_size":
                try:
                    size = int(value)
                    if size < 1 or size > 15:
                        confidence *= 0.3
                except ValueError:
                    confidence *= 0.5

            confidence = min(confidence, 1.0)

            if best is None or confidence > best["confidence"]:
                best = {
                    "value": value,
                    "confidence": round(confidence, 2),
                    "source_snippet": source_snippet[:200],
                    "tag": tag,
                }

    return best


def extract_all_fields(text: str) -> list[dict]:
    results = []
    for field_name in FIELD_PATTERNS:
        parsed = parse_field(text, field_name)
        if parsed:
            results.append({
                "field_name": field_name,
                "value": parsed["value"],
                "confidence": parsed["confidence"],
                "source_snippet": parsed["source_snippet"],
                "needs_review": parsed["confidence"] < 0.7,
            })
        else:
            results.append({
                "field_name": field_name,
                "value": "",
                "confidence": 0.0,
                "source_snippet": "",
                "needs_review": True,
            })
    return results
