import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.collaboration import HandoffRequest
from app.models.vapt import Finding
from app.models.task import Task, TaskAssignment
from app.models.notification import Notification
from app.models.auth import User
from app.schemas.collaboration import HandoffCreate, HandoffAction, HandoffResponse

router = APIRouter(prefix="/handoffs", tags=["collaboration"])


@router.get("", response_model=List[HandoffResponse])
def list_handoffs(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(HandoffRequest)
    if department_id:
        query = query.filter(
            (HandoffRequest.target_department_id == department_id) |
            (HandoffRequest.source_department_id == department_id)
        )
    return query.order_by(HandoffRequest.created_at.desc()).all()


@router.post("", response_model=HandoffResponse)
def create_handoff(
    data: HandoffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lookup originating department
    finding = db.query(Finding).filter(Finding.id == data.resource_id).first()
    source_dept_id = finding.department_id if finding else current_user.organization_id

    handoff = HandoffRequest(
        id=str(uuid.uuid4()),
        source_department_id=source_dept_id,
        target_department_id=data.target_department_id,
        source_user_id=current_user.id,
        recipient_user_id=data.recipient_user_id,
        resource_type=data.resource_type,
        resource_id=data.resource_id,
        request_status="pending",
        notes=data.notes,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(handoff)

    # Update finding status to "Remediation Assigned"
    if finding:
        finding.status = "Remediation Assigned"

    # Send Notification to target recipient
    if data.recipient_user_id:
        notif = Notification(
            id=str(uuid.uuid4()),
            organization_id=current_user.organization_id or "default-org",
            recipient_id=data.recipient_user_id,
            notification_type="handoff_received",
            title="Cross-Department Task / Finding Handoff",
            body=f"You have received a remediation handoff request from {current_user.full_name}: {finding.title if finding else 'Resource'}",
            resource_type=data.resource_type,
            resource_id=data.resource_id,
            priority="high",
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(notif)

    db.commit()
    db.refresh(handoff)

    log_audit_event(
        db,
        action="handoff_created",
        resource_type="handoff_request",
        resource_id=handoff.id,
        actor_id=current_user.id,
        event_metadata={"target_department": data.target_department_id}
    )

    return handoff


@router.patch("/{handoff_id}/respond", response_model=HandoffResponse)
def respond_to_handoff(
    handoff_id: str,
    action: HandoffAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    handoff = db.query(HandoffRequest).filter(HandoffRequest.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff request not found")

    handoff.request_status = action.status
    handoff.responded_at = datetime.datetime.now(datetime.timezone.utc)
    if action.notes:
        handoff.notes = f"{handoff.notes or ''}\nResponse: {action.notes}".strip()

    # If accepted and resource is finding, mark finding "In Progress"
    if action.status == "accepted" and handoff.resource_type == "finding":
        finding = db.query(Finding).filter(Finding.id == handoff.resource_id).first()
        if finding:
            finding.status = "In Progress"
            finding.assigned_to = current_user.id

    db.commit()
    db.refresh(handoff)

    log_audit_event(
        db,
        action=f"handoff_{action.status}",
        resource_type="handoff_request",
        resource_id=handoff.id,
        actor_id=current_user.id
    )

    return handoff
