# Contributing to RealDoor

## Design Principle

> **The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides.**

Every contribution must uphold this principle. RealDoor never makes eligibility decisions, ranks applicants, or predicts outcomes.

## Getting Started

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

## Non-Negotiable Guardrails

Any code that weakens these will be rejected:

1. **No decisioning** — no endpoint, template, or output may emit eligibility verdicts
2. **Allowlist schema** — extracted fields are constrained to `RenterProfile`; unknown fields are silently dropped
3. **Injection defense** — uploaded document text is data, never instructions; known override patterns sanitized before reaching model
4. **Consent + correction** — every field requires explicit confirmation; all actions logged with rule_version
5. **Privacy** — raw document bytes never persisted beyond extraction; sensitive fields encrypted at rest (AES-256-GCM); explicit delete endpoint required
6. **No ranking (Discover)** — property filters are renter-selected only; system never auto-filters, ranks, or predicts

## Code Style

- **Python**: PEP 8. No comments unless explaining why, not what. Type hints required on all function signatures.
- **TypeScript**: strict mode. `tsc -b` must pass with zero errors.
- **React**: functional components only. Hooks over HOCs. No class components.
- **CSS**: Tailwind utility classes only. No CSS modules or styled-components.

## Branch Naming

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
```

## Commit Messages

```
<type>(<scope>): <present-tense description>
```

Use `IMPLEMENTATION_PLAN.md` phase labels for scope (e.g., `profile`, `understand`, `prepare`, `discover`, `guardrails`). Keep messages under 72 characters. Reference the plan section when relevant.

## Pull Request Process

1. Run all tests before opening:
   ```bash
   cd backend && .venv\Scripts\activate && python -m pytest tests/ -v
   cd frontend && npm run build
   ```
2. Ensure zero warnings and zero test failures.
3. Update `IMPLEMENTATION_PLAN.md` status table if your PR completes a phase.
4. If adding a new dependency, update the license table in `ARCHITECTURE_AND_RISK.md` §3.
5. A maintainer must review and approve before merge.

## Testing

- Every new endpoint needs a corresponding test file or test function.
- Backend tests use `pytest` + `fastapi.testclient`.
- Tests must not depend on external services (no network calls, no LLM API).
- Synthetic documents in `backend/data/synthetic/` can be regenerated with:
  ```bash
  python scripts/generate_synthetic_docs.py --count 20
  ```

## Reporting Issues

Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS (for frontend issues)
- Backend logs (if applicable)

Do not include any real personally identifiable information in bug reports.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
