from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.deps import current_user_id, db, require_role
from app.api.schemas import CompanyOut, InternshipIn, InternshipOut, InternshipWithCompany
from app.core.exceptions import ForbiddenError, NotFoundError
from app.infra.db.models import Company, Internship

router = APIRouter()


@router.get("/", response_model=list[InternshipWithCompany])
async def list_internships(
    session: Annotated[AsyncSession, Depends(db)],
    company_id: Optional[int] = Query(None),
    open_only: bool = Query(True),
    is_remote: Optional[bool] = Query(None),
    governorate: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search title and required skills"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    stmt = select(Internship, Company).join(Company, Internship.company_id == Company.id)
    if company_id:
        stmt = stmt.where(Internship.company_id == company_id)
    if open_only:
        stmt = stmt.where(Internship.is_open == True)  # noqa: E712
    if is_remote is not None:
        stmt = stmt.where(Internship.is_remote == is_remote)
    if governorate:
        stmt = stmt.where(Company.governorate.ilike(f"%{governorate}%"))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Internship.title_en.ilike(like))
            | (Internship.title_ar.ilike(like))
            | (Internship.required_skills.ilike(like))
        )
    stmt = stmt.order_by(Internship.created_at.desc()).offset(offset).limit(limit)
    rows = (await session.exec(stmt)).all()
    return [
        InternshipWithCompany(
            **InternshipOut.model_validate(internship, from_attributes=True).model_dump(),
            company=CompanyOut.model_validate(company, from_attributes=True),
        )
        for internship, company in rows
    ]


@router.get("/{internship_id}", response_model=InternshipWithCompany)
async def get_internship(internship_id: int, session: Annotated[AsyncSession, Depends(db)]):
    row = await session.get(Internship, internship_id)
    if not row:
        raise NotFoundError("Internship not found")
    company = await session.get(Company, row.company_id)
    if not company:
        raise NotFoundError("Company not found")
    return InternshipWithCompany(
        **InternshipOut.model_validate(row, from_attributes=True).model_dump(),
        company=CompanyOut.model_validate(company, from_attributes=True),
    )


@router.post("/", response_model=InternshipOut, status_code=201)
async def create_internship(
    payload: InternshipIn,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("company", "admin"))],
):
    company = (
        await session.exec(select(Company).where(Company.owner_user_id == user_id))
    ).first()
    if not company:
        raise ForbiddenError("No company linked to this account")
    internship = Internship(company_id=company.id, **payload.model_dump())
    session.add(internship)
    await session.commit()
    await session.refresh(internship)
    return InternshipOut.model_validate(internship, from_attributes=True)


@router.put("/{internship_id}", response_model=InternshipOut)
async def update_internship(
    internship_id: int,
    payload: InternshipIn,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    role: Annotated[str, Depends(require_role("company", "admin"))],
):
    row = await session.get(Internship, internship_id)
    if not row:
        raise NotFoundError("Internship not found")
    if role != "admin":
        company = (
            await session.exec(select(Company).where(Company.owner_user_id == user_id))
        ).first()
        if not company or company.id != row.company_id:
            raise ForbiddenError("You can only edit your own internships")
    for k, v in payload.model_dump().items():
        setattr(row, k, v)
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return InternshipOut.model_validate(row, from_attributes=True)


@router.delete("/{internship_id}", status_code=204)
async def delete_internship(
    internship_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    role: Annotated[str, Depends(require_role("company", "admin"))],
):
    row = await session.get(Internship, internship_id)
    if not row:
        raise NotFoundError("Internship not found")
    if role != "admin":
        company = (
            await session.exec(select(Company).where(Company.owner_user_id == user_id))
        ).first()
        if not company or company.id != row.company_id:
            raise ForbiddenError("You can only delete your own internships")
    await session.delete(row)
    await session.commit()
