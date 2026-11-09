import datetime
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, Date
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class WorkdayCheckin(Base):
    __tablename__ = "workday_checkins"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    work_date = Column(Date, default=lambda: datetime.datetime.now(datetime.timezone.utc).date(), index=True)
    checked_in_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    checked_out_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="active", index=True)  # active, paused, completed


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    started_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    notes = Column(Text, nullable=True)


class DailyWorkReport(Base, TimestampMixin):
    __tablename__ = "daily_work_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    work_date = Column(Date, default=lambda: datetime.datetime.now(datetime.timezone.utc).date(), index=True)
    summary = Column(Text, nullable=False)
    blockers = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)
    submission_status = Column(String(50), default="submitted", index=True)  # submitted, approved, rejected
    submitted_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    approved_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
