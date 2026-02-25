"""
API v1 路由汇总
将所有子路由注册到统一的 v1_router
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.customers import router as customers_router
from app.api.v1.products import router as products_router
from app.api.v1.orders import router as orders_router
from app.api.v1.after_sales import router as after_sales_router
from app.api.v1.websocket import router as ws_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.warehouses import router as warehouses_router
from app.api.v1.settings import router as settings_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.dictionaries import router as dictionaries_router
from app.api.v1.opportunities import router as opportunities_router
from app.api.v1.opportunity_proxy import router as opportunity_proxy_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.sales_targets import router as sales_targets_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.admin import router as admin_router
from app.api.v1.reports import router as reports_router
from app.api.v1.chat import router as chat_router
from app.api.v1.badges import router as badges_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(customers_router)
v1_router.include_router(products_router)
v1_router.include_router(orders_router)
v1_router.include_router(after_sales_router)
v1_router.include_router(ws_router)
v1_router.include_router(analytics_router)
v1_router.include_router(warehouses_router)
v1_router.include_router(settings_router)
v1_router.include_router(audit_logs_router)
v1_router.include_router(dictionaries_router)
v1_router.include_router(opportunities_router)
v1_router.include_router(opportunity_proxy_router)
v1_router.include_router(tasks_router)
v1_router.include_router(sales_targets_router)
v1_router.include_router(notifications_router)
v1_router.include_router(admin_router)
v1_router.include_router(reports_router)
v1_router.include_router(chat_router)
v1_router.include_router(badges_router)
