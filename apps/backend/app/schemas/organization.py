from typing import Optional, Dict, Any
from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    organization_id: str
    name: str
    slug: str
    description: Optional[str] = None
    department_head_id: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    slug: str
    description: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class WorkspaceCreate(BaseModel):
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: str
    organization_id: str
    department_id: str
    name: str
    slug: str
    description: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class TeamCreate(BaseModel):
    organization_id: str
    department_id: str
    name: str
    description: Optional[str] = None
    team_lead_id: Optional[str] = None


class TeamResponse(BaseModel):
    id: str
    organization_id: str
    department_id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
