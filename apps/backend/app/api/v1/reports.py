import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.report import Report, ReportShare
from app.models.vapt import Finding
from app.models.task import Task
from app.models.organization import Department
from app.models.auth import User
from app.schemas.report import ReportCreate, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.post("", response_model=ReportResponse)
def generate_report(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rep_id = str(uuid.uuid4())
    report = Report(
        id=rep_id,
        organization_id=data.organization_id,
        department_id=data.department_id,
        workspace_id=data.workspace_id,
        report_type=data.report_type,
        title=data.title,
        generated_by=current_user.id,
        format=data.format.upper(),
        reporting_start=data.reporting_start,
        reporting_end=data.reporting_end,
        report_status="generated",
        storage_key=f"reports/{rep_id}.html"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_audit_event(
        db,
        action="report_generated",
        resource_type="report",
        resource_id=report.id,
        actor_id=current_user.id,
        event_metadata={"type": data.report_type, "format": data.format}
    )

    return report


@router.get("/{report_id}/content")
def get_report_html_content(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate dynamic executive or VAPT report
    findings = db.query(Finding).all()
    tasks = db.query(Task).all()
    depts = db.query(Department).all()

    crit_count = sum(1 for f in findings if f.severity == "Critical")
    high_count = sum(1 for f in findings if f.severity == "High")
    med_count = sum(1 for f in findings if f.severity == "Medium")
    low_count = sum(1 for f in findings if f.severity == "Low")

    findings_rows = "".join([
        f"""<tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">{f.finding_number}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{f.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                <span style="background: {'#ef4444' if f.severity == 'Critical' else '#f97316' if f.severity == 'High' else '#eab308' if f.severity == 'Medium' else '#3b82f6'}; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold;">{f.severity}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">{f.cvss_score}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{f.status}</td>
        </tr>""" for f in findings
    ])

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{report.title} — EnterpriseOps</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; background: #f8fafc; }}
        .card {{ background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 24px; border: 1px solid #e2e8f0; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }}
        .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }}
        .metric {{ background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; }}
        .metric-val {{ font-size: 28px; font-weight: 800; color: #0f172a; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
        th {{ background: #f8fafc; text-align: left; padding: 12px 10px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #64748b; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div>
                <h1 style="margin: 0; color: #0f172a;">{report.title}</h1>
                <p style="margin: 4px 0 0; color: #64748b;">Enterprise IT Operations & Vulnerability Assessment Report</p>
            </div>
            <div style="text-align: right; color: #64748b; font-size: 13px;">
                <strong>Date:</strong> {datetime.datetime.now().strftime('%B %d, %Y')}<br>
                <strong>Classification:</strong> Highly Confidential
            </div>
        </div>

        <h3 style="color: #334155; margin-top: 0;">Executive Summary & Posture</h3>
        <p>This automated consolidated report captures operational performance, workload delivery, and security vulnerabilities across all organizational departments and workspaces.</p>

        <div class="grid">
            <div class="metric"><div class="metric-val" style="color: #ef4444;">{crit_count}</div><div style="font-size: 12px; color: #64748b; font-weight: bold;">CRITICAL FINDINGS</div></div>
            <div class="metric"><div class="metric-val" style="color: #f97316;">{high_count}</div><div style="font-size: 12px; color: #64748b; font-weight: bold;">HIGH FINDINGS</div></div>
            <div class="metric"><div class="metric-val" style="color: #eab308;">{med_count}</div><div style="font-size: 12px; color: #64748b; font-weight: bold;">MEDIUM FINDINGS</div></div>
            <div class="metric"><div class="metric-val" style="color: #3b82f6;">{len(tasks)}</div><div style="font-size: 12px; color: #64748b; font-weight: bold;">TOTAL TASKS</div></div>
        </div>

        <h3 style="color: #334155; margin-top: 30px;">Identified Security Vulnerabilities (VAPT)</h3>
        <table>
            <thead>
                <tr>
                    <th>Finding ID</th>
                    <th>Vulnerability Title</th>
                    <th>Severity</th>
                    <th>CVSS</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {findings_rows if findings_rows else '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">No vulnerabilities recorded</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>"""
    return Response(content=html, media_type="text/html")
