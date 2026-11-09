import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, verify_totp_code, generate_totp_secret, get_totp_uri
from app.core.audit import log_audit_event
from app.core.dependencies import get_current_user
from app.models.auth import User, RoleAssignment, Role
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, MFASetupResponse, MFAVerifyRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        log_audit_event(
            db,
            action="login_failed",
            resource_type="user",
            ip_address=request.client.host if request.client else None,
            event_metadata={"email": login_data.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.account_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended or deactivated")

    # Check MFA if enabled
    if user.mfa_enabled and user.mfa_secret:
        if not login_data.totp_code:
            return TokenResponse(
                access_token="",
                user_id=user.id,
                email=user.email,
                full_name=user.full_name,
                role="",
                mfa_required=True
            )
        if not verify_totp_code(user.mfa_secret, login_data.totp_code):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA TOTP code")

    # Record login
    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    # Get user primary role
    assignment = db.query(RoleAssignment).join(Role).filter(RoleAssignment.user_id == user.id).first()
    primary_role = assignment.role.name if assignment and assignment.role else "Employee"

    access_token = create_access_token(
        subject=user.id,
        claims={
            "email": user.email,
            "role": primary_role,
            "org_id": user.organization_id
        }
    )

    # Set secure HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=28800,
        samesite="lax",
        secure=False  # Set to True in production with TLS
    )

    log_audit_event(
        db,
        action="user_login",
        resource_type="user",
        resource_id=user.id,
        actor_id=user.id,
        organization_id=user.organization_id,
        ip_address=request.client.host if request.client else None
    )

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=primary_role,
        organization_id=user.organization_id,
        mfa_required=False
    )


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.delete_cookie(key="access_token")
    log_audit_event(db, action="user_logout", resource_type="user", resource_id=current_user.id, actor_id=current_user.id)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignments = db.query(RoleAssignment).join(Role).filter(RoleAssignment.user_id == current_user.id).all()
    roles = [a.role.name for a in assignments if a.role]
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        designation=current_user.designation,
        employee_code=current_user.employee_code,
        organization_id=current_user.organization_id,
        account_status=current_user.account_status,
        mfa_enabled=current_user.mfa_enabled,
        roles=roles or ["Employee"]
    )


@router.post("/mfa/setup", response_model=MFASetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = generate_totp_secret()
    current_user.mfa_secret = secret
    db.commit()
    uri = get_totp_uri(secret, current_user.email)
    return MFASetupResponse(secret=secret, provisioning_uri=uri)


@router.post("/mfa/verify")
def verify_and_enable_mfa(
    req: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initialized")
    if not verify_totp_code(current_user.mfa_secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    current_user.mfa_enabled = True
    db.commit()
    log_audit_event(db, action="mfa_enabled", resource_type="user", resource_id=current_user.id, actor_id=current_user.id)
    return {"message": "MFA successfully enabled"}
