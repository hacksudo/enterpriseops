import datetime
from typing import Optional
from pydantic import BaseModel


class ChannelCreate(BaseModel):
    organization_id: str
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None
    name: str
    channel_type: Optional[str] = "department"


class ChannelResponse(BaseModel):
    id: str
    name: str
    channel_type: str
    department_id: Optional[str] = None
    workspace_id: Optional[str] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str
    parent_message_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    channel_id: str
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
