import datetime
from typing import Optional
from pydantic import BaseModel


class HandoffCreate(BaseModel):
    target_department_id: str
    recipient_user_id: Optional[str] = None
    resource_type: str = "finding"  # finding, task, report
    resource_id: str
    notes: Optional[str] = None


class HandoffAction(BaseModel):
    status: str  # accepted, rejected, completed
    notes: Optional[str] = None


class HandoffResponse(BaseModel):
    id: str
    source_department_id: str
    target_department_id: str
    source_user_id: str
    recipient_user_id: Optional[str] = None
    resource_type: str
    resource_id: str
    request_status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
