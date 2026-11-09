import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.notification import Notification
from app.models.auth import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return notifs


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.read_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    return {"message": "Notification marked as read"}
