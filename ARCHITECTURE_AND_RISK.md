# RealDoor — Architecture & Risk Note

## 1. System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (React 19 + TypeScript + Tailwind + shadcn/ui)            │
│  WCAG 2.2 AA — keyboard-navigable, aria-live regions                │
│                                                                     │
│  Start Screen → Stage 1: Profile  →  Stage 2: Understand           │
│                     (upload, extract,    (rules Q&A, calc)          │
│                      confirm fields)                                │
│                         ↓                      ↓                    │
│                     Stage 3: Prepare  →  [Stage 4: Discover]        │
│                     (checklist diff,        (property list)         │
│                      profile edit,          stretch goal)           │
│                      PDF export)                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST/JSON (port 8000)
                           │ session_token in query / body
┌──────────────────────────▼──────────────────────────────────────────┐
│  Backend (FastAPI + Python 3.11+)                                   │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ /session/*  │  │ /extract/    │  │ /confirm/  │  │ /rules/ask│  │
│  │ CRUD + log  │  │ OCR pipeline │  │ field conf  │  │ RAG over  │  │
│  │ encrypted   │  │ + allowlist  │  │ + profile   │  │ MTSP      │  │
│  │ profile store│ │ filter       │  │ update      │  │ corpus    │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬─────┘  └─────┬─────┘  │
│         │                │                  │               │        │
│  ┌──────┴────────────────┴──────────────────┴───────────────┴──────┐│
│  │                    Middleware Layer                              ││
│  │  RefusalMiddleware — 400 on decision verbs                      ││
│  │  ConsentLoggerMiddleware — logs all POST/PUT/DELETE actions      ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ /calc/       │  │ /checklist/  │  │ /packet/*                │   │
│  │ deterministic│  │ LIHTC gold   │  │ PDF export (reportlab)   │   │
│  │ MTSP math    │  │ diff + expiry│  │ assemble/download/delete │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐  ┌───────────────────────────────────────────┐    │
│  │ /discover/   │  │ /fmr (optional)                           │    │
│  │ properties   │  │ Fair Market Rents context                 │    │
│  │ LIHTC filter │  │ (stretch)                                 │    │
│  └──────────────┘  └───────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│  Ephemeral Session Store (in-memory dict, thread-safe)              │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ session_token (UUID) → {                                       │ │
│  │   created_at: float,                                           │ │
│  │   profile: {full_name: ██, annual_income: ██,                  │ │
│  │             current_address: ██, ...}  ← AES-256-GCM encrypted │ │
│  │   documents: [{doc_type, uploaded_at, field_names}],            │ │
│  │   consent_log: [{timestamp, action_type, field, rule_version}], │ │
│  │   packets: [{packet_id, created_at, pdf_bytes, include_fields}] │ │
│  │ }                                                              │ │
│  │ TTL: 24 hours; auto-purge on read                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Data Flow

| Data | Lifetime | Storage | Encryption |
|------|----------|---------|------------|
| Uploaded document bytes | Extracted → hashed → discarded | In memory only | Never persisted |
| Raw text hash | Session lifetime | In-memory session dict | Plaintext (hash only) |
| `annual_income`, `full_name`, `current_address` | Session lifetime | In-memory session dict | AES-256-GCM |
| Other profile fields | Session lifetime | In-memory session dict | Plaintext |
| Consent log | Session lifetime | In-memory session dict | Plaintext (no raw doc content) |
| PDF packet bytes | Session lifetime | In-memory session dict | Plaintext |
| MTSP rule corpus | Static (frozen file) | `data/mtsp/mtsp_2026.json` | N/A |
| LIHTC property data (stretch) | Static (frozen file) | `data/lihtc_2024_filtered.csv` | N/A |
| FMR data (optional) | Static (frozen file) | `data/fmr_2026.csv` | N/A |

**Key rule**: Raw document bytes are never written to disk or persisted beyond the extraction call. Only a SHA-256 hash of the raw text is stored in the session for audit purposes.

## 3. Model / Library License List

| Component | License | Purpose |
|-----------|---------|---------|
| React 19 | MIT | UI framework |
| React DOM 19 | MIT | DOM rendering |
| Vite 6 | MIT | Build tool |
| TypeScript 5.6 | Apache 2.0 | Type checking |
| Tailwind CSS 3.4 | MIT | Utility-first CSS |
| Radix UI primitives | MIT | Accessible UI components |
| Lucide React | ISC | Icons |
| class-variance-authority | Apache 2.0 | Component variants |
| FastAPI 0.115 | MIT | API framework |
| Uvicorn | BSD 3-Clause | ASGI server |
| Pydantic 2 | MIT | Schema validation |
| Cryptography | Apache 2.0 / BSD | AES-256 encryption |
| PyPDF 6 | BSD 3-Clause | PDF text extraction |
| Pillow 12 | MIT (HPND) | Image handling |
| ReportLab | BSD 3-Clause | PDF generation |
| python-multipart | Apache 2.0 | File upload parsing |
| httpx | BSD 3-Clause | HTTP client |
| pytest | MIT | Testing |
| pandas (stretch) | BSD 3-Clause | CSV data parsing |
| Faker (dev) | MIT | Synthetic data generation |

## 4. Known Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Extraction hallucination** (regex-based field parser may miss fields or produce false positives) | Medium | Confidence scoring (0-1); fields < 0.7 require human confirmation; abstention path for unfound fields |
| **Retrieval miss rate** (keyword matching may miss semantically similar queries to MTSP corpus) | Medium | Multi-strategy retrieval (household size + CBSA + keyword scoring); abstention path for low-confidence cases |
| **Injection surface** (malicious document text attempting prompt injection) | High | Sanitize → proceed (strip override patterns via `re.sub`, continue extraction); zero-trust document-as-data approach |
| **Session store contention** (in-memory dict with thread lock may bottleneck under concurrent users) | Low | Single-process single-thread demo; in-memory limitation acknowledged. Would require Redis/memcached for multi-process deployment |
| **AES key in memory** (`ENCRYPTION_KEY` derived from `os.urandom(32)` at process start) | Medium | Key never logged or exposed; regenerated on each process restart. No key rotation in current design |
| **Accessibility gaps in property list UI** (Discover stretch goal) | Low | Color-contrast ratios, screen-reader testing, and keyboard-nav verified per component; full WCAG 2.2 AA audit pending for discover stage |
| **LIHTC data staleness** (projects through 2024 only) | Low | Staleness banner displayed in UI; every property card labeled "location only — contact property for availability" |
| **Packet data persistence** (PDF bytes stored in session memory) | Low | Bytes auto-deleted on session expiry (24h TTL); explicit delete endpoint available |

## 5. What the System Does NOT Do

- ❌ **Make eligibility decisions** — Refusal middleware returns 400 on decision verbs; output templates never contain verdict language
- ❌ **Rank applicants or properties** — No scoring, sorting by likelihood, or acceptance prediction
- ❌ **Predict acceptance likelihood** — Calculator returns AMI % only; never emits "eligible", "qualifies", "likely"
- ❌ **Infer demographic/behavioral proxies** — No demographic inference from document text; allowlist restricts extracted fields to `RenterProfile` schema
- ❌ **Transmit packets to any property or agency** — PDF is downloaded to renter's machine only; no auto-transmit capability
- ❌ **Store raw document bytes beyond session lifetime** — Bytes discarded after extraction; only hash retained
- ❌ **Train on uploaded data** — No data leaves the session; no training pipeline consumes session data
- ❌ **Auto-filter properties in Discover** — All filters are renter-selected; system never auto-filters or ranks

## 6. Guardrail Summary

| Guardrail | Layer | Enforcement |
|-----------|-------|-------------|
| Refusal (decision verbs) | Middleware | 400 response + log entry |
| Injection defense | Extraction | Sanitize → proceed; log attempt |
| Allowlist schema | Extraction | Fields outside `RenterProfile` rejected |
| Session encryption | Store | AES-256-GCM for sensitive fields |
| Consent logging | Middleware + Store | All actions logged with rule_version |
| Session TTL | Store | 24-hour auto-purge |
| Explicit delete | Endpoint | `DELETE /session/{id}` → hard delete |
| Output no-decision | QA + Calc | Refusal message + abstention path |
| Discover no-ranking | Frontend | Filters are renter-selected only |

## 7. Design Principle

> **"The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides."**
