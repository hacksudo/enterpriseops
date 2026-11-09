from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    logo_url = Column(String(1024), nullable=True)
    settings = Column(JSON, default=dict)
    status = Column(String(50), default="active", index=True)

    # Relationships
    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization")


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    department_head_id = Column(String(36), nullable=True)
    status = Column(String(50), default="active", index=True)

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    teams = relationship("Team", back_populates="department", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="department", cascade="all, delete-orphan")


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    team_lead_id = Column(String(36), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="teams")


class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", index=True)
    settings = Column(JSON, default=dict)

    # Relationships
    department = relationship("Department", back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")
