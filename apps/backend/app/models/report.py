import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=True, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    report_type = Column(String(100), nullable=False, index=True)  # executive_consolidated, vapt_assessment, employee_daily, department_summary
    title = Column(String(255), nullable=False)
    generated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporting_start = Column(DateTime, nullable=True)
    reporting_end = Column(DateTime, nullable=True)
    report_status = Column(String(50), default="generated", index=True)  # generating, generated, failed
    format = Column(String(10), default="HTML")  # HTML, PDF, DOCX, XLSX, CSV
    storage_key = Column(String(512), nullable=True)

    # Relationships
    shares = relationship("ReportShare", back_populates="report", cascade="all, delete-orphan")


class ReportShare(Base):
    __tablename__ = "report_shares"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    shared_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_level = Column(String(50), default="read_only")  # read_only, full
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    report = relationship("Report", back_populates="shares")
