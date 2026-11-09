import uuid
import hashlib
import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.file import FileRecord, FileLink
from app.models.auth import User

router = APIRouter(prefix="/files", tags=["files"])

ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv", "text/plain",
    "image/png", "image/jpeg",
    "application/zip", "application/json", "text/xml"
]


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    resource_type: str = Form(...),
    resource_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read file contents and compute hash
    contents = await file.read()
    file_size = len(contents)
    sha256 = hashlib.sha256(contents).hexdigest()

    # Create local storage path if MinIO offline
    upload_dir = "/tmp/enterpriseops_storage"
    os.makedirs(upload_dir, exist_ok=True)
    storage_key = f"evidence/{uuid.uuid4()}_{file.filename}"
    local_path = os.path.join(upload_dir, os.path.basename(storage_key))
    with open(local_path, "wb") as f:
        f.write(contents)

    file_rec = FileRecord(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id or "default-org",
        uploaded_by=current_user.id,
        original_filename=file.filename or "uploaded_file",
        storage_key=storage_key,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        sha256=sha256,
        scan_status="clean",
        classification="confidential"
    )
    db.add(file_rec)
    db.flush()

    # Link to resource
    link = FileLink(
        id=str(uuid.uuid4()),
        file_id=file_rec.id,
        resource_type=resource_type,
        resource_id=resource_id
    )
    db.add(link)
    db.commit()

    log_audit_event(
        db,
        action="file_uploaded",
        resource_type="file",
        resource_id=file_rec.id,
        actor_id=current_user.id,
        event_metadata={"filename": file.filename, "size": file_size, "sha256": sha256}
    )

    return {
        "file_id": file_rec.id,
        "filename": file_rec.original_filename,
        "file_size": file_rec.file_size,
        "sha256": file_rec.sha256,
        "scan_status": file_rec.scan_status
    }
