"""Hybrid AI matcher for student <-> company training fit.

Scoring weights (sum = 100):
    skills        40
    field         20
    geo           20
    university    10
    experience    10

Returns ranked list of (company, score, breakdown, reasons).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


WEIGHTS = {
    "skills": 40.0,
    "field": 20.0,
    "geo": 20.0,
    "university": 10.0,
    "experience": 10.0,
}



@dataclass
class CompanyVec:
    id: int
    slug: str
    name: str
    fields: str
    training_fields: str
    city: str
    governorate: str
    latitude: float
    longitude: float
    is_strategic_partner: bool


@dataclass
class StudentVec:
    skills: str
    knowledge_areas: str
    major: str
    experience_years: int
    home_lat: float | None
    home_lng: float | None
    home_governorate: str
    university_governorate: str | None
    university_id: int | None


def _tokenize(text: str) -> str:
    return " ".join(p.strip() for p in text.replace(",", " ").split() if p.strip())


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _geo_score(distance_km: float) -> float:
    # Decay: 0 km -> 1.0, 25 km -> ~0.78, 100 km -> ~0.37, 200 km -> ~0.14
    return float(math.exp(-distance_km / 80.0))


def _experience_score(student_years: int, required_years: int = 0) -> float:
    if required_years <= 0:
        return 1.0
    if student_years >= required_years:
        return 1.0
    return max(0.0, student_years / required_years)


def _tfidf_similarity(source: str, targets: list[str]) -> np.ndarray:
    source = _tokenize(source)
    targets = [_tokenize(t) for t in targets]
    if not source or not targets:
        return np.zeros(len(targets))
    try:
        vec = TfidfVectorizer(stop_words=None, lowercase=True, ngram_range=(1, 2))
        m = vec.fit_transform([source] + targets)
        sim = cosine_similarity(m[0:1], m[1:]).flatten()
        return np.clip(sim, 0.0, 1.0)
    except ValueError:
        return np.zeros(len(targets))


def _field_for_major(major: str) -> list[str]:
    """Crude mapping of major to relevant company fields."""
    m = major.lower()
    table: list[tuple[tuple[str, ...], list[str]]] = [
        (("computer", "software", "informat", "cs"), ["IT", "Software", "AI", "Data"]),
        (("data", "ai", "machine"), ["AI", "Data", "IT"]),
        (("cyber", "security"), ["Cybersecurity", "IT"]),
        (("electric", "communic", "telecom"), ["Telecom", "Engineering", "IT"]),
        (("mechan", "civil", "indust", "architect"), ["Engineering", "Industrial"]),
        (("pharma", "medic", "nurs", "health"), ["Pharma", "Healthcare"]),
        (("finance", "account", "business", "econ", "market"), ["Banking", "Business", "Fintech"]),
        (("law",), ["Legal"]),
        (("design", "media", "art"), ["Media", "Design"]),
        (("educat", "teach"), ["Education"]),
    ]
    for keys, fields in table:
        if any(k in m for k in keys):
            return fields
    return []


def _university_score(
    student_uni_gov: str | None, company_governorate: str
) -> float:
    if not student_uni_gov:
        return 0.5
    return 1.0 if student_uni_gov.strip().lower() == company_governorate.strip().lower() else 0.4


def rank(student: StudentVec, companies: Iterable[CompanyVec]) -> list[dict]:
    companies = list(companies)
    if not companies:
        return []

    # --- Skills (TF-IDF) ---
    skill_source = f"{student.skills} {student.knowledge_areas}"
    skill_targets = [f"{c.training_fields} {c.fields}" for c in companies]
    skills_sim = _tfidf_similarity(skill_source, skill_targets)

    # --- Field fit ---
    desired_fields = [f.lower() for f in _field_for_major(student.major)]
    field_scores = np.array(
        [
            1.0
            if not desired_fields
            else (
                1.0
                if any(df in (c.fields + " " + c.training_fields).lower() for df in desired_fields)
                else 0.3
            )
            for c in companies
        ]
    )

    # --- Geo ---
    if student.home_lat is not None and student.home_lng is not None:
        distances = np.array(
            [
                _haversine_km(student.home_lat, student.home_lng, c.latitude, c.longitude)
                for c in companies
            ]
        )
        geo_scores = np.array([_geo_score(d) for d in distances])
    else:
        distances = np.array([float("nan")] * len(companies))
        geo_scores = np.full(len(companies), 0.5)

    # --- University compat ---
    uni_scores = np.array(
        [
            _university_score(student.university_governorate, c.governorate)
            for c in companies
        ]
    )

    # --- Experience (no internship-specific requirement at company level => 1) ---
    exp_scores = np.full(len(companies), 1.0)

    final = (
        skills_sim * WEIGHTS["skills"]
        + field_scores * WEIGHTS["field"]
        + geo_scores * WEIGHTS["geo"]
        + uni_scores * WEIGHTS["university"]
        + exp_scores * WEIGHTS["experience"]
    )

    out: list[dict] = []
    for i, c in enumerate(companies):
        reasons: list[str] = []
        if skills_sim[i] >= 0.35:
            reasons.append("Strong skills overlap")
        elif skills_sim[i] >= 0.15:
            reasons.append("Some skills overlap")
        if not math.isnan(distances[i]):
            reasons.append(f"{distances[i]:.0f} km from your home")
        if field_scores[i] >= 0.9:
            reasons.append("Matches your field of study")
        if uni_scores[i] >= 0.9:
            reasons.append("Same governorate as your university")

        out.append(
            {
                "company_id": c.id,
                "score": round(float(final[i]), 2),
                "distance_km": None if math.isnan(distances[i]) else round(float(distances[i]), 2),
                "reasons": reasons,
                "breakdown": {
                    "skills": round(float(skills_sim[i] * WEIGHTS["skills"]), 2),
                    "field": round(float(field_scores[i] * WEIGHTS["field"]), 2),
                    "university": round(float(uni_scores[i] * WEIGHTS["university"]), 2),
                    "geo": round(float(geo_scores[i] * WEIGHTS["geo"]), 2),
                    "experience": round(float(exp_scores[i] * WEIGHTS["experience"]), 2),
                    "partner_boost": 0.0,
                },
            }
        )

    out.sort(key=lambda x: x["score"], reverse=True)
    return out
