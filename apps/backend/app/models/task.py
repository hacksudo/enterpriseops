import datetime
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    task_number = Column(String(32), unique=True, nullable=False, index=True)  # e.g., "TASK-1001"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="VAPT", index=True)  # Android PT, Web App, QA, DevOps, Dev, Bug Fixing
    priority = Column(String(50), default="medium", index=True)  # critical, high, medium, low
    status = Column(String(50), default="Planned", index=True)  # Draft, Planned, Assigned, Accepted, In Progress, Blocked, In Review, Completed, Approved, Reopened, Cancelled
    
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    planned_start_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_minutes = Column(Integer, default=0)
    actual_minutes = Column(Integer, default=0)
    recurrence_rule_id = Column(String(36), ForeignKey("recurrence_rules.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    events = relationship("TaskEvent", back_populates="task", cascade="all, delete-orphan")


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(String(36), nullable=True)
    assignment_status = Column(String(50), default="assigned", index=True)  # assigned, accepted, rejected, completed
    assigned_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    accepted_at = Column(DateTime, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="assignments")


class TaskComment(Base, TimestampMixin):
    __tablename__ = "task_comments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)

    # Relationships
    task = relationship("Task", back_populates="comments")


class TaskEvent(Base):
    __tablename__ = "task_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    event_type = Column(String(100), nullable=False)  # status_changed, priority_changed, assigned, commented
    previous_values = Column(JSON, default=dict)
    new_values = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    task = relationship("Task", back_populates="events")


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    depends_on_task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    dependency_type = Column(String(50), default="blocks")  # blocks, relates_to


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    frequency = Column(String(50), nullable=False)  # daily, weekly, monthly, quarterly, yearly
    interval = Column(Integer, default=1)
    weekdays = Column(String(50), nullable=True)  # e.g. "MO,TU,WE,TH,FR"
    timezone = Column(String(50), default="UTC")
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=True)
    occurrence_limit = Column(Integer, nullable=True)
    configuration = Column(JSON, default=dict)


class TaskOccurrence(Base):
    __tablename__ = "task_occurrences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recurrence_rule_id = Column(String(36), ForeignKey("recurrence_rules.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    scheduled_for = Column(DateTime, nullable=False, index=True)
    occurrence_status = Column(String(50), default="pending")  # pending, generated, skipped
