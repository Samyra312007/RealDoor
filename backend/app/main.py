import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.config import settings
from app.middleware.refusal import RefusalMiddleware
from app.middleware.consent_logger import ConsentLoggerMiddleware
from app.routers import (
    session,
    extract,
    confirm,
    rules,
    calc,
    checklist,
    packet,
    discover,
    fmr,
    tenant,
    designations,
)

logger = logging.getLogger("real_door")

HUMAN_ERRORS: dict[str, str] = {
    "none values not allowed": "This field is required and cannot be empty.",
    "field required": "A required field is missing. Check your input and try again.",
    "value is not a valid dict": "Invalid format. Send a valid JSON object.",
    "value_error.missing": "A required field is missing.",
}

app = FastAPI(
    title=settings.APP_NAME,
    description="RealDoor — Application-Readiness Copilot. "
                "The AI extracts, explains, retrieves, calculates, and prepares. "
                "The renter confirms. A qualified human decides.",
    version="0.1.0",
)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    raw = exc.errors()
    messages = []
    for err in raw:
        msg = err.get("msg", "")
        loc = ".".join(str(x) for x in err.get("loc", []))
        cleaned = HUMAN_ERRORS.get(msg)
        if cleaned:
            messages.append(f"{loc}: {cleaned}" if loc and loc != "body" else cleaned)
        else:
            messages.append(msg)
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "message": " ".join(messages) if len(messages) <= 2 else messages},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "Something went wrong. Please try again or rephrase your input."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RefusalMiddleware)
app.add_middleware(ConsentLoggerMiddleware)

app.include_router(session.router)
app.include_router(extract.router)
app.include_router(confirm.router)
app.include_router(rules.router)
app.include_router(calc.router)
app.include_router(checklist.router)
app.include_router(packet.router)
app.include_router(discover.router)
app.include_router(fmr.router)
app.include_router(tenant.router)
app.include_router(designations.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "0.1.0",
        "guardrails": {
            "refusal_layer": "active",
            "consent_logger": "active",
            "injection_defense": "active",
            "session_encryption": "active",
            "discover_stretch": "active",
            "fmr_context": "active",
            "tenant_tables": "active",
            "qct_dda_context": "active",
        },
        "design_principle": (
            "The AI extracts, explains, retrieves, calculates, and prepares. "
            "The renter confirms. A qualified human decides."
        ),
    }
