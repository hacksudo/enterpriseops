import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.worklog import WorkdayCheckin, TimeEntry, DailyWorkReport
from app.models.task import Task
from app.models.auth import User, Membership
from app.schemas.worklog import CheckinRequest, CheckinResponse, DailyReportCreate, DailyReportResponse, TimeEntryCreate, TimeEntryResponse

router = APIRouter(prefix="/worklogs", tags=["worklogs"])


@router.get("/status")
def get_work_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    checkin = db.query(WorkdayCheckin).filter(
        WorkdayCheckin.user_id == current_user.id,
        WorkdayCheckin.work_date == today
    ).order_by(WorkdayCheckin.checked_in_at.desc()).first()

    is_checked_in = checkin is not None and checkin.status == "active"
    checkin_time = checkin.checked_in_at.isoformat() if checkin else None
    
    # Calculate elapsed minutes today
    elapsed_minutes = 0
    if is_checked_in and checkin:
        now = datetime.datetime.now(datetime.timezone.utc)
        elapsed_minutes = max(0, int((now - checkin.checked_in_at.replace(tzinfo=datetime.timezone.utc)).total_seconds() / 60))

    return {
        "checked_in": is_checked_in,
        "checked_in_at": checkin_time,
        "elapsed_minutes": elapsed_minutes,
        "checkin_id": checkin.id if checkin else None
    }


@router.post("/checkin", response_model=CheckinResponse)
def checkin_workday(
    data: CheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    
    # Lookup primary department from membership or default
    membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()
    dept_id = membership.department_id if membership and membership.department_id else current_user.organization_id
    
    # Create or update active checkin
    checkin = WorkdayCheckin(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        organization_id=current_user.organization_id or "default-org",
        department_id=dept_id or "default-dept",
        work_date=today,
        checked_in_at=datetime.datetime.now(datetime.timezone.utc),
        status="active"
    )
    db.add(checkin)

    # If task selected, set task status to 'In Progress'
    if data.task_id:
        task = db.query(Task).filter(Task.id == data.task_id).first()
        if task:
            task.status = "In Progress"
            if not task.started_at:
                task.started_at = datetime.datetime.now(datetime.timezone.utc)

    db.commit()
    db.refresh(checkin)

    log_audit_event(
        db,
        action="workday_checkin",
        resource_type="workday_checkin",
        resource_id=checkin.id,
        actor_id=current_user.id,
        organization_id=current_user.organization_id
    )

    return checkin


@router.post("/checkout")
def checkout_workday(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    checkin = db.query(WorkdayCheckin).filter(
        WorkdayCheckin.user_id == current_user.id,
        WorkdayCheckin.work_date == today,
        WorkdayCheckin.status == "active"
    ).order_by(WorkdayCheckin.checked_in_at.desc()).first()

    if not checkin:
        raise HTTPException(status_code=400, detail="No active check-in found for today")

    checkin.checked_out_at = datetime.datetime.now(datetime.timezone.utc)
    checkin.status = "completed"
    db.commit()

    log_audit_event(
        db,
        action="workday_checkout",
        resource_type="workday_checkin",
        resource_id=checkin.id,
        actor_id=current_user.id
    )

    return {"message": "Successfully ended work for today"}


@router.post("/daily-reports", response_model=DailyReportResponse)
def submit_daily_report(
    data: DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    report = DailyWorkReport(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        department_id=data.department_id,
        work_date=today,
        summary=data.summary,
        blockers=data.blockers,
        next_steps=data.next_steps,
        submission_status="submitted",
        submitted_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_audit_event(
        db,
        action="daily_report_submitted",
        resource_type="daily_work_report",
        resource_id=report.id,
        actor_id=current_user.id
    )

    return report


@router.get("/daily-reports", response_model=List[DailyReportResponse])
def list_daily_reports(
    department_id: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DailyWorkReport)
    if department_id:
        query = query.filter(DailyWorkReport.department_id == department_id)
    if user_id:
        query = query.filter(DailyWorkReport.user_id == user_id)
    return query.order_by(DailyWorkReport.submitted_at.desc()).all()
