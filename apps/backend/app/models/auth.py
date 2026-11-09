import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

# Association table for Role <-> Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    employee_code = Column(String(64), unique=True, nullable=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    designation = Column(String(128), default="Employee")
    avatar_key = Column(String(512), nullable=True)
    timezone = Column(String(64), default="UTC")
    account_status = Column(String(50), default="active", index=True)  # active, suspended, invited
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    role_assignments = relationship("RoleAssignment", back_populates="user", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    role_scope = Column(String(50), default="organization")  # global, organization, department, workspace
    is_system_role = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    assignments = relationship("RoleAssignment", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource = Column(String(100), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class RoleAssignment(Base):
    __tablename__ = "role_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    scope_type = Column(String(50), default="organization")  # global, organization, department, workspace
    scope_id = Column(String(36), nullable=True, index=True)
    assigned_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    user = relationship("User", back_populates="role_assignments")
    role = relationship("Role", back_populates="assignments")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=True, index=True)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)
    membership_type = Column(String(50), default="member")  # admin, pmo, lead, member
    status = Column(String(50), default="active", index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    user = relationship("User", back_populates="memberships")


class SessionRecord(Base):
    __tablename__ = "session_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
