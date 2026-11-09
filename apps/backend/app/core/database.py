import os
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Base declarative class
Base = declarative_base()

# Database Connection URLs
sync_db_url = settings.get_database_url()
async_db_url = settings.get_async_database_url()

# If using PostgreSQL with psycopg2, ensure driver prefix is postgresql+psycopg2
if sync_db_url.startswith("postgresql://"):
    sync_db_url = sync_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Standalone or local mode: use pre-seeded SQLite database if not running against external Postgres host
if "sqlite" in sync_db_url or settings.POSTGRES_SERVER in ("localhost", "127.0.0.1") or not os.environ.get("POSTGRES_SERVER"):
    sync_db_url = "sqlite:///./enterpriseops.db"

if "sqlite" in sync_db_url:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    sync_db_url,
    echo=False,
    future=True,
    pool_pre_ping=True if "sqlite" not in sync_db_url else False,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# Async Engine for FastAPI Request Handlers
async_engine = None
AsyncSessionLocal = None

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    import asyncpg
    if "postgresql" in async_db_url:
        async_engine = create_async_engine(
            async_db_url,
            echo=False,
            future=True,
            pool_pre_ping=True
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=async_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
except Exception:
    pass


def get_db():
    """Sync session dependency for standard routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator:
    """Async session dependency"""
    if AsyncSessionLocal:
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    else:
        # Fallback to sync wrapper
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
