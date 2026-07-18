import base64
import os
from app.config import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_session_data(data: str) -> str:
    key = settings.ENCRYPTION_KEY[:32]
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, data.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_session_data(token: str) -> str:
    key = settings.ENCRYPTION_KEY[:32]
    raw = base64.b64decode(token)
    nonce, ct = raw[:12], raw[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None).decode()


SENSITIVE_FIELDS = ["annual_income", "full_name", "current_address"]
