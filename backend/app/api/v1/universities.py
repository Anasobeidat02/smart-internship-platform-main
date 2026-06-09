from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.deps import db
from app.api.schemas import UniversityOut
from app.core.exceptions import NotFoundError
from app.infra.db.models import University

router = APIRouter()


@router.get("/", response_model=list[UniversityOut])
async def list_universities(session: Annotated[AsyncSession, Depends(db)]):
    rows = (await session.exec(select(University).order_by(University.name_en))).all()
    return [UniversityOut.model_validate(r, from_attributes=True) for r in rows]


@router.get("/{slug}", response_model=UniversityOut)
async def get_university(slug: str, session: Annotated[AsyncSession, Depends(db)]):
    row = (await session.exec(select(University).where(University.slug == slug))).first()
    if not row:
        raise NotFoundError("University not found")
    return UniversityOut.model_validate(row, from_attributes=True)
