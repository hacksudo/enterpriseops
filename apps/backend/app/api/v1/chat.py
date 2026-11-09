import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.chat import Channel, Message
from app.models.auth import User
from app.schemas.chat import ChannelCreate, ChannelResponse, MessageCreate, MessageResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/channels", response_model=List[ChannelResponse])
def list_channels(
    department_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Channel)
    if department_id:
        query = query.filter(Channel.department_id == department_id)
    if workspace_id:
        query = query.filter(Channel.workspace_id == workspace_id)
    channels = query.all()

    # If no channels yet, create a default general channel
    if not channels and current_user.organization_id:
        general = Channel(
            id=str(uuid.uuid4()),
            organization_id=current_user.organization_id,
            department_id=department_id,
            name="General Discussion",
            channel_type="department",
            created_by=current_user.id
        )
        db.add(general)
        db.commit()
        db.refresh(general)
        channels = [general]

    return channels


@router.post("/channels", response_model=ChannelResponse)
def create_channel(
    data: ChannelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ch = Channel(
        id=str(uuid.uuid4()),
        organization_id=data.organization_id,
        department_id=data.department_id,
        workspace_id=data.workspace_id,
        name=data.name,
        channel_type=data.channel_type or "department",
        created_by=current_user.id
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch


@router.get("/channels/{channel_id}/messages", response_model=List[MessageResponse])
def get_channel_messages(
    channel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(Message.channel_id == channel_id).order_by(Message.created_at.asc()).all()
    result = []
    for m in messages:
        sender_name = m.sender.full_name if m.sender else "User"
        result.append(
            MessageResponse(
                id=m.id,
                channel_id=m.channel_id,
                sender_id=m.sender_id,
                sender_name=sender_name,
                content=m.content,
                created_at=m.created_at
            )
        )
    return result


@router.post("/channels/{channel_id}/messages", response_model=MessageResponse)
def send_message(
    channel_id: str,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = Message(
        id=str(uuid.uuid4()),
        channel_id=channel_id,
        sender_id=current_user.id,
        parent_message_id=data.parent_message_id,
        content=data.content,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        channel_id=msg.channel_id,
        sender_id=msg.sender_id,
        sender_name=current_user.full_name,
        content=msg.content,
        created_at=msg.created_at
    )
