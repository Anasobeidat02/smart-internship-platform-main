from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import select, func, delete as sqldelete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import db, require_role
from app.core.exceptions import NotFoundError, ForbiddenError
from app.infra.db.models import (
    Application,
    Company,
    Internship,
    RefreshToken,
    StudentProfile,
    University,
    User,
)

router = APIRouter()


# -------------------------- Schemas --------------------------

class UserRow(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    locale: str
    created_at: Optional[datetime] = None
    full_name: Optional[str] = None


class StudentRow(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    major: str
    university_id: Optional[int]
    university_name: Optional[str]
    gpa: float
    experience_years: int
    skills: str
    knowledge_areas: str
    home_city: str
    home_governorate: str
    is_active: bool
    created_at: Optional[datetime] = None


class CompanyRow(BaseModel):
    id: int
    slug: str
    name_en: str
    name_ar: str
    industry: str
    city: str
    governorate: str
    size: str
    is_strategic_partner: bool
    website: Optional[str] = None
    logo_url: Optional[str] = None
    owner_user_id: Optional[int] = None
    open_internships: int = 0
    applications_count: int = 0


class UniversityRow(BaseModel):
    id: int
    slug: str
    name_en: str
    name_ar: str
    type: str
    city: str
    governorate: str
    website: Optional[str] = None
    students_count: int = 0


class InternshipRow(BaseModel):
    id: int
    company_id: int
    company_name: str
    title_en: str
    title_ar: str
    description_en: str = ""
    description_ar: str = ""
    required_skills: str = ""
    knowledge_areas: str = ""
    required_experience: int = 0
    duration_weeks: int
    is_remote: bool
    is_open: bool
    applications_count: int = 0
    created_at: Optional[datetime] = None


class ApplicationRow(BaseModel):
    id: int
    student_user_id: int
    student_email: str
    student_name: str
    internship_id: int
    internship_title: str
    company_id: int
    company_name: str
    status: str
    match_score: float
    cover_letter: str
    created_at: Optional[datetime] = None


class AdminStats(BaseModel):
    users: int
    students: int
    companies: int
    universities: int
    internships: int
    applications: int
    strategic_partners: int
    active_users: int


class StatusUpdate(BaseModel):
    status: str


class ActiveUpdate(BaseModel):
    is_active: bool


AdminGuard = Annotated[str, Depends(require_role("admin"))]


# -------------------------- Stats --------------------------

@router.get("/stats", response_model=AdminStats)
async def get_stats(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    async def _count(model, *where) -> int:
        stmt = select(func.count()).select_from(model)
        for w in where:
            stmt = stmt.where(w)
        return int((await session.exec(stmt)).one())

    return AdminStats(
        users=await _count(User),
        students=await _count(StudentProfile),
        companies=await _count(Company),
        universities=await _count(University),
        internships=await _count(Internship),
        applications=await _count(Application),
        strategic_partners=await _count(Company, Company.is_strategic_partner == True),  # noqa: E712
        active_users=await _count(User, User.is_active == True),  # noqa: E712
    )


# -------------------------- Users --------------------------

@router.get("/users", response_model=list[UserRow])
async def list_users(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    users = (await session.exec(select(User).order_by(User.id))).all()
    profiles = (await session.exec(select(StudentProfile))).all()
    name_by_uid = {p.user_id: p.full_name for p in profiles}
    return [
        UserRow(
            id=u.id,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            locale=u.locale,
            created_at=u.created_at,
            full_name=name_by_uid.get(u.id),
        )
        for u in users
    ]


@router.patch("/users/{user_id}/active", response_model=UserRow)
async def set_user_active(
    user_id: int,
    payload: ActiveUpdate,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    user.is_active = payload.is_active
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserRow(
        id=user.id, email=user.email, role=user.role, is_active=user.is_active,
        locale=user.locale, created_at=user.created_at,
    )


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    if user.role == "admin":
        raise ForbiddenError("Admin users cannot be deleted")

    await session.exec(sqldelete(Application).where(Application.student_user_id == user_id))
    await session.exec(sqldelete(StudentProfile).where(StudentProfile.user_id == user_id))
    await session.exec(sqldelete(RefreshToken).where(RefreshToken.user_id == user_id))
    owned = (await session.exec(select(Company).where(Company.owner_user_id == user_id))).all()
    for c in owned:
        c.owner_user_id = None
        session.add(c)
    await session.delete(user)
    await session.commit()
    return None


class CreateUserIn(BaseModel):
    email: str
    password: str
    role: str = "student"  # student | company | admin
    full_name: str = ""


@router.post("/users", response_model=UserRow, status_code=201)
async def create_user(
    payload: CreateUserIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    from app.core.security import hash_password
    from app.core.exceptions import ConflictError
    existing = (await session.exec(select(User).where(User.email == payload.email))).first()
    if existing:
        raise ConflictError("Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    if payload.full_name and payload.role == "student":
        profile = StudentProfile(user_id=user.id, full_name=payload.full_name)
        session.add(profile)
        await session.commit()
    return UserRow(
        id=user.id, email=user.email, role=user.role, is_active=user.is_active,
        locale=user.locale, created_at=user.created_at, full_name=payload.full_name or None,
    )


# -------------------------- Students --------------------------

@router.get("/students", response_model=list[StudentRow])
async def list_students(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    profiles = (await session.exec(select(StudentProfile).order_by(StudentProfile.id))).all()
    users = {u.id: u for u in (await session.exec(select(User))).all()}
    unis = {u.id: u for u in (await session.exec(select(University))).all()}
    rows: list[StudentRow] = []
    for p in profiles:
        u = users.get(p.user_id)
        if not u:
            continue
        uni = unis.get(p.university_id) if p.university_id else None
        rows.append(
            StudentRow(
                id=p.id,
                user_id=p.user_id,
                email=u.email,
                full_name=p.full_name,
                major=p.major,
                university_id=p.university_id,
                university_name=uni.name_en if uni else None,
                gpa=p.gpa,
                experience_years=p.experience_years,
                skills=p.skills,
                knowledge_areas=p.knowledge_areas,
                home_city=p.home_city,
                home_governorate=p.home_governorate,
                is_active=u.is_active,
                created_at=p.created_at,
            )
        )
    return rows


# -------------------------- Companies --------------------------

@router.get("/companies", response_model=list[CompanyRow])
async def list_companies(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    companies = (await session.exec(select(Company).order_by(Company.name_en))).all()
    open_rows = (
        await session.exec(
            select(Internship.company_id, func.count())
            .where(Internship.is_open == True)  # noqa: E712
            .group_by(Internship.company_id)
        )
    ).all()
    open_counts = {cid: int(c) for cid, c in open_rows}
    app_rows = (
        await session.exec(
            select(Application.company_id, func.count()).group_by(Application.company_id)
        )
    ).all()
    app_counts = {cid: int(c) for cid, c in app_rows}

    return [
        CompanyRow(
            id=c.id,
            slug=c.slug,
            name_en=c.name_en,
            name_ar=c.name_ar,
            industry=c.fields,
            city=c.city,
            governorate=c.governorate,
            size=c.size,
            is_strategic_partner=c.is_strategic_partner,
            website=c.website,
            logo_url=c.logo_url,
            owner_user_id=c.owner_user_id,
            open_internships=open_counts.get(c.id, 0),
            applications_count=app_counts.get(c.id, 0),
        )
        for c in companies
    ]


@router.post("/companies/{company_id}/toggle-strategic", response_model=dict)
async def toggle_strategic(
    company_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    c = await session.get(Company, company_id)
    if not c:
        raise NotFoundError("Company not found")
    c.is_strategic_partner = not c.is_strategic_partner
    session.add(c)
    await session.commit()
    return {"id": c.id, "is_strategic_partner": c.is_strategic_partner}


@router.delete("/companies/{company_id}", status_code=204)
async def delete_company(
    company_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    c = await session.get(Company, company_id)
    if not c:
        raise NotFoundError("Company not found")
    await session.exec(sqldelete(Application).where(Application.company_id == company_id))
    await session.exec(sqldelete(Internship).where(Internship.company_id == company_id))
    await session.delete(c)
    await session.commit()
    return None


import re as _re

def _slugify(s: str) -> str:
    return _re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


class CreateCompanyIn(BaseModel):
    name_en: str
    name_ar: str
    city: str = "Amman"
    governorate: str = "Amman"
    industry: str = ""
    size: str = "medium"
    website: Optional[str] = None
    latitude: float = 31.9515694
    longitude: float = 35.9239625


@router.post("/companies", response_model=CompanyRow, status_code=201)
async def create_company(
    payload: CreateCompanyIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    from app.core.exceptions import ConflictError
    slug = _slugify(payload.name_en)
    # make slug unique
    existing_slugs = {c.slug for c in (await session.exec(select(Company).where(Company.slug.startswith(slug)))).all()}
    final_slug = slug
    counter = 1
    while final_slug in existing_slugs:
        final_slug = f"{slug}-{counter}"
        counter += 1
    company = Company(
        slug=final_slug,
        name_en=payload.name_en,
        name_ar=payload.name_ar,
        city=payload.city,
        governorate=payload.governorate,
        fields=payload.industry,
        size=payload.size,
        website=payload.website,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    session.add(company)
    await session.commit()
    await session.refresh(company)
    return CompanyRow(
        id=company.id, slug=company.slug, name_en=company.name_en, name_ar=company.name_ar,
        industry=company.fields, city=company.city, governorate=company.governorate,
        size=company.size, is_strategic_partner=company.is_strategic_partner,
        website=company.website, logo_url=company.logo_url, owner_user_id=company.owner_user_id,
        open_internships=0, applications_count=0,
    )


# -------------------------- Universities (Institutes) --------------------------

@router.get("/universities", response_model=list[UniversityRow])
async def list_universities(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    unis = (await session.exec(select(University).order_by(University.name_en))).all()
    count_rows = (
        await session.exec(
            select(StudentProfile.university_id, func.count())
            .where(StudentProfile.university_id.is_not(None))
            .group_by(StudentProfile.university_id)
        )
    ).all()
    counts = {uid: int(c) for uid, c in count_rows}
    return [
        UniversityRow(
            id=u.id,
            slug=u.slug,
            name_en=u.name_en,
            name_ar=u.name_ar,
            type=u.type,
            city=u.city,
            governorate=u.governorate,
            website=u.website,
            students_count=counts.get(u.id, 0),
        )
        for u in unis
    ]


@router.delete("/universities/{university_id}", status_code=204)
async def delete_university(
    university_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    uni = await session.get(University, university_id)
    if not uni:
        raise NotFoundError("Institute not found")
    students = (
        await session.exec(
            select(StudentProfile).where(StudentProfile.university_id == university_id)
        )
    ).all()
    for s in students:
        s.university_id = None
        session.add(s)
    await session.delete(uni)
    await session.commit()
    return None


class CreateUniversityIn(BaseModel):
    name_en: str
    name_ar: str
    type: str = "public"  # public | private
    city: str = "Amman"
    governorate: str = "Amman"
    website: Optional[str] = None
    latitude: float = 31.9515694
    longitude: float = 35.9239625


@router.post("/universities", response_model=UniversityRow, status_code=201)
async def create_university(
    payload: CreateUniversityIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    import re as _re2
    slug = _re2.sub(r"[^a-z0-9]+", "-", payload.name_en.lower()).strip("-")
    existing_slugs = {u.slug for u in (await session.exec(select(University).where(University.slug.startswith(slug)))).all()}
    final_slug = slug
    counter = 1
    while final_slug in existing_slugs:
        final_slug = f"{slug}-{counter}"
        counter += 1
    uni = University(
        slug=final_slug,
        name_en=payload.name_en,
        name_ar=payload.name_ar,
        type=payload.type,
        city=payload.city,
        governorate=payload.governorate,
        website=payload.website,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    session.add(uni)
    await session.commit()
    await session.refresh(uni)
    return UniversityRow(
        id=uni.id, slug=uni.slug, name_en=uni.name_en, name_ar=uni.name_ar,
        type=uni.type, city=uni.city, governorate=uni.governorate,
        website=uni.website, students_count=0,
    )


# -------------------------- Internships --------------------------

@router.get("/internships", response_model=list[InternshipRow])
async def list_internships(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    items = (await session.exec(select(Internship).order_by(Internship.id.desc()))).all()
    companies = {c.id: c for c in (await session.exec(select(Company))).all()}
    app_rows = (
        await session.exec(
            select(Application.internship_id, func.count()).group_by(Application.internship_id)
        )
    ).all()
    app_counts = {iid: int(c) for iid, c in app_rows}
    return [
        InternshipRow(
            id=it.id,
            company_id=it.company_id,
            company_name=companies[it.company_id].name_en if it.company_id in companies else f"#{it.company_id}",
            title_en=it.title_en,
            title_ar=it.title_ar,
            description_en=it.description_en,
            description_ar=it.description_ar,
            required_skills=it.required_skills,
            knowledge_areas=it.knowledge_areas,
            required_experience=it.required_experience,
            duration_weeks=it.duration_weeks,
            is_remote=it.is_remote,
            is_open=it.is_open,
            applications_count=app_counts.get(it.id, 0),
            created_at=it.created_at,
        )
        for it in items
    ]


@router.delete("/internships/{internship_id}", status_code=204)
async def delete_internship(
    internship_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    it = await session.get(Internship, internship_id)
    if not it:
        raise NotFoundError("Internship not found")
    await session.exec(sqldelete(Application).where(Application.internship_id == internship_id))
    await session.delete(it)
    await session.commit()
    return None


class CreateInternshipIn(BaseModel):
    company_id: int
    title_en: str
    title_ar: str
    description_en: str = ""
    description_ar: str = ""
    required_skills: str = ""
    knowledge_areas: str = ""
    required_experience: int = 0
    duration_weeks: int = 12
    is_remote: bool = False
    is_open: bool = True


@router.post("/internships", response_model=InternshipRow, status_code=201)
async def create_internship(
    payload: CreateInternshipIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    company = await session.get(Company, payload.company_id)
    if not company:
        raise NotFoundError(f"Company #{payload.company_id} not found")

    internship = Internship(
        company_id=payload.company_id,
        title_en=payload.title_en,
        title_ar=payload.title_ar,
        description_en=payload.description_en,
        description_ar=payload.description_ar,
        required_skills=payload.required_skills,
        knowledge_areas=payload.knowledge_areas,
        required_experience=payload.required_experience,
        duration_weeks=payload.duration_weeks,
        is_remote=payload.is_remote,
        is_open=payload.is_open,
    )
    session.add(internship)
    await session.commit()
    await session.refresh(internship)

    return InternshipRow(
        id=internship.id,
        company_id=internship.company_id,
        company_name=company.name_en,
        title_en=internship.title_en,
        title_ar=internship.title_ar,
        duration_weeks=internship.duration_weeks,
        is_remote=internship.is_remote,
        is_open=internship.is_open,
        applications_count=0,
        created_at=internship.created_at,
    )



# -------------------------- Applications --------------------------

@router.get("/applications", response_model=list[ApplicationRow])
async def list_applications(
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    apps = (await session.exec(select(Application).order_by(Application.id.desc()))).all()
    users = {u.id: u for u in (await session.exec(select(User))).all()}
    profiles = {p.user_id: p for p in (await session.exec(select(StudentProfile))).all()}
    internships = {i.id: i for i in (await session.exec(select(Internship))).all()}
    companies = {c.id: c for c in (await session.exec(select(Company))).all()}
    rows: list[ApplicationRow] = []
    for a in apps:
        u = users.get(a.student_user_id)
        p = profiles.get(a.student_user_id)
        i = internships.get(a.internship_id)
        c = companies.get(a.company_id)
        rows.append(
            ApplicationRow(
                id=a.id,
                student_user_id=a.student_user_id,
                student_email=u.email if u else f"#{a.student_user_id}",
                student_name=p.full_name if p else (u.email if u else ""),
                internship_id=a.internship_id,
                internship_title=i.title_en if i else f"#{a.internship_id}",
                company_id=a.company_id,
                company_name=c.name_en if c else f"#{a.company_id}",
                status=a.status,
                match_score=a.match_score,
                cover_letter=a.cover_letter,
                created_at=a.created_at,
            )
        )
    return rows


@router.patch("/applications/{application_id}/status", response_model=dict)
async def set_application_status(
    application_id: int,
    payload: StatusUpdate,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    valid = {"pending", "accepted", "rejected", "withdrawn"}
    if payload.status not in valid:
        raise ForbiddenError(f"Invalid status. Allowed: {sorted(valid)}")
    a = await session.get(Application, application_id)
    if not a:
        raise NotFoundError("Application not found")
    a.status = payload.status
    session.add(a)
    await session.commit()
    return {"id": a.id, "status": a.status}


@router.delete("/applications/{application_id}", status_code=204)
async def delete_application(
    application_id: int,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    a = await session.get(Application, application_id)
    if not a:
        raise NotFoundError("Application not found")
    await session.delete(a)
    await session.commit()
    return None


# -------------------------- Edit API Endpoints --------------------------

class UpdateUserIn(BaseModel):
    email: str
    password: Optional[str] = None
    role: str = "student"
    full_name: str = ""


@router.put("/users/{user_id}", response_model=UserRow)
async def update_user(
    user_id: int,
    payload: UpdateUserIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    
    if user.email != payload.email:
        from app.core.exceptions import ConflictError
        existing = (await session.exec(select(User).where(User.email == payload.email))).first()
        if existing:
            raise ConflictError("Email already registered")
        user.email = payload.email
        
    if payload.password:
        from app.core.security import hash_password
        user.password_hash = hash_password(payload.password)
        
    user.role = payload.role
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    if user.role == "student":
        profile = (await session.exec(select(StudentProfile).where(StudentProfile.user_id == user.id))).first()
        if profile:
            profile.full_name = payload.full_name
            session.add(profile)
        else:
            profile = StudentProfile(user_id=user.id, full_name=payload.full_name)
            session.add(profile)
        await session.commit()
    elif payload.full_name:
        profile = (await session.exec(select(StudentProfile).where(StudentProfile.user_id == user.id))).first()
        if profile:
            profile.full_name = payload.full_name
            session.add(profile)
            await session.commit()
            
    return UserRow(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        locale=user.locale,
        created_at=user.created_at,
        full_name=payload.full_name or None,
    )


@router.put("/companies/{company_id}", response_model=CompanyRow)
async def update_company(
    company_id: int,
    payload: CreateCompanyIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    c = await session.get(Company, company_id)
    if not c:
        raise NotFoundError("Company not found")
    
    if c.name_en != payload.name_en:
        slug = _slugify(payload.name_en)
        existing_slugs = {co.slug for co in (await session.exec(select(Company).where(Company.slug.startswith(slug)))).all() if co.id != company_id}
        final_slug = slug
        counter = 1
        while final_slug in existing_slugs:
            final_slug = f"{slug}-{counter}"
            counter += 1
        c.slug = final_slug

    c.name_en = payload.name_en
    c.name_ar = payload.name_ar
    c.city = payload.city
    c.governorate = payload.governorate
    c.fields = payload.industry
    c.size = payload.size
    c.website = payload.website
    
    if payload.latitude != 31.9515694 or c.latitude is None:
        c.latitude = payload.latitude
    if payload.longitude != 35.9239625 or c.longitude is None:
        c.longitude = payload.longitude
        
    session.add(c)
    await session.commit()
    await session.refresh(c)
    
    open_internships = int(
        (
            await session.exec(
                select(func.count())
                .select_from(Internship)
                .where(Internship.company_id == c.id)
                .where(Internship.is_open == True)
            )
        ).one()
    )
    applications_count = int(
        (
            await session.exec(
                select(func.count())
                .select_from(Application)
                .where(Application.company_id == c.id)
            )
        ).one()
    )
    
    return CompanyRow(
        id=c.id,
        slug=c.slug,
        name_en=c.name_en,
        name_ar=c.name_ar,
        industry=c.fields,
        city=c.city,
        governorate=c.governorate,
        size=c.size,
        is_strategic_partner=c.is_strategic_partner,
        website=c.website,
        logo_url=c.logo_url,
        owner_user_id=c.owner_user_id,
        open_internships=open_internships,
        applications_count=applications_count,
    )


@router.put("/universities/{university_id}", response_model=UniversityRow)
async def update_university(
    university_id: int,
    payload: CreateUniversityIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    u = await session.get(University, university_id)
    if not u:
        raise NotFoundError("University not found")
        
    if u.name_en != payload.name_en:
        import re as _re2
        slug = _re2.sub(r"[^a-z0-9]+", "-", payload.name_en.lower()).strip("-")
        existing_slugs = {uni.slug for uni in (await session.exec(select(University).where(University.slug.startswith(slug)))).all() if uni.id != university_id}
        final_slug = slug
        counter = 1
        while final_slug in existing_slugs:
            final_slug = f"{slug}-{counter}"
            counter += 1
        u.slug = final_slug
        
    u.name_en = payload.name_en
    u.name_ar = payload.name_ar
    u.type = payload.type
    u.city = payload.city
    u.governorate = payload.governorate
    u.website = payload.website
    
    if payload.latitude != 31.9515694 or u.latitude is None:
        u.latitude = payload.latitude
    if payload.longitude != 35.9239625 or u.longitude is None:
        u.longitude = payload.longitude
    
    session.add(u)
    await session.commit()
    await session.refresh(u)
    
    students_count = int(
        (
            await session.exec(
                select(func.count())
                .select_from(StudentProfile)
                .where(StudentProfile.university_id == u.id)
            )
        ).one()
    )
    
    return UniversityRow(
        id=u.id,
        slug=u.slug,
        name_en=u.name_en,
        name_ar=u.name_ar,
        type=u.type,
        city=u.city,
        governorate=u.governorate,
        website=u.website,
        students_count=students_count,
    )


@router.put("/internships/{internship_id}", response_model=InternshipRow)
async def update_internship(
    internship_id: int,
    payload: CreateInternshipIn,
    session: Annotated[AsyncSession, Depends(db)],
    _: AdminGuard,
):
    it = await session.get(Internship, internship_id)
    if not it:
        raise NotFoundError("Internship not found")
    company = await session.get(Company, payload.company_id)
    if not company:
        raise NotFoundError(f"Company #{payload.company_id} not found")

    it.company_id = payload.company_id
    it.title_en = payload.title_en
    it.title_ar = payload.title_ar
    it.description_en = payload.description_en
    it.description_ar = payload.description_ar
    it.required_skills = payload.required_skills
    it.knowledge_areas = payload.knowledge_areas
    it.required_experience = payload.required_experience
    it.duration_weeks = payload.duration_weeks
    it.is_remote = payload.is_remote
    it.is_open = payload.is_open
    
    session.add(it)
    await session.commit()
    await session.refresh(it)
    
    app_count = int(
        (
            await session.exec(
                select(func.count())
                .select_from(Application)
                .where(Application.internship_id == it.id)
            )
        ).one()
    )
    
    return InternshipRow(
        id=it.id,
        company_id=it.company_id,
        company_name=company.name_en,
        title_en=it.title_en,
        title_ar=it.title_ar,
        description_en=it.description_en,
        description_ar=it.description_ar,
        required_skills=it.required_skills,
        knowledge_areas=it.knowledge_areas,
        required_experience=it.required_experience,
        duration_weeks=it.duration_weeks,
        is_remote=it.is_remote,
        is_open=it.is_open,
        applications_count=app_count,
        created_at=it.created_at,
    )


# -------------------------- Seed --------------------------

@router.post("/seed", response_model=dict)
async def reseed(_: AdminGuard):
    from app.infra.seed.seeder import seed_all
    
    summary = await seed_all()
    return summary
