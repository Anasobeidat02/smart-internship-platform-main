# Smart Internship Platform

Enterprise platform that matches Jordanian university students with the best internship/training companies based on **skills, university, home location, and field of study** - powered by a hybrid AI matcher and an interactive 3D Jordan map.

> Strategic partner: **TWG Academy** - Irbid, Al-Yousfi Circle, Al-Jamal Center, 4th floor.

## Stack

- **Backend:** FastAPI (async, clean architecture) · SQLModel · SQLite · Alembic · JWT
- **AI/ML:** scikit-learn TF-IDF · Haversine geo scoring · rule-based domain fit
- **Frontend:** Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui
- **Map:** MapLibre GL JS (real Jordan map, 3D pitch + extruded pins)
- **Animations:** Framer Motion · GSAP · react-three-fiber (hero scenes)
- **Charts:** Recharts
- **State:** TanStack Query · Zustand
- **i18n:** EN/AR with full RTL

## Monorepo layout

```
backend/   # FastAPI service + seed data + AI matcher
frontend/  # Next.js 15 app
docs/      # architecture & data sources
```

## Quick start

### Backend

```powershell
cd backend
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -e .
python -m app.infra.seed.seeder   # seed unis, companies, TWG
uvicorn app.main:app --reload      # http://localhost:8000  (docs at /docs)
```

### Frontend

```powershell
cd frontend
pnpm install
pnpm dev       # http://localhost:3000
```

## Default accounts (after seeding)

| Role    | Email                       | Password   |
| ------- | --------------------------- | ---------- |
| Admin   | admin@smartintern.jo        | admin123!  |
| Company | hr@twg-academy.jo           | twg12345!  |
| Student | demo.student@smartintern.jo | demo123!   |
