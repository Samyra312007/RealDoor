import uuid
import time
from threading import Lock
from app.services.encryption import (
    encrypt_session_data,
    decrypt_session_data,
    SENSITIVE_FIELDS,
)
from app.config import settings

MTSP_RULE_VERSION = "mtsp_2026_v1"


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, dict] = {}
        self._lock = Lock()

    def create_session(self) -> str:
        token = str(uuid.uuid4())
        with self._lock:
            self._sessions[token] = {
                "created_at": time.time(),
                "profile": None,
                "extracted_fields": [],
                "confirmed_fields": [],
                "documents": [],
                "rule_queries": [],
                "calculations": [],
                "packets": [],
                "consent_log": [],
            }
        return token

    def get_session(self, token: str) -> dict | None:
        with self._lock:
            session = self._sessions.get(token)
            if session is None:
                return None
            if time.time() - session["created_at"] > settings.SESSION_TTL_SECONDS:
                del self._sessions[token]
                return None
            return session

    def set_profile(self, token: str, profile: dict) -> bool:
        session = self.get_session(token)
        if session is None:
            return False
        encrypted = profile.copy()
        for field in SENSITIVE_FIELDS:
            if field in encrypted and encrypted[field] is not None:
                encrypted[field] = encrypt_session_data(str(encrypted[field]))
        with self._lock:
            session["profile"] = encrypted
        return True

    def get_decrypted_profile(self, token: str) -> dict | None:
        session = self.get_session(token)
        if session is None or session["profile"] is None:
            return None
        profile = session["profile"].copy()
        for field in SENSITIVE_FIELDS:
            if field in profile and profile[field] is not None:
                try:
                    profile[field] = decrypt_session_data(profile[field])
                    if field == "annual_income":
                        profile[field] = float(profile[field])
                except Exception:
                    pass
        return profile

    def add_document(self, token: str, doc_type: str, field_names: list[str]) -> bool:
        session = self.get_session(token)
        if session is None:
            return False
        with self._lock:
            session.setdefault("documents", []).append({
                "doc_type": doc_type,
                "uploaded_at": time.time(),
                "field_names": field_names,
            })
        return True

    def get_documents(self, token: str) -> list[dict]:
        session = self.get_session(token)
        if session is None:
            return []
        return session.get("documents", [])

    def delete_session(self, token: str) -> bool:
        with self._lock:
            if token in self._sessions:
                del self._sessions[token]
                return True
            return False

    def log_action(self, token: str, action_type: str, field: str | None = None) -> None:
        session = self.get_session(token)
        if session is None:
            return
        with self._lock:
            session["consent_log"].append({
                "timestamp": time.time(),
                "action_type": action_type,
                "field": field,
                "rule_version": MTSP_RULE_VERSION,
            })


session_store = SessionStore()
