# RealDoor — Application-Readiness Copilot

RealDoor is a privacy-first, no-eligibility web application that helps renters prepare complete, accurate housing applications. Users upload documents, extract and confirm their profile data, understand income and occupancy rules, review a readiness checklist, and export a submission-ready packet — all without any automated eligibility decision.

> **The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides.**

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Guardrails & Security](#guardrails--security)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Frontend Routes](#frontend-routes)
- [Testing](#testing)
- [Data Sources](#data-sources)
- [License](#license)

---

## Features

| Stage | What it does |
|-------|-------------|
| **1. Profile** | Upload PDF / images / DOCX → regex field extraction → confirm or correct each field in a review flow |
| **2. Understand** | Ask natural-language questions against MTSP income limits + deterministic LIHTC calculator with full formula trace |
| **3. Prepare** | 8-item LIHTC gold-standard checklist (present / missing / expired), profile inline editing, PDF packet export |
| **4. Discover** | Browse LIHTC properties by metro area with renter-selected bedroom, unit-type, and income filters |

### Key capabilities

- **Multi-format document extraction** — PDF (PyPDF + pdfminer.six fallback), DOCX (python-docx), and image uploads
- **Field confirmation workflow** — AI-extracted fields presented for human review; correction and skip support
- **Deterministic calculator** — TCAC / HIFA / HOME income limits with step-by-step formula trace; no black-box decisions
- **Natural-language retrieval** — Ask questions against the MTSP (Market Trend & Strategy Publication) corpus
- **Gold-standard checklist** — 8 LIHTC requirements with per-item status (present / missing / expired), evidence citations, and editable profile summary
- **PDF packet export** — Merges checklist, profile, and evidence into a single submission-ready document
- **LIHTC property discovery** — Filter by metro, bedrooms, unit type, max income, and DDA / QCT designations
- **24-hour session TTL** — All data auto-purges; explicit delete triggers hard removal and AES-256-GCM encrypted storage at rest

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React 19)               │
│  React Router · Tailwind · shadcn/ui · Lucide       │
│  Routes: / → /profile → /understand → /prepare →   │
│          /discover                                   │
└────────────────────┬────────────────────────────────┘
                     │  HTTP (REST)
                     ▼
┌─────────────────────────────────────────────────────┐
│               Backend (FastAPI / Python)              │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Routers   │  │ Services  │  │ Guardrails         │  │
│  │ ─ session │  │ ─ encrypt │  │ ─ refusal_mw      │  │
│  │ ─ extract │  │           │  │ ─ injection_defense│  │
│  │ ─ confirm │  │           │  │ ─ consent_logger   │  │
│  │ ─ rules   │  │           │  │ ─ session_store    │  │
│  │ ─ calc    │  │           │  │ ─ allowlist        │  │
│  │ ─ checklist│  │           │  └───────────────────┘  │
│  │ ─ packet  │  │           │                        │
│  │ ─ discover│  │           │                        │
│  │ ─ fmr     │  │           │                        │
│  │ ─ tenant  │  │           │                        │
│  │ ─ design  │  │           │                        │
│  └──────────┘  └──────────┘                        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Data flow:**
1. Renter creates a session → receives opaque session token
2. Uploads documents → server extracts fields against an allowlist schema
3. Extracted fields returned for human confirmation (no auto-approval)
4. Confirmed fields drive the calculator, checklist, and packet export
5. All actions logged with `rule_version`; raw document content never stored

---

## Guardrails & Security

| Layer | Mechanism |
|-------|-----------|
| **No eligibility decisions** | Refusal middleware intercepts HTTP 400 on decision verbs ("approve", "eligible", "deny", etc.) |
| **Allowlist schema** | Extraction constrained to `RenterProfile` fields; field names outside the allowlist are rejected |
| **Injection defense** | Document text sanitized — never concatenated raw into prompts or system instructions |
| **Encryption at rest** | PII fields (`annual_income`, `full_name`, `current_address`) encrypted with AES-256-GCM via `cryptography` library |
| **Consent logging** | Every extraction, confirmation, and query logged with `rule_version` and timestamp; raw document content never persisted |
| **Session lifecycle** | 24-hour TTL auto-purge; explicit `DELETE /session/{id}` hard-deletes all associated data |
| **Frontend isolation** | Session token stored in `sessionStorage` only (not persisted to disk) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.6, Vite 6, Tailwind CSS 3, React Router 7 |
| **UI Components** | shadcn/ui (Radix UI primitives), Lucide icons |
| **Backend** | Python 3.12+, FastAPI, Pydantic 2, Uvicorn |
| **Document Processing** | PyPDF, pdfminer.six, python-docx, ReportLab (PDF generation) |
| **Data Processing** | Pandas (CSV), JSON |
| **Security** | `cryptography` (AES-256-GCM), `python-jose` (JWT) |
| **Testing** | pytest (backend), Vitest (frontend) |

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to start a session.

---

## Project Structure

```
RealDoor/
├── frontend/                        # React + Vite + TypeScript
│   └── src/
│       ├── api/
│       │   └── client.ts            # REST client (all endpoints)
│       ├── components/
│       │   ├── layout/              # Header, Banner, FolderRail, StageNav, MobileStageIndicator
│       │   ├── profile/             # ProfileStage, field confirmation UI
│       │   ├── understand/          # Q&A panel, calculator UI
│       │   ├── prepare/             # Checklist, packet export, profile editor
│       │   ├── discover/            # LIHTC property browser
│       │   └── ui/                  # Button, Card, Input, Badge, Progress, etc.
│       ├── hooks/                   # useSession, useExtraction, useCalculator,
│       │                            # useRules, usePrepare, useDiscover
│       ├── lib/                     # SessionContext, utils (cn helper)
│       └── pages/                   # StartPage, ProfilePage, UnderstandPage,
│                                    # PreparePage, DiscoverPage
├── backend/                         # FastAPI + Python
│   ├── app/
│   │   ├── routers/                 # session, extract, confirm, rules, calc,
│   │   │                            # checklist, packet, discover, fmr, tenant, designations
│   │   ├── extraction/              # Field parser, document extractor (PDF/DOCX/image)
│   │   ├── retrieval/               # MTSP corpus loader, retriever, QA pipeline
│   │   ├── discover/                # LIHTC property service
│   │   ├── guardrails/              # Session store, injection defense
│   │   ├── middleware/              # Refusal middleware, consent logger
│   │   ├── schemas/                 # Pydantic models, field allowlist
│   │   ├── services/                # AES-256-GCM encryption service
│   │   └── data/                    # MTSP docs, LIHTC/fmr/DDA/QCT CSV datasets
│   └── tests/                       # 8 test files — guardrails, extraction, calc,
│                                    # retrieval, understand, prepare, discover, gold QA
├── ARCHITECTURE_AND_RISK.md
└── IMPLEMENTATION_PLAN.md
```

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/session` | Create a new session |
| `DELETE` | `/session/{id}` | Delete session and all data |
| `GET` | `/session/{id}` | Get session metadata |
| `POST` | `/session/{id}/extract` | Upload document for field extraction |
| `POST` | `/session/{id}/confirm` | Confirm or correct an extracted field |
| `DELETE` | `/session/{id}/field/{name}` | Remove a field from the session |
| `POST` | `/session/{id}/rules` | Ask a natural-language question against MTSP |
| `POST` | `/session/{id}/calculate` | Run the deterministic income calculator |
| `GET` | `/session/{id}/checklist` | Get the 8-item gold-standard checklist |
| `POST` | `/session/{id}/packet` | Generate and download the PDF packet |
| `GET` | `/session/{id}/profile` | Get the confirmed renter profile |
| `PUT` | `/session/{id}/profile` | Update profile fields inline |
| `GET` | `/discover/properties` | List LIHTC properties (query: metro, bedrooms, etc.) |
| `GET` | `/discover/metros` | List available metro areas |
| `GET` | `/discover/fmr/{metro}` | Fair Market Rent data for a metro |

---

## Frontend Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | StartPage | Session creation landing |
| `/profile` | ProfilePage | Document upload + field confirmation |
| `/understand` | UnderstandPage | MTSP Q&A + income calculator |
| `/prepare` | PreparePage | Checklist, profile editor, packet export |
| `/discover` | DiscoverPage | LIHTC property browser |

Stage access is gated: /understand and /prepare require all profile fields confirmed; otherwise the user is redirected to /profile.

---

## Testing

### Backend (pytest)

```bash
cd backend
.venv\Scripts\activate
python -m pytest tests/ -v
```

8 test files covering:
- Guardrails (refusal, injection, session lifecycle)
- Document extraction (PDF, DOCX, field parsing)
- Income calculator (deterministic formulas, edge cases)
- MTSP retrieval and QA
- Gold-standard checklist generation
- Packet export
- LIHTC property discovery
- Understand-stage integration

### Frontend (TypeScript)

```bash
cd frontend
npm run build    # tsc + vite build — zero errors expected
```

---

## Data Sources

The backend ships with reference datasets in `backend/app/data/`:

| File | Source | Purpose |
|------|--------|---------|
| `mtsp/` | TCAC / HCD | Market Trend & Strategy Publication corpus for Q&A |
| `lihtc_2024_filtered.csv` | TCAC | LIHTC property registry for discovery |
| `fmr_2026.csv` | HUD | Fair Market Rents by metro area |
| `dda_2026.csv` | HUD | Difficult Development Areas |
| `qct_2026.csv` | HUD | Qualified Census Tracts |
| `gold_qa.json` | Internal | Gold-standard Q&A pairs for retrieval evaluation |

---

## License

MIT
