import datetime
from typing import Optional
from pydantic import BaseModel


class ReportCreate(BaseModel):
    organization_id: str
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None
    report_type: str  # executive_consolidated, vapt_assessment, employee_daily, department_summary
    title: str
    format: str = "HTML"  # HTML, PDF, DOCX, XLSX, CSV
    reporting_start: Optional[datetime.datetime] = None
    reporting_end: Optional[datetime.datetime] = None


class ReportResponse(BaseModel):
    id: str
    title: str
    report_type: str
    format: str
    report_status: str
    storage_key: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ReportShareRequest(BaseModel):
    recipient_user_id: str
    permission_level: str = "read_only"
    expires_in_hours: Optional[int] = 72
