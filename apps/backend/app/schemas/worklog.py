import datetime
from typing import Optional
from pydantic import BaseModel


class CheckinRequest(BaseModel):
    task_id: Optional[str] = None
    notes: Optional[str] = None


class CheckinResponse(BaseModel):
    id: str
    user_id: str
    work_date: datetime.date
    checked_in_at: datetime.datetime
    checked_out_at: Optional[datetime.datetime] = None
    status: str

    class Config:
        from_attributes = True


class TimeEntryCreate(BaseModel):
    task_id: Optional[str] = None
    started_at: datetime.datetime
    ended_at: datetime.datetime
    duration_minutes: int
    notes: Optional[str] = None


class TimeEntryResponse(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str] = None
    started_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    duration_minutes: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class DailyReportCreate(BaseModel):
    department_id: str
    summary: str
    blockers: Optional[str] = None
    next_steps: Optional[str] = None


class DailyReportResponse(BaseModel):
    id: str
    user_id: str
    department_id: str
    work_date: datetime.date
    summary: str
    blockers: Optional[str] = None
    next_steps: Optional[str] = None
    submission_status: str
    submitted_at: datetime.datetime

    class Config:
        from_attributes = True
