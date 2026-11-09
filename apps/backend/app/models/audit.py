import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from app.core.database import Base
from app.models.base import generate_uuid


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # user_login, finding_created, handoff_approved, etc.
    resource_type = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(36), nullable=True, index=True)
    scope = Column(String(100), default="global", index=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    event_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
