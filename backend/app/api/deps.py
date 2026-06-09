from typing import Annotated

from fastapi import Depends, Header
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.infra.db.session import get_session


async def db(session: Annotated[AsyncSession, Depends(get_session)]) -> AsyncSession:
    return session


def _parse_bearer(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


async def current_claims(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> dict:
    token = _parse_bearer(authorization)
    try:
        claims = decode_token(token)
    except ValueError as e:
        raise UnauthorizedError(str(e)) from e
    if claims.get("type") != "access":
        raise UnauthorizedError("Wrong token type")
    return claims


async def current_user_id(claims: Annotated[dict, Depends(current_claims)]) -> int:
    return int(claims["sub"])


async def current_role(claims: Annotated[dict, Depends(current_claims)]) -> str:
    return str(claims.get("role", "student"))


def require_role(*roles: str):
    async def _checker(role: Annotated[str, Depends(current_role)]) -> str:
        if role not in roles:
            raise ForbiddenError(f"Requires role: {', '.join(roles)}")
        return role

    return _checker
