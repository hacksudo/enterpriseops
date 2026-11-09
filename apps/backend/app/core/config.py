import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "EnterpriseOps"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"
    APP_SECRET_KEY: str = "e839174f85ad1b4a390c6841e0bca2d89201948194b39c01a284c1938d9284ba"
    DOMAIN: str = "localhost"

    # Bootstrap Super Admin credentials
    BOOTSTRAP_ADMIN_EMAIL: str = "superadmin@enterpriseops.internal"
    BOOTSTRAP_ADMIN_PASSWORD: str = "AdminP@ssw0rd2026!Secure"
    BOOTSTRAP_ADMIN_NAME: str = "Executive Super Admin"

    # PostgreSQL Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "enterpriseops_user"
    POSTGRES_PASSWORD: str = "secure_postgres_password_2026"
    POSTGRES_DB: str = "enterpriseops"
    DATABASE_URL: str | None = None
    ASYNC_DATABASE_URL: str | None = None

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None

    # MinIO S3 Private Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "enterpriseops_minio_access"
    MINIO_SECRET_KEY: str = "enterpriseops_minio_secret_key_2026"
    MINIO_BUCKET_NAME: str = "enterpriseops-evidence"
    MINIO_SECURE: bool = False

    # Security & Tokens
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    ALGORITHM: str = "HS256"
    COOKIE_SECURE: bool = False
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://localhost",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item) for item in parsed]
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item) for item in v]
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://localhost",
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_async_database_url(self) -> str:
        if self.ASYNC_DATABASE_URL:
            return self.ASYNC_DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
