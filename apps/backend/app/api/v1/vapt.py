import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.cvss_engine import calculate_cvss, get_severity_from_score
from app.core.audit import log_audit_event
from app.models.vapt import Engagement, Asset, Finding, FindingEvent, FindingRetest
from app.models.organization import Department, Workspace
from app.models.notification import Notification, AlertDelivery
from app.models.auth import User, RoleAssignment, Role
from app.services.finding_extractor import (
    extract_findings_from_file,
    default_score_for_severity,
    export_findings_to_excel,
    export_findings_to_docx
)
from app.schemas.vapt import (
    CVSSCalculateRequest, CVSSCalculateResponse,
    EngagementCreate, EngagementResponse,
    FindingCreate, FindingUpdate, FindingResponse,
    FindingRetestCreate, FindingRetestResponse,
    ExtractedFindingItem, ExtractionResponse, BulkImportRequest
)

router = APIRouter(prefix="/vapt", tags=["vapt"])


def generate_finding_number(db: Session) -> str:
    year = datetime.datetime.now().year
    count = db.query(Finding).count()
    return f"VAPT-{year}-{1001 + count}"


@router.post("/cvss/calculate", response_model=CVSSCalculateResponse)
def calculate_cvss_endpoint(req: CVSSCalculateRequest):
    try:
        score, severity = calculate_cvss(req.version, req.vector)
        return CVSSCalculateResponse(
            version=req.version,
            vector=req.vector,
            score=score,
            severity=severity
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CVSS calculation error: {str(e)}")


# --- Engagements ---
@router.get("/engagements", response_model=List[EngagementResponse])
def list_engagements(
    workspace_id: Optional[str] = None,
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Engagement).filter(Engagement.status == "active")
    if workspace_id:
        query = query.filter(Engagement.workspace_id == workspace_id)
    if department_id:
        query = query.filter(Engagement.department_id == department_id)
    return query.all()


@router.post("/engagements", response_model=EngagementResponse)
def create_engagement(
    data: EngagementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    eng = Engagement(
        id=str(uuid.uuid4()),
        organization_id=data.organization_id,
        department_id=data.department_id,
        workspace_id=data.workspace_id,
        project_id=data.project_id,
        name=data.name,
        assessment_type=data.assessment_type or "Android Penetration Testing",
        scope=data.scope,
        start_date=data.start_date,
        end_date=data.end_date,
        status="active"
    )
    db.add(eng)
    db.commit()
    db.refresh(eng)
    return eng


def enrich_findings(findings: List[Finding], db: Session) -> List[FindingResponse]:
    user_ids = {f.assigned_to for f in findings if f.assigned_to}
    users_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        users_map = {u.id: u for u in users}

    responses = []
    for f in findings:
        assignee = users_map.get(f.assigned_to)
        responses.append(FindingResponse(
            id=f.id,
            organization_id=f.organization_id,
            department_id=f.department_id,
            workspace_id=f.workspace_id,
            project_id=f.project_id,
            asset_id=f.asset_id,
            finding_number=f.finding_number,
            title=f.title,
            description=f.description,
            observation=f.observation,
            reproduction_steps=f.reproduction_steps,
            impact=f.impact,
            remediation=f.remediation,
            cwe_id=f.cwe_id,
            cve_id=f.cve_id,
            owasp_mapping=f.owasp_mapping,
            cvss_version=f.cvss_version,
            cvss_vector=f.cvss_vector,
            cvss_score=f.cvss_score,
            severity=f.severity,
            status=f.status,
            discovered_by=f.discovered_by,
            assigned_to=f.assigned_to,
            assigned_user_name=assignee.full_name if assignee else None,
            assigned_user_email=assignee.email if assignee else None,
            discovered_at=f.discovered_at,
            created_at=f.created_at
        ))
    return responses


# --- Findings ---
@router.get("/findings", response_model=List[FindingResponse])
def list_findings(
    workspace_id: Optional[str] = None,
    department_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Finding)
    if workspace_id:
        query = query.filter(Finding.workspace_id == workspace_id)
    if department_id:
        query = query.filter(Finding.department_id == department_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if assigned_to:
        query = query.filter(Finding.assigned_to == assigned_to)
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (Finding.title.ilike(s_term)) |
            (Finding.finding_number.ilike(s_term)) |
            (Finding.cve_id.ilike(s_term)) |
            (Finding.observation.ilike(s_term))
        )
    findings = query.order_by(Finding.created_at.desc()).all()
    return enrich_findings(findings, db)


@router.get("/findings/export/excel")
def export_findings_excel(
    workspace_id: Optional[str] = None,
    department_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings_resp = list_findings(
        workspace_id=workspace_id,
        department_id=department_id,
        severity=severity,
        status=status,
        assigned_to=assigned_to,
        search=search,
        db=db,
        current_user=current_user
    )
    findings_dicts = [f.model_dump() for f in findings_resp]
    excel_bytes = export_findings_to_excel(findings_dicts)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=EnterpriseOps_VAPT_Report.xlsx"
        }
    )


@router.get("/findings/export/docx")
def export_findings_docx(
    workspace_id: Optional[str] = None,
    department_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings_resp = list_findings(
        workspace_id=workspace_id,
        department_id=department_id,
        severity=severity,
        status=status,
        assigned_to=assigned_to,
        search=search,
        db=db,
        current_user=current_user
    )
    findings_dicts = [f.model_dump() for f in findings_resp]
    docx_bytes = export_findings_to_docx(findings_dicts)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": "attachment; filename=EnterpriseOps_VAPT_Report.docx"
        }
    )


@router.post("/findings", response_model=FindingResponse)
def create_finding(
    data: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Compute score and severity if vector is provided
    calc_score = data.cvss_score or 0.0
    calc_severity = data.severity or "Informational"

    if data.cvss_vector:
        try:
            calc_score, auto_sev = calculate_cvss(data.cvss_version or "4.0", data.cvss_vector)
            if not data.severity:
                calc_severity = auto_sev
        except Exception:
            pass

    finding_num = generate_finding_number(db)
    finding = Finding(
        id=str(uuid.uuid4()),
        organization_id=data.organization_id,
        department_id=data.department_id,
        workspace_id=data.workspace_id,
        project_id=data.project_id,
        engagement_id=data.engagement_id,
        asset_id=data.asset_id,
        finding_number=finding_num,
        title=data.title,
        description=data.description,
        observation=data.observation,
        reproduction_steps=data.reproduction_steps,
        impact=data.impact,
        remediation=data.remediation,
        cwe_id=data.cwe_id,
        cve_id=data.cve_id,
        owasp_mapping=data.owasp_mapping,
        cvss_version=data.cvss_version or "4.0",
        cvss_vector=data.cvss_vector,
        cvss_score=calc_score,
        severity=calc_severity,
        status="Submitted",
        discovered_by=current_user.id,
        assigned_to=data.assigned_to,
        discovered_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(finding)
    db.flush()

    # Event audit
    event = FindingEvent(
        id=str(uuid.uuid4()),
        finding_id=finding.id,
        actor_id=current_user.id,
        event_type="submitted",
        new_values={"severity": calc_severity, "score": calc_score, "status": "Submitted"}
    )
    db.add(event)

    # --- High / Critical Alert System (Section 15) ---
    if calc_severity in ["Critical", "High"]:
        # Find Stakeholders: Super Admins, PMOs, Dept Admins
        stakeholder_assignments = db.query(RoleAssignment).join(Role).filter(
            Role.name.in_(["Super Admin", "Department Admin", "PMO", "Managing Director", "CEO"])
        ).all()
        stakeholder_user_ids = list(set([a.user_id for a in stakeholder_assignments if a.user_id != current_user.id]))

        for rec_id in stakeholder_user_ids:
            notif = Notification(
                id=str(uuid.uuid4()),
                organization_id=finding.organization_id,
                recipient_id=rec_id,
                notification_type=f"finding_{calc_severity.lower()}",
                title=f"🚨 {calc_severity.upper()} SECURITY ALERT: {finding.title}",
                body=f"A {calc_severity} vulnerability ({finding.finding_number}) with CVSS score {calc_score} was submitted by {current_user.full_name}.",
                resource_type="finding",
                resource_id=finding.id,
                priority="critical" if calc_severity == "Critical" else "high",
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(notif)
            db.flush()

            delivery = AlertDelivery(
                id=str(uuid.uuid4()),
                notification_id=notif.id,
                channel="in_app",
                delivery_status="delivered",
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(delivery)

    db.commit()
    db.refresh(finding)

    log_audit_event(
        db,
        action="finding_created",
        resource_type="finding",
        resource_id=finding.id,
        actor_id=current_user.id,
        organization_id=finding.organization_id,
        event_metadata={"severity": calc_severity, "score": calc_score}
    )

    return enrich_findings([finding], db)[0]


@router.patch("/findings/{finding_id}", response_model=FindingResponse)
def update_finding(
    finding_id: str,
    data: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    old_status = finding.status
    old_assigned = finding.assigned_to

    if data.title is not None:
        finding.title = data.title
    if data.description is not None:
        finding.description = data.description
    if data.observation is not None:
        finding.observation = data.observation
    if data.reproduction_steps is not None:
        finding.reproduction_steps = data.reproduction_steps
    if data.impact is not None:
        finding.impact = data.impact
    if data.remediation is not None:
        finding.remediation = data.remediation
    if data.severity is not None:
        finding.severity = data.severity
    if data.cvss_score is not None:
        finding.cvss_score = data.cvss_score
    if data.cvss_vector is not None:
        finding.cvss_vector = data.cvss_vector
    if data.assigned_to is not None:
        finding.assigned_to = data.assigned_to if data.assigned_to != "" else None
    if data.status is not None:
        finding.status = data.status

    event_type = "updated"
    if data.status is not None and data.status != old_status:
        event_type = "status_changed"
    elif data.assigned_to is not None and data.assigned_to != old_assigned:
        event_type = "reassigned"

    event = FindingEvent(
        id=str(uuid.uuid4()),
        finding_id=finding.id,
        actor_id=current_user.id,
        event_type=event_type,
        previous_values={"status": old_status, "assigned_to": old_assigned},
        new_values={
            "status": finding.status,
            "assigned_to": finding.assigned_to,
            "notes": data.notes or ""
        }
    )
    db.add(event)

    if data.notes:
        retest = FindingRetest(
            id=str(uuid.uuid4()),
            finding_id=finding.id,
            tested_by=current_user.id,
            result="passed" if finding.status in ["Resolved", "Closed"] else "review_note",
            notes=data.notes,
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(retest)

    db.commit()
    db.refresh(finding)

    log_audit_event(
        db,
        action="finding_updated",
        resource_type="finding",
        resource_id=finding.id,
        actor_id=current_user.id,
        organization_id=finding.organization_id,
        event_metadata={"new_status": finding.status, "assigned_to": finding.assigned_to, "notes": data.notes}
    )

    return enrich_findings([finding], db)[0]


@router.post("/findings/upload-extract", response_model=ExtractionResponse)
async def upload_extract_findings(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        raw_findings = extract_findings_from_file(file.filename, content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract findings: {str(e)}")

    extracted_items = [ExtractedFindingItem(**item) for item in raw_findings]
    file_type = "excel" if file.filename.lower().endswith((".xlsx", ".xls")) else \
                "docx" if file.filename.lower().endswith(".docx") else \
                "csv" if file.filename.lower().endswith(".csv") else "document"

    return ExtractionResponse(
        filename=file.filename,
        file_type=file_type,
        total_extracted=len(extracted_items),
        findings=extracted_items
    )


@router.post("/findings/bulk-import", response_model=List[FindingResponse])
def bulk_import_findings(
    data: BulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.findings:
        return []

    org_id = data.organization_id
    dept_id = data.department_id
    ws_id = data.workspace_id

    if not org_id or not dept_id or not ws_id:
        depts = db.query(Department).all()
        vapt_dept = next((d for d in depts if "vapt" in d.slug.lower()), depts[0] if depts else None)
        if vapt_dept:
            org_id = org_id or vapt_dept.organization_id
            dept_id = dept_id or vapt_dept.id
        workspaces = db.query(Workspace).all()
        if workspaces:
            ws_id = ws_id or workspaces[0].id

    all_users = db.query(User).all()
    created_findings = []

    for item in data.findings:
        assignee_id = item.assigned_to or data.default_assigned_to
        if not assignee_id and item.suggested_assignee:
            sugg = item.suggested_assignee.strip().lower()
            matched = next((u for u in all_users if sugg in u.full_name.lower() or sugg in u.email.lower()), None)
            if matched:
                assignee_id = matched.id

        score = item.cvss_score if item.cvss_score is not None else default_score_for_severity(item.severity)
        finding_num = generate_finding_number(db)

        finding = Finding(
            id=str(uuid.uuid4()),
            organization_id=org_id or "default-org",
            department_id=dept_id or "default-dept",
            workspace_id=ws_id or "default-ws",
            finding_number=finding_num,
            title=item.title,
            description=item.description or item.observation or item.title,
            observation=item.observation or item.title,
            reproduction_steps=f"Extracted from report for asset: {item.affected_asset or 'Target component'}",
            impact=item.impact or f"Potential impact on {item.affected_asset or 'system'}",
            remediation=item.remediation or "Apply vendor patch or configuration hardening.",
            cwe_id=item.cwe_id,
            cve_id=item.cve_id,
            cvss_version=item.cvss_version or "4.0",
            cvss_vector=item.cvss_vector,
            cvss_score=score,
            severity=item.severity,
            status=item.status or "Open",
            discovered_by=current_user.id,
            assigned_to=assignee_id,
            discovered_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(finding)
        db.flush()

        event = FindingEvent(
            id=str(uuid.uuid4()),
            finding_id=finding.id,
            actor_id=current_user.id,
            event_type="imported",
            new_values={"status": finding.status, "severity": finding.severity, "score": score}
        )
        db.add(event)

        # Alerts if Critical/High
        if item.severity in ["Critical", "High"]:
            stakeholder_assignments = db.query(RoleAssignment).join(Role).filter(
                Role.name.in_(["Super Admin", "Department Admin", "PMO", "Managing Director", "CEO"])
            ).all()
            stakeholder_user_ids = list(set([a.user_id for a in stakeholder_assignments if a.user_id != current_user.id]))
            for rec_id in stakeholder_user_ids:
                notif = Notification(
                    id=str(uuid.uuid4()),
                    organization_id=finding.organization_id,
                    recipient_id=rec_id,
                    notification_type=f"finding_{item.severity.lower()}",
                    title=f"🚨 {item.severity.upper()} SECURITY ALERT: {finding.title}",
                    body=f"Imported {item.severity} finding ({finding.finding_number}) with score {score} assigned.",
                    resource_type="finding",
                    resource_id=finding.id,
                    priority="critical" if item.severity == "Critical" else "high",
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(notif)
                db.flush()

                delivery = AlertDelivery(
                    id=str(uuid.uuid4()),
                    notification_id=notif.id,
                    channel="in_app",
                    delivery_status="delivered",
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(delivery)

        created_findings.append(finding)

    db.commit()

    log_audit_event(
        db,
        action="findings_bulk_imported",
        resource_type="finding",
        resource_id="bulk",
        actor_id=current_user.id,
        organization_id=org_id or "default-org",
        event_metadata={"count": len(created_findings)}
    )

    return enrich_findings(created_findings, db)


@router.post("/findings/{finding_id}/retest", response_model=FindingRetestResponse)
def submit_retest(
    finding_id: str,
    data: FindingRetestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    retest = FindingRetest(
        id=str(uuid.uuid4()),
        finding_id=finding.id,
        tested_by=current_user.id,
        result=data.result,
        notes=data.notes,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(retest)

    # If passed, update status to Resolved/Closed; if failed, Reopened
    prev_status = finding.status
    if data.result == "passed":
        finding.status = "Resolved"
    else:
        finding.status = "Reopened"

    event = FindingEvent(
        id=str(uuid.uuid4()),
        finding_id=finding.id,
        actor_id=current_user.id,
        event_type="retested",
        previous_values={"status": prev_status},
        new_values={"status": finding.status, "retest_result": data.result}
    )
    db.add(event)

    db.commit()
    db.refresh(retest)

    log_audit_event(
        db,
        action="finding_retested",
        resource_type="finding",
        resource_id=finding.id,
        actor_id=current_user.id,
        event_metadata={"result": data.result, "new_status": finding.status}
    )

    return retest


@router.delete("/findings/clear-all")
def clear_all_findings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permanently deletes all VAPT vulnerability findings, events, and retests.
    Resets findings count to 0 for a fresh clean slate.
    """
    try:
        count = db.query(Finding).count()
        db.query(FindingRetest).delete()
        db.query(FindingEvent).delete()
        db.query(Finding).delete()
        db.commit()

        log_audit_event(
            db,
            action="all_findings_cleared",
            resource_type="finding",
            resource_id="all",
            actor_id=current_user.id,
            organization_id=current_user.organization_id,
            event_metadata={"deleted_count": count}
        )

        return {
            "status": "success",
            "message": f"Successfully deleted all {count} vulnerability findings. Dashboard is fresh!",
            "deleted_count": count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear findings: {str(e)}")


@router.delete("/findings/{finding_id}")
def delete_single_finding(
    finding_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes an individual vulnerability finding."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    db.query(FindingRetest).filter(FindingRetest.finding_id == finding_id).delete()
    db.query(FindingEvent).filter(FindingEvent.finding_id == finding_id).delete()
    db.delete(finding)
    db.commit()

    log_audit_event(
        db,
        action="finding_deleted",
        resource_type="finding",
        resource_id=finding_id,
        actor_id=current_user.id,
        organization_id=current_user.organization_id
    )

    return {"status": "success", "message": "Finding deleted successfully"}

