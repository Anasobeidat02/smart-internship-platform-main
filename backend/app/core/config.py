from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Smart Internship Platform"
    env: str = "dev"
    database_url: str = "sqlite+aiosqlite:///./smart.db"

    # JWT_SECRET must be provided via environment variable — no hardcoded fallback.
    jwt_secret: str
    jwt_algo: str = "HS256"
    access_token_ttl_minutes: int = 60
    refresh_token_ttl_days: int = 14

    cors_origins: str = "http://localhost:3000"

    # Email / SMTP (optional — leave SMTP_HOST blank to use dry-run log mode)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_tls: bool = True

    # Auth hardening
    login_rate_limit: str = "10/minute"
    register_rate_limit: str = "5/minute"
    max_failed_logins: int = 10
    lockout_minutes: int = 15

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.env.lower() in ("prod", "production")

    def validate_for_runtime(self) -> list[str]:
        """Return a list of fatal config errors (empty if config is healthy)."""
        errors: list[str] = []
        if len(self.jwt_secret) < 32:
            errors.append(
                "JWT_SECRET must be set to a strong value (>=32 chars). "
                "Set the JWT_SECRET environment variable."
            )
        if self.is_production:
            if not self.cors_list or "*" in self.cors_list:
                errors.append("CORS_ORIGINS must be explicitly set (no wildcard) in production.")
            if self.database_url.startswith("sqlite"):
                errors.append("DATABASE_URL must point to a managed DB (e.g. Postgres) in production.")
        return errors


@lru_cache
def get_settings() -> Settings:
    return Settings()

