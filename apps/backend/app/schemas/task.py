import datetime
from typing import Optional, List
from pydantic import BaseModel


class TaskCreate(BaseModel):
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None
    project_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = "Android Penetration Testing"
    priority: Optional[str] = "medium"  # critical, high, medium, low
    assigned_to_user_id: Optional[str] = None
    due_at: Optional[datetime.datetime] = None
    estimated_minutes: Optional[int] = 0


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None  # Planned, In Progress, Blocked, In Review, Completed, Approved, Reopened, Cancelled
    due_at: Optional[datetime.datetime] = None
    actual_minutes: Optional[int] = None


class TaskResponse(BaseModel):
    id: str
    organization_id: str
    department_id: str
    workspace_id: str
    project_id: Optional[str] = None
    task_number: str
    title: str
    description: Optional[str] = None
    category: str
    priority: str
    status: str
    created_by: Optional[str] = None
    assigned_by: Optional[str] = None
    assigned_to: Optional[str] = None
    due_at: Optional[datetime.datetime] = None
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    estimated_minutes: int
    actual_minutes: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class TaskCommentCreate(BaseModel):
    content: str


class TaskCommentResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
