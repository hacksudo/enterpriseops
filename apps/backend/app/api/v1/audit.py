from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.audit import AuditLog
from app.models.auth import User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
def list_audit_logs(
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("audit_logs", "read"))
):
    query = db.query(AuditLog)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.created_at.desc()).limit(100).all()
