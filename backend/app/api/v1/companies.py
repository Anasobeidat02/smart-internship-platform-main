from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.deps import current_user_id, db, require_role
from app.api.schemas import CompanyIn, CompanyOut
from app.core.exceptions import ForbiddenError, NotFoundError
# استيراد الموديلات المطلوبة لقاعدة البيانات بما فيها جداول الطلبات والفرص
from app.infra.db.models import Company, Application, Internship 

router = APIRouter()


@router.get("/me", response_model=CompanyOut)
async def get_my_company(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("company", "admin"))],
):
    row = (
        await session.exec(select(Company).where(Company.owner_user_id == user_id))
    ).first()
    if not row:
        raise NotFoundError("No company linked to this account")
    return CompanyOut.model_validate(row, from_attributes=True)


@router.put("/me", response_model=CompanyOut)
async def update_my_company(
    payload: CompanyIn,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("company", "admin"))],
):
    row = (
        await session.exec(select(Company).where(Company.owner_user_id == user_id))
    ).first()
    if not row:
        raise ForbiddenError("No company linked to this account")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return CompanyOut.model_validate(row, from_attributes=True)


@router.get("/api/v1/company/me/applications", response_model=list) 
async def get_my_company_applications(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("company"))],
):
    """
    جلب كافة طلبات التدريب (Applications) التي قدمها الطلاب 
    على الفرص المتاحة لشركة المستخدم الحالي فقط.
    """
    # 1. البحث عن الشركة التابعة للمستخدم المسجل دخوله
    company = (
        await session.exec(select(Company).where(Company.owner_user_id == user_id))
    ).first()
    
    if not company:
        raise NotFoundError("No company linked to this account")

    # 2. جلب الطلبات عبر عمل Join بين جدول الطلبات وجدول الفرص للتصفية حسب الـ company_id
    stmt = (
        select(Application)
        .join(Internship, Application.internship_id == Internship.id)
        .where(Internship.company_id == company.id)
    )
    
    rows = (await session.exec(stmt)).all()
    return rows


@router.get("/", response_model=list[CompanyOut])
async def list_companies(
    session: Annotated[AsyncSession, Depends(db)],
    governorate: Optional[str] = Query(None),
    field: Optional[str] = Query(None),
    strategic: Optional[bool] = Query(None),
    q: Optional[str] = Query(None, description="Search across name and training fields"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    stmt = select(Company).where(Company.is_approved == True)  # noqa: E712
    if governorate:
        stmt = stmt.where(Company.governorate.ilike(f"%{governorate}%"))
    if field:
        stmt = stmt.where(Company.fields.ilike(f"%{field}%"))
    if strategic is not None:
        stmt = stmt.where(Company.is_strategic_partner == strategic)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Company.name_en.ilike(like))
            | (Company.name_ar.ilike(like))
            | (Company.training_fields.ilike(like))
            | (Company.fields.ilike(like))
        )
    stmt = stmt.order_by(
        Company.is_strategic_partner.desc(), Company.name_en
    ).offset(offset).limit(limit)
    rows = (await session.exec(stmt)).all()
    return [CompanyOut.model_validate(r, from_attributes=True) for r in rows]


@router.get("/{slug}", response_model=CompanyOut)
async def get_company(slug: str, session: Annotated[AsyncSession, Depends(db)]):
    row = (await session.exec(select(Company).where(Company.slug == slug))).first()
    if not row or not row.is_approved:
        raise NotFoundError("Company not found")
    return CompanyOut.model_validate(row, from_attributes=True)