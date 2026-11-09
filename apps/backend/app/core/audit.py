import datetime
import uuid
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    scope: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    event_metadata: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """Creates an immutable audit record in the database."""
    entry = AuditLog(
        id=str(uuid.uuid4()),
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        actor_id=str(actor_id) if actor_id else None,
        organization_id=str(organization_id) if organization_id else None,
        scope=scope or "global",
        ip_address=ip_address,
        user_agent=user_agent,
        event_metadata=event_metadata or {},
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(entry)
    db.commit()
    return entry
