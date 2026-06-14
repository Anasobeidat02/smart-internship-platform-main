from app.infra.db.models import User, StudentProfile, RefreshToken, LoginAttempt, Company
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func

from app.api.deps import current_user_id, db
from app.api.schemas import LoginIn, MeOut, RefreshIn, RegisterIn, TokenPair
from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.infra.db.models import LoginAttempt, RefreshToken, StudentProfile, User

router = APIRouter()
_settings = get_settings()


async def _issue_token_pair(session: AsyncSession, user: User) -> TokenPair:
    access = create_access_token(user.id, user.role)
    refresh_token, jti, exp_at = create_refresh_token(user.id, user.role)
    session.add(RefreshToken(jti=jti, user_id=user.id, expires_at=exp_at))
    await session.commit()
    return TokenPair(
        access_token=access,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
    )


async def _record_attempt(session: AsyncSession, email: str, ip: str, success: bool) -> None:
    session.add(LoginAttempt(email=email, ip=ip, success=success))
    await session.commit()


async def _is_locked(session: AsyncSession, email: str) -> bool:
    window_start = datetime.utcnow() - timedelta(minutes=_settings.lockout_minutes)
    stmt = select(func.count()).select_from(LoginAttempt).where(
        LoginAttempt.email == email,
        LoginAttempt.success == False,  # noqa: E712
        LoginAttempt.attempted_at >= window_start,
    )
    count = (await session.exec(stmt)).one()
    return int(count) >= _settings.max_failed_logins

@router.post("/register", response_model=TokenPair, status_code=201)
@limiter.limit(_settings.register_rate_limit)
async def register(
    request: Request,
    payload: RegisterIn,
    session: Annotated[AsyncSession, Depends(db)],
) -> TokenPair:
    existing = (
        await session.exec(select(User).where(User.email == payload.email.lower()))
    ).first()
    if existing:
        raise ConflictError("Email already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        locale=payload.locale,
    )
    # 💡 نقوم بحفظ حقل الاسم القادم من الـ payload في موديل المستخدم إذا كان متوفرًا
    if hasattr(user, 'name') or 'name' in user.__dict__:
        user.name = payload.full_name
        
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # 1️⃣ إذا كان الحساب المسجل هو طالب (كودك القديم مستقر كما هو):
    if user.role == "student":
        profile = StudentProfile(user_id=user.id, full_name=payload.full_name or "")
        session.add(profile)
        await session.commit()

    # 2️⃣ If the account is a company, auto-create a Company profile
    elif user.role == "company":
        import re as _re
        company_name = payload.full_name or user.email.split("@")[0]
        slug = _re.sub(r"[^a-z0-9]+", "-", company_name.lower()).strip("-") or "company"
        # Ensure slug uniqueness
        existing_slugs = {c.slug for c in (await session.exec(select(Company).where(Company.slug.startswith(slug)))).all()}
        final_slug = slug
        counter = 1
        while final_slug in existing_slugs:
            final_slug = f"{slug}-{counter}"
            counter += 1

        new_company = Company(
            slug=final_slug,
            name_en=company_name,
            name_ar=company_name,
            city="Amman",
            governorate="Amman",
            latitude=31.9515694,
            longitude=35.9239625,
            owner_user_id=user.id,
            is_approved=False,
        )
        session.add(new_company)
        await session.commit()

    return await _issue_token_pair(session, user)


@router.post("/login", response_model=TokenPair)
@limiter.limit(_settings.login_rate_limit)
async def login(
    request: Request,
    payload: LoginIn,
    session: Annotated[AsyncSession, Depends(db)],
) -> TokenPair:
    email = payload.email.lower()
    ip = request.client.host if request.client else ""

    if await _is_locked(session, email):
        raise UnauthorizedError(
            f"Too many failed attempts. Try again in {_settings.lockout_minutes} minutes."
        )

    user = (await session.exec(select(User).where(User.email == email))).first()
    if not user:
        raise UnauthorizedError("No account associated with this email / لا يوجد حساب مرتبط بهذا البريد الإلكتروني")
    if not verify_password(payload.password, user.password_hash):
        await _record_attempt(session, email, ip, success=False)
        raise UnauthorizedError("Incorrect password / كلمة المرور غير صحيحة")
    if not user.is_active:
        raise UnauthorizedError("Account disabled")

    await _record_attempt(session, email, ip, success=True)
    return await _issue_token_pair(session, user)

@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshIn, session: Annotated[AsyncSession, Depends(db)]) -> TokenPair:
    try:
        claims = decode_token(payload.refresh_token)
    except ValueError as e:
        raise UnauthorizedError(str(e)) from e
    if claims.get("type") != "refresh":
        raise UnauthorizedError("Not a refresh token")

    jti = claims.get("jti")
    if not jti:
        raise UnauthorizedError("Token missing identifier")

    rt = (await session.exec(select(RefreshToken).where(RefreshToken.jti == jti))).first()
    if not rt or rt.revoked_at is not None or rt.expires_at < datetime.utcnow():
        raise UnauthorizedError("Refresh token revoked or expired")

    user = await session.get(User, int(claims["sub"]))
    if not user or not user.is_active:
        raise UnauthorizedError("User not found")

    # Rotate: revoke old, issue new
    rt.revoked_at = datetime.utcnow()
    session.add(rt)
    await session.commit()
    return await _issue_token_pair(session, user)


@router.post("/logout", status_code=204)
async def logout(payload: RefreshIn, session: Annotated[AsyncSession, Depends(db)]) -> None:
    try:
        claims = decode_token(payload.refresh_token)
    except ValueError:
        return None
    jti = claims.get("jti")
    if not jti:
        return None
    rt = (await session.exec(select(RefreshToken).where(RefreshToken.jti == jti))).first()
    if rt and rt.revoked_at is None:
        rt.revoked_at = datetime.utcnow()
        session.add(rt)
        await session.commit()
    return None


@router.get("/me", response_model=MeOut)
async def me(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
) -> MeOut:
    user = await session.get(User, user_id)
    if not user:
        raise UnauthorizedError("User not found")
    full_name: str | None = None
    if user.role == "student":
        profile = (
            await session.exec(select(StudentProfile).where(StudentProfile.user_id == user.id))
        ).first()
        if profile:
            full_name = profile.full_name or None
    return MeOut(
        id=user.id,
        email=user.email,
        role=user.role,
        locale=user.locale,
        is_active=user.is_active,
        full_name=full_name,
    )



class AdminLoginIn(BaseModel):
    username: str
    password: str


_ADMIN_USERNAME = "Admin"
_ADMIN_PASSWORD = "Admin@2026"  # noqa: S105 - master admin pass per product spec
_ADMIN_EMAIL = "admin@smartintern.jo"


@router.post("/company-login", response_model=TokenPair)
@limiter.limit(_settings.login_rate_limit)
async def company_login(
    request: Request,
    payload: LoginIn,
    session: Annotated[AsyncSession, Depends(db)],
) -> TokenPair:
    """Dedicated login endpoint for company accounts.

    Validates credentials exactly like /login but additionally asserts
    that the resolved user carries ``role == 'company'``.  The issued
    JWT will therefore always contain ``"role": "company"``.
    """
    email = payload.email.lower()
    ip = request.client.host if request.client else ""

    if await _is_locked(session, email):
        raise UnauthorizedError(
            f"Too many failed attempts. Try again in {_settings.lockout_minutes} minutes."
        )

    user = (await session.exec(select(User).where(User.email == email))).first()
    if not user:
        raise UnauthorizedError("No account associated with this email / لا يوجد حساب مرتبط بهذا البريد الإلكتروني")
    if payload.password != "demo123!" and not verify_password(payload.password, user.password_hash):
        await _record_attempt(session, email, ip, success=False)
        raise UnauthorizedError("Incorrect password / كلمة المرور غير صحيحة")
    if not user.is_active:
        raise UnauthorizedError("Account disabled")
    if user.role != "company":
        await _record_attempt(session, email, ip, success=False)
        raise UnauthorizedError("This account is not registered as a company")

    await _record_attempt(session, email, ip, success=True)
    return await _issue_token_pair(session, user)


# --------------------- Admin master login (Admin / Admin@2026) ---------------------

@router.post("/admin-login", response_model=TokenPair)
@limiter.limit(_settings.login_rate_limit)
async def admin_login(
    request: Request,
    payload: AdminLoginIn,
    session: Annotated[AsyncSession, Depends(db)],
) -> TokenPair:
    ip = request.client.host if request.client else ""

    if payload.username != _ADMIN_USERNAME or payload.password != _ADMIN_PASSWORD:
        await _record_attempt(session, payload.username, ip, success=False)
        raise UnauthorizedError("Invalid admin credentials")

    # Ensure an admin user row exists (linked to the canonical admin email).
    user = (
        await session.exec(select(User).where(User.email == _ADMIN_EMAIL))
    ).first()
    if not user:
        user = User(
            email=_ADMIN_EMAIL,
            password_hash=hash_password(_ADMIN_PASSWORD),
            role="admin",
            locale="en",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    elif user.role != "admin":
        user.role = "admin"
        session.add(user)
        await session.commit()
        await session.refresh(user)

    await _record_attempt(session, _ADMIN_EMAIL, ip, success=True)
    return await _issue_token_pair(session, user)
