import datetime
from sqlalchemy import Column, String, Text, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Engagement(Base, TimestampMixin):
    __tablename__ = "engagements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    assessment_type = Column(String(100), default="Android Penetration Testing")
    scope = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="active", index=True)  # active, completed, archived

    # Relationships
    assets = relationship("Asset", back_populates="engagement", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="engagement", cascade="all, delete-orphan")


class Asset(Base, TimestampMixin):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_name = Column(String(255), nullable=False)
    asset_type = Column(String(100), default="Mobile Application")  # Mobile App, Web App, API, Network Host
    asset_identifier = Column(String(255), nullable=True)  # e.g., com.enterpriseops.app or api.company.com
    environment = Column(String(50), default="Production")  # Production, Staging, QA
    scope_status = Column(String(50), default="in_scope")

    # Relationships
    engagement = relationship("Engagement", back_populates="assets")
    findings = relationship("Finding", back_populates="asset", cascade="all, delete-orphan")


class Finding(Base, TimestampMixin):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=True, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    
    finding_number = Column(String(32), unique=True, nullable=False, index=True)  # e.g. "VAPT-2026-001"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    observation = Column(Text, nullable=False)
    reproduction_steps = Column(Text, nullable=True)
    impact = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    cwe_id = Column(String(50), nullable=True)
    cve_id = Column(String(50), nullable=True)
    owasp_mapping = Column(String(100), nullable=True)
    
    cvss_version = Column(String(10), default="4.0")  # "4.0" or "3.1"
    cvss_vector = Column(String(255), nullable=True)
    cvss_score = Column(Float, default=0.0, index=True)
    severity = Column(String(50), default="Informational", index=True)  # Critical, High, Medium, Low, Informational
    status = Column(String(50), default="Draft", index=True)  # Draft, Submitted, Under Review, Confirmed, Remediation Assigned, In Progress, Ready for Retest, Retesting, Resolved, Closed, Reopened
    
    discovered_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    discovered_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
    retest_due_at = Column(DateTime, nullable=True)

    # Relationships
    engagement = relationship("Engagement", back_populates="findings")
    asset = relationship("Asset", back_populates="findings")
    events = relationship("FindingEvent", back_populates="finding", cascade="all, delete-orphan")
    retests = relationship("FindingRetest", back_populates="finding", cascade="all, delete-orphan")


class FindingEvent(Base):
    __tablename__ = "finding_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    event_type = Column(String(100), nullable=False)  # created, submitted, severity_changed, status_changed
    previous_values = Column(JSON, default=dict)
    new_values = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    finding = relationship("Finding", back_populates="events")


class FindingRetest(Base):
    __tablename__ = "finding_retests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    tested_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    test_date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    result = Column(String(50), nullable=False)  # passed (fixed), failed (still vulnerable)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    finding = relationship("Finding", back_populates="retests")
