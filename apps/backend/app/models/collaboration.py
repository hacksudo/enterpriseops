import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class HandoffRequest(Base):
    __tablename__ = "handoff_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    target_department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    source_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    resource_type = Column(String(50), nullable=False)  # finding, task, report
    resource_id = Column(String(36), nullable=False, index=True)
    request_status = Column(String(50), default="pending", index=True)  # pending, accepted, rejected, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    responded_at = Column(DateTime, nullable=True)


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource_type = Column(String(50), nullable=False, index=True)  # task, finding_closure, daily_report
    resource_id = Column(String(36), nullable=False, index=True)
    requested_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_approver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    approval_status = Column(String(50), default="pending", index=True)  # pending, approved, rejected
    decision_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    decided_at = Column(DateTime, nullable=True)
