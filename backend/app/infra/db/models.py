from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


# ----------------------------- Users / Auth -----------------------------

class User(TimestampMixin, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    password_hash: str = Field(max_length=255)
    role: str = Field(default="student", index=True)  # student | company | admin
    is_active: bool = Field(default=True)
    locale: str = Field(default="en", max_length=8)


# --------------------------- Reference data ----------------------------

class University(TimestampMixin, table=True):
    __tablename__ = "universities"

    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True, max_length=80)
    name_en: str = Field(max_length=200)
    name_ar: str = Field(max_length=200)
    type: str = Field(default="public", max_length=20)  # public | private
    city: str = Field(max_length=80)
    governorate: str = Field(max_length=80)
    latitude: float
    longitude: float
    website: Optional[str] = Field(default=None, max_length=255)


class Company(TimestampMixin, table=True):
    __tablename__ = "companies"

    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True, max_length=120)
    name_en: str = Field(max_length=200)
    name_ar: str = Field(max_length=200)
    description_en: str = Field(default="", max_length=2000)
    description_ar: str = Field(default="", max_length=2000)
    fields: str = Field(default="", max_length=400)  # comma-separated: IT, AI, Telecom...
    training_fields: str = Field(default="", max_length=1000)  # skill keywords
    city: str = Field(max_length=80)
    governorate: str = Field(max_length=80)
    address: str = Field(default="", max_length=300)
    latitude: float
    longitude: float
    website: Optional[str] = Field(default=None, max_length=255)
    logo_url: Optional[str] = Field(default=None, max_length=400)
    size: str = Field(default="medium", max_length=20)  # small | medium | large | enterprise
    is_strategic_partner: bool = Field(default=False, index=True)
    owner_user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)


# ----------------------------- Students --------------------------------

class StudentProfile(TimestampMixin, table=True):
    __tablename__ = "student_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    full_name: str = Field(max_length=160)
    university_id: Optional[int] = Field(default=None, foreign_key="universities.id", index=True)
    major: str = Field(default="", max_length=160)
    gpa: float = Field(default=0.0)
    skills: str = Field(default="", max_length=1000)  # comma-separated
    knowledge_areas: str = Field(default="", max_length=1000)
    experience_years: int = Field(default=0)
    home_city: str = Field(default="", max_length=80)
    home_governorate: str = Field(default="", max_length=80)
    home_latitude: Optional[float] = None
    home_longitude: Optional[float] = None


# ----------------------------- Internships -----------------------------

class Internship(TimestampMixin, table=True):
    __tablename__ = "internships"

    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)
    title_en: str = Field(max_length=200)
    title_ar: str = Field(max_length=200)
    description_en: str = Field(default="", max_length=2000)
    description_ar: str = Field(default="", max_length=2000)
    required_skills: str = Field(default="", max_length=1000)
    knowledge_areas: str = Field(default="", max_length=1000)
    required_experience: int = Field(default=0)
    duration_weeks: int = Field(default=12)
    is_remote: bool = Field(default=False)
    university_filter: Optional[str] = Field(default=None, max_length=100)  # slug | None = open
    is_open: bool = Field(default=True, index=True)


# ---------------------------- Applications -----------------------------

class Application(TimestampMixin, table=True):
    __tablename__ = "applications"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_user_id: int = Field(foreign_key="users.id", index=True)
    internship_id: int = Field(foreign_key="internships.id", index=True)
    company_id: int = Field(foreign_key="companies.id", index=True)
    match_score: float = Field(default=0.0)
    skills_score: float = Field(default=0.0)
    geo_score: float = Field(default=0.0)
    field_score: float = Field(default=0.0)
    experience_score: float = Field(default=0.0)
    status: str = Field(default="pending", index=True)  # pending|accepted|rejected|withdrawn
    cover_letter: str = Field(default="", max_length=2000)


# ----------------------------- Auth security -----------------------------

class LoginAttempt(SQLModel, table=True):
    __tablename__ = "login_attempts"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, max_length=255)
    ip: str = Field(default="", max_length=64)
    success: bool = Field(default=False)
    attempted_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(index=True, unique=True, max_length=64)
    user_id: int = Field(foreign_key="users.id", index=True)
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    revoked_at: Optional[datetime] = Field(default=None, index=True)
