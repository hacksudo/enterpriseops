import datetime
from typing import Optional, List
from pydantic import BaseModel


class CVSSCalculateRequest(BaseModel):
    version: str = "4.0"  # "4.0" or "3.1"
    vector: str


class CVSSCalculateResponse(BaseModel):
    version: str
    vector: str
    score: float
    severity: str


class EngagementCreate(BaseModel):
    organization_id: str
    department_id: str
    workspace_id: str
    project_id: Optional[str] = None
    name: str
    assessment_type: Optional[str] = "Android Penetration Testing"
    scope: Optional[str] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None


class EngagementResponse(BaseModel):
    id: str
    name: str
    assessment_type: str
    scope: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class FindingCreate(BaseModel):
    organization_id: str
    department_id: str
    workspace_id: str
    project_id: Optional[str] = None
    engagement_id: Optional[str] = None
    asset_id: Optional[str] = None
    
    title: str
    description: Optional[str] = None
    observation: str
    reproduction_steps: Optional[str] = None
    impact: str
    remediation: str
    cwe_id: Optional[str] = None
    cve_id: Optional[str] = None
    owasp_mapping: Optional[str] = None
    
    cvss_version: Optional[str] = "4.0"
    cvss_vector: Optional[str] = None
    cvss_score: Optional[float] = None
    severity: Optional[str] = None  # If not provided, computed from CVSS
    assigned_to: Optional[str] = None


class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    observation: Optional[str] = None
    reproduction_steps: Optional[str] = None
    impact: Optional[str] = None
    remediation: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class FindingResponse(BaseModel):
    id: str
    organization_id: str
    department_id: str
    workspace_id: str
    project_id: Optional[str] = None
    asset_id: Optional[str] = None
    finding_number: str
    title: str
    description: Optional[str] = None
    observation: str
    reproduction_steps: Optional[str] = None
    impact: str
    remediation: str
    cwe_id: Optional[str] = None
    cve_id: Optional[str] = None
    owasp_mapping: Optional[str] = None
    cvss_version: str
    cvss_vector: Optional[str] = None
    cvss_score: float
    severity: str
    status: str
    discovered_by: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_user_name: Optional[str] = None
    assigned_user_email: Optional[str] = None
    discovered_at: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ExtractedFindingItem(BaseModel):
    title: str
    severity: str = "Medium"
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None
    cvss_version: Optional[str] = "4.0"
    observation: Optional[str] = None
    description: Optional[str] = None
    impact: Optional[str] = None
    remediation: Optional[str] = None
    affected_asset: Optional[str] = None
    cve_id: Optional[str] = None
    cwe_id: Optional[str] = None
    status: str = "Open"
    suggested_assignee: Optional[str] = None
    assigned_to: Optional[str] = None


class ExtractionResponse(BaseModel):
    filename: str
    file_type: str
    total_extracted: int
    findings: List[ExtractedFindingItem]


class BulkImportRequest(BaseModel):
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None
    default_assigned_to: Optional[str] = None
    findings: List[ExtractedFindingItem]


class FindingRetestCreate(BaseModel):
    result: str  # passed, failed
    notes: Optional[str] = None


class FindingRetestResponse(BaseModel):
    id: str
    finding_id: str
    tested_by: str
    result: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
