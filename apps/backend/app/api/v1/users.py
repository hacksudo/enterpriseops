import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.auth import User, Role, RoleAssignment, Membership
from app.models.organization import Department
from app.schemas.auth import UserCreate, UserResponse, UserStatusUpdate, UserPasswordReset

router = APIRouter(prefix="/users", tags=["users"])


def get_user_role_names(user_id: str, db: Session) -> List[str]:
    assignments = db.query(RoleAssignment).join(Role).filter(RoleAssignment.user_id == user_id).all()
    return [a.role.name for a in assignments if a.role]


def is_super_admin(roles: List[str]) -> bool:
    return any(r in ["Super Admin", "Managing Director", "CEO"] for r in roles)


def is_pmo_or_lead(roles: List[str]) -> bool:
    return any(r in ["PMO", "Project Manager", "Team Lead", "Department Admin"] for r in roles)


@router.get("", response_model=List[UserResponse])
def list_users(
    department_id: Optional[str] = None,
    include_inactive: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    if not include_inactive:
        query = query.filter(User.account_status == "active")
        
    users = query.order_by(User.created_at.desc()).all()

    result = []
    for u in users:
        roles = get_user_role_names(u.id, db)
        
        # Get primary department membership
        membership = db.query(Membership).filter(Membership.user_id == u.id).first()
        dept_name = None
        dept_id = None
        if membership and membership.department_id:
            dept = db.query(Department).filter(Department.id == membership.department_id).first()
            if dept:
                dept_name = dept.name
                dept_id = dept.id

        if department_id and dept_id != department_id:
            continue

        result.append(
            UserResponse(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                designation=u.designation,
                employee_code=u.employee_code,
                organization_id=u.organization_id,
                department_id=dept_id,
                department_name=dept_name,
                account_status=u.account_status,
                mfa_enabled=u.mfa_enabled,
                roles=roles or ["Employee"]
            )
        )
    return result


@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_roles = get_user_role_names(current_user.id, db)
    current_is_super = is_super_admin(current_roles)
    current_is_pmo = is_pmo_or_lead(current_roles)

    # 1. Authorization check: only Super Admin or PMO/Lead can create users
    if not current_is_super and not current_is_pmo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have permissions to provision users."
        )

    # 2. Privilege Escalation Prevention: PMO cannot create Super Admin or Dept Admin
    target_role = data.role_name or "Employee"
    if not current_is_super and target_role in ["Super Admin", "Managing Director", "CEO", "Department Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilege Restriction: PMOs can only provision team members (Employee, Tester, Developer, Team Lead). Only Super Administrators can create administrative roles."
        )

    # 3. Department scoping for PMO
    target_dept_id = data.department_id
    if not current_is_super:
        # PMO must bind created user to PMO's own department
        pmo_membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()
        if pmo_membership and pmo_membership.department_id:
            target_dept_id = pmo_membership.department_id

    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        id=str(uuid.uuid4()),
        organization_id=data.organization_id or current_user.organization_id,
        employee_code=data.employee_code or f"EMP-{uuid.uuid4().hex[:6].upper()}",
        full_name=data.full_name,
        email=data.email.lower(),
        password_hash=get_password_hash(data.password),
        designation=data.designation or "Employee",
        account_status="active",
        mfa_enabled=False
    )
    db.add(new_user)
    db.flush()

    # Assign role
    role_to_assign = db.query(Role).filter(Role.name == target_role).first()
    if not role_to_assign:
        # Create role if doesn't exist
        role_to_assign = Role(
            id=str(uuid.uuid4()),
            organization_id=new_user.organization_id,
            name=target_role,
            description=f"{target_role} role",
            role_scope="global" if current_is_super and target_role in ["Super Admin", "Auditor"] else "department"
        )
        db.add(role_to_assign)
        db.flush()

    assignment = RoleAssignment(
        id=str(uuid.uuid4()),
        user_id=new_user.id,
        role_id=role_to_assign.id,
        scope_type="organization" if current_is_super and target_role in ["Super Admin", "Auditor"] else "department",
        scope_id=target_dept_id or new_user.organization_id,
        assigned_by=current_user.id
    )
    db.add(assignment)

    # Add department membership
    dept_name = None
    if target_dept_id:
        dept = db.query(Department).filter(Department.id == target_dept_id).first()
        if dept:
            dept_name = dept.name
        membership = Membership(
            id=str(uuid.uuid4()),
            user_id=new_user.id,
            organization_id=new_user.organization_id,
            department_id=target_dept_id,
            workspace_id=data.workspace_id,
            membership_type="member",
            status="active"
        )
        db.add(membership)

    db.commit()

    log_audit_event(
        db,
        action="user_created",
        resource_type="user",
        resource_id=new_user.id,
        actor_id=current_user.id,
        organization_id=new_user.organization_id,
        metadata={"email": new_user.email, "role": target_role, "created_by_role": "Super Admin" if current_is_super else "PMO"}
    )

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        designation=new_user.designation,
        employee_code=new_user.employee_code,
        organization_id=new_user.organization_id,
        department_id=target_dept_id,
        department_name=dept_name,
        account_status=new_user.account_status,
        mfa_enabled=new_user.mfa_enabled,
        roles=[target_role]
    )


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_roles = get_user_role_names(current_user.id, db)
    current_is_super = is_super_admin(current_roles)
    current_is_pmo = is_pmo_or_lead(current_roles)

    if not current_is_super and not current_is_pmo:
        raise HTTPException(status_code=403, detail="Permission denied")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot alter your own account status")

    target_roles = get_user_role_names(target_user.id, db)
    if not current_is_super and (is_super_admin(target_roles) or is_pmo_or_lead(target_roles)):
        raise HTTPException(status_code=403, detail="PMOs cannot suspend administrative accounts")

    target_user.account_status = payload.account_status
    db.commit()

    log_audit_event(
        db,
        action=f"user_status_{payload.account_status}",
        resource_type="user",
        resource_id=target_user.id,
        actor_id=current_user.id,
        organization_id=target_user.organization_id
    )

    return {"message": f"User status updated to {payload.account_status}", "user_id": target_user.id, "status": target_user.account_status}


@router.patch("/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: UserPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_roles = get_user_role_names(current_user.id, db)
    current_is_super = is_super_admin(current_roles)

    if not current_is_super:
        raise HTTPException(status_code=403, detail="Super Admin privilege required to reset passwords")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    log_audit_event(
        db,
        action="user_password_reset",
        resource_type="user",
        resource_id=target_user.id,
        actor_id=current_user.id,
        organization_id=target_user.organization_id
    )

    return {"message": "Password successfully reset"}


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_roles = get_user_role_names(current_user.id, db)
    if not is_super_admin(current_roles):
        raise HTTPException(status_code=403, detail="Super Admin privilege required to delete users")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Clean up assignments and memberships
    db.query(RoleAssignment).filter(RoleAssignment.user_id == user_id).delete()
    db.query(Membership).filter(Membership.user_id == user_id).delete()
    db.delete(target_user)
    db.commit()

    log_audit_event(
        db,
        action="user_deleted",
        resource_type="user",
        resource_id=user_id,
        actor_id=current_user.id,
        organization_id=current_user.organization_id
    )

    return {"message": "User deleted successfully", "user_id": user_id}
