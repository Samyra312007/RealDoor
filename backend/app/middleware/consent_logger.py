from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.guardrails.session_store import session_store


class ConsentLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        if request.method in ("POST", "PUT", "DELETE") and response.status_code < 400:
            session_token = request.headers.get("x-session-token", "") or request.query_params.get("token", "")
            if session_token:
                action_type = f"{request.method} {request.url.path}"
                session_store.log_action(session_token, action_type)
        return response
