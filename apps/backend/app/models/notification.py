import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean, JSON
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(String(100), nullable=False, index=True)  # finding_critical, finding_high, task_assigned, handoff_received, report_ready
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    resource_type = Column(String(50), nullable=True)  # finding, task, handoff, report
    resource_id = Column(String(36), nullable=True)
    priority = Column(String(50), default="normal", index=True)  # critical, high, normal, low
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # finding_submitted, sla_breach
    severity = Column(String(50), nullable=False)  # Critical, High
    recipient_policy = Column(JSON, default=dict)  # {"roles": ["Super Admin", "PMO", "Department Admin"]}
    escalation_policy = Column(JSON, default=dict)
    enabled = Column(Boolean, default=True)


class AlertDelivery(Base):
    __tablename__ = "alert_deliveries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_rule_id = Column(String(36), ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    notification_id = Column(String(36), ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(50), default="in_app")  # in_app, websocket, email
    delivery_status = Column(String(50), default="delivered", index=True)  # pending, delivered, failed
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
