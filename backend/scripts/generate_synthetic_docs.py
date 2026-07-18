"""
Generate synthetic documents for extraction pipeline testing.

Usage:
    python scripts/generate_synthetic_docs.py --output-dir data/synthetic --count 20
"""
import argparse
import csv
import json
import os
import random
import io
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

try:
    from faker import Faker

    fake = Faker()
    HAS_FAKER = True
except ImportError:
    HAS_FAKER = False


DOC_TYPES = ["pay_stub", "benefit_letter", "tax_return", "bank_statement", "id_document"]

MTSP_CBSAS = {
    "12086": "Atlanta-Sandy Springs-Alpharetta, GA",
    "16980": "Chicago-Naperville-Elgin, IL-IN-WI",
    "31080": "Los Angeles-Long Beach-Anaheim, CA",
    "35620": "New York-Newark-Jersey City, NY-NJ-PA",
    "19100": "Dallas-Fort Worth-Arlington, TX",
}


def _make_name():
    if HAS_FAKER:
        return fake.name()
    return random.choice(
        ["Jane Doe", "John Smith", "Maria Garcia", "James Johnson", "Patricia Brown"]
    )


def _make_address():
    if HAS_FAKER:
        return fake.address().strip().replace("\n", ", ")
    return f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Elm', 'Park'])} St, {random.choice(['Atlanta', 'Chicago', 'Los Angeles'])}, {random.choice(['GA', 'IL', 'CA'])} {random.randint(10000, 99999)}"


def _make_ssn():
    return f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"


def _make_income():
    return random.choice([32000, 45000, 55000, 62000, 75000, 48000, 38000, 52000, 68000])


def _make_age_days():
    return random.choice([15, 30, 60, 90, 120, 200, 400, 800])


def _make_employer():
    if HAS_FAKER:
        return fake.company()
    return random.choice(["Acme Corp", "Tech Solutions Inc", "State Government", "Healthcare Partners"])


def generate_pay_stub(doc_id: int) -> tuple[str, str, dict]:
    name = _make_name()
    income = _make_income()
    employer = _make_employer()
    hh_size = random.randint(1, 5)
    lines = [
        f"PAY STUB — {employer}",
        f"Employee: {name}",
        f"Pay Period: 01/01/2026 - 01/15/2026",
        f"Gross Pay YTD: ${income:,}.00",
        f"Annual Salary: ${income:,}.00",
        f"Year-to-Date Earnings: ${income:,}.00",
        "",
        "--- Page 1 ---",
        "",
        f"Address: {_make_address()}",
        f"Household Size: {hh_size}",
    ]
    gold = {
        "full_name": name,
        "annual_income": str(income),
        "income_source": "employment",
        "household_size": str(hh_size),
    }
    return "pay_stub", "\n".join(lines), gold


def generate_benefit_letter(doc_id: int) -> tuple[str, str, dict]:
    name = _make_name()
    income = _make_income()
    benefit_type = random.choice(["SSI", "SSDI", "TANF", "SNAP"])
    monthly = round(income / 12, 2)
    lines = [
        f"BENEFIT AWARD LETTER — {benefit_type}",
        f"Beneficiary: {name}",
        f"Monthly Benefit: ${monthly:,.2f}",
        f"Annual Benefit: ${income:,.0f}",
        f"Source of Income: {benefit_type}",
        f"Effective Date: 01/01/2026",
    ]
    gold = {
        "full_name": name,
        "monthly_income": str(monthly),
        "annual_income": str(income),
        "income_source": benefit_type.lower().replace(" ", "_"),
    }
    return "benefit_letter", "\n".join(lines), gold


def generate_tax_return(doc_id: int) -> tuple[str, str, dict]:
    name = _make_name()
    income = _make_income()
    lines = [
        f"IRS FORM 1040 — TAX RETURN",
        f"Taxpayer: {name}",
        f"Filing Status: Single",
        f"Adjusted Gross Income: ${income:,}.00",
        f"Total Income: ${income:,}.00",
        f"Tax Year: 2025",
        f"SSN: {_make_ssn()}",
        f"Address: {_make_address()}",
    ]
    gold = {
        "full_name": name,
        "annual_income": str(income),
        "current_address": "",
    }
    return "tax_return", "\n".join(lines), gold


def generate_bank_statement(doc_id: int) -> tuple[str, str, dict]:
    name = _make_name()
    income = _make_income()
    lines = [
        f"BANK STATEMENT — Q1 2026",
        f"Account Holder: {name}",
        f"Account Number: ****{random.randint(1000, 9999)}",
        f"Statement Period: 01/01/2026 - 03/31/2026",
        f"Total Deposits: ${income:,.0f}",
        f"Beginning Balance: $2,500.00",
        f"Ending Balance: ${income - random.randint(5000, 15000):,.0f}",
    ]
    gold = {
        "full_name": name,
        "annual_income": str(income),
    }
    return "bank_statement", "\n".join(lines), gold


def generate_id_document(doc_id: int) -> tuple[str, str, dict]:
    name = _make_name()
    dob = f"{random.randint(1, 12):02d}/{random.randint(1, 28):02d}/{random.randint(1950, 2000)}"
    address = _make_address()
    lines = [
        f"STATE IDENTIFICATION CARD",
        f"Name: {name}",
        f"Date of Birth: {dob}",
        f"Address: {address}",
        f"ID Number: {random.randint(100000000, 999999999)}",
        f"Expiration: 12/31/2030",
    ]
    gold = {
        "full_name": name,
        "current_address": address,
        "has_government_id": "yes",
    }
    return "id_document", "\n".join(lines), gold


GENERATORS = {
    "pay_stub": generate_pay_stub,
    "benefit_letter": generate_benefit_letter,
    "tax_return": generate_tax_return,
    "bank_statement": generate_bank_statement,
    "id_document": generate_id_document,
}


def render_pdf(doc_type: str, text: str, output_path: str):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph(f"Synthetic Document: {doc_type}", styles["Title"]), Spacer(1, 12)]
    for line in text.split("\n"):
        if line.startswith("--- Page "):
            story.append(Paragraph(f"<b>{line}</b>", styles["Normal"]))
        elif line.strip():
            story.append(Paragraph(line, styles["Normal"]))
        else:
            story.append(Spacer(1, 4))
    doc.build(story)
    with open(output_path, "wb") as f:
        f.write(buf.getvalue())


def generate_doc(doc_id: int, output_dir: str) -> dict:
    doc_type = random.choice(DOC_TYPES)
    gen = GENERATORS[doc_type]
    dt, text, gold = gen(doc_id)
    filename = f"synthetic_{doc_id:04d}_{dt}.pdf"
    render_pdf(dt, text, os.path.join(output_dir, filename))
    return {
        "filename": filename,
        "doc_type": dt,
        "gold": gold,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic rental documents")
    parser.add_argument("--output-dir", default="data/synthetic", help="Output directory")
    parser.add_argument("--count", type=int, default=20, help="Number of documents to generate")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = []
    for i in range(1, args.count + 1):
        entry = generate_doc(i, str(output_dir))
        manifest.append(entry)
        print(f"  [{i}/{args.count}] {entry['filename']} — {entry['doc_type']}")

    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    all_gold_keys = set()
    for entry in manifest:
        all_gold_keys.update(entry["gold"].keys())
    manifest_csv = output_dir / "manifest.csv"
    with open(manifest_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "doc_type"] + sorted(all_gold_keys))
        writer.writeheader()
        for entry in manifest:
            row = {"filename": entry["filename"], "doc_type": entry["doc_type"], **entry["gold"]}
            writer.writerow(row)

    print(f"\nGenerated {args.count} documents in {output_dir}/")
    print(f"  Manifest: {manifest_path}")
    print(f"  CSV:      {manifest_csv}")
    print(f"\nHAS_FAKER={HAS_FAKER} — {'using Faker for realistic data' if HAS_FAKER else 'using static names'}")
    print(f"Install Faker for more realistic generation: pip install faker")


if __name__ == "__main__":
    main()
