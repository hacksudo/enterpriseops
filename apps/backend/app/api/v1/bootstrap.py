import uuid
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.audit import log_audit_event
from app.models.organization import Organization
from app.models.auth import User, Role, Permission, RoleAssignment, Membership, role_permissions
from app.core.dependencies import get_current_user
from app.models.vapt import Finding, FindingEvent, FindingRetest, Asset, Engagement
from app.models.project import Project, ProjectMember
from app.models.task import Task, TaskEvent, TaskAssignment, TaskComment, TaskDependency, TaskOccurrence
from app.models.worklog import WorkdayCheckin, TimeEntry, DailyWorkReport
from app.models.collaboration import HandoffRequest, Approval
from app.models.notification import Notification, AlertDelivery
from app.models.chat import Message, Channel
from app.models.report import Report, ReportShare

router = APIRouter(prefix="/bootstrap", tags=["bootstrap"])

STANDARD_RESOURCES = [
    "organizations", "departments", "teams", "workspaces", "users", "roles",
    "projects", "tasks", "workday_checkins", "daily_reports", "time_entries",
    "engagements", "findings", "files", "reports", "channels", "messages",
    "handoffs", "approvals", "notifications", "audit_logs"
]

STANDARD_ACTIONS = ["create", "read", "update", "delete", "assign", "approve", "share", "export"]


def run_system_bootstrap(db: Session, admin_email: str, admin_password: str, admin_name: str) -> dict:
    """Core idempotent bootstrap logic used by both API and CLI."""
    # 1. Create or ensure permissions
    all_perm_objs = []
    for res in STANDARD_RESOURCES:
        for act in STANDARD_ACTIONS:
            perm = db.query(Permission).filter(Permission.resource == res, Permission.action == act).first()
            if not perm:
                perm = Permission(
                    id=str(uuid.uuid4()),
                    resource=res,
                    action=act,
                    description=f"Allows {act} operation on {res}"
                )
                db.add(perm)
                db.flush()
            all_perm_objs.append(perm)

    # 2. Create or ensure System Roles
    roles_def = [
        ("Super Admin", "Full enterprise-wide administrative control", "global"),
        ("Department Admin", "Departmental administrative and operational control", "department"),
        ("PMO", "Project, task, milestone, and remediation management", "workspace"),
        ("Team Lead", "Team workload and task coordination", "team"),
        ("Employee", "Standard employee workspace and task execution", "workspace"),
        ("Auditor", "Read-only access across authorized compliance resources", "global")
    ]

    created_roles = {}
    for r_name, r_desc, r_scope in roles_def:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(
                id=str(uuid.uuid4()),
                name=r_name,
                description=r_desc,
                role_scope=r_scope,
                is_system_role=True
            )
            db.add(role)
            db.flush()
        created_roles[r_name] = role

    # Assign all permissions to Super Admin
    super_admin_role = created_roles["Super Admin"]
    super_admin_role.permissions = all_perm_objs

    # 3. Create or ensure Root Organization
    org = db.query(Organization).first()
    if not org:
        org = Organization(
            id=str(uuid.uuid4()),
            name="EnterpriseOps Global IT & Security",
            slug="enterpriseops-global",
            settings={"brand_name": "EnterpriseOps", "theme": "liquid-glass"},
            status="active"
        )
        db.add(org)
        db.flush()

    # 4. Create or ensure Super Admin user
    super_user = db.query(User).filter(User.email == admin_email.lower()).first()
    if not super_user:
        super_user = User(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            employee_code="EMP-001",
            full_name=admin_name,
            email=admin_email.lower(),
            password_hash=get_password_hash(admin_password),
            designation="Chief Executive Officer / Super Admin",
            account_status="active",
            mfa_enabled=False
        )
        db.add(super_user)
        db.flush()

        # Assign Super Admin Role
        assignment = RoleAssignment(
            id=str(uuid.uuid4()),
            user_id=super_user.id,
            role_id=super_admin_role.id,
            scope_type="global",
            scope_id=org.id,
            assigned_by="system_bootstrap"
        )
        db.add(assignment)

    db.commit()

    log_audit_event(
        db,
        action="system_bootstrap_executed",
        resource_type="organization",
        resource_id=org.id,
        actor_id=super_user.id if super_user else None,
        organization_id=org.id
    )

    return {
        "status": "success",
        "message": "EnterpriseOps bootstrapped successfully",
        "organization_id": org.id,
        "super_admin_email": admin_email
    }


@router.post("/init")
def bootstrap_endpoint(db: Session = Depends(get_db)):
    """First-run initialization endpoint to set up root organization and admin."""
    return run_system_bootstrap(
        db,
        admin_email=settings.BOOTSTRAP_ADMIN_EMAIL,
        admin_password=settings.BOOTSTRAP_ADMIN_PASSWORD,
        admin_name=settings.BOOTSTRAP_ADMIN_NAME
    )


@router.get("/status")
def check_bootstrap_status(db: Session = Depends(get_db)):
    has_admin = db.query(User).first() is not None
    return {"bootstrapped": has_admin}


class ClearDemoDataRequest(BaseModel):
    wipe_demo_users: Optional[bool] = False


@router.post("/clear-demo-data")
def clear_demo_data(
    payload: Optional[ClearDemoDataRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clears all demo data (findings, tasks, projects, worklogs, handoffs, notifications, messages, reports)
    so the organization can launch completely fresh with zero demo entries.
    Preserves core organizations, departments, roles, and administrative user accounts.
    Optionally deletes default demo user accounts (pmo, tester, dev) if wipe_demo_users=True.
    """
    try:
        wipe_users = payload.wipe_demo_users if payload else False

        # 0. Clear AlertDeliveries & Notifications
        db.query(AlertDelivery).delete(synchronize_session=False)
        db.query(Notification).delete(synchronize_session=False)

        # 1. Clear VAPT Findings, Retests, Events, Assets, Engagements
        db.query(FindingRetest).delete(synchronize_session=False)
        db.query(FindingEvent).delete(synchronize_session=False)
        findings_count = db.query(Finding).count()
        db.query(Finding).delete(synchronize_session=False)
        db.query(Asset).delete(synchronize_session=False)
        db.query(Engagement).delete(synchronize_session=False)

        # 2. Clear Tasks, Dependencies, Occurrences, Comments, Assignments, Events
        db.query(TaskDependency).delete(synchronize_session=False)
        db.query(TaskOccurrence).delete(synchronize_session=False)
        db.query(TaskComment).delete(synchronize_session=False)
        db.query(TaskAssignment).delete(synchronize_session=False)
        db.query(TaskEvent).delete(synchronize_session=False)
        tasks_count = db.query(Task).count()
        db.query(Task).delete(synchronize_session=False)

        # 3. Clear Projects & Project Members
        db.query(ProjectMember).delete(synchronize_session=False)
        db.query(Project).delete(synchronize_session=False)

        # 4. Clear Worklogs & Check-ins
        db.query(TimeEntry).delete(synchronize_session=False)
        db.query(DailyWorkReport).delete(synchronize_session=False)
        db.query(WorkdayCheckin).delete(synchronize_session=False)

        # 5. Clear Handoffs & Approvals
        db.query(Approval).delete(synchronize_session=False)
        db.query(HandoffRequest).delete(synchronize_session=False)

        # 6. Clear Notifications, Messages & Reports
        db.query(Message).delete(synchronize_session=False)
        db.query(ReportShare).delete(synchronize_session=False)
        db.query(Report).delete(synchronize_session=False)

        # 7. Optionally wipe demo users (Sarah Jenkins, Vishal Waghmare, Alex Rivera)
        demo_users_deleted = 0
        if wipe_users:
            demo_emails = [
                "pmo@enterpriseops.internal",
                "tester@enterpriseops.internal",
                "dev@enterpriseops.internal"
            ]
            demo_users = db.query(User).filter(User.email.in_(demo_emails)).all()
            for u in demo_users:
                if u.id != current_user.id:
                    db.query(RoleAssignment).filter(RoleAssignment.user_id == u.id).delete(synchronize_session=False)
                    db.query(Membership).filter(Membership.user_id == u.id).delete(synchronize_session=False)
                    db.delete(u)
                    demo_users_deleted += 1

        db.commit()

        log_audit_event(
            db,
            action="demo_data_cleared",
            resource_type="system",
            resource_id="root",
            actor_id=current_user.id,
            organization_id=current_user.organization_id,
            event_metadata={
                "deleted_findings": findings_count,
                "deleted_tasks": tasks_count,
                "deleted_demo_users": demo_users_deleted
            }
        )

        user_msg = f" (and {demo_users_deleted} demo staff accounts)" if demo_users_deleted > 0 else ""
        return {
            "status": "success",
            "message": f"All demo entries (vulnerabilities: {findings_count}, tasks: {tasks_count}{user_msg}) have been permanently wiped. System is 100% fresh and clean for client handover!",
            "deleted_findings": findings_count,
            "deleted_tasks": tasks_count,
            "deleted_demo_users": demo_users_deleted
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear demo data: {str(e)}")

