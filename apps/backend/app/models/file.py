import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class FileRecord(Base, TimestampMixin):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(512), nullable=False, unique=True, index=True)
    mime_type = Column(String(128), nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    scan_status = Column(String(50), default="clean", index=True)  # pending, clean, quarantined, rejected
    classification = Column(String(50), default="confidential")  # public, internal, confidential, restricted

    # Relationships
    links = relationship("FileLink", back_populates="file", cascade="all, delete-orphan")


class FileLink(Base):
    __tablename__ = "file_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)  # task, finding, daily_report, report
    resource_id = Column(String(36), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    file = relationship("FileRecord", back_populates="links")
