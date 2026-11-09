from typing import Dict, List, Any
from pydantic import BaseModel


class ExecutiveDashboardStats(BaseModel):
    total_departments: int
    total_employees: int
    active_users: int
    active_projects: int
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    
    # Security overview
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    informational_findings: int
    open_findings: int
    closed_findings: int
    
    # Categorizations
    findings_by_severity: Dict[str, int]
    findings_by_department: Dict[str, int]
    findings_discovered_today: int
    findings_discovered_this_week: int
    findings_discovered_this_month: int


class DepartmentPerformanceStats(BaseModel):
    department_id: str
    department_name: str
    total_employees: int
    active_tasks: int
    completed_tasks: int
    total_findings: int
    critical_findings: int
    high_findings: int


class EmployeeDashboardStats(BaseModel):
    checked_in: bool
    today_work_time_minutes: int
    assigned_tasks_count: int
    in_progress_tasks_count: int
    completed_tasks_count: int
    personal_findings_count: int
    unread_notifications_count: int


class PMODashboardStats(BaseModel):
    active_projects: int
    active_tasks: int
    completed_tasks: int
    blocked_tasks: int
    critical_alerts: int
    high_alerts: int
    remediation_pending: int
