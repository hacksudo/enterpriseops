import datetime
import uuid
from sqlalchemy import Column, DateTime, String
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False
    )
