"""Idempotent seeder for universities, companies, TWG partner and demo accounts."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

from sqlmodel import select

from app.core.security import hash_password
from app.infra.db.models import Company, Internship, StudentProfile, University, User
from app.infra.db.session import SessionLocal, init_db

DATA_DIR = Path(__file__).parent / "data"


# Fields that should be refreshed on every seed run so that JSON edits to
# canonical addresses, coordinates, websites, names etc. propagate to existing
# rows without requiring a DB wipe.
_UNI_REFRESH_FIELDS = ("name_en", "name_ar", "type", "city", "governorate", "latitude", "longitude", "website")
_COMPANY_REFRESH_FIELDS = (
    "name_en", "name_ar", "description_en", "description_ar",
    "fields", "training_fields", "city", "governorate", "address",
    "latitude", "longitude", "website", "size", "is_strategic_partner",
)


async def _seed_universities(session) -> int:
    payload = json.loads((DATA_DIR / "universities_jo.json").read_text(encoding="utf-8"))
    inserted = 0
    for row in payload:
        existing = (
            await session.exec(select(University).where(University.slug == row["slug"]))
        ).first()
        if existing:
            for field in _UNI_REFRESH_FIELDS:
                if field in row:
                    setattr(existing, field, row[field])
            session.add(existing)
            continue
        session.add(University(**row))
        inserted += 1
    await session.commit()
    return inserted


async def _seed_companies(session) -> int:
    payload = json.loads((DATA_DIR / "companies_jo.json").read_text(encoding="utf-8"))
    all_companies = payload

    inserted = 0
    for row in all_companies:
        existing = (
            await session.exec(select(Company).where(Company.slug == row["slug"]))
        ).first()
        if existing:
            for field in _COMPANY_REFRESH_FIELDS:
                if field in row:
                    setattr(existing, field, row[field])
            existing.is_approved = True
            session.add(existing)
            continue
        session.add(Company(**row, is_approved=True))
        inserted += 1
    await session.commit()
    return inserted


async def _seed_demo_accounts(session) -> int:
    inserted = 0
    seeded: list[tuple[str, str, str]] = [
        ("admin@smartintern.jo", "admin123!", "admin"),
        
        ("demo.student@smartintern.jo", "demo123!", "student"),
        ("demo.company@smartintern.jo", "demo123!", "company"),
    ]
    for email, password, role in seeded:
        existing = (
            await session.exec(select(User).where(User.email == email))
        ).first()
        if existing:
            continue
        user = User(
            email=email,
            password_hash=hash_password(password),
            role=role,
            locale="en",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        inserted += 1

        if role == "company":
            company = (
                await session.exec(select(Company).where(Company.slug == "aramex"))
            ).first()
            if company:
                company.owner_user_id = user.id
                company.is_approved = True
                session.add(company)
                await session.commit()
        elif role == "student":
            uj = (
                await session.exec(select(University).where(University.slug == "uj"))
            ).first()
            profile = StudentProfile(
                user_id=user.id,
                full_name="Demo Student",
                university_id=uj.id if uj else None,
                major="Computer Science",
                gpa=3.6,
                skills="Python, React, SQL, FastAPI, machine learning",
                knowledge_areas="Backend, AI, Data Science",
                experience_years=1,
                home_city="Amman",
                home_governorate="Amman",
                home_latitude=31.9539,
                home_longitude=35.9106,
            )
            session.add(profile)
            await session.commit()

    return inserted


_FIELD_TO_TITLE = {
    "Training": ("Professional Training Program Intern", "متدرب برنامج تدريب مهني"),
    "IT": ("Software Engineering Intern", "متدرب هندسة برمجيات"),
    "Software": ("Full-Stack Developer Intern", "متدرب تطوير برمجيات"),
    "AI": ("AI / ML Engineering Intern", "متدرب ذكاء اصطناعي"),
    "Data": ("Data Analyst Intern", "متدرب تحليل بيانات"),
    "Telecom": ("Network Engineering Intern", "متدرب هندسة شبكات"),
    "Cybersecurity": ("Cybersecurity Intern", "متدرب أمن سيبراني"),
    "Banking": ("Banking Operations Intern", "متدرب عمليات مصرفية"),
    "Pharma": ("Pharmaceutical R&D Intern", "متدرب بحث وتطوير دوائي"),
    "Healthcare": ("Healthcare Operations Intern", "متدرب عمليات صحية"),
    "Energy": ("Energy & Sustainability Intern", "متدرب طاقة واستدامة"),
    "Logistics": ("Supply Chain Intern", "متدرب سلاسل التزويد"),
    "Media": ("Digital Media Intern", "متدرب إعلام رقمي"),
    "Tourism": ("Tourism & Heritage Intern", "متدرب سياحة وتراث"),
    "Engineering": ("Engineering Intern", "متدرب هندسي"),
    "Education": ("Education Program Intern", "متدرب برامج تعليمية"),
}


def _pick_titles(company: Company) -> list[tuple[str, str]]:
    seen: list[tuple[str, str]] = []
    for f in (company.fields or "").split(","):
        f = f.strip()
        if f in _FIELD_TO_TITLE and _FIELD_TO_TITLE[f] not in seen:
            seen.append(_FIELD_TO_TITLE[f])
        if len(seen) >= 2:
            break
    if not seen:
        seen.append(("General Internship", "تدريب عام"))
    return seen


async def _seed_internships(session) -> int:
    """Seed 1-2 internships per company so the platform has real, searchable listings."""
    companies = (await session.exec(select(Company))).all()
    inserted = 0
    for company in companies:
        existing = (
            await session.exec(select(Internship).where(Internship.company_id == company.id))
        ).all()
        if existing:
            continue
        for title_en, title_ar in _pick_titles(company):
            desc_en = (
                f"{title_en} at {company.name_en}. "
                f"Work alongside experienced teams in {company.city}. "
                f"Skills focus: {company.training_fields[:200]}."
            )
            desc_ar = f"{title_ar} لدى {company.name_ar} في {company.city}."
            session.add(Internship(
                company_id=company.id,
                title_en=title_en,
                title_ar=title_ar,
                description_en=desc_en,
                description_ar=desc_ar,
                required_skills=company.training_fields[:500],
                knowledge_areas=company.fields[:200],
                required_experience=0,
                duration_weeks=12,
                is_remote=False,
                is_open=True,
            ))
            inserted += 1
    await session.commit()
    return inserted


async def seed_all() -> dict:
    await init_db()
    async with SessionLocal() as session:
        unis = await _seed_universities(session)
        comps = await _seed_companies(session)
        users = await _seed_demo_accounts(session)
        ints = await _seed_internships(session)
    return {
        "universities_inserted": unis,
        "companies_inserted": comps,
        "users_inserted": users,
        "internships_inserted": ints,
    }


def main() -> None:
    summary = asyncio.run(seed_all())
    print("Seed summary:", summary)


if __name__ == "__main__":
    main()
