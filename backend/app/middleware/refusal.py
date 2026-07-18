from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.config import settings

DECISION_VERBS = [
    "approve", "deny", "reject", "accept", "eligible", "ineligible",
    "eligibility", "qualify", "disqualify", "admit", "decline",
    "grant", "refuse",
    "approved", "denied", "rejected", "accepted",
    "does not qualify", "entitled", "not entitled",
    "you qualify", "you do not qualify",
    "you are eligible", "you are not eligible",
    "congratulations", "unfortunately",
]

SKIP_CONTENT_TYPES = ["multipart/form-data", "application/octet-stream"]

REFUSAL_MESSAGE = (
    "I can extract, explain rules, and calculate — "
    "but I cannot determine eligibility. "
    "Please confirm your profile and consult a qualified human."
)


class RefusalMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST":
            content_type = request.headers.get("content-type", "")
            if not any(skip in content_type for skip in SKIP_CONTENT_TYPES):
                body_bytes = await request.body()
                if body_bytes:
                    try:
                        body_text = body_bytes.decode("utf-8").lower()
                        for verb in DECISION_VERBS:
                            if verb in body_text:
                                return JSONResponse(
                                    status_code=400,
                                    content={
                                        "error": "refusal",
                                        "message": REFUSAL_MESSAGE,
                                        "triggered_by": verb,
                                        "refusal_category": "decision_verb_detected",
                                    },
                                )
                    except UnicodeDecodeError:
                        pass
        response = await call_next(request)
        return response
