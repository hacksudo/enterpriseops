from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.bootstrap import router as bootstrap_router
from app.api.v1.organizations import router as org_router
from app.api.v1.users import router as users_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.worklogs import router as worklogs_router
from app.api.v1.vapt import router as vapt_router
from app.api.v1.handoffs import router as handoffs_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.reports import router as reports_router
from app.api.v1.chat import router as chat_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.audit import router as audit_router
from app.api.v1.files import router as files_router

api_router = APIRouter()
api_router.include_router(bootstrap_router)
api_router.include_router(auth_router)
api_router.include_router(org_router)
api_router.include_router(users_router)
api_router.include_router(tasks_router)
api_router.include_router(worklogs_router)
api_router.include_router(vapt_router)
api_router.include_router(handoffs_router)
api_router.include_router(analytics_router)
api_router.include_router(reports_router)
api_router.include_router(chat_router)
api_router.include_router(notifications_router)
api_router.include_router(audit_router)
api_router.include_router(files_router)
