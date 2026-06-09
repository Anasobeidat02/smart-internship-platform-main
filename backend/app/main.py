from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import (
    admin,
    analytics,
    auth,
    companies,
    internships,
    recommendations,
    students,
    universities,
    applications,
)
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.rate_limit import limiter
from app.infra.db.session import init_db


def create_app() -> FastAPI:
    settings = get_settings()

    fatal = settings.validate_for_runtime()
    if fatal:
        raise RuntimeError(
            "Refusing to start - invalid production config:\n  - " + "\n  - ".join(fatal)
        )

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "Enterprise platform matching Jordanian university students with the best "
            "internship/training companies based on skills, university, home location and field."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # CORS - strict in production
    cors_origins = settings.cors_list
    if not cors_origins:
        if settings.is_production:
            raise RuntimeError("CORS_ORIGINS must be set in production")
        cors_origins = ["http://localhost:3000"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(students.router, prefix="/api/v1/students", tags=["students"])
    app.include_router(universities.router, prefix="/api/v1/universities", tags=["universities"])
    app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
    app.include_router(internships.router, prefix="/api/v1/internships", tags=["internships"])
    app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])
    app.include_router(
        recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"]
    )
    app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

    @app.on_event("startup")
    async def _startup() -> None:
        # 1. بناء جداول قاعدة البيانات تلقائياً عند التشغيل
        await init_db()
        
        # 2. زرع حساب الأدمن الأساسي بشكل حقيقي ودائم إذا لم يكن موجوداً
        try:
            from app.infra.db.session import SessionLocal 
            from app.infra.db.models import User
            from app.core.security import hash_password
            from sqlmodel import select

            async with SessionLocal() as session: # فتح الجلسة الحقيقية
                # التحقق من وجود مستخدم بصلاحية admin
                statement = select(User).where(User.role == "admin")
                result = await session.execute(statement)
                admin_exists = result.first()

                if not admin_exists:
                    default_admin = User(
                        email="admin@smartintern.jo",
                        password_hash=hash_password("admin123!"), # تشفير صارم وحقيقي
                        role="admin",
                        is_active=True,
                        locale="en"
                    )
                    session.add(default_admin)
                    await session.commit()
                    print("\n [Success] Default admin account securely seeded into database (admin@smartintern.jo)!\n")
        except Exception as e:
            print(f"\n⚠️ [Warning] Could not seed default admin user: {e}\n")

   
    @app.get("/", tags=["meta"])
    async def root():
        return {
            "name": settings.app_name,
            "version": "0.1.0",
            "docs": "/docs",
            "status": "ok",
        }

    @app.get("/api/v1/health", tags=["meta"])
    async def health():
        return {"status": "ok"}

    return app


app = create_app()