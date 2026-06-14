from datetime import datetime
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, EmailStr, Field


T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    has_more: bool


# -------- Auth --------

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="student", pattern="^(student|company)$")
    full_name: Optional[str] = None
    locale: str = Field(default="en", pattern="^(en|ar)$")


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class RefreshIn(BaseModel):
    refresh_token: str


class MeOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    locale: str
    is_active: bool
    full_name: Optional[str] = None


# -------- Student profile --------

class StudentProfileIn(BaseModel):
    full_name: str
    university_id: Optional[int] = None
    major: str = ""
    gpa: float = 0.0
    skills: str = ""
    knowledge_areas: str = ""
    experience_years: int = 0
    home_city: str = ""
    home_governorate: str = ""
    home_latitude: Optional[float] = None
    home_longitude: Optional[float] = None


class StudentProfileOut(StudentProfileIn):
    id: int
    user_id: int


# -------- University --------

class UniversityOut(BaseModel):
    id: int
    slug: str
    name_en: str
    name_ar: str
    type: str
    city: str
    governorate: str
    latitude: float
    longitude: float
    website: Optional[str] = None


# -------- Company --------

class CompanyOut(BaseModel):
    id: int
    slug: str
    name_en: str
    name_ar: str
    description_en: str
    description_ar: str
    fields: str
    training_fields: str
    city: str
    governorate: str
    address: str
    latitude: float
    longitude: float
    website: Optional[str] = None
    logo_url: Optional[str] = None
    size: str
    is_strategic_partner: bool
    is_approved: bool


class CompanyIn(BaseModel):
    name_en: str
    name_ar: str
    description_en: str = ""
    description_ar: str = ""
    fields: str = ""
    training_fields: str = ""
    city: str
    governorate: str
    address: str = ""
    latitude: float
    longitude: float
    website: Optional[str] = None
    logo_url: Optional[str] = None
    size: str = "medium"


# -------- Internship --------

class InternshipIn(BaseModel):
    title_en: str
    title_ar: str
    description_en: str = ""
    description_ar: str = ""
    required_skills: str = ""
    knowledge_areas: str = ""
    required_experience: int = 0
    duration_weeks: int = 12
    is_remote: bool = False
    university_filter: Optional[str] = None
    is_open: bool = True


class InternshipOut(InternshipIn):
    id: int
    company_id: int
    created_at: datetime


class InternshipWithCompany(InternshipOut):
    company: "CompanyOut"


# -------- Application --------

class ApplicationOut(BaseModel):
    id: int
    student_user_id: int
    internship_id: int
    company_id: int
    match_score: float
    skills_score: float
    geo_score: float
    field_score: float
    experience_score: float
    status: str
    cover_letter: str = ""
    created_at: datetime


class ApplicationStatusIn(BaseModel):
    status: str = Field(pattern="^(pending|accepted|rejected|withdrawn)$")


# -------- Recommendation --------

class MatchBreakdown(BaseModel):
    skills: float
    field: float
    university: float
    geo: float
    experience: float
    partner_boost: float


class RecommendationItem(BaseModel):
    company: CompanyOut
    internship: Optional[InternshipOut] = None
    score: float
    distance_km: Optional[float] = None
    reasons: list[str]
    breakdown: MatchBreakdown


class RecommendationOut(BaseModel):
    items: list[RecommendationItem]
    student_home: Optional[dict] = None

