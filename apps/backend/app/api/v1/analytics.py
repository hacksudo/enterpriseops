import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.organization import Department
from app.models.auth import User
from app.models.project import Project
from app.models.task import Task, TaskAssignment
from app.models.vapt import Finding
from app.models.worklog import WorkdayCheckin
from app.models.notification import Notification
from app.schemas.analytics import ExecutiveDashboardStats, DepartmentPerformanceStats, EmployeeDashboardStats, PMODashboardStats

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/executive", response_model=ExecutiveDashboardStats)
def get_executive_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.datetime.now(datetime.timezone.utc)
    today_start = datetime.datetime(now.year, now.month, now.day, tzinfo=datetime.timezone.utc)
    week_start = today_start - datetime.timedelta(days=7)
    month_start = today_start - datetime.timedelta(days=30)

    total_departments = db.query(Department).filter(Department.status == "active").count()
    total_employees = db.query(User).filter(User.account_status == "active").count()
    active_users = db.query(WorkdayCheckin).filter(
        WorkdayCheckin.work_date == today_start.date(),
        WorkdayCheckin.status == "active"
    ).distinct(WorkdayCheckin.user_id).count()

    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_tasks = db.query(Task).filter(Task.deleted_at == None).count()
    completed_tasks = db.query(Task).filter(Task.status.in_(["Completed", "Approved"])).count()
    overdue_tasks = db.query(Task).filter(
        Task.due_at < now,
        ~Task.status.in_(["Completed", "Approved", "Cancelled"])
    ).count()

    # Vulnerability calculations
    total_findings = db.query(Finding).count()
    crit_count = db.query(Finding).filter(Finding.severity == "Critical").count()
    high_count = db.query(Finding).filter(Finding.severity == "High").count()
    med_count = db.query(Finding).filter(Finding.severity == "Medium").count()
    low_count = db.query(Finding).filter(Finding.severity == "Low").count()
    info_count = db.query(Finding).filter(Finding.severity == "Informational").count()

    open_findings = db.query(Finding).filter(~Finding.status.in_(["Closed", "Resolved", "False Positive"])).count()
    closed_findings = db.query(Finding).filter(Finding.status.in_(["Closed", "Resolved"])).count()

    today_findings = db.query(Finding).filter(Finding.discovered_at >= today_start).count()
    week_findings = db.query(Finding).filter(Finding.discovered_at >= week_start).count()
    month_findings = db.query(Finding).filter(Finding.discovered_at >= month_start).count()

    # Department distribution
    depts = db.query(Department).all()
    findings_by_dept = {}
    for d in depts:
        count = db.query(Finding).filter(Finding.department_id == d.id).count()
        findings_by_dept[d.name] = count

    return ExecutiveDashboardStats(
        total_departments=total_departments,
        total_employees=total_employees,
        active_users=active_users,
        active_projects=active_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        total_findings=total_findings,
        critical_findings=crit_count,
        high_findings=high_count,
        medium_findings=med_count,
        low_findings=low_count,
        informational_findings=info_count,
        open_findings=open_findings,
        closed_findings=closed_findings,
        findings_by_severity={
            "Critical": crit_count,
            "High": high_count,
            "Medium": med_count,
            "Low": low_count,
            "Informational": info_count
        },
        findings_by_department=findings_by_dept,
        findings_discovered_today=today_findings,
        findings_discovered_this_week=week_findings,
        findings_discovered_this_month=month_findings
    )


@router.get("/employee", response_model=EmployeeDashboardStats)
def get_employee_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    checkin = db.query(WorkdayCheckin).filter(
        WorkdayCheckin.user_id == current_user.id,
        WorkdayCheckin.work_date == today,
        WorkdayCheckin.status == "active"
    ).first()

    assigned_count = db.query(TaskAssignment).filter(TaskAssignment.assigned_user_id == current_user.id).count()
    in_prog_count = db.query(Task).join(TaskAssignment).filter(
        TaskAssignment.assigned_user_id == current_user.id,
        Task.status == "In Progress"
    ).count()
    comp_count = db.query(Task).join(TaskAssignment).filter(
        TaskAssignment.assigned_user_id == current_user.id,
        Task.status.in_(["Completed", "Approved"])
    ).count()

    pers_findings = db.query(Finding).filter(Finding.discovered_by == current_user.id).count()
    unread_notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.read_at == None
    ).count()

    elapsed = 0
    if checkin:
        now = datetime.datetime.now(datetime.timezone.utc)
        elapsed = max(0, int((now - checkin.checked_in_at.replace(tzinfo=datetime.timezone.utc)).total_seconds() / 60))

    return EmployeeDashboardStats(
        checked_in=checkin is not None,
        today_work_time_minutes=elapsed,
        assigned_tasks_count=assigned_count,
        in_progress_tasks_count=in_prog_count,
        completed_tasks_count=comp_count,
        personal_findings_count=pers_findings,
        unread_notifications_count=unread_notifs
    )


@router.get("/pmo", response_model=PMODashboardStats)
def get_pmo_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    active_projects = db.query(Project).filter(Project.status == "active").count()
    active_tasks = db.query(Task).filter(Task.status.in_(["Planned", "In Progress", "In Review"])).count()
    completed_tasks = db.query(Task).filter(Task.status.in_(["Completed", "Approved"])).count()
    blocked_tasks = db.query(Task).filter(Task.status == "Blocked").count()
    
    crit_alerts = db.query(Finding).filter(Finding.severity == "Critical", ~Finding.status.in_(["Closed", "Resolved"])).count()
    high_alerts = db.query(Finding).filter(Finding.severity == "High", ~Finding.status.in_(["Closed", "Resolved"])).count()
    rem_pending = db.query(Finding).filter(Finding.status.in_(["Submitted", "Under Review", "Remediation Assigned", "In Progress"])).count()

    return PMODashboardStats(
        active_projects=active_projects,
        active_tasks=active_tasks,
        completed_tasks=completed_tasks,
        blocked_tasks=blocked_tasks,
        critical_alerts=crit_alerts,
        high_alerts=high_alerts,
        remediation_pending=rem_pending
    )
