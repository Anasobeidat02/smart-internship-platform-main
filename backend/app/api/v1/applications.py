from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.deps import current_user_id, db, require_role
from app.api.schemas import ApplicationOut, ApplicationStatusIn
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.infra.db.models import Application, Company, Internship, StudentProfile, User, University
from app.services.mailer import notify_company_new_application, notify_student_status_change
from app.ml.matcher import CompanyVec, StudentVec, rank

router = APIRouter()


class ApplyIn(BaseModel):
    internship_id: int
    cover_letter: str = Field(default="", max_length=2000)
    match_score: float = 0.0
    skills_score: float = 0.0
    geo_score: float = 0.0
    field_score: float = 0.0
    experience_score: float = 0.0


# ─── Student: submit application ─────────────────────────────────────────────

@router.post("/", response_model=ApplicationOut, status_code=201)
async def apply(
    payload: ApplyIn,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("student"))],
):
    internship = await session.get(Internship, payload.internship_id)
    if not internship:
        raise NotFoundError("Internship not found")
    if not internship.is_open:
        raise ConflictError("Internship is closed")

    existing = (
        await session.exec(
            select(Application).where(
                Application.student_user_id == user_id,
                Application.internship_id == internship.id,
            )
        )
    ).first()
    if existing:
        raise ConflictError("Already applied")

    student_profile = (
        await session.exec(
            select(StudentProfile).where(StudentProfile.user_id == user_id)
        )
    ).first()

    match_score = 0.0
    skills_score = 0.0
    geo_score = 0.0
    field_score = 0.0
    experience_score = 0.0

    company = await session.get(Company, internship.company_id)
    if student_profile and company:
        uni_gov = None
        if student_profile.university_id:
            uni = await session.get(University, student_profile.university_id)
            if uni:
                uni_gov = uni.governorate

        student_vec = StudentVec(
            skills=student_profile.skills or "",
            knowledge_areas=student_profile.knowledge_areas or "",
            major=student_profile.major or "",
            experience_years=student_profile.experience_years or 0,
            home_lat=student_profile.home_latitude,
            home_lng=student_profile.home_longitude,
            home_governorate=student_profile.home_governorate or "",
            university_governorate=uni_gov,
            university_id=student_profile.university_id,
        )
        cvec = CompanyVec(
            id=company.id,
            slug=company.slug,
            name=company.name_en,
            fields=company.fields,
            training_fields=company.training_fields,
            city=company.city,
            governorate=company.governorate,
            latitude=company.latitude,
            longitude=company.longitude,
            is_strategic_partner=company.is_strategic_partner,
        )
        ranked = rank(student_vec, [cvec])
        if ranked:
            r_item = ranked[0]
            match_score = r_item["score"]
            breakdown = r_item.get("breakdown", {})
            skills_score = breakdown.get("skills", 0.0)
            geo_score = breakdown.get("geo", 0.0)
            field_score = breakdown.get("field", 0.0)
            experience_score = breakdown.get("experience", 0.0)

    app_row = Application(
        student_user_id=user_id,
        internship_id=internship.id,
        company_id=internship.company_id,
        cover_letter=payload.cover_letter,
        match_score=match_score,
        skills_score=skills_score,
        geo_score=geo_score,
        field_score=field_score,
        experience_score=experience_score,
        status="pending",
    )
    session.add(app_row)
    await session.commit()
    await session.refresh(app_row)

    # ── Fire-and-forget email to the company ──────────────────────────────
    student_user = await session.get(User, user_id)

    if company and student_user:
        company_email = company.website or student_user.email  # fallback
        # Use the company owner's email if available, else fallback gracefully
        if company.owner_user_id:
            owner = await session.get(User, company.owner_user_id)
            if owner:
                company_email = owner.email

        import asyncio
        asyncio.create_task(
            notify_company_new_application(
                company_email=company_email,
                company_name=company.name_en,
                internship_title=internship.title_en,
                student_name=student_profile.full_name if student_profile else student_user.email,
                student_email=student_user.email,
                cover_letter=payload.cover_letter,
                match_score=match_score,
            )
        )

    return ApplicationOut.model_validate(app_row, from_attributes=True)


# ─── Student: list my applications ────────────────────────────────────────────

@router.get("/mine", response_model=list[ApplicationOut])
async def my_applications(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("student"))],
):
    rows = (
        await session.exec(
            select(Application)
            .where(Application.student_user_id == user_id)
            .order_by(Application.created_at.desc())
        )
    ).all()
    return [ApplicationOut.model_validate(r, from_attributes=True) for r in rows]


# ─── Company: list received applications ──────────────────────────────────────

@router.get("/for-company", response_model=list[ApplicationOut])
async def company_applications(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("company", "admin"))],
):
    company = (
        await session.exec(select(Company).where(Company.owner_user_id == user_id))
    ).first()
    if not company:
        raise ForbiddenError("No company linked to this account")
    rows = (
        await session.exec(
            select(Application)
            .where(Application.company_id == company.id)
            .order_by(Application.match_score.desc())
        )
    ).all()
    return [ApplicationOut.model_validate(r, from_attributes=True) for r in rows]


# ─── Student: withdraw ────────────────────────────────────────────────────────

@router.patch("/{application_id}/withdraw", response_model=ApplicationOut)
async def withdraw(
    application_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("student"))],
):
    row = await session.get(Application, application_id)
    if not row:
        raise NotFoundError("Application not found")
    if row.student_user_id != user_id:
        raise ForbiddenError("You can only withdraw your own application")
    if row.status in ("accepted", "rejected", "withdrawn"):
        raise ConflictError(f"Cannot withdraw a {row.status} application")
    row.status = "withdrawn"
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return ApplicationOut.model_validate(row, from_attributes=True)


# ─── Company / Admin: accept or reject ───────────────────────────────────────

@router.patch("/{application_id}/status", response_model=ApplicationOut)
async def update_status(
    application_id: int,
    payload: ApplicationStatusIn,
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    role: Annotated[str, Depends(require_role("company", "admin"))],
):
    row = await session.get(Application, application_id)
    if not row:
        raise NotFoundError("Application not found")

    # Companies can only manage their own applications
    if role != "admin":
        company = (
            await session.exec(select(Company).where(Company.owner_user_id == user_id))
        ).first()
        if not company or company.id != row.company_id:
            raise ForbiddenError("You can only manage applications to your own company")

    if payload.status not in ("pending", "accepted", "rejected"):
        raise ConflictError("Allowed values: pending, accepted, rejected")

    old_status = row.status
    row.status = payload.status
    session.add(row)
    await session.commit()
    await session.refresh(row)

    # ── Notify student when status changes ───────────────────────────────
    if payload.status != old_status and payload.status in ("accepted", "rejected"):
        student_user = await session.get(User, row.student_user_id)
        internship = await session.get(Internship, row.internship_id)
        company = await session.get(Company, row.company_id)
        student_profile = (
            await session.exec(
                select(StudentProfile).where(StudentProfile.user_id == row.student_user_id)
            )
        ).first()

        if student_user and internship and company:
            import asyncio
            asyncio.create_task(
                notify_student_status_change(
                    student_email=student_user.email,
                    student_name=student_profile.full_name if student_profile else student_user.email,
                    internship_title=internship.title_en,
                    company_name=company.name_en,
                    new_status=payload.status,
                )
            )

    return ApplicationOut.model_validate(row, from_attributes=True)
@router.get("/for-company", response_model=list)
async def get_applications_for_my_company(
    session: Annotated[AsyncSession, Depends(db)],
    user_id: Annotated[int, Depends(current_user_id)],
    _: Annotated[str, Depends(require_role("company", "admin"))],
):
    """
    جلب كافة طلبات التدريب الخاصة بالشركة الحالية عبر ملف الـ applications
    """
    # 1. جلب الشركة المرتبطة بالمستخدم الحالي
    company = (
        await session.exec(select(Company).where(Company.owner_user_id == user_id))
    ).first()
    
    if not company:
        company = (await session.exec(select(Company))).first()
        if not company:
            return []
        
    # 2. جلب الطلبات المرتبطة بفرص هذه الشركة
    stmt = (
        select(Application)
        .join(Internship, Application.internship_id == Internship.id)
        .where(Internship.company_id == company.id)
    )
    
    rows = (await session.exec(stmt)).all()
    return rows