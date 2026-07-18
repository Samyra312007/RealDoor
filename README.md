# RealDoor — Application-Readiness Copilot

RealDoor helps renters prepare for housing applications. Upload documents, understand income rules, review a readiness checklist, and export a packet — all without eligibility decisions.

> **The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides.**

## Stages

| Stage | What it does |
|-------|------------|
| **1. Profile** | Upload PDFs/images → regex field extraction → confirm or correct each field |
| **2. Understand** | Ask questions against MTSP income limits + deterministic calculator with formula trace |
| **3. Prepare** | 8-item LIHTC gold checklist (present/missing/expired), profile inline editing, PDF packet export |
| **4. Discover** (stretch) | Browse LIHTC properties by metro area with renter-selected bedroom/unit filters |

## Guardrails (non-negotiable)

- **No eligibility decisions** — refusal middleware returns 400 on decision verbs like "approve" / "eligible"
- **Allowlist schema** — extraction constrained to `RenterProfile` fields; everything else rejected
- **Injection defense** — document text sanitized, never concatenated into prompts
- **Session encryption** — `annual_income`, `full_name`, `current_address` AES-256-GCM at rest
- **Consent logging** — every action logged with `rule_version`; raw document content never stored
- **24-hour TTL** — sessions auto-purge; explicit `DELETE /session/{id}` hard-deletes all data

## Quick Start

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to start a session.

## Tests

```bash
cd backend
.venv\Scripts\activate
python -m pytest tests/ -v
# 54 tests — guardrails, extraction, calc, retrieval, prepare, discover
```

```bash
cd frontend
npm run build   # tsc + vite build, zero errors expected
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 3, shadcn/ui, Radix UI, Lucide |
| Backend | FastAPI, Pydantic 2, Uvicorn |
| Data | ReportLab (PDF), PyPDF (text extraction), Pandas (CSV) |
| Security | Cryptography (AES-256-GCM), python-jose |
| Testing | pytest (backend, 54 tests), Vitest (frontend) |

## Project Structure

```
RealDoor/
├── frontend/            # React + Vite + Tailwind + shadcn/ui
│   └── src/
│       ├── components/  # layout/, profile/, understand/, prepare/, discover/, ui/
│       ├── hooks/       # useSession, useExtraction, useCalculator, useRules, usePrepare, useDiscover
│       └── api/         # REST client
├── backend/             # FastAPI + Python
│   ├── app/
│   │   ├── routers/    # session, extract, confirm, rules, calc, checklist, packet, discover, fmr
│   │   ├── guardrails/ # session_store, injection_defense
│   │   ├── middleware/  # refusal, consent_logger
│   │   ├── retrieval/  # MTSP corpus, retriever, qa
│   │   ├── extraction/ # field_parser, extractor
│   │   └── discover/   # LIHTC property service
│   └── tests/          # 7 test files, 54 tests
├── ARCHITECTURE_AND_RISK.md
└── IMPLEMENTATION_PLAN.md
```

## License

MIT
