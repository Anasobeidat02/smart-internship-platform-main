from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.deps import db
from app.infra.db.models import Application, Company, Internship, StudentProfile, University

router = APIRouter()


@router.get("/overview")
async def overview(session: Annotated[AsyncSession, Depends(db)]):
    universities = (await session.exec(select(func.count(University.id)))).one()
    companies = (await session.exec(select(func.count(Company.id)))).one()
    internships = (await session.exec(select(func.count(Internship.id)))).one()
    students = (await session.exec(select(func.count(StudentProfile.id)))).one()
    apps = (await session.exec(select(func.count(Application.id)))).one()
    return {
        "universities": universities,
        "companies": companies,
        "internships": internships,
        "students": students,
        "applications": apps,
    }


@router.get("/by-governorate")
async def by_governorate(session: Annotated[AsyncSession, Depends(db)]):
    rows = (
        await session.exec(
            select(Company.governorate, func.count(Company.id)).group_by(Company.governorate)
        )
    ).all()
    return [{"governorate": g, "count": c} for g, c in rows]


@router.get("/by-field")
async def by_field(session: Annotated[AsyncSession, Depends(db)]):
    rows = (await session.exec(select(Company.fields))).all()
    counter: dict[str, int] = {}
    for f in rows:
        for part in (f or "").split(","):
            key = part.strip()
            if key:
                counter[key] = counter.get(key, 0) + 1
    return [
        {"field": k, "count": v}
        for k, v in sorted(counter.items(), key=lambda x: x[1], reverse=True)
    ]
