import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.core.audit import log_audit_event
from app.models.organization import Organization, Department, Workspace, Team
from app.models.project import Project
from app.models.auth import User
from app.schemas.organization import (
    OrganizationCreate, OrganizationResponse,
    DepartmentCreate, DepartmentResponse,
    WorkspaceCreate, WorkspaceResponse,
    TeamCreate, TeamResponse
)

router = APIRouter(prefix="/org", tags=["organizations"])


# --- Organizations ---
@router.get("/organizations", response_model=List[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Organization).filter(Organization.status == "active").all()


@router.post("/organizations", response_model=OrganizationResponse)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("organizations", "create"))
):
    org = Organization(
        id=str(uuid.uuid4()),
        name=data.name,
        slug=data.slug.lower(),
        logo_url=data.logo_url,
        settings=data.settings or {},
        status="active"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    log_audit_event(db, action="org_created", resource_type="organization", resource_id=org.id, actor_id=current_user.id)
    return org


# --- Departments ---
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(
    organization_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Department).filter(Department.status == "active")
    if organization_id:
        query = query.filter(Department.organization_id == organization_id)
    return query.all()


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dept = Department(
        id=str(uuid.uuid4()),
        organization_id=data.organization_id,
        name=data.name,
        slug=data.slug.lower(),
        description=data.description,
        department_head_id=data.department_head_id,
        status="active"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    log_audit_event(
        db,
        action="department_created",
        resource_type="department",
        resource_id=dept.id,
        actor_id=current_user.id,
        organization_id=data.organization_id
    )
    return dept


# --- Workspaces ---
@router.get("/workspaces", response_model=List[WorkspaceResponse])
def list_workspaces(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Workspace).filter(Workspace.status == "active")
    if department_id:
        query = query.filter(Workspace.department_id == department_id)
    return query.all()


@router.post("/workspaces", response_model=WorkspaceResponse)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = data.organization_id or current_user.organization_id
    if not org_id:
        org = db.query(Organization).first()
        org_id = org.id if org else str(uuid.uuid4())

    dept_id = data.department_id
    if not dept_id:
        dept = db.query(Department).first()
        dept_id = dept.id if dept else str(uuid.uuid4())

    generated_slug = data.slug or data.name.lower().replace(" ", "-").replace("/", "-")
    # ensure slug uniqueness
    base_slug = generated_slug
    idx = 1
    while db.query(Workspace).filter(Workspace.slug == generated_slug).first():
        generated_slug = f"{base_slug}-{idx}"
        idx += 1

    ws = Workspace(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        department_id=dept_id,
        name=data.name.strip(),
        slug=generated_slug,
        description=data.description or f"Workspace for {data.name}",
        status="active"
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    log_audit_event(
        db,
        action="workspace_created",
        resource_type="workspace",
        resource_id=ws.id,
        actor_id=current_user.id,
        organization_id=org_id
    )
    return ws


# --- Teams ---
@router.get("/teams", response_model=List[TeamResponse])
def list_teams(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Team)
    if department_id:
        query = query.filter(Team.department_id == department_id)
    return query.all()


@router.post("/teams", response_model=TeamResponse)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = Team(
        id=str(uuid.uuid4()),
        organization_id=data.organization_id,
        department_id=data.department_id,
        name=data.name,
        description=data.description,
        team_lead_id=data.team_lead_id
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    log_audit_event(
        db,
        action="team_created",
        resource_type="team",
        resource_id=team.id,
        actor_id=current_user.id,
        organization_id=data.organization_id
    )
    return team
