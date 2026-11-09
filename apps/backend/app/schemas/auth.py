from typing import Optional, List
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None
    mfa_required: bool = False


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    designation: Optional[str] = "Employee"
    employee_code: Optional[str] = None
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None
    role_name: Optional[str] = "Employee"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    designation: Optional[str] = None
    employee_code: Optional[str] = None
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    account_status: str
    mfa_enabled: bool
    roles: List[str] = []

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    account_status: str  # active, suspended, deactivated


class UserPasswordReset(BaseModel):
    new_password: str


class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str


class MFAVerifyRequest(BaseModel):
    code: str
