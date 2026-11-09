from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.auth import User, RoleAssignment, Role, Permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Authenticates the user via Bearer token or HTTP-only access_token cookie."""
    # Check Header first, then check Cookie
    auth_token = token
    if not auth_token:
        auth_token = request.cookies.get("access_token")
    
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(auth_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")
    
    if user.account_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is suspended or inactive")
        
    return user


def require_role(role_name: str):
    """Enforces that the user has a specific role (or is Super Admin)."""
    def role_checker(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        # Check Super Admin override
        assignments = db.query(RoleAssignment).join(Role).filter(RoleAssignment.user_id == user.id).all()
        user_roles = [a.role.name for a in assignments if a.role]
        
        if "Super Admin" in user_roles or "Managing Director" in user_roles or "CEO" in user_roles:
            return user
            
        if role_name not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires '{role_name}' role"
            )
        return user
    return role_checker


def require_permission(resource: str, action: str):
    """Enforces granular permission on resource and action."""
    def perm_checker(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        assignments = db.query(RoleAssignment).join(Role).filter(RoleAssignment.user_id == user.id).all()
        for a in assignments:
            if not a.role:
                continue
            if a.role.name in ["Super Admin", "Managing Director", "CEO"]:
                return user
            for p in a.role.permissions:
                if (p.resource == resource or p.resource == "*") and (p.action == action or p.action == "*"):
                    return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: cannot {action} on {resource}"
        )
    return perm_checker
