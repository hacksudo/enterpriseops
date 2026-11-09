import sys
import uuid
import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.config import settings
from app.core.security import get_password_hash
from app.api.v1.bootstrap import run_system_bootstrap
from app.models.organization import Organization, Department, Workspace
from app.models.auth import User, Role, RoleAssignment, Membership
from app.models.task import Task, TaskAssignment, TaskEvent
from app.models.worklog import WorkdayCheckin, DailyWorkReport
from app.models.vapt import Engagement, Asset, Finding, FindingEvent
from app.models.collaboration import HandoffRequest
from app.models.chat import Channel, Message
from app.models.notification import Notification, AlertDelivery


def bootstrap_admin():
    """Initializes database schema and bootstraps the root administrator."""
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        res = run_system_bootstrap(
            db,
            admin_email=settings.BOOTSTRAP_ADMIN_EMAIL,
            admin_password=settings.BOOTSTRAP_ADMIN_PASSWORD,
            admin_name=settings.BOOTSTRAP_ADMIN_NAME
        )
        print(f"Bootstrap complete: {res['message']}")
        print(f"Super Admin Login: {res['super_admin_email']}")
    finally:
        db.close()


def seed_demo_data():
    """Seeds the realistic End-to-End demonstration scenario specified in Section 38."""
    print("Seeding demonstration data...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # First ensure bootstrap is run
        run_system_bootstrap(
            db,
            admin_email=settings.BOOTSTRAP_ADMIN_EMAIL,
            admin_password=settings.BOOTSTRAP_ADMIN_PASSWORD,
            admin_name=settings.BOOTSTRAP_ADMIN_NAME
        )
        org = db.query(Organization).first()

        # Roles
        pmo_role = db.query(Role).filter(Role.name == "PMO").first()
        emp_role = db.query(Role).filter(Role.name == "Employee").first()
        dept_admin_role = db.query(Role).filter(Role.name == "Department Admin").first()

        # 1. Departments: VAPT / Cybersecurity & Software Development
        vapt_dept = db.query(Department).filter(Department.name == "VAPT / Cybersecurity").first()
        if not vapt_dept:
            vapt_dept = Department(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="VAPT / Cybersecurity",
                slug="vapt",
                description="Penetration testing, security audits, and vulnerability assessments",
                status="active"
            )
            db.add(vapt_dept)
            db.flush()

        dev_dept = db.query(Department).filter(Department.name == "Software Development").first()
        if not dev_dept:
            dev_dept = Department(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="Software Development",
                slug="software-development",
                description="Core application engineering and platform remediation",
                status="active"
            )
            db.add(dev_dept)
            db.flush()

        # 2. Workspace: Android Security Workspace
        android_ws = db.query(Workspace).filter(Workspace.name == "Android Security Workspace").first()
        if not android_ws:
            android_ws = Workspace(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                department_id=vapt_dept.id,
                name="Android Security Workspace",
                slug="android-security",
                description="Mobile application penetration testing and binary security analysis",
                status="active"
            )
            db.add(android_ws)
            db.flush()

        dev_ws = db.query(Workspace).filter(Workspace.name == "Mobile Engineering Workspace").first()
        if not dev_ws:
            dev_ws = Workspace(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                department_id=dev_dept.id,
                name="Mobile Engineering Workspace",
                slug="mobile-engineering",
                description="Android and iOS client engineering and patch development",
                status="active"
            )
            db.add(dev_ws)
            db.flush()

        # 3. Accounts: PMO, Tester, Developer
        def get_or_create_user(email, name, code, designation, dept_id, ws_id, role_obj):
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    employee_code=code,
                    full_name=name,
                    email=email,
                    password_hash=get_password_hash("DemoP@ssw0rd2026!"),
                    designation=designation,
                    account_status="active",
                    mfa_enabled=False
                )
                db.add(u)
                db.flush()

                # Role assignment
                assign = RoleAssignment(
                    id=str(uuid.uuid4()),
                    user_id=u.id,
                    role_id=role_obj.id,
                    scope_type="workspace",
                    scope_id=ws_id,
                    assigned_by="demo_seeder"
                )
                db.add(assign)

                # Membership
                mem = Membership(
                    id=str(uuid.uuid4()),
                    user_id=u.id,
                    organization_id=org.id,
                    department_id=dept_id,
                    workspace_id=ws_id,
                    membership_type="member",
                    status="active"
                )
                db.add(mem)
            return u

        pmo_user = get_or_create_user(
            "pmo@enterpriseops.internal", "Sarah Jenkins", "PMO-001",
            "Lead Security PMO", vapt_dept.id, android_ws.id, pmo_role
        )
        tester_user = get_or_create_user(
            "tester@enterpriseops.internal", "Vishal Waghmare", "SEC-101",
            "Senior Mobile Security Researcher", vapt_dept.id, android_ws.id, emp_role
        )
        dev_user = get_or_create_user(
            "dev@enterpriseops.internal", "Alex Rivera", "DEV-202",
            "Senior Android Developer", dev_dept.id, dev_ws.id, emp_role
        )

        # 4. Workday Check-in for Tester (Vishal)
        today = datetime.datetime.now(datetime.timezone.utc).date()
        checkin = db.query(WorkdayCheckin).filter(WorkdayCheckin.user_id == tester_user.id, WorkdayCheckin.work_date == today).first()
        if not checkin:
            checkin = WorkdayCheckin(
                id=str(uuid.uuid4()),
                user_id=tester_user.id,
                organization_id=org.id,
                department_id=vapt_dept.id,
                work_date=today,
                checked_in_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=4),
                status="active"
            )
            db.add(checkin)

        # 5. Task: "Android Penetration Testing"
        task = db.query(Task).filter(Task.title == "Android Penetration Testing").first()
        if not task:
            task = Task(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                department_id=vapt_dept.id,
                workspace_id=android_ws.id,
                task_number="TASK-1001",
                title="Android Penetration Testing",
                description="Comprehensive dynamic analysis, AndroidManifest.xml audit, exported component validation, and API authentication testing on Mobile Banking APK.",
                category="Android Penetration Testing",
                priority="critical",
                status="In Progress",
                created_by=tester_user.id,
                assigned_by=pmo_user.id,
                started_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=3),
                due_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2),
                estimated_minutes=480,
                actual_minutes=240
            )
            db.add(task)
            db.flush()

            assign = TaskAssignment(
                id=str(uuid.uuid4()),
                task_id=task.id,
                assigned_user_id=tester_user.id,
                assigned_by=pmo_user.id,
                assignment_status="accepted",
                accepted_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=3)
            )
            db.add(assign)

        # 6. Daily Activity Report for Tester
        daily_rep = db.query(DailyWorkReport).filter(DailyWorkReport.user_id == tester_user.id, DailyWorkReport.work_date == today).first()
        if not daily_rep:
            daily_rep = DailyWorkReport(
                id=str(uuid.uuid4()),
                user_id=tester_user.id,
                department_id=vapt_dept.id,
                work_date=today,
                summary="• Analyzed Android application bytecode and manifest.\n• Reviewed AndroidManifest.xml and discovered exported insecure ContentProvider.\n• Performed API security testing against payment endpoints.\n• Identified high-severity authorization bypass.\n• Uploaded proof-of-concept evidence artifact.\n• Submitted findings for PMO and Developer remediation.",
                blockers="Pending test environment database reset for retest iteration.",
                next_steps="Perform retest once Android dev pushes v2.4.1 hotfix.",
                submission_status="submitted",
                submitted_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)
            )
            db.add(daily_rep)

        # 7. Engagement & Critical Finding
        eng = db.query(Engagement).filter(Engagement.name == "Q4 Mobile Banking VAPT").first()
        if not eng:
            eng = Engagement(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                department_id=vapt_dept.id,
                workspace_id=android_ws.id,
                name="Q4 Mobile Banking VAPT",
                assessment_type="Android Penetration Testing",
                scope="Android Client APK v2.4.0 & Backend Core APIs",
                status="active"
            )
            db.add(eng)
            db.flush()

        asset = db.query(Asset).filter(Asset.asset_name == "Mobile Banking APK").first()
        if not asset:
            asset = Asset(
                id=str(uuid.uuid4()),
                engagement_id=eng.id,
                asset_name="Mobile Banking APK",
                asset_type="Mobile Application",
                asset_identifier="com.enterpriseops.banking",
                environment="Production"
            )
            db.add(asset)
            db.flush()

        finding = db.query(Finding).filter(Finding.finding_number == "VAPT-2026-001").first()
        if not finding:
            finding = Finding(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                department_id=vapt_dept.id,
                workspace_id=android_ws.id,
                engagement_id=eng.id,
                asset_id=asset.id,
                finding_number="VAPT-2026-001",
                title="Remote Account Takeover via Insecure Exported Deep Link & Token Leakage",
                description="The mobile application registers an insecure deep link handler in AndroidManifest.xml without origin validation, allowing unauthorized external applications on the device to trigger authenticated transfers.",
                observation="Intent filter android.intent.action.VIEW for scheme 'bank://transfer' executes without user re-authentication or CSRF verification token.",
                reproduction_steps="1. Install POC application on Android device.\n2. Send intent with malicious payload URI: bank://transfer?target=attacker&amount=5000\n3. Observed immediate background transaction completion without PIN confirmation.",
                impact="Complete compromise of customer fund balances and full account takeover without user awareness.",
                remediation="Configure android:exported=\"false\" or enforce strict cryptographic signature validation and mandatory biometrics prompt before initiating state-changing actions.",
                cwe_id="CWE-926",
                cve_id="CVE-2026-10492",
                owasp_mapping="OWASP Mobile Top 10 M1: Improper Platform Usage",
                cvss_version="4.0",
                cvss_vector="CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
                cvss_score=9.3,
                severity="Critical",
                status="Remediation Assigned",
                discovered_by=tester_user.id,
                assigned_to=dev_user.id,
                discovered_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=2)
            )
            db.add(finding)
            db.flush()

            # Critical Alert Dispatch records
            super_user = db.query(User).filter(User.email == settings.BOOTSTRAP_ADMIN_EMAIL.lower()).first()
            for notify_user in [super_user, pmo_user]:
                if notify_user:
                    notif = Notification(
                        id=str(uuid.uuid4()),
                        organization_id=org.id,
                        recipient_id=notify_user.id,
                        notification_type="finding_critical",
                        title=f"🚨 CRITICAL SECURITY ALERT: {finding.title}",
                        body=f"Critical vulnerability VAPT-2026-001 (CVSS 9.3) discovered on Mobile Banking APK by {tester_user.full_name}.",
                        resource_type="finding",
                        resource_id=finding.id,
                        priority="critical",
                        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=2)
                    )
                    db.add(notif)
                    db.flush()

                    deliv = AlertDelivery(
                        id=str(uuid.uuid4()),
                        notification_id=notif.id,
                        channel="in_app",
                        delivery_status="delivered"
                    )
                    db.add(deliv)

            # Cross-Department Handoff (VAPT -> Software Development)
            handoff = HandoffRequest(
                id=str(uuid.uuid4()),
                source_department_id=vapt_dept.id,
                target_department_id=dev_dept.id,
                source_user_id=pmo_user.id,
                recipient_user_id=dev_user.id,
                resource_type="finding",
                resource_id=finding.id,
                request_status="accepted",
                notes="Assigned to Android team for urgent patch development before sprint release.",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1),
                responded_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=30)
            )
            db.add(handoff)

        # 8. Chat Channels and Initial Messages
        channel = db.query(Channel).filter(Channel.name == "Android Security & Dev Sync").first()
        if not channel:
            channel = Channel(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                department_id=vapt_dept.id,
                name="Android Security & Dev Sync",
                channel_type="department",
                created_by=pmo_user.id
            )
            db.add(channel)
            db.flush()

            msg1 = Message(
                id=str(uuid.uuid4()),
                channel_id=channel.id,
                sender_id=tester_user.id,
                content="Hey team, just completed dynamic assessment on the banking APK. Identified Critical finding VAPT-2026-001 regarding the exported deep link handler.",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)
            )
            msg2 = Message(
                id=str(uuid.uuid4()),
                channel_id=channel.id,
                sender_id=pmo_user.id,
                content="Thanks Vishal! I've assigned the remediation handoff directly to Alex in Software Development.",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=45)
            )
            msg3 = Message(
                id=str(uuid.uuid4()),
                channel_id=channel.id,
                sender_id=dev_user.id,
                content="Acknowledged! Reviewing the POC reproduction steps now. We will enforce authentication gating and have a retest build ready shortly.",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=20)
            )
            db.add_all([msg1, msg2, msg3])

        db.commit()
        print("Demo data seeded successfully!")
        print("  Super Admin: superadmin@enterpriseops.internal / AdminP@ssw0rd2026!Secure")
        print("  PMO:        pmo@enterpriseops.internal / DemoP@ssw0rd2026!")
        print("  Tester:     tester@enterpriseops.internal / DemoP@ssw0rd2026!")
        print("  Developer:  dev@enterpriseops.internal / DemoP@ssw0rd2026!")
    finally:
        db.close()


def clean_demo_data(wipe_demo_users: bool = True):
    """Permanently deletes demo data so the system is ready for clean production handover."""
    print("Purging demo data for fresh client handover...")
    db: Session = SessionLocal()
    try:
        from app.models.notification import AlertDelivery, Notification
        from app.models.vapt import FindingRetest, FindingEvent, Finding, Asset, Engagement
        from app.models.project import Project, ProjectMember
        from app.models.task import Task, TaskDependency, TaskOccurrence, TaskComment, TaskAssignment, TaskEvent
        from app.models.worklog import TimeEntry, DailyWorkReport, WorkdayCheckin
        from app.models.collaboration import Approval, HandoffRequest
        from app.models.chat import Message
        from app.models.report import Report, ReportShare
        from app.models.auth import RoleAssignment

        db.query(AlertDelivery).delete(synchronize_session=False)
        db.query(Notification).delete(synchronize_session=False)

        db.query(FindingRetest).delete(synchronize_session=False)
        db.query(FindingEvent).delete(synchronize_session=False)
        findings_count = db.query(Finding).count()
        db.query(Finding).delete(synchronize_session=False)
        db.query(Asset).delete(synchronize_session=False)
        db.query(Engagement).delete(synchronize_session=False)

        db.query(TaskDependency).delete(synchronize_session=False)
        db.query(TaskOccurrence).delete(synchronize_session=False)
        db.query(TaskComment).delete(synchronize_session=False)
        db.query(TaskAssignment).delete(synchronize_session=False)
        db.query(TaskEvent).delete(synchronize_session=False)
        tasks_count = db.query(Task).count()
        db.query(Task).delete(synchronize_session=False)

        db.query(ProjectMember).delete(synchronize_session=False)
        db.query(Project).delete(synchronize_session=False)

        db.query(TimeEntry).delete(synchronize_session=False)
        db.query(DailyWorkReport).delete(synchronize_session=False)
        db.query(WorkdayCheckin).delete(synchronize_session=False)

        db.query(Approval).delete(synchronize_session=False)
        db.query(HandoffRequest).delete(synchronize_session=False)

        db.query(Message).delete(synchronize_session=False)
        db.query(ReportShare).delete(synchronize_session=False)
        db.query(Report).delete(synchronize_session=False)

        if wipe_demo_users:
            demo_emails = [
                "pmo@enterpriseops.internal",
                "tester@enterpriseops.internal",
                "dev@enterpriseops.internal"
            ]
            demo_users = db.query(User).filter(User.email.in_(demo_emails)).all()
            for u in demo_users:
                db.query(RoleAssignment).filter(RoleAssignment.user_id == u.id).delete(synchronize_session=False)
                db.query(Membership).filter(Membership.user_id == u.id).delete(synchronize_session=False)
                db.delete(u)
            print(f"  [✓] Removed {len(demo_users)} demo accounts (Sarah, Vishal, Alex).")

        db.commit()
        print(f"[✓] Successfully cleaned {findings_count} findings and {tasks_count} tasks.")
        print("[✓] EnterpriseOps database is 100% clean and ready for handover!")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "seed":
        seed_demo_data()
    elif len(sys.argv) > 1 and sys.argv[1] in ["clean", "reset", "clear"]:
        clean_demo_data(wipe_demo_users=True)
    else:
        bootstrap_admin()
