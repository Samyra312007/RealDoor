from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
)

app = FastAPI(
    title=settings.APP_NAME,
    description="RealDoor — Application-Readiness Copilot. "
                "The AI extracts, explains, retrieves, calculates, and prepares. "
                "The renter confirms. A qualified human decides.",
    version="0.1.0",
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
        },
        "design_principle": (
            "The AI extracts, explains, retrieves, calculates, and prepares. "
            "The renter confirms. A qualified human decides."
        ),
    }
