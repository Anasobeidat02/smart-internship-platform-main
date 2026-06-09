from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.deps import current_user_id, db, require_role
from app.api.schemas import StudentProfileIn, StudentProfileOut
from app.core.exceptions import NotFoundError
from app.infra.db.models import StudentProfile

router = APIRouter()


@router.get("/me", response_model=StudentProfileOut)
async def get_my_profile(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("student"))],
) -> StudentProfileOut:
    profile = (
        await session.exec(select(StudentProfile).where(StudentProfile.user_id == user_id))
    ).first()
    if not profile:
        raise NotFoundError("Profile not found")
    return StudentProfileOut.model_validate(profile, from_attributes=True)


@router.put("/me", response_model=StudentProfileOut)
async def upsert_my_profile(
    payload: StudentProfileIn,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("student"))],
) -> StudentProfileOut:
    profile = (
        await session.exec(select(StudentProfile).where(StudentProfile.user_id == user_id))
    ).first()
    if not profile:
        profile = StudentProfile(user_id=user_id, full_name=payload.full_name)
    for k, v in payload.model_dump().items():
        setattr(profile, k, v)
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return StudentProfileOut.model_validate(profile, from_attributes=True)
