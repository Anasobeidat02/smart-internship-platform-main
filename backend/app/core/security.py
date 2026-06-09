from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

_settings = get_settings()


def hash_password(plain: str) -> str:
    pw = plain.encode("utf-8")[:72]  # bcrypt limit
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except ValueError:
        return False


def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, _settings.jwt_secret, algorithm=_settings.jwt_algo)


def create_access_token(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=_settings.access_token_ttl_minutes)
    return _encode({
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    })


def create_refresh_token(user_id: int, role: str) -> tuple[str, str, datetime]:
    """Returns (token, jti, expires_at). Caller persists jti in RefreshToken table."""
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=_settings.refresh_token_ttl_days)
    jti = uuid4().hex
    token = _encode({
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    })
    return token, jti, exp.replace(tzinfo=None)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, _settings.jwt_secret, algorithms=[_settings.jwt_algo])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
